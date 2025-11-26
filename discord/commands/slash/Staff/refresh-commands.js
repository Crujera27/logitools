const { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, REST, Routes } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient.js');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('refresh-commands')
        .setDescription('Refresh all application commands for this server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    options: {
        cooldown: 30000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        try {
            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

            await rest.put(
                Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, interaction.guild.id),
                { body: client.applicationcommandsArray }
            );

            await interaction.editReply({
                content: `Commands refreshed successfully. ${client.applicationcommandsArray.length} commands synced to this server.`
            });
        } catch (error) {
            console.error('Failed to refresh commands:', error);
            await interaction.editReply({
                content: `Failed to refresh commands: ${error.message}`
            });
        }
    }
};
