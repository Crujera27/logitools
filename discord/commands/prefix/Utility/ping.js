const { Message } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient.js');

module.exports = {
    structure: {
        name: 'ping',
        description: 'Responde con ¡Pong!',
        aliases: ['p'],
        permissions: 'Administrator',
        cooldown: 5000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {Message<true>} message 
     * @param {string[]} args 
     */
    run: async (client, message, args) => {

        await message.reply({
            content: '¡Pong! ' +  client.ws.ping
        });

    }
};
