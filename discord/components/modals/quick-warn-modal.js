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
    Website: https://crujera.net

*/

const { ModalSubmitInteraction, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const ExtendedClient = require('../../class/ExtendedClient.js');

module.exports = {
    customId: 'quick-warn-modal',
    /**
     * @param {ExtendedClient} client 
     * @param {ModalSubmitInteraction} interaction 
     */
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        try {
            const reason = interaction.fields.getTextInputValue('warn-reason');
            const levelInput = interaction.fields.getTextInputValue('warn-level').toLowerCase().trim();

            // Validate level
            let level = null;
            let levelDisplay = null;
            
            if (levelInput === 'leve') {
                level = 'warn_mild';
                levelDisplay = 'leve';
            } else if (levelInput === 'medio') {
                level = 'warn_middle';
                levelDisplay = 'medio';
            } else if (levelInput === 'grave') {
                level = 'warn_severe';
                levelDisplay = 'grave';
            }

            if (level === null) {
                return await interaction.editReply({
                    content: 'El nivel del warn es inválido. Solamente están disponibles: `leve`, `medio` o `grave`',
                });
            }

            // Get stored message information
            const pendingWarn = client.pendingWarns?.get(interaction.user.id);
            
            if (!pendingWarn) {
                return await interaction.editReply({
                    content: 'No se encontró información del mensaje. Por favor, intenta de nuevo.',
                });
            }

            // Clear pending warn
            client.pendingWarns.delete(interaction.user.id);

            // Get configuration
            const parseConfigModule = await import('../../../tools/parseConfig.mjs');
            const parseConfig = parseConfigModule.default;
            const appConfig = await parseConfig();

            // Verify channels are configured
            if (!appConfig.discord.warns_channel || !appConfig.discord.evidence_channel) {
                return await interaction.editReply({
                    content: 'Los canales de warns o evidencias no están configurados. Contacta con un administrador.',
                });
            }

            // Get target user
            const targetUser = await client.users.fetch(pendingWarn.targetUserId);
            const member = interaction.guild.members.cache.get(pendingWarn.targetUserId);

            if (!member) {
                return await interaction.editReply({
                    content: 'El usuario ya no está en el servidor.',
                });
            }

            // Apply the warn
            const toolsModule = await import('../../../tools/punishment.mjs');
            const tools = await toolsModule;
            const punishmentApplied = await tools.applyPunishment(
                pendingWarn.targetUserId,
                level,
                reason,
                interaction.user.id
            );

            if (!punishmentApplied.success) {
                return await interaction.editReply({
                    content: 'Ha ocurrido un error al intentar aplicar el warn al usuario.',
                });
            }

            const messageScreenshot = await generateMessageScreenshot(client, pendingWarn);

            const sourceChannel = await client.channels.fetch(pendingWarn.channelId);
            const channelMention = sourceChannel ? `<#${sourceChannel.id}>` : '#unknown';

            const evidenceChannel = await client.channels.fetch(appConfig.discord.evidence_channel);
            
            if (evidenceChannel) {
                const evidenceText = 
                    `**Warn ${levelDisplay}**\n` +
                    `ID: ${pendingWarn.targetUserId}\n` +
                    `Tag: <@${pendingWarn.targetUserId}>\n` +
                    `Razón: ${reason}\n` +
                    `Canal:\n${channelMention}\n` +
                    `Pruebas:`;

                const files = [];
                if (messageScreenshot) {
                    const attachment = new AttachmentBuilder(messageScreenshot, { 
                        name: 'evidence.png' 
                    });
                    files.push(attachment);
                }

                await evidenceChannel.send({ content: evidenceText, files });
            }

            // Send notification to warns channel
            const warnsChannel = await client.channels.fetch(appConfig.discord.warns_channel);
            
            if (warnsChannel) {
                const warnNotification = `<@${pendingWarn.targetUserId}>(${pendingWarn.targetUserId}) ha recibido un warn **${levelDisplay}** con la razón: ${reason}`;
                await warnsChannel.send({ content: warnNotification });
            }

            // Send DM to user
            const warnDmEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle("Mensaje de la moderación de Logikk's Discord")
                .setDescription(
                    `Hola, <@${pendingWarn.targetUserId}>. Nos ponemos en contacto con usted mediante el presente comunicado para informarle sobre las medidas que se han tomado debido a su conducta.
                    \n
                    Sanción impuesta: **Warn ${levelDisplay}**
                    Razón: **${reason}**
                    \n
                    Le recomendamos que visite el canal de <#901587290093158442> y eche un vistazo para evitar posibles sanciones en el futuro.
                    Puede encontrar su historial del servidor en [aquí](https://logikk.crujera.net/history).
                    Si considera que esta sanción ha sido aplicada de forma incorrecta o injusta, abra un ticket en <#928733150467735642>
                    \n
                    Un saludo,
                    **Equipo administrativo de Logikk's Discord**`
                )
                .setTimestamp();

            try {
                await targetUser.send({ embeds: [warnDmEmbed] });
            } catch (dmError) {
                console.error(`Error sending DM to ${targetUser.tag}: ${dmError.message}`);
            }

            await checkWarnLimits(tools, appConfig, targetUser, interaction);

            // Delete the original message
            try {
                const channel = await client.channels.fetch(pendingWarn.channelId);
                const originalMessage = await channel.messages.fetch(pendingWarn.messageId);
                await originalMessage.delete();
            } catch (deleteError) {
                console.error(`Error deleting original message: ${deleteError.message}`);
            }

            await interaction.editReply({
                content: `Warn **${levelDisplay}** aplicado correctamente a <@${pendingWarn.targetUserId}> con la razón: \`${reason}\``,
            });

        } catch (error) {
            console.error('Error in quick-warn-modal:', error);
            await interaction.editReply({
                content: 'Ha ocurrido un error inesperado al procesar el warn.',
            });
        }
    }
};

