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
    Website: https://crujera.galnod.com

*/

const config = require('../../config.js');
const { log } = require('../../functions');
const ExtendedClient = require('../../class/ExtendedClient.js');

module.exports = {
    event: 'interactionCreate',
    /**
     * 
     * @param {ExtendedClient} client 
     * @param {import('discord.js').Interaction} interaction 
     * @returns 
     */
    run: async (client, interaction) => {
        const componentPermission = async (component) => {
            if (component.options?.public === false && interaction.user.id !== interaction.message.interaction.user.id) {
                await interaction.reply({
                    content: "No tienes permiso para utilizar este componente.", ephemeral: true
                });
                return false;
            };
            
            return true;
        };

        if (interaction.isButton()) {
            const component = client.collection.components.buttons.get(interaction.customId);

            if (!component) return;
            
            if (!(await componentPermission(component))) return;

            try {
                component.run(client, interaction);
            } catch (error) {
                log(error, 'error');
            }

            return;
        };

        if (interaction.isAnySelectMenu()) {
            const component = client.collection.components.selects.get(interaction.customId);

            if (!component) return;

            if (!(await componentPermission(component))) return;

            try {
                component.run(client, interaction);
            } catch (error) {
                log(error, 'error');
            }

            return;
        };

        if (interaction.isModalSubmit()) {
            const component = client.collection.components.modals.get(interaction.customId);

            if (!component) return;

            try {
                component.run(client, interaction);
            } catch (error) {
                log(error, 'error');
            };

            return;
        };

        if (interaction.isAutocomplete()) {
            const component = client.collection.components.autocomplete.get(interaction.commandName);

            if (!component) return;

            try {
                component.run(client, interaction);
            } catch (error) {
                log(error, 'error');
            }

            return;
        };
    }
};
