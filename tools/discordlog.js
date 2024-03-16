const axios = require('axios');

async function sendEmbedWithDetails(webhookUrl, embedDetails) {
    try {
        const embed = {
            color: embedDetails.color || 0x0099ff,
            title: embedDetails.title,
            url: embedDetails.url,
            description: embedDetails.description,
            fields: embedDetails.fields || [],
            timestamp: embedDetails.timestamp || new Date(),
            footer: {
                text: embedDetails.footer || 'Sent via Discord.js'
            }
        };

        const response = await axios.post(webhookUrl, {
            embeds: [embed]
        });
        return response.data;
    } catch (error) {
        console.error('Error sending log:', error);
        throw error;
    }
}

async function sendLog(action, moderator, user, reason) {
    try {
        const parseConfigModule = (await import("../tools/parseConfig.mjs")).default;
        const parseConfig = await parseConfigModule();
        
        const embedDetails = {
            title: 'Registro de la moderación',
            description: `Acción: ${action} \nModerador: <@${moderator}>(${moderator})\nUsuario: <@${user}>(${user})\nRazón: ${reason}`,
            color: 0xff0000,
            timestamp: new Date(),
        };
        await sendEmbedWithDetails( parseConfig.discord.modlog_webhook, embedDetails);
    } catch (error) {
        console.error('Error sending log:', error);
    }
}

module.exports = sendLog;
