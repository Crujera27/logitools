/*
.____                 .__  __                .__          
|    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
|    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
|    |__(  <_> ) /_/  >  ||  | (  <_> |  <_> )  |__\___ \ 
|_______ \____/\___  /|__||__|  \____/ \____/|____/____  >
        \/    /_____/                                  \/ 
                         
        
    Copyright (C) 2024 Ángel Crujera (me@crujera.net)

    This program is free software: you can redistribute it and/or modify  
    it under the terms of the GNU Affero General Public License as published by  
    the Free Software Foundation, either version 3 of the License, or  
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,  
    but WITHOUT ANY WARRANTY; without even the implied warranty of  
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the  
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License  
    along with this program. If not, see <https://www.gnu.org/licenses/>.
    
    GitHub: https://github.com/Crujera27/
    Website: https://crujera.net

*/

const { ChannelType, Message, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const config = require("../../config.js");
const { log } = require("../../functions");
const ExtendedClient = require("../../class/ExtendedClient.js");

const cooldown = new Map();
const aiModerationCache = new Map();

const AI_CACHE_TTL = 60 * 1000;
const MIN_MESSAGE_LENGTH = 5;
const CONTEXT_MESSAGE_COUNT = 10;
const QUEUE_PROCESS_INTERVAL = 500;

const moderationQueue = [];
let isProcessingQueue = false;

function addToModerationQueue(client, message) {
    moderationQueue.push({ client, message, addedAt: Date.now() });
    
    if (!isProcessingQueue) {
        processQueue();
    }
}

async function processQueue() {
    if (isProcessingQueue || moderationQueue.length === 0) return;
    
    isProcessingQueue = true;
    
    while (moderationQueue.length > 0) {
        const item = moderationQueue.shift();
        
        if (Date.now() - item.addedAt > 60000) {
            continue;
        }
        
        try {
            await processAIModeration(item.client, item.message);
        } catch (error) {
            log(`Queue processing error: ${error.message}`, 'err');
        }
        
        if (moderationQueue.length > 0) {
            await new Promise(resolve => setTimeout(resolve, QUEUE_PROCESS_INTERVAL));
        }
    }
    
    isProcessingQueue = false;
}

const CATEGORY_PUNISHMENT_MAP = {
    'S1': 'ban',
    'S2': 'warn_severe',
    'S3': 'ban',
    'S4': 'ban',
    'S5': 'warn_severe',
    'S6': 'warn_middle',
    'S7': 'warn_severe',
    'S8': 'warn_middle',
    'S9': 'ban',
    'S10': 'warn_severe',
    'S11': 'warn_severe',
    'S12': 'warn_middle',
    'S13': 'warn_middle',
};

const CATEGORY_DESCRIPTIONS = {
    'S1': 'Crímenes Violentos',
    'S2': 'Crímenes No Violentos',
    'S3': 'Crímenes Sexuales',
    'S4': 'Explotación Infantil',
    'S5': 'Difamación',
    'S6': 'Consejos Especializados',
    'S7': 'Privacidad',
    'S8': 'Propiedad Intelectual',
    'S9': 'Armas Indiscriminadas',
    'S10': 'Discurso de Odio',
    'S11': 'Autolesión/Suicidio',
    'S12': 'Contenido Sexual',
    'S13': 'Desinformación Electoral',
};

module.exports = {
    event: "messageCreate",
    run: async (client, message) => {
        if (message.author.bot || message.channel.type === ChannelType.DM) return;

        addToModerationQueue(client, message);

        if (!config.handler.commands.prefix) return;

        let prefix = config.handler.prefix;
        prefix = config.handler.prefix;

        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const commandInput = args.shift().toLowerCase();

        if (!commandInput.length) return;

        let command =
            client.collection.prefixcommands.get(commandInput) ||
            client.collection.prefixcommands.get(
                client.collection.aliases.get(commandInput)
            );

        if (command) {
            try {
                if (
                    command.structure?.permissions &&
                    !message.member.permissions.has(command.structure?.permissions)
                ) {
                    await message.reply({
                        content:
                            config.messageSettings.notHasPermissionMessage !== undefined &&
                                config.messageSettings.notHasPermissionMessage !== null &&
                                config.messageSettings.notHasPermissionMessage !== ""
                                ? config.messageSettings.notHasPermissionMessage
                                : "You do not have the permission to use this command.",
                    });

                    return;
                }

                if (command.structure?.developers) {
                    if (!config.users.developers.includes(message.author.id)) {
                        setTimeout(async () => {
                            await message.reply({
                                content:
                                    config.messageSettings.developerMessage !== undefined &&
                                        config.messageSettings.developerMessage !== null &&
                                        config.messageSettings.developerMessage !== ""
                                        ? config.messageSettings.developerMessage
                                        : "You are not authorized to use this command",
                            });
                        }, 5 * 1000);
                    }

                    return;
                }

                if (command.structure?.nsfw && !message.channel.nsfw) {
                    await message.reply({
                        content:
                            config.messageSettings.nsfwMessage !== undefined &&
                                config.messageSettings.nsfwMessage !== null &&
                                config.messageSettings.nsfwMessage !== ""
                                ? config.messageSettings.nsfwMessage
                                : "The current channel is not a NSFW channel.",
                    });

                    return;
                }

                if (command.structure?.cooldown) {
                    const cooldownFunction = () => {
                        let data = cooldown.get(message.author.id);

                        data.push(commandInput);

                        cooldown.set(message.author.id, data);

                        setTimeout(() => {
                            let data = cooldown.get(message.author.id);

                            data = data.filter((v) => v !== commandInput);

                            if (data.length <= 0) {
                                cooldown.delete(message.author.id);
                            } else {
                                cooldown.set(message.author.id, data);
                            }
                        }, command.structure?.cooldown);
                    };

                    if (cooldown.has(message.author.id)) {
                        let data = cooldown.get(message.author.id);

                        if (data.some((v) => v === commandInput)) {
                            await message.reply({
                                content:
                                    (config.messageSettings.cooldownMessage !== undefined &&
                                        config.messageSettings.cooldownMessage !== null &&
                                        config.messageSettings.cooldownMessage !== ""
                                        ? config.messageSettings.cooldownMessage
                                        : "Slow down buddy! You're too fast to use this command ({cooldown}s).").replace(/{cooldown}/g, command.structure.cooldown / 1000),
                            });

                            return;
                        } else {
                            cooldownFunction();
                        }
                    } else {
                        cooldown.set(message.author.id, [commandInput]);

                        cooldownFunction();
                    }
                }

                command.run(client, message, args);
            } catch (error) {
                log(error, "err");
            }
        }
    },
};

async function processAIModeration(client, message) {
    const executeQuery = require("../../../tools/mysql.mjs").default;
    
    const settings = await executeQuery("SELECT value FROM settings WHERE name = 'ai_moderation_enabled'");
    if (!settings?.[0] || settings[0].value !== '1') return;

    if (message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
    
    const bypassRoles = await executeQuery("SELECT role_id FROM moderation_bypass WHERE is_active = 1");
    const bypassRoleIds = bypassRoles.map(r => r.role_id);
    if (message.member?.roles.cache.some(role => bypassRoleIds.includes(role.id))) return;

    if (message.content.length < MIN_MESSAGE_LENGTH) return;

    const initialResult = await quickAnalyze(message);
    if (!initialResult || !initialResult.unsafe) return;
    
    const contextMessages = await fetchUserMessageHistory(message, CONTEXT_MESSAGE_COUNT);
    const finalResult = await analyzeWithContext(message, contextMessages);
    if (!finalResult) return;
    
    await logAIModerationResult(message, finalResult, contextMessages);
    
    if (finalResult.unsafe && finalResult.category) {
        await applyAIModerationAction(client, message, finalResult);
    }
}

async function quickAnalyze(message) {
    try {
        const { Ollama } = await import('ollama');
        
        const parseConfigModule = (await import("../../../tools/parseConfig.mjs")).default;
        const parseConfig = await parseConfigModule;
        const appConfig = await parseConfig();
        
        const ollama = new Ollama({ host: appConfig.ai.ollama_host || 'http://127.0.0.1:11434' });

        const response = await ollama.chat({
            model: appConfig.ai.ollama_model || 'llama-guard3',
            messages: [{ role: 'user', content: message.content }],
            stream: false
        });
        
        return parseGuardResponse(response.message?.content || '');
    } catch (error) {
        log(`Quick analysis error: ${error.message}`, 'err');
        return null;
    }
}

async function fetchUserMessageHistory(message, count) {
    try {
        const messages = await message.channel.messages.fetch({ limit: 100 });
        const userMessages = messages
            .filter(m => m.author.id === message.author.id && m.id !== message.id)
            .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
            .first(count);
        
        return userMessages.reverse().map(m => ({
            content: m.content,
            channel: m.channel.name,
            timestamp: m.createdTimestamp
        }));
    } catch (error) {
        log(`Error fetching message history: ${error.message}`, 'err');
        return [];
    }
}

async function analyzeWithContext(message, contextMessages) {
    const cacheKey = `${message.author.id}:${message.content.substring(0, 100)}:ctx`;
    const cached = aiModerationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < AI_CACHE_TTL) {
        return cached.result;
    }

    try {
        const { Ollama } = await import('ollama');
        
        const parseConfigModule = (await import("../../../tools/parseConfig.mjs")).default;
        const parseConfig = await parseConfigModule;
        const appConfig = await parseConfig();
        
        const ollama = new Ollama({ host: appConfig.ai.ollama_host || 'http://127.0.0.1:11434' });
        
        const messages = [
            ...contextMessages.map(m => ({
                role: 'user',
                content: m.content
            })),
            { role: 'user', content: message.content }
        ];

        const response = await ollama.chat({
            model: appConfig.ai.ollama_model || 'llama-guard3',
            messages: messages,
            stream: false
        });
        
        const result = parseGuardResponse(response.message?.content || '');
        
        aiModerationCache.set(cacheKey, { result, timestamp: Date.now() });
        
        return result;
    } catch (error) {
        log(`Context analysis error: ${error.message}`, 'err');
        return null;
    }
}

function parseGuardResponse(response) {
    const trimmed = response.trim().toLowerCase();
    
    if (trimmed.startsWith('safe')) {
        return { unsafe: false, category: null, raw: response };
    }
    
    if (trimmed.startsWith('unsafe')) {
        const categoryMatch = response.match(/S\d{1,2}/i);
        const category = categoryMatch ? categoryMatch[0].toUpperCase() : null;
        return { unsafe: true, category, raw: response };
    }
    
    return { unsafe: false, category: null, raw: response };
}

async function logAIModerationResult(message, result, contextMessages = []) {
    try {
        const executeQuery = require("../../../tools/mysql.mjs").default;
        
        const punishment = result.unsafe && result.category 
            ? CATEGORY_PUNISHMENT_MAP[result.category] || null 
            : null;
        
        await executeQuery(`
            INSERT INTO ai_moderation_logs 
            (user_id, message_content, ai_decision, ai_category, punishment_applied, context_messages)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            message.author.id,
            message.content.substring(0, 1000),
            result.unsafe ? 'unsafe' : 'safe',
            result.category,
            punishment,
            JSON.stringify(contextMessages)
        ]);
    } catch (error) {
        log(`Error logging AI moderation result: ${error.message}`, 'err');
    }
}

async function applyAIModerationAction(client, message, result) {
    const punishment = CATEGORY_PUNISHMENT_MAP[result.category];
    if (!punishment) return;

    try {
        const parseConfigModule = (await import("../../../tools/parseConfig.mjs")).default;
        const parseConfig = await parseConfigModule;
        const appConfig = await parseConfig();

        const { applyPunishment } = await import("../../../tools/punishment.mjs");
        
        const reason = `[LOGITOOLS -AI_AUTOMOD] ${CATEGORY_DESCRIPTIONS[result.category] || 'Contenido detectado como inseguro'}`;
        
        if (punishment === 'ban') {
            await sendModerationNotification(message, result, punishment, appConfig);
            await message.member?.ban({ reason, deleteMessageSeconds: 86400 });
        } else {
            await applyPunishment(message.author.id, punishment, reason, 'AI-Moderation');
            await sendModerationNotification(message, result, punishment, appConfig);
        }

        await sendEvidenceLog(client, message, result, punishment, appConfig);
        await sendWarnsChannelNotification(client, message, result, punishment, appConfig);
        
        try {
            await message.delete();
        } catch {}
        
    } catch (error) {
        log(`Error applying AI moderation action: ${error.message}`, 'err');
    }
}

async function sendModerationNotification(message, result, punishment, appConfig) {
    try {
        const punishmentLabels = {
            'warn_mild': 'Warn leve',
            'warn_middle': 'Warn medio',
            'warn_severe': 'Warn grave',
            'ban': 'Ban permanente'
        };

        let appealInfo = '';
        if (punishment === 'ban') {
            appealInfo = `Si considera que esta sanción ha sido aplicada de forma incorrecta o injusta, puede apelar en:\n${appConfig.ai?.ban_appeal_link || 'https://dyno.gg/form/bcbd876e'}`;
        } else {
            appealInfo = 'Si considera que esta sanción ha sido aplicada de forma incorrecta o injusta, abra un ticket en <#928733150467735642> en la categoría "Apelar una sanción"';
        }

        const aiName = appConfig.ai?.assistant_name || 'AI-Moderation';

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle("Mensaje de la moderación de Logikk's Discord")
            .setDescription(
                `Hola, <@${message.author.id}>. Nos ponemos en contacto con usted mediante el presente comunicado para informarle sobre las medidas que se han tomado debido a su conducta.
                \n
                Sanción impuesta: **${punishmentLabels[punishment] || punishment}**
                Razón: **${CATEGORY_DESCRIPTIONS[result.category] || 'Contenido detectado como inseguro'}**
                \n
                ⚠️ **Esta sanción fue aplicada automáticamente por nuestro sistema de IA (${aiName}).**
                \n
                Le recomendamos que visite el canal de <#901587290093158442> y eche un vistazo para evitar posibles sanciones en el futuro.
                Puede encontrar su historial del servidor en [aquí](https://logikk.crujera.net/history).
                ${appealInfo}
                \n
                Un saludo,
                **Equipo administrativo de Logikk's Discord**`
            )
            .setTimestamp();

        await message.author.send({ embeds: [embed] });
    } catch {}
}

async function sendEvidenceLog(client, message, result, punishment, appConfig) {
    if (!appConfig.discord?.evidence_channel) return;

    try {
        const evidenceChannel = await client.channels.fetch(appConfig.discord.evidence_channel);
        if (!evidenceChannel) return;

        const punishmentLabels = {
            'warn_mild': 'leve',
            'warn_middle': 'medio',
            'warn_severe': 'grave',
            'ban': 'Ban'
        };

        const evidenceText = 
            `**${punishment === 'ban' ? 'Ban' : `Warn ${punishmentLabels[punishment]}`}** (AI-Moderation)\n` +
            `ID: ${message.author.id}\n` +
            `Tag: <@${message.author.id}>\n` +
            `Razón: [LOGITOOLS -AI_AUTOMOD] ${CATEGORY_DESCRIPTIONS[result.category] || 'Contenido detectado como inseguro'}\n` +
            `Categoría IA: ${result.category}\n` +
            `Canal:\n<#${message.channel.id}>\n` +
            `Staff: AI-Moderation (${appConfig.ai?.assistant_name || 'AI-Moderation'})\n` +
            `Pruebas:\n\`\`\`${message.content.substring(0, 1500)}\`\`\``;

        await evidenceChannel.send({ content: evidenceText });
    } catch {}
}

async function sendWarnsChannelNotification(client, message, result, punishment, appConfig) {
    if (!appConfig.discord?.warns_channel) return;

    try {
        const warnsChannel = await client.channels.fetch(appConfig.discord.warns_channel);
        if (!warnsChannel) return;

        const punishmentLabels = {
            'warn_mild': 'leve',
            'warn_middle': 'medio',
            'warn_severe': 'grave',
            'ban': 'ban permanente'
        };

        const notification = `<@${message.author.id}>(${message.author.id}) ha recibido un **${punishment === 'ban' ? 'ban permanente' : `warn ${punishmentLabels[punishment]}`}** (AI-Moderation) con la razón: [LOGITOOLS -AI_AUTOMOD] ${CATEGORY_DESCRIPTIONS[result.category] || 'Contenido detectado como inseguro'}`;
        await warnsChannel.send({ content: notification });
    } catch {}
}