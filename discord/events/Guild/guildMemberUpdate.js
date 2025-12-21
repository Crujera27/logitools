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
        log(`Member update event triggered for ${newMember.user?.username || 'unknown'}`, 'info');

        // Only process if this is in our configured guild
        if (newMember.guild.id !== config.development.guild) {
            log(`Ignoring member update for different guild: ${newMember.guild.id}`, 'info');
            return;
        }

        try {
            log('Member update detected, triggering staff role resync...', 'info');
            const client = newMember.guild.client;
            await client.syncStaffRoles();
            log('Staff role resync completed after member update', 'info');
        } catch (error) {
            log(`Error during staff role resync after member update: ${error.message}`, 'err');
        }
    }
};