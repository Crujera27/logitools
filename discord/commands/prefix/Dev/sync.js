const { Message, REST, Routes } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient.js');
const config = require('../../../config.js');

module.exports = {
    structure: {
        name: 'sync',
        description: 'Sync commands to a specific server by ID (dev only)',
        aliases: ['gsync', 'global-sync'],
        permissions: 'Administrator',
        cooldown: 10000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {Message<true>} message 
     * @param {string[]} args 
     */
    run: async (client, message, args) => {
        const devIds = config.development?.developers || [];
        if (!devIds.includes(message.author.id)) {
            return message.reply({ content: 'This command is restricted to developers only.' });
        }

        const guildId = args[0];
        if (!guildId) {
            return message.reply({ content: 'Usage: `!sync <guild_id>` or `!sync global`' });
        }

        const reply = await message.reply({ content: 'Syncing commands...' });

        try {
            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

            if (guildId.toLowerCase() === 'global') {
                await rest.put(
                    Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
                    { body: client.applicationcommandsArray }
                );
                await reply.edit({
                    content: `Commands synced globally. ${client.applicationcommandsArray.length} commands deployed (may take up to 1 hour to propagate).`
                });
            } else {
                await rest.put(
                    Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
                    { body: client.applicationcommandsArray }
                );
                await reply.edit({
                    content: `Commands synced to guild \`${guildId}\`. ${client.applicationcommandsArray.length} commands deployed.`
                });
            }
        } catch (error) {
            console.error('Failed to sync commands:', error);
            await reply.edit({
                content: `Failed to sync commands: ${error.message}`
            });
        }
    }
};
