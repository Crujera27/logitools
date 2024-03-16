/*
.____                 .__  __                .__          
|    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
|    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
|    |__(  <_> ) /_/  >  ||  | (  <_> |  <_> )  |__\___ \ 
|_______ \____/\___  /|__||__|  \____/ \____/|____/____  >
        \/    /_____/                                  \/ 
                         
        
    Copyright © 2024 Crujera27 y contribuidores. Todos los derechos reservados.
    
    GitHub: https://github.com/Crujera27/
    Web: https://crujera.galnod.com
    Licencia del proyecto: CC BY-NC-ND 4.0

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
