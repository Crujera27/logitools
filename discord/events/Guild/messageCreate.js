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
const ANONYMIZE_AFTER_DAYS = 30;
const ANONYMIZE_INTERVAL = 6 * 60 * 60 * 1000;
const OLLAMA_MAX_RETRIES = 3;
const OLLAMA_INITIAL_DELAY = 1000;
const OLLAMA_TIMEOUT = 30000;

const moderationQueue = [];
let isProcessingQueue = false;
let lastAnonymize = 0;

async function anonymizeOldLogs() {
    if (Date.now() - lastAnonymize < ANONYMIZE_INTERVAL) return;
    lastAnonymize = Date.now();
    
    try {
        const parseConfigModule = (await import("../../../tools/parseConfig.mjs")).default;
        const parseConfig = await parseConfigModule;
        const appConfig = await parseConfig();
        
        const anonymizeDays = appConfig.ai?.anonymize_after_days ?? ANONYMIZE_AFTER_DAYS;
        if (anonymizeDays <= 0) return;
        
        const executeQuery = require("../../../tools/mysql.mjs").default;
        
        // Anonimizar registros antiguos: eliminar contenido sensible pero conservar estadísticas
        await executeQuery(`
            UPDATE ai_moderation_logs 
            SET 
                message_content = '[ANONIMIZADO]',
                context_messages = '[]',
                user_id = CONCAT('anon_', MD5(user_id))
            WHERE 
                created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
                AND message_content != '[ANONIMIZADO]'
        `, [anonymizeDays]);
        
        log(`[AI-Mod] Logs antiguos anonimizados (>${anonymizeDays} días)`, 'info');
    } catch (error) {
        log(`Error anonymizing AI moderation logs: ${error.message}`, 'err');
    }
}

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
    'S1': 'warn_severe',
    'S2': null,
    'S3': 'ban',
    'S4': 'ban',
    'S5': 'warn_severe',
    'S6': null,
    'S7': 'warn_severe',
    'S8': 'warn_middle',
    'S9': 'ban',
    'S10': 'warn_severe',
    'S11': 'warn_severe',
    'S12': 'warn_middle',
    'S13': null,
};

const CATEGORY_DESCRIPTIONS = {
    'S1': 'Crear / promocionar contenido de naturaleza violenta',
    'S2': 'Crear / promocionar contenido de crímenes no violentos',
    'S3': 'Crear / promocionar crímenes de carácter sexual',
    'S4': 'Crear / promocionar contenido en contra de los derechos humanos',
    'S5': 'Crear / promocionar contenido de naturaleza difamatoria',
    'S6': 'Crear / promocionar consejos especializados no seguros',
    'S7': 'Crear / promocionar la divulgación de información privada',
    'S8': 'Crear / promocionar el infringimiento a la Propiedad Intelectual',
    'S9': 'Crear / promocionar armas indiscriminadas',
    'S10': 'Crear / promocionar discurso de odio',
    'S11': 'Crear / promocionar autolesión o suicidio',
    'S12': 'Crear / promocionar contenido sexual',
    'S13': 'Crear / promocionar desinformación electoral',
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

                log(`BOT PREFIX COMMAND: ${commandInput} executed by ${message.author.tag} (${message.author.id}) in ${message.guild?.name || 'DM'}`, 'info');
                command.run(client, message, args);
            } catch (error) {
                log(`BOT PREFIX COMMAND FAILED: ${commandInput} executed by ${message.author.tag} (${message.author.id}) in ${message.guild?.name || 'DM'} - Error: ${error}`, "err");
            }
        }
    },
};

