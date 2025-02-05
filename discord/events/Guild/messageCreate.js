/*
.____                 .__  __                .__          
|    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
|    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
|    |__(  <_> ) /_/  >  ||  | (  <_> |  <_> )  |__\___ \ 
|_______ \____/\___  /|__||__|  \____/ \____/|____/____  >
        \/    /_____/                                  \/ 
                         
        
    Copyright (C) 2024 Ángel Crujera (angel.c@galnod.com)

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
    Website: https://crujera.galnod.com

*/

const { ChannelType, Message } = require("discord.js");
const config = require("../../config.js");
const { log } = require("../../functions");
const ExtendedClient = require("../../class/ExtendedClient.js");
// const checkmsg = require('../../../tools/ollama.mjs');
const executeQuery = require('../../../tools/mysql.mjs');

const cooldown = new Map();

// Add these at the top of the file
const SPAM_THRESHOLD = 5; // Messages
const SPAM_TIME_WINDOW = 5000; // 5 seconds
const MESSAGE_HISTORY = new Map(); // Store recent messages
const CAPS_THRESHOLD = 0.7; // 70% caps trigger
const MAX_MENTIONS = 3;
const URL_allowlist = ['discord.com', 'github.com']; // Add trusted domains

let filterCache = {
    patterns: [],
    allowlist: [],
    lastUpdate: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
/*
async function updateFilterCache() {
    if (Date.now() - filterCache.lastUpdate < CACHE_DURATION) {
        return filterCache;
    }

    const [patterns] = await executeQuery(
        'SELECT pattern, type, severity FROM filter_patterns WHERE is_active = TRUE'
    );
    const [allowlist] = await executeQuery(
        'SELECT domain FROM filter_allowlist WHERE is_active = TRUE'
    );

    filterCache = {
        patterns: patterns,
        allowlist: allowlist.map(w => w.domain),
        lastUpdate: Date.now()
    };

    return filterCache;
}
*/

function isSpam(message) {
    const authorHistory = MESSAGE_HISTORY.get(message.author.id) || [];
    const now = Date.now();
    const recentMessages = authorHistory.filter(msg => now - msg.timestamp < SPAM_TIME_WINDOW);
    
    // Update history
    recentMessages.push({ content: message.content, timestamp: now });
    MESSAGE_HISTORY.set(message.author.id, recentMessages);
    
    return recentMessages.length >= SPAM_THRESHOLD;
}

function hasExcessiveCaps(content) {
    if (content.length < 8) return false;
    const upperCount = content.replace(/[^A-Z]/g, '').length;
    return upperCount / content.length > CAPS_THRESHOLD;
}

function hasExcessiveMentions(message) {
    return message.mentions.users.size > MAX_MENTIONS || 
           message.mentions.roles.size > MAX_MENTIONS;
}

function containsUnsafeUrl(content) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex) || [];
    return urls.some(url => !URL_allowlist.some(safe => url.includes(safe)));
}

async function checkViolations(content, message) {
    const filters = await updateFilterCache();
    let violation = null;

    // Check each pattern from database
    for (const filter of filters.patterns) {
        let matches = false;
        
        switch(filter.type) {
            case 'regex':
                matches = new RegExp(filter.pattern, 'i').test(content);
                break;
            case 'phrase':
                matches = content.includes(filter.pattern.toLowerCase());
                break;
            case 'domain':
                matches = content.includes(filter.pattern);
                break;
        }

        if (matches) {
            return {
                type: filter.type,
                severity: filter.severity
            };
        }
    }

    // Check spam/caps/mentions
    if (isSpam(message)) {
        return { type: 'spam', severity: 'middle' };
    }
    if (hasExcessiveCaps(content)) {
        return { type: 'caps', severity: 'mild' };
    }
    if (hasExcessiveMentions(message)) {
        return { type: 'mentions', severity: 'middle' };
    }
    
    // URL check using allowlist from DB
    if (containsUnsafeUrl(content, filters.allowlist)) {
        return { type: 'url', severity: 'middle' };
    }

    return null;
}

async function canBypassModeration(message) {
    // Admin permission bypass
    if (message.member.permissions.has('Administrator')) return true;

    // Check for bypass role from DB
    const [roles] = await executeQuery(
        'SELECT role_id FROM moderation_bypass WHERE is_active = TRUE'
    );
    
    return message.member.roles.cache.some(role => 
        roles.some(bypass => bypass.role_id === role.id)
    );
}

async function isAIModerationEnabled() {
    const [settings] = await executeQuery(
        'SELECT value FROM settings WHERE name = "ai_moderation_enabled"'
    );
    return settings[0]?.value === '1';
}

module.exports = {
    event: "messageCreate",
    /**
     *
     * @param {ExtendedClient} client
     * @param {Message<true>} message
     * @returns
     */
    run: async (client, message) => {
        if (message.author.bot || message.channel.type === ChannelType.DM) return;

        // Check bypass first
        const bypass = await canBypassModeration(message);
        if (bypass) return;

        const content = message.content.toLowerCase();
        const violation = await checkViolations(content, message);

        if (violation) {
            await message.delete();
            
            switch(violation.severity) {
                case 'mild':
                    // Add mild warning logic
                    break;
                case 'middle':
                    // Add middle warning logic
                    break;
                case 'severe':
                    // Add severe warning logic
                    break;
                case 'ban':
                    // Add ban logic
                    break;
            }
            return;
        }

        // Check if AI moderation is enabled before proceeding
        const aiEnabled = await isAIModerationEnabled();
        if (aiEnabled) {
            const aiResponse = await checkmsg(message.content);
            const action = aiResponse.message.content.trim().toLowerCase();
            
            switch(action) {
                case 'warn_mild':
                    // Add warn mild logic
                    break;
                case 'warn_middle':
                    // Add warn middle logic
                    break;
                case 'warn_severe':
                    // Add warn severe logic
                    break;
                case 'ban':
                    // Add ban logic
                    break;
            }
        }

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