async function generateMessageScreenshot(client, messageData) {
    try {
        const channel = await client.channels.fetch(messageData.channelId);
        if (!channel) return null;

        const message = await channel.messages.fetch(messageData.messageId);
        if (!message) return null;

        return await renderMessageToImage(message);
    } catch (error) {
        console.error('Error generating message screenshot:', error);
        return null;
    }
}

async function renderMessageToImage(message) {
    try {
        const { createCanvas, loadImage } = require('@napi-rs/canvas');
        
        const padding = 16;
        const avatarSize = 40;
        const maxWidth = 500;
        const fontSize = 14;
        const usernameSize = 15;
        const lineHeight = fontSize + 6;
        
        const contentLines = wrapText(message.content || '', maxWidth - avatarSize - padding * 3, fontSize);
        const contentHeight = Math.max(contentLines.length * lineHeight, 20);
        
        let extraHeight = 0;
        if (message.embeds && message.embeds.length > 0) extraHeight += 80;
        if (message.attachments && message.attachments.size > 0) extraHeight += 24;
        
        const canvasHeight = padding * 2 + Math.max(avatarSize, contentHeight + 24) + extraHeight + 20;
        
        const canvas = createCanvas(maxWidth, canvasHeight);
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#313338';
        ctx.fillRect(0, 0, maxWidth, canvasHeight);
        
        const avatarX = padding;
        const avatarY = padding;
        
        try {
            const avatarUrl = message.author.displayAvatarURL({ extension: 'png', size: 128 });
            const avatar = await loadImage(avatarUrl);
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();
        } catch (e) {
            ctx.fillStyle = '#5865F2';
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${avatarSize / 2}px Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(message.author.username.charAt(0).toUpperCase(), avatarX + avatarSize / 2, avatarY + avatarSize / 2);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }
        
        const textX = avatarX + avatarSize + 12;
        
        ctx.font = `bold ${usernameSize}px Arial, sans-serif`;
        ctx.fillStyle = '#f2f3f5';
        const username = message.author.username;
        ctx.fillText(username, textX, avatarY + 16);
        
        const usernameWidth = ctx.measureText(username).width;
        
        let badgeOffset = 0;
        if (message.author.bot) {
            const badgeX = textX + usernameWidth + 6;
            ctx.fillStyle = '#5865F2';
            ctx.beginPath();
            ctx.roundRect(badgeX, avatarY + 4, 32, 16, 3);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Arial, sans-serif';
            ctx.fillText('APP', badgeX + 6, avatarY + 15);
            badgeOffset = 40;
        }
        
        const date = new Date(message.createdTimestamp);
        const timeString = date.toLocaleDateString('es-ES', { 
            day: '2-digit', month: '2-digit', year: 'numeric'
        }) + ', ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        ctx.font = `${fontSize - 2}px Arial, sans-serif`;
        ctx.fillStyle = '#949ba4';
        ctx.fillText(timeString, textX + usernameWidth + badgeOffset + 8, avatarY + 15);
        
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = '#dbdee1';
        
        let lineY = avatarY + 36;
        for (const line of contentLines) {
            ctx.fillText(line, textX, lineY);
            lineY += lineHeight;
        }
        
        if (message.embeds && message.embeds.length > 0) {
            const embed = message.embeds[0];
            const embedY = lineY + 8;
            
            ctx.fillStyle = embed.color ? `#${embed.color.toString(16).padStart(6, '0')}` : '#5865F2';
            ctx.fillRect(textX, embedY, 4, 60);
            
            ctx.fillStyle = '#2b2d31';
            ctx.fillRect(textX + 4, embedY, maxWidth - textX - padding - 4, 60);
            
            if (embed.title) {
                ctx.font = `bold ${fontSize}px Arial, sans-serif`;
                ctx.fillStyle = '#00a8fc';
                ctx.fillText(embed.title.substring(0, 40), textX + 12, embedY + 20);
            }
            
            if (embed.description) {
                ctx.font = `${fontSize - 1}px Arial, sans-serif`;
                ctx.fillStyle = '#dbdee1';
                const descPreview = embed.description.substring(0, 60) + (embed.description.length > 60 ? '...' : '');
                ctx.fillText(descPreview, textX + 12, embedY + 40);
            }
            
            lineY = embedY + 68;
        }
        
        if (message.attachments && message.attachments.size > 0) {
            ctx.fillStyle = '#949ba4';
            ctx.font = `italic ${fontSize - 1}px Arial, sans-serif`;
            ctx.fillText(`[${message.attachments.size} archivo(s) adjunto(s)]`, textX, lineY + 8);
        }
        
        return canvas.toBuffer('image/png');
        
    } catch (error) {
        console.error('Error rendering message to image:', error);
        return null;
    }
}