async function processAIModeration(client, message) {
    const executeQuery = require("../../../tools/mysql.mjs").default;
    const parseConfigModule = (await import("../../../tools/parseConfig.mjs")).default;
    const parseConfig = await parseConfigModule;
    const appConfig = await parseConfig();
    const verbose = appConfig.ai?.verbose_logging || false;
    const ignoredCategories = appConfig.ai?.ignored_categories || [];
    
    anonymizeOldLogs();
    
    const settings = await executeQuery("SELECT value FROM settings WHERE name = 'ai_moderation_enabled'");
    if (!settings?.[0] || settings[0].value !== '1') return;

    if (message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        if (verbose) log(`[AI-Mod] Skipping admin: ${message.author.tag}`, 'info');
        return;
    }
    
    const bypassRoles = await executeQuery("SELECT role_id FROM moderation_bypass WHERE is_active = 1");
    const bypassRoleIds = bypassRoles.map(r => r.role_id);
    if (message.member?.roles.cache.some(role => bypassRoleIds.includes(role.id))) {
        if (verbose) log(`[AI-Mod] Skipping bypassed role: ${message.author.tag}`, 'info');
        return;
    }

    if (message.content.length < MIN_MESSAGE_LENGTH) {
        if (verbose) log(`[AI-Mod] Skipping short message from ${message.author.tag}: ${message.content.length} chars`, 'info');
        return;
    }

    if (verbose) log(`[AI-Mod] Analyzing message from ${message.author.tag} in #${message.channel.name}`, 'info');
    
    const initialResult = await quickAnalyze(message, verbose);
    if (!initialResult || !initialResult.unsafe) {
        if (verbose) log(`[AI-Mod] Initial scan SAFE for ${message.author.tag}`, 'info');
        return;
    }
    
    // Verificar si la categoría está en la lista de ignoradas
    if (initialResult.category && ignoredCategories.includes(initialResult.category)) {
        if (verbose) log(`[AI-Mod] Category ${initialResult.category} is ignored, skipping ${message.author.tag}`, 'info');
        return;
    }
    
    if (verbose) log(`[AI-Mod] Initial scan UNSAFE (${initialResult.category}) for ${message.author.tag}, fetching context...`, 'warn');
    
    const contextMessages = await fetchUserMessageHistory(message, CONTEXT_MESSAGE_COUNT);
    if (verbose) log(`[AI-Mod] Fetched ${contextMessages.length} context messages for ${message.author.tag}`, 'info');
    
    const finalResult = await analyzeWithContext(message, contextMessages, verbose);
    if (!finalResult || !finalResult.unsafe || !finalResult.category) {
        if (verbose) log(`[AI-Mod] Context analysis SAFE for ${message.author.tag}`, 'info');
        return;
    }
    
    // Verificar de nuevo después del análisis con contexto
    if (ignoredCategories.includes(finalResult.category)) {
        if (verbose) log(`[AI-Mod] Category ${finalResult.category} is ignored after context analysis, skipping ${message.author.tag}`, 'info');
        return;
    }
    
    if (verbose) log(`[AI-Mod] CONFIRMED UNSAFE: ${message.author.tag} - Category: ${finalResult.category} (${CATEGORY_DESCRIPTIONS[finalResult.category]})`, 'warn');
    
    await logAIModerationResult(message, finalResult, contextMessages);
    await applyAIModerationAction(client, message, finalResult, verbose);
}

