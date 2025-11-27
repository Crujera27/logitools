const { Message, REST, Routes } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient.js');

module.exports = {
    structure: {
        name: 'refresh',
        description: 'Refresh all application commands for this server',
        aliases: ['sync', 'reload-commands'],
        permissions: 'Administrator',
        cooldown: 30000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {Message<true>} message 
     * @param {string[]} args 
     */
    run: async (client, message, args) => {
        const reply = await message.reply({ content: 'Refreshing commands...' });

        try {
            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

            await rest.put(
                Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, message.guild.id),
                { body: client.applicationcommandsArray }
            );

            await reply.edit({
                content: `Commands refreshed successfully. ${client.applicationcommandsArray.length} commands synced to this server.`
            });
        } catch (error) {
            console.error('Failed to refresh commands:', error);
            await reply.edit({
                content: `Failed to refresh commands: ${error.message}`
            });
        }
    }
};
