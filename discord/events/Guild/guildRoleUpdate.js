/*
.____                 .__  __                .__          
|    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
|    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
|    |__(  <_> ) /_/  >  ||  | (  <_> |  |_> )  |__\___ \
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

const { Events } = require('discord.js');
const config = require('../../config.js');
const executeQuery = require('../../../tools/mysql.mjs');
const { log } = require('../../functions.js');

module.exports = {
    event: Events.GuildRoleUpdate,
    once: false,
    /**
     *
     * @param {import('discord.js').Role} oldRole
     * @param {import('discord.js').Role} newRole
     * @returns
     */
    run: async (oldRole, newRole) => {
        if (newRole.guild.id !== config.development.guild) return;

        if (!config.roles.staff.includes(newRole.id)) return;

        log(`Staff role updated: ${newRole.name} (${newRole.id})`, 'info');

        // When a staff role is updated, resync all staff roles
        // This ensures we catch any member changes due to role updates
        try {
            const client = newRole.guild.client;
            await client.syncStaffRoles();
            log('Resynced staff roles after role update', 'info');
        } catch (error) {
            log(`Error resyncing staff roles after role update: ${error.message}`, 'err');
        }
    }
};