function wrapText(text, maxWidth, fontSize) {
    if (!text || text.trim() === '') return [];
    
    const charsPerLine = Math.floor(maxWidth / (fontSize * 0.6));
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
        // Handle line breaks in original text
        if (word.includes('\n')) {
            const parts = word.split('\n');
            for (let i = 0; i < parts.length; i++) {
                if (i > 0) {
                    if (currentLine.trim()) {
                        lines.push(currentLine.trim());
                    }
                    currentLine = '';
                }
                if ((currentLine + parts[i]).length > charsPerLine) {
                    if (currentLine.trim()) {
                        lines.push(currentLine.trim());
                    }
                    currentLine = parts[i] + ' ';
                } else {
                    currentLine += parts[i] + ' ';
                }
            }
            continue;
        }
        
        if ((currentLine + word).length > charsPerLine) {
            if (currentLine.trim()) {
                lines.push(currentLine.trim());
            }
            currentLine = word + ' ';
        } else {
            currentLine += word + ' ';
        }
    }
    
    if (currentLine.trim()) {
        lines.push(currentLine.trim());
    }
    
    // Limit to 15 lines max
    if (lines.length > 15) {
        return [...lines.slice(0, 15), '...'];
    }
    
    return lines;
}

/**
 * Checks warn limits and applies additional sanctions if necessary
 * @param {Object} tools 
 * @param {Object} appConfig 
 * @param {import('discord.js').User} targetUser 
 * @param {ModalSubmitInteraction} interaction 
 */
