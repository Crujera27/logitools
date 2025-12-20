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
    event: Events.GuildMemberUpdate,
    once: false,
    /**
     *
     * @param {import('discord.js').GuildMember} oldMember
     * @param {import('discord.js').GuildMember} newMember
     * @returns
     */
    run: async (oldMember, newMember) => {
        // Only process if this is in our configured guild
        if (newMember.guild.id !== config.development.guild) return;

        // Check if staff roles changed
        const oldStaffRoles = oldMember.roles.cache.filter(role => config.roles.staff.includes(role.id));
        const newStaffRoles = newMember.roles.cache.filter(role => config.roles.staff.includes(role.id));

        const hadStaffRole = oldStaffRoles.size > 0;
        const hasStaffRole = newStaffRoles.size > 0;

        // If staff status changed, update database
        if (hadStaffRole !== hasStaffRole) {
            try {
                const isStaff = hasStaffRole ? 1 : 0;
                await executeQuery('UPDATE users SET isStaff = ? WHERE discord_id = ?', [isStaff, newMember.id]);
                log(`Updated staff status for ${newMember.user.username} (${newMember.id}): ${isStaff}`, 'info');
            } catch (error) {
                log(`Error updating staff status on role change: ${error.message}`, 'err');
            }
        }
    }
};