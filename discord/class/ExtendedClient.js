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
// Import executeQuery the same way as in admin routes
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
            intents: [Object.keys(GatewayIntentBits)],
            partials: [Object.keys(Partials)],
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

        // Start staff role synchronization
        this.startStaffRoleSync();
    };

    /**
     * Sync staff roles from Discord to database
     */
    syncStaffRoles = async () => {
        try {
            if (!config.roles.staff || config.roles.staff.length === 0) {
                log('No staff roles configured, skipping sync', 'warn');
                return;
            }

            const guild = this.guilds.cache.get(config.development.guild);
            if (!guild) {
                log('Guild not found, skipping staff role sync', 'warn');
                return;
            }

            // Get all members with staff roles
            const staffMembers = new Set();

            for (const roleId of config.roles.staff) {
                const role = guild.roles.cache.get(roleId);
                if (role) {
                    role.members.forEach(member => {
                        staffMembers.add(member.id);
                    });
                }
            }

            // Update database: set isStaff=1 for users with staff roles
            if (staffMembers.size > 0) {
                const staffIds = Array.from(staffMembers);
                const placeholders = staffIds.map(() => '?').join(',');

                // First, set isStaff=0 for all users (clear old staff)
                await executeQuery('UPDATE users SET isStaff = 0');

                // Then set isStaff=1 for current staff members
                await executeQuery(`UPDATE users SET isStaff = 1 WHERE discord_id IN (${placeholders})`, staffIds);
            } else {
                // No staff roles found, clear all staff status
                await executeQuery('UPDATE users SET isStaff = 0');
            }

            log(`Synced ${staffMembers.size} staff members to database`, 'info');

        } catch (error) {
            log(`Error syncing staff roles: ${error.message}`, 'err');
        }
    };

    /**
     * Start periodic staff role synchronization
     */
    startStaffRoleSync = () => {
        // Initial sync
        this.syncStaffRoles();

        // Sync every 5 minutes
        setInterval(() => {
            this.syncStaffRoles();
        }, 5 * 60 * 1000);
    };
};