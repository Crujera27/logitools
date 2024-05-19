/*
.____                 .__  __                .__          
|    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
|    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
|    |__(  <_> ) /_/  >  ||  | (  <_> |  <_> )  |__\___ \ 
|_______ \____/\___  /|__||__|  \____/ \____/|____/____  >
        \/    /_____/                                  \/ 
                         
        
    Copyright (C) 2024  Ángel Crujera (angel.c@galnod.com)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
    
    GitHub: https://github.com/Crujera27/
    Website: https://crujera.galnod.com

*/

const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient.js');
const config = require('../../../config.js');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View all the possible commands!'),
    options: {
        cooldown: 15000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {

        await interaction.deferReply();

        let prefix = config.handler.prefix;
        prefix = config.handler.prefix;

        const mapIntCmds = client.applicationcommandsArray.map((v) => `\`${(v.type === 2 || v.type === 3) ? '' : '/'}${v.name}\`: ${v.description || '(No description)'}`);
        const mapPreCmds = client.collection.prefixcommands.map((v) => `\`${prefix}${v.structure.name}\` (${v.structure.aliases.length > 0 ? v.structure.aliases.map((a) => `**${a}**`).join(', ') : 'None'}): ${v.structure.description || '(No description)'}`);

        await interaction.followUp({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Comando de ayuda')
                    .addFields(
                        { name: 'Slash commands', value: `${mapIntCmds.join('\n')}` },
                        { name: 'Prefix commands', value: `${mapPreCmds.join('\n')}` }
                    )
            ]
        });

    }
};
