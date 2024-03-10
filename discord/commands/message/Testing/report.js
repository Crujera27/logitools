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
    Licencia del proyecto: MIT

*/
const { MessageContextMenuCommandInteraction, ContextMenuCommandBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient.js');

// Ensure to use import properly for ES modules

module.exports = {
    structure: new ContextMenuCommandBuilder()
        .setName('Reportar contenido en el mensaje')
        .setType(3),
    /**
     * @param {ExtendedClient} client 
     * @param {MessageContextMenuCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        try {
            const { parseConfig } = await import('../../../../tools/parseConfig.mjs')
            if (interaction.targetMessage.author.id == interaction.user.id) {
                return await interaction.reply({
                    content: '¡Quiérete un poco! No puedes reportar un mensaje que ha sido enviado por ti mismo/a.',
                    ephemeral: true,
                });
            }
            if (interaction.targetMessage.author.bot) {
                return await interaction.reply({
                    content: 'No puedes reportar un mensaje enviado por un bot.',
                    ephemeral: true,
                });
            }
            if (interaction.targetMessage.author.id == interaction.guild.ownerId) {
                return await interaction.reply({
                    content: 'No puedes reportar un mensaje del dueño/a del servidor.',
                    ephemeral: true,
                });
            }

            await interaction.reply({
                content: 'Esta funcionalidad se encuentra desactivada temporalmente. Por favor, abra un ticket para informar sobre un usuario.',
                ephemeral: true,
            });
        } catch (error) {
            console.error('Error occurred while parsing config:', error);
        }
    }
};