async function quickAnalyze(message, verbose = false) {
    const parseConfigModule = (await import("../../../tools/parseConfig.mjs")).default;
    const parseConfig = await parseConfigModule;
    const appConfig = await parseConfig();
    
    const chatRequest = {
        model: appConfig.ai.ollama_model || 'llama-guard3',
        messages: [{ role: 'user', content: message.content }],
        stream: false
    };
    
    const startTime = Date.now();
    const response = await executeOllamaWithRetry(chatRequest, appConfig, verbose);
    
    if (!response) {
        return null;
    }
    
    if (verbose) log(`[AI-Mod] Quick analysis completed in ${Date.now() - startTime}ms`, 'info');
    
    return parseGuardResponse(response.message?.content || '');
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

async function analyzeWithContext(message, contextMessages, verbose = false) {
    const cacheKey = `${message.author.id}:${message.content.substring(0, 100)}:ctx`;
    const cached = aiModerationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < AI_CACHE_TTL) {
        if (verbose) log(`[AI-Mod] Using cached result for ${message.author.tag}`, 'info');
        return cached.result;
    }

    const parseConfigModule = (await import("../../../tools/parseConfig.mjs")).default;
    const parseConfig = await parseConfigModule;
    const appConfig = await parseConfig();
    
    const messages = [
        ...contextMessages.map(m => ({
            role: 'user',
            content: m.content
        })),
        { role: 'user', content: message.content }
    ];

    const chatRequest = {
        model: appConfig.ai.ollama_model || 'llama-guard3',
        messages: messages,
        stream: false
    };

    const startTime = Date.now();
    const response = await executeOllamaWithRetry(chatRequest, appConfig, verbose);
    
    if (!response) {
        return null;
    }
    
    if (verbose) log(`[AI-Mod] Context analysis completed in ${Date.now() - startTime}ms (${messages.length} messages)`, 'info');
    
    const result = parseGuardResponse(response.message?.content || '');
    
    aiModerationCache.set(cacheKey, { result, timestamp: Date.now() });
    
    return result;
}

