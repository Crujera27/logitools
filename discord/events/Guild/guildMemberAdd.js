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
    event: Events.GuildMemberAdd,
    once: false,
    /**
     *
     * @param {import('discord.js').GuildMember} member
     * @returns
     */
    run: async (member) => {
        // Only process if this is in our configured guild
        if (member.guild.id !== config.development.guild) return;

        // Check if member has staff roles
        const hasStaffRole = member.roles.cache.some(role => config.roles.staff.includes(role.id));

        if (hasStaffRole) {
            try {
                await executeQuery('UPDATE users SET isStaff = 1 WHERE discord_id = ?', [member.id]);
                log(`Set staff status for new member ${member.user.username} (${member.id})`, 'info');
            } catch (error) {
                log(`Error updating staff status for new member: ${error.message}`, 'err');
            }
        }
    }
};