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

const { Message, REST, Routes } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient.js');
const config = require('../../../config.js');

module.exports = {
    structure: {
        name: 'unsync',
        description: 'Unregister all commands from a guild or globally (dev only)',
        aliases: ['unregister', 'clear-commands'],
        permissions: 'Administrator',
        cooldown: 10000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {Message<true>} message 
     * @param {string[]} args 
     */
    run: async (client, message, args) => {
        const devIds = config.users?.developers || [];
        if (!devIds.includes(message.author.id)) {
            return message.reply({ content: 'This command is restricted to developers only.' });
        }

        const target = args[0];
        if (!target) {
            return message.reply({ content: 'Usage: `lt!unsync here` (current guild), `lt!unsync <guild_id>`, or `lt!unsync global`' });
        }

        const reply = await message.reply({ content: 'Unregistering commands...' });

        try {
            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

            if (target.toLowerCase() === 'global') {
                await rest.put(
                    Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
                    { body: [] }
                );
                await reply.edit({
                    content: 'All global commands have been unregistered. (May take up to 1 hour to propagate)'
                });
            } else {
                const guildId = target.toLowerCase() === 'here' ? message.guild.id : target;
                
                await rest.put(
                    Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
                    { body: [] }
                );
                await reply.edit({
                    content: `All commands have been unregistered from guild \`${guildId}\`.`
                });
            }
        } catch (error) {
            console.error('Failed to unregister commands:', error);
            await reply.edit({
                content: `Failed to unregister commands: ${error.message}`
            });
        }
    }
};