async function checkWarnLimits(tools, appConfig, targetUser, interaction) {
    const { EmbedBuilder } = require('discord.js');
    
    const checkPunishments = await tools.getUserVigentPunishments(targetUser.id);
    
    if (!checkPunishments.success) {
        console.error('Error checking warns:', checkPunishments.message);
        return;
    }
    
    const mildWarns = checkPunishments.punishments.filter(p => p.punishment_type === 'warn_mild');
    const middleWarns = checkPunishments.punishments.filter(p => p.punishment_type === 'warn_middle');
    const severeWarns = checkPunishments.punishments.filter(p => p.punishment_type === 'warn_severe');
    
    // Check mild warn limit
    if (mildWarns.length >= appConfig.punishments.limit_warns_mild) {
        await tools.updateExpirationStatusByUserAndType(targetUser.id, 'warn_mild');
        
        if (appConfig.punishments.reset_cnt_add_nextlvl_warn_on_limit === true) {
            await tools.applyPunishment(targetUser.id, 'warn_middle', 'Límite de warns leves superados', interaction.user.id);
        }
        
        if (appConfig.punishments.punishment_limit_warn_mild === 'ban') {
            const banEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle("Mensaje de la moderación de Logikk's Discord")
                .setDescription(`Hola, ${targetUser}. Has sido baneado/a por superar el límite de warns leves.`)
                .setTimestamp();
            
            try {
                await targetUser.send({ embeds: [banEmbed] });
            } catch (e) { /* Ignore DM errors */ }
            
            const member = await interaction.guild.members.fetch(targetUser.id);
            await member.ban({ reason: 'Límite de warns leves superado.' });
        }
        return;
    }
    
    // Check middle warn limit
    if (middleWarns.length >= appConfig.punishments.limit_warns_milddle) {
        await tools.updateExpirationStatusByUserAndType(targetUser.id, 'warn_middle');
        
        if (appConfig.punishments.reset_cnt_add_nextlvl_warn_on_limit === true) {
            await tools.applyPunishment(targetUser.id, 'warn_severe', 'Límite de warns medios superados', interaction.user.id);
        }
        
        if (appConfig.punishments.punishment_limit_warn_milddle === 'ban') {
            const banEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle("Mensaje de la moderación de Logikk's Discord")
                .setDescription(`Hola, ${targetUser}. Has sido baneado/a por superar el límite de warns medios.`)
                .setTimestamp();
            
            try {
                await targetUser.send({ embeds: [banEmbed] });
            } catch (e) { /* Ignore DM errors */ }
            
            const member = await interaction.guild.members.fetch(targetUser.id);
            await member.ban({ reason: 'Límite de warns medios superado.' });
        }
        return;
    }
    
    // Check severe warn limit
    if (severeWarns.length >= appConfig.punishments.limit_warns_severe) {
        await tools.updateExpirationStatusByUserAndType(targetUser.id, 'warn_severe');
        
        if (appConfig.punishments.punishment_limit_warn_severe === 'ban') {
            const banEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle("Mensaje de la moderación de Logikk's Discord")
                .setDescription(`Hola, ${targetUser}. Has sido baneado/a por superar el límite de warns graves.`)
                .setTimestamp();
            
            try {
                await targetUser.send({ embeds: [banEmbed] });
            } catch (e) { /* Ignore DM errors */ }
            
            const member = await interaction.guild.members.fetch(targetUser.id);
            await member.ban({ reason: 'Límite de warns graves superado.' });
        }
        
        await tools.applyPunishment(targetUser.id, 'ban', 'Límite de warns graves superados', interaction.user.id);
    }
}
