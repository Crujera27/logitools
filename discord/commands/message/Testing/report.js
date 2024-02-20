const { MessageContextMenuCommandInteraction, ContextMenuCommandBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient.js');

module.exports = {
    structure: new ContextMenuCommandBuilder()
        .setName('Reportar contenido en el mensaje')
        .setType(3),
    /**
     * @param {ExtendedClient} client 
     * @param {MessageContextMenuCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
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
            content: 'El mensaje ha sido enviado a nuestros moderadores de contenido. Por favor, espere pacientemente a que dicho contenido sea evaluado.',
            ephemeral: true,
        });

    }
};