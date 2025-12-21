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

const { Client, Partials, Collection, GatewayIntentBits } = require("discord.js");
const config = require('../config.js');
const commands = require("../handlers/commands.js");
const events = require("../handlers/events.js");
const deploy = require("../handlers/deploy.js");
const components = require("../handlers/components.js");
const { default: executeQuery } = require("../../tools/mysql.mjs");
const { log } = require('../functions.js');

module.exports = class extends Client {
    collection = {
        interactioncommands: new Collection(),
        prefixcommands: new Collection(),
        aliases: new Collection(),
        components: {
            buttons: new Collection(),
            selects: new Collection(),
            modals: new Collection(),
            autocomplete: new Collection()
        }
    };
    applicationcommandsArray = [];

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMessageReactions,
            ],
            partials: Object.values(Partials),
            presence: {
                activities: [{
                    name: 'Logitols v4',
                    type: 4,
                    state: 'Logitols v4'
                }]
            }
        });
    };

    start = async () => {
        commands(this);
        events(this);
        components(this);

        await this.login(process.env.DISCORD_BOT_TOKEN);

        if (config.handler.deploy) deploy(this, config);

        // Start staff role synchronization and monitoring
        log('Starting staff role monitoring and sync at boot...', 'info');

        // Wait for caches to populate after login
        setTimeout(() => {
            this.startStaffRoleSync();
        }, 5000); // 5 second delay to allow caches to populate
    };

    /**
     * Sync staff roles from Discord to database
     */
    syncStaffRoles = async () => {
        try {
            log(`Starting staff role sync. Configured roles: ${JSON.stringify(config.roles.staff)}`, 'info');

            if (!config.roles.staff || config.roles.staff.length === 0) {
                log('No staff roles configured, skipping sync', 'warn');
                return;
            }

            const guild = this.guilds.cache.get(config.development.guild);
            if (!guild) {
                log(`Guild ${config.development.guild} not found in cache.`, 'err');
                log(`Bot is currently in these guilds:`, 'info');
                this.guilds.cache.forEach(g => {
                    log(`- ${g.name} (${g.id}) - ${g.memberCount} members`, 'info');
                });
                log(`To fix: Invite the bot to your server or update the guild ID in discord/config.js`, 'warn');
                return;
            }

            log(`Found guild: ${guild.name || 'Unknown'} (${guild.id})`, 'info');

            // Check if bot is in the guild
            const botMember = guild.members.cache.get(this.user.id);
            if (!botMember) {
                log(`Bot member not found in cache for guild ${guild.id}`, 'warn');
                log(`Guild members in cache: ${guild.members.cache.size}`, 'info');

                // Try to fetch the bot member
                try {
                    const fetchedBotMember = await guild.members.fetch(this.user.id);
                    log(`Successfully fetched bot member: ${fetchedBotMember.user.username}`, 'info');
                } catch (error) {
                    log(`Failed to fetch bot member: ${error.message}`, 'err');
                    log(`This suggests the bot is not actually in the guild ${guild.id}`, 'err');
                    return;
                }
            } else {
                log(`Bot is a member of guild: ${botMember.user.username}`, 'info');
            }

            log(`Guild roles available: ${guild.roles.cache.size}`, 'info');

            // If cache is empty, try to fetch roles
            if (guild.roles.cache.size === 0) {
                log('Role cache is empty, attempting to fetch roles...', 'warn');
                try {
                    await guild.roles.fetch();
                    log(`After fetch - Guild roles available: ${guild.roles.cache.size}`, 'info');
                } catch (error) {
                    log(`Failed to fetch roles: ${error.message}`, 'err');
                }
            }

            log(`All role IDs in guild: ${Array.from(guild.roles.cache.keys()).join(', ')}`, 'info');

            // Get all members with staff roles by scanning each role's members
            const staffMembers = new Set();

            for (const roleId of config.roles.staff) {
                try {
                    let role = guild.roles.cache.get(roleId);

                    // If not in cache, try to fetch it directly
                    if (!role) {
                        log(`Role ${roleId} not in cache, attempting to fetch directly...`, 'warn');
                        role = await guild.roles.fetch(roleId);
                        log(`Successfully fetched role: ${role.name} (${role.id})`, 'info');
                    }

                    if (role) {
                        let memberCount = 0;
                        try {
                            const members = await guild.members.fetch();
                            for (const [memberId, member] of members) {
                                if (member.roles.cache.has(roleId)) {
                                    staffMembers.add(memberId);
                                    memberCount++;
                                    log(`Staff member found: ${member.user.username} (${memberId}) has role ${role.name}`, 'info');
                                }
                            }
                        } catch (error) {
                            log(`Error fetching members for role check: ${error.message}`, 'err');
                            // Fallback: try to use role.members if available
                            if (role.members && role.members.size > 0) {
                                role.members.forEach(member => {
                                    staffMembers.add(member.id);
                                    memberCount++;
                                });
                                log(`Used fallback role.members for ${role.name}: ${memberCount} members`, 'info');
                            }
                        }

                        log(`Role ${role.name} (${roleId}) processed: ${memberCount} staff members found`, 'info');
                    } else {
                        log(`Role ${roleId} not found in guild`, 'warn');
                        log(`Available roles: ${Array.from(guild.roles.cache.values()).map(r => `${r.name} (${r.id})`).join(', ')}`, 'info');
                    }
                } catch (error) {
                    log(`Error processing role ${roleId}: ${error.message}`, 'err');
                }
            }

            log(`Total staff members found: ${staffMembers.size}`, 'info');

            // Update database: set isStaff=1 for users with staff roles
            if (staffMembers.size > 0) {
                const staffIds = Array.from(staffMembers);

                // First, set isStaff=0 for all users (clear old staff)
                await executeQuery('UPDATE users SET isStaff = 0');

                // Check which staff members exist in the database
                const placeholders = staffIds.map(() => '?').join(',');
                const existingUsers = await executeQuery(`SELECT discord_id FROM users WHERE discord_id IN (${placeholders})`, staffIds);
                const existingUserIds = existingUsers.map(user => user.discord_id);

                log(`Found ${existingUsers.length} existing users out of ${staffIds.length} staff members`, 'info');

                // Only update users who exist in the database
                if (existingUserIds.length > 0) {
                    const existingPlaceholders = existingUserIds.map(() => '?').join(',');
                    await executeQuery(`UPDATE users SET isStaff = 1 WHERE discord_id IN (${existingPlaceholders})`, existingUserIds);
                    log(`Updated ${existingUserIds.length} existing staff members in database`, 'info');
                }

                // Log users with staff roles who haven't logged in yet
                const missingUsers = staffIds.filter(id => !existingUserIds.includes(id));
                if (missingUsers.length > 0) {
                    log(`Staff members not in database (haven't logged in yet): ${missingUsers.join(', ')}`, 'warn');
                }
            } else {
                // No staff roles found, clear all staff status
                await executeQuery('UPDATE users SET isStaff = 0');
                log('No staff members found, cleared all staff status', 'info');
            }

            log(`Synced ${staffMembers.size} staff members to database`, 'info');

        } catch (error) {
            log(`Error syncing staff roles: ${error.message}`, 'err');
            console.error('Full error:', error);
        }
    };

    /**
     * Start periodic staff role synchronization
     */
    startStaffRoleSync = () => {
        log('Performing initial staff role sync at boot', 'info');
        this.syncStaffRoles();

        setInterval(() => {
            log('Performing periodic staff role sync', 'info');
            this.syncStaffRoles();
        }, 2 * 60 * 1000);
    };
};