async function executeOllamaWithRetry(chatRequest, appConfig, verbose = false) {
    if(config.ai.enabled === false) return null;
    const { Ollama } = await import('ollama');
    
    let lastError = null;
    
    for (let attempt = 1; attempt <= OLLAMA_MAX_RETRIES; attempt++) {
        try {
            const ollama = new Ollama({ host: appConfig.ai.ollama_host || 'http://127.0.0.1:11434' });
            
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout: Ollama no respondió a tiempo')), OLLAMA_TIMEOUT);
            });
            
            const chatPromise = ollama.chat(chatRequest);
            
            const response = await Promise.race([chatPromise, timeoutPromise]);
            
            return response;
        } catch (error) {
            lastError = error;
            
            const isRetryable = 
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('ETIMEDOUT') ||
                error.message.includes('ENOTFOUND') ||
                error.message.includes('Timeout') ||
                error.message.includes('socket hang up') ||
                error.message.includes('network') ||
                error.code === 'ECONNRESET';
            
            if (!isRetryable) {
                log(`[AI-Mod] Error no recuperable de Ollama: ${error.message}`, 'err');
                return null;
            }
            
            if (attempt < OLLAMA_MAX_RETRIES) {
                const delay = OLLAMA_INITIAL_DELAY * Math.pow(2, attempt - 1);
                if (verbose) log(`[AI-Mod] Intento ${attempt}/${OLLAMA_MAX_RETRIES} fallido, reintentando en ${delay}ms...`, 'warn');
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    log(`[AI-Mod] Ollama no disponible después de ${OLLAMA_MAX_RETRIES} intentos: ${lastError?.message}`, 'err');
    return null;
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

async function applyAIModerationAction(client, message, result, verbose = false) {
    const punishment = CATEGORY_PUNISHMENT_MAP[result.category];
    if (!punishment) return;

    try {
        const parseConfigModule = (await import("../../../tools/parseConfig.mjs")).default;
        const parseConfig = await parseConfigModule;
        const appConfig = await parseConfig();
        const executeQuery = require("../../../tools/mysql.mjs").default;

        const { applyPunishment, getUserVigentPunishments, updateExpirationStatusByUserAndType } = await import("../../../tools/punishment.mjs");
        
        const reason = `[LOGITOOLS -AI_AUTOMOD] ${CATEGORY_DESCRIPTIONS[result.category] || 'Contenido detectado como inseguro'}`;
        
        if (verbose) log(`[AI-Mod] Applying ${punishment} to ${message.author.tag} for ${result.category}`, 'warn');
        
        let limitAction = null;
        
        if (punishment === 'ban') {
            await sendModerationNotification(message, result, punishment, appConfig);
            await message.member?.ban({ reason, deleteMessageSeconds: 86400 });
            if (verbose) log(`[AI-Mod] Banned ${message.author.tag}`, 'warn');
            await sendEvidenceLog(client, message, result, punishment, appConfig);
            await sendWarnsChannelNotification(client, message, result, punishment, appConfig);
        } else {
            await applyPunishment(message.author.id, punishment, reason, 'AI-Moderation');
            await sendModerationNotification(message, result, punishment, appConfig);
            await sendEvidenceLog(client, message, result, punishment, appConfig);
            await sendWarnsChannelNotification(client, message, result, punishment, appConfig);
            
            limitAction = await checkWarnLimitAndApply(client, message, punishment, result, appConfig, verbose);
            
            if (verbose) log(`[AI-Mod] Applied ${punishment} to ${message.author.tag}`, 'warn');
        }
        
        if (verbose) log(`[AI-Mod] Logged evidence and notification for ${message.author.tag}`, 'info');
        
        try {
            await message.delete();
            if (verbose) log(`[AI-Mod] Deleted message from ${message.author.tag}`, 'info');
        } catch {}
        
    } catch (error) {
        log(`[AI-Mod] Error applying action: ${error.message}`, 'err');
    }
}

async function checkWarnLimitAndApply(client, message, warnType, result, appConfig, verbose = false) {
    try {
        const executeQuery = require("../../../tools/mysql.mjs").default;
        const { applyPunishment, updateExpirationStatusByUserAndType } = await import("../../../tools/punishment.mjs");
        
        const warnCounts = await executeQuery(`
            SELECT punishment_type, COUNT(*) as count 
            FROM punishment_history 
            WHERE discord_id = ? AND expired = 0 AND punishment_type IN ('warn_mild', 'warn_middle', 'warn_severe')
            GROUP BY punishment_type
        `, [message.author.id]);
        
        const counts = {
            warn_mild: 0,
            warn_middle: 0,
            warn_severe: 0
        };
        
        warnCounts.forEach(row => {
            counts[row.punishment_type] = row.count;
        });
        
        const limits = {
            warn_mild: parseInt(appConfig.punishments?.limit_warns_mild) || 3,
            warn_middle: parseInt(appConfig.punishments?.limit_warns_milddle) || 3,
            warn_severe: parseInt(appConfig.punishments?.limit_warns_severe) || 3
        };
        
        const punishmentActions = {
            warn_mild: appConfig.punishments?.punishment_limit_warn_mild || 'timeout',
            warn_middle: appConfig.punishments?.punishment_limit_warn_milddle || 'timeout',
            warn_severe: appConfig.punishments?.punishment_limit_warn_severe || 'ban'
        };
        
        const durations = {
            warn_mild: appConfig.punishments?.punishment_limit_warn_mild_duration || '3d',
            warn_middle: appConfig.punishments?.punishment_limit_warn_milddle_duration || '7d',
            warn_severe: null
        };
        
        const resetAndUpgrade = appConfig.punishments?.reset_cnt_add_nextlvl_warn_on_limit !== false;
        
        if (verbose) log(`[AI-Mod] Warn counts for ${message.author.tag}: mild=${counts.warn_mild}, middle=${counts.warn_middle}, severe=${counts.warn_severe}`, 'info');
        
        for (const type of ['warn_severe', 'warn_middle', 'warn_mild']) {
            if (counts[type] >= limits[type]) {
                const action = punishmentActions[type];
                const duration = durations[type];
                
                if (verbose) log(`[AI-Mod] Limit exceeded for ${type} (${counts[type]}/${limits[type]}), applying ${action}`, 'warn');
                
                if (action === 'ban') {
                    const banReason = `[LOGITOOLS -AI_AUTOMOD] Límite de warns ${type} superado`;
                    
                    const limitResult = { 
                        ...result, 
                        category: result.category,
                        limitExceeded: true,
                        limitType: type
                    };
                    
                    await sendLimitExceededNotification(message, limitResult, 'ban', type, appConfig);
                    await sendEvidenceLog(client, message, limitResult, 'ban', appConfig);
                    await sendWarnsChannelNotification(client, message, limitResult, 'ban', appConfig);
                    
                    await message.member?.ban({ reason: banReason, deleteMessageSeconds: 86400 });
                    if (verbose) log(`[AI-Mod] Banned ${message.author.tag} for exceeding ${type} limit`, 'warn');
                    return { appliedPunishment: 'ban', warnType: type };
                } else if (action === 'timeout') {
                    const ms = parseDuration(duration);
                    if (ms && message.member?.moderatable) {
                        await message.member.timeout(ms, `[LOGITOOLS -AI_AUTOMOD] Límite de warns ${type} superado`);
                        if (verbose) log(`[AI-Mod] Timed out ${message.author.tag} for ${duration}`, 'warn');
                    }
                }
                
                if (resetAndUpgrade && type !== 'warn_severe') {
                    await updateExpirationStatusByUserAndType(message.author.id, type);
                    const nextLevel = type === 'warn_mild' ? 'warn_middle' : 'warn_severe';
                    await applyPunishment(message.author.id, nextLevel, `[LOGITOOLS -AI_AUTOMOD] Upgrade por superar límite de ${type}`, 'AI-Moderation');
                    if (verbose) log(`[AI-Mod] Upgraded ${message.author.tag} from ${type} to ${nextLevel}`, 'warn');
                } else {
                    await updateExpirationStatusByUserAndType(message.author.id, type);
                }
                
                return { appliedPunishment: action, warnType: type };
            }
        }
        
        return null;
    } catch (error) {
        log(`[AI-Mod] Error checking warn limits: ${error.message}`, 'err');
        return null;
    }
}

async function sendLimitExceededNotification(message, result, punishment, limitType, appConfig) {
    try {
        const warnTypeLabels = {
            'warn_mild': 'warns leves',
            'warn_middle': 'warns medios',
            'warn_severe': 'warns graves'
        };

        const appealInfo = `Si considera que esta sanción ha sido aplicada de forma incorrecta o injusta, puede apelar en:\n${appConfig.ai?.ban_appeal_link || 'https://dyno.gg/form/bcbd876e'}`;

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle("Mensaje de la moderación de Logikk's Discord")
            .setDescription(
                `Hola, <@${message.author.id}>. Nos ponemos en contacto con usted mediante el presente comunicado para informarle sobre las medidas que se han tomado debido a su conducta.
                \n
                Sanción impuesta: **Ban permanente**
                Razón: **Límite de ${warnTypeLabels[limitType] || limitType} superado**
                Último warn por: **${CATEGORY_DESCRIPTIONS[result.category] || 'Contenido detectado como inseguro'}**
                \n
                ⚠️ **Esta sanción fue aplicada automáticamente por nuestro sistema de IA.**
                \n
                ${appealInfo}
                \n
                Un saludo,
                **Equipo administrativo de Logikk's Discord**`
            )
            .setTimestamp();

        await message.author.send({ embeds: [embed] });
    } catch {}
}

function parseDuration(duration) {
    if (!duration) return null;
    const match = duration.match(/^(\d+)([smhd])$/i);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    const multipliers = {
        's': 1000,
        'm': 60 * 1000,
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000
    };
    
    return value * multipliers[unit];
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

        let rulesReminder = '';
        if (punishment !== 'ban') {
            rulesReminder = '\nLe recomendamos que visite el canal de <#901587290093158442> y eche un vistazo para evitar posibles sanciones en el futuro.\nPuede encontrar su historial del servidor en [aquí](https://logikk.crujera.net/history).';
        }

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle("Mensaje de la moderación de Logikk's Discord")
            .setDescription(
                `Hola, <@${message.author.id}>. Nos ponemos en contacto con usted mediante el presente comunicado para informarle sobre las medidas que se han tomado debido a su conducta.
                \n
                Sanción impuesta: **${punishmentLabels[punishment] || punishment}**
                Razón: **${CATEGORY_DESCRIPTIONS[result.category] || 'Contenido detectado como inseguro'}**
                \n
                ⚠️ **Esta sanción fue aplicada automáticamente por nuestro sistema de IA.**
                ${rulesReminder}
                \n
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