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
const config = require('../../config.js');
const https = require('https');
const http = require('http');
module.exports = {
    customId: 'quick-ban-modal',
    /**
     * @param {ExtendedClient} client
     * @param {ModalSubmitInteraction} interaction
     */
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Re-check staff permissions (the modal could be submitted by anyone who got it)
            const staffRoles = config.roles?.staff || [];
            const isStaff =
                interaction.member.roles.cache.some((r) => staffRoles.includes(r.id)) ||
                interaction.member.permissions.has('Administrator');
            if (!isStaff) {
                return await interaction.editReply({ content: 'No tienes permisos para usar este comando.' });
            }

            const reason = interaction.fields.getTextInputValue('ban-reason').trim();
            const daysRaw = interaction.fields.getTextInputValue('ban-days').trim();
            const captchaInput = interaction.fields.getTextInputValue('ban-captcha').trim().toUpperCase();

            // Pending ban info stored by the context menu command
            const pendingBan = client.pendingBans?.get(interaction.user.id);
            if (!pendingBan) {
                return await interaction.editReply({
                    content: 'No se encontró información del mensaje. Por favor, intenta de nuevo.',
                });
            }

            if (Date.now() > pendingBan.expiresAt) {
                client.pendingBans.delete(interaction.user.id);
                return await interaction.editReply({
                    content: 'La solicitud ha caducado. Por favor, intenta de nuevo.',
                });
            }

            if (captchaInput !== pendingBan.captcha) {
                // Keep the pending ban so the staff member can retry with a new modal
                client.pendingBans.delete(interaction.user.id);
                return await interaction.editReply({
                    content: 'El código de confirmación es incorrecto. El ban no se ha aplicado.',
                });
            }

            // Validate days (0-7)
            let days = 0;
            if (daysRaw !== '') {
                days = parseInt(daysRaw, 10);
                if (Number.isNaN(days) || days < 0 || days > 7) {
                    return await interaction.editReply({
                        content: 'Los días de mensajes a borrar deben ser un número entre 0 y 7.',
                    });
                }
            }

            // Everything valid: consume the pending ban
            client.pendingBans.delete(interaction.user.id);

            const parseConfigModule = await import('../../../tools/parseConfig.mjs');
            const appConfig = await (parseConfigModule.default)();

            if (!appConfig.discord.warns_channel || !appConfig.discord.evidence_channel) {
                return await interaction.editReply({
                    content: 'Los canales de warns o evidencias no están configurados. Contacta con un administrador.',
                });
            }

            const targetUser = await client.users.fetch(pendingBan.targetUserId);
            const member = interaction.guild.members.cache.get(pendingBan.targetUserId);

            // Re-validate hierarchy at submit time
            if (member) {
                if (!member.bannable) {
                    return await interaction.editReply({
                        content: 'No puedo banear a este usuario (jerarquía de roles o permisos).',
                    });
                }
                const isOwner = interaction.guild.ownerId === interaction.user.id;
                if (!isOwner && member.roles.highest.position >= interaction.member.roles.highest.position) {
                    return await interaction.editReply({
                        content: 'No puedes banear a alguien con un rol igual o superior al tuyo.',
                    });
                }
            }

            const evidence = await collectEvidence(client, pendingBan);
            const messageScreenshot = evidence.screenshot;
            const downloadedAttachments = evidence.attachments;

            const sourceChannel = await client.channels.fetch(pendingBan.channelId).catch(() => null);
            const channelMention = sourceChannel ? `<#${sourceChannel.id}>` : '#unknown';

            const banDmEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle("Mensaje de la moderación de Logikk's Discord")
                .setDescription(
                    `Hola, <@${pendingBan.targetUserId}>. Nos ponemos en contacto con usted mediante el presente comunicado para informarle sobre las medidas que se han tomado debido a su conducta.
                    \n
                    Sanción impuesta: **Ban**
                    Razón: **${reason}**
                    \n
                    Puede encontrar su historial del servidor en [aquí](https://logikk.crujera.net/history).
                    Si considera que esta sanción ha sido aplicada de forma incorrecta o injusta, puede presentar una apelación en nuestro foro de apelaciones: [https://dyno.gg/form/bcbd876e](https://dyno.gg/form/bcbd876e).
                    \n
                    Un saludo,
                    **Equipo administrativo de Logikk's Discord**`
                )
                .setTimestamp();

            try {
                await targetUser.send({ embeds: [banDmEmbed] });
            } catch (dmError) {
                console.error(`Error sending DM to ${targetUser.tag}: ${dmError.message}`);
            }

            try {
                await interaction.guild.members.ban(pendingBan.targetUserId, {
                    reason: `${reason} | Staff: ${interaction.user.tag}`,
                    deleteMessageSeconds: days * 24 * 60 * 60,
                });
            } catch (banError) {
                console.error(`Error banning user: ${banError.message}`);
                return await interaction.editReply({
                    content: 'Ha ocurrido un error al intentar banear al usuario.',
                });
            }

            const tools = await import('../../../tools/punishment.mjs');
            const punishmentApplied = await tools.applyPunishment(
                pendingBan.targetUserId,
                'ban',
                reason,
                interaction.user.id
            );
            if (!punishmentApplied.success) {
                console.error('Error registering ban punishment:', punishmentApplied.message);
            }

            const evidenceChannel = await client.channels.fetch(appConfig.discord.evidence_channel).catch(() => null);
            if (evidenceChannel) {
                const evidenceText =
                    `**Ban**\n` +
                    `ID: ${pendingBan.targetUserId}\n` +
                    `Tag: <@${pendingBan.targetUserId}>\n` +
                    `Razón: ${reason}\n` +
                    `Canal:\n${channelMention}\n` +
                    `Staff: <@${interaction.user.id}> (${interaction.user.id})\n` +
                    `Contexto: ${evidence.before} mensaje(s) anterior(es) y ${evidence.after} posterior(es)\n` +
                    `Pruebas:`;

                const files = [];
                if (messageScreenshot) {
                    files.push(new AttachmentBuilder(messageScreenshot, { name: 'evidence.png' }));
                }
                for (let i = 0; i < downloadedAttachments.length; i++) {
                    const att = downloadedAttachments[i];
                    if (att.buffer) {
                        files.push(
                            new AttachmentBuilder(att.buffer, {
                                name: att.filename || `attachment_${i + 1}${att.extension || ''}`,
                            })
                        );
                    }
                }
                try {
                    const chunks = chunkFiles(files, MAX_FILES_PER_MESSAGE, MAX_BYTES_PER_MESSAGE);
                    const firstMessage = await evidenceChannel.send({ content: evidenceText, files: chunks[0] });

                    for (let i = 1; i < chunks.length; i++) {
                        try {
                            await firstMessage.reply({
                                content: `Pruebas adicionales (${i + 1}/${chunks.length})`,
                                files: chunks[i],
                                allowedMentions: { repliedUser: false },
                            });
                        } catch (replyError) {
                            console.error(`Error sending additional evidence (${i + 1}/${chunks.length}): ${replyError.message}`);
                        }
                    }

                    if (evidence.skipped > 0) {
                        await firstMessage
                            .reply({
                                content: `Archivos omitidos por superar el tamaño máximo permitido: ${evidence.skipped}`,
                                allowedMentions: { repliedUser: false },
                            })
                            .catch(() => {});
                    }
                } catch (evidenceError) {
                    console.error(`Error sending evidence: ${evidenceError.message}`);
                }
            }

            await interaction.editReply({
                content: `Ban aplicado correctamente a <@${pendingBan.targetUserId}> con la razón: \`${reason}\``,
            });
        } catch (error) {
            console.error('Error in quick-ban-modal:', error);
            await interaction.editReply({
                content: 'Ha ocurrido un error inesperado al procesar el ban.',
            }).catch(() => {});
        }
    },
};

const CONTEXT_BEFORE = 5;
const CONTEXT_AFTER = 5;
const MAX_FILES_PER_MESSAGE = 10; // límite de Discord por mensaje
const MAX_BYTES_PER_MESSAGE = 20 * 1024 * 1024; // tamaño total máximo por mensaje
const MAX_FILE_SIZE = 8 * 1024 * 1024; // tamaño máximo por archivo

function chunkFiles(files, maxCount, maxBytes) {
    const chunks = [];
    let current = [];
    let bytes = 0;

    for (const file of files) {
        const size = Buffer.isBuffer(file.attachment) ? file.attachment.length : 0;
        if (current.length >= maxCount || (current.length > 0 && bytes + size > maxBytes)) {
            chunks.push(current);
            current = [];
            bytes = 0;
        }
        current.push(file);
        bytes += size;
    }
    if (current.length > 0) chunks.push(current);

    return chunks.length > 0 ? chunks : [[]];
}


async function collectEvidence(client, pendingBan) {
    const result = { screenshot: null, attachments: [], before: 0, after: 0, skipped: 0 };

    let target = null;
    let beforeMsgs = [];
    let afterMsgs = [];

    try {
        const channel = await client.channels.fetch(pendingBan.channelId);
        target = await channel.messages.fetch(pendingBan.messageId);

        const byTime = (a, b) => a.createdTimestamp - b.createdTimestamp;
        const before = await channel.messages
            .fetch({ before: pendingBan.messageId, limit: CONTEXT_BEFORE })
            .catch(() => null);
        const after = await channel.messages
            .fetch({ after: pendingBan.messageId, limit: CONTEXT_AFTER })
            .catch(() => null);

        beforeMsgs = before ? [...before.values()].sort(byTime) : [];
        afterMsgs = after ? [...after.values()].sort(byTime) : [];
    } catch (error) {
        console.error('Error fetching evidence context:', error);
    }

    result.before = beforeMsgs.length;
    result.after = afterMsgs.length;

    if (target) {
        try {
            result.screenshot = await renderMessagesToImage([...beforeMsgs, target, ...afterMsgs], target.id);
        } catch (error) {
            console.error('Error generating message screenshot:', error);
        }
    }

    let candidates = [];
    if (target) {
        const fromTarget = [...target.attachments.values()];
        const contextMsgs = [...beforeMsgs.slice().reverse(), ...afterMsgs];
        const fromContext = contextMsgs
            .flatMap((m) => [...m.attachments.values()])
            .filter((a) => a.contentType?.startsWith('image/'));
        candidates = [...fromTarget, ...fromContext];
    } else {
        candidates = (pendingBan.attachments || []).map((url) => ({ url }));
    }

    const usable = candidates.filter((a) => !a.size || a.size <= MAX_FILE_SIZE);
    result.skipped = candidates.length - usable.length;

    const downloaded = await downloadAttachments(usable.map((a) => a.url));
    result.attachments = downloaded.map((att, i) => ({
        ...att,
        filename: `${i + 1}_${att.filename}`,
    }));

    return result;
}

async function renderMessagesToImage(messages, targetId) {
    const { createCanvas, loadImage } = require('@napi-rs/canvas');

    const images = [];
    for (const m of messages) {
        const buffer = await renderMessageToImage(m, m.id === targetId);
        if (buffer) images.push(await loadImage(buffer));
    }
    if (images.length === 0) return null;

    const width = Math.max(...images.map((i) => i.width));
    const height = images.reduce((sum, i) => sum + i.height, 0);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#313338';
    ctx.fillRect(0, 0, width, height);

    let y = 0;
    for (const img of images) {
        ctx.drawImage(img, 0, y);
        y += img.height;
    }
    return canvas.toBuffer('image/png');
}

async function renderMessageToImage(message, highlight = false) {
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

        if (highlight) {
            ctx.fillStyle = '#3f2f33';
            ctx.fillRect(0, 0, maxWidth, canvasHeight);
            ctx.fillStyle = '#ed4245';
            ctx.fillRect(0, 0, 4, canvasHeight);
        }

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
        const timeString =
            date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
            ', ' +
            date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
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
        if (word.includes('\n')) {
            const parts = word.split('\n');
            for (let i = 0; i < parts.length; i++) {
                if (i > 0) {
                    if (currentLine.trim()) lines.push(currentLine.trim());
                    currentLine = '';
                }
                if ((currentLine + parts[i]).length > charsPerLine) {
                    if (currentLine.trim()) lines.push(currentLine.trim());
                    currentLine = parts[i] + ' ';
                } else {
                    currentLine += parts[i] + ' ';
                }
            }
            continue;
        }

        if ((currentLine + word).length > charsPerLine) {
            if (currentLine.trim()) lines.push(currentLine.trim());
            currentLine = word + ' ';
        } else {
            currentLine += word + ' ';
        }
    }

    if (currentLine.trim()) lines.push(currentLine.trim());

    if (lines.length > 15) return [...lines.slice(0, 15), '...'];
    return lines;
}

async function downloadAttachments(attachmentUrls) {
    if (!attachmentUrls || attachmentUrls.length === 0) return [];

    const downloadedFiles = [];
    for (const url of attachmentUrls) {
        try {
            const buffer = await downloadFile(url);
            if (buffer) {
                const pathname = new URL(url).pathname;
                const filename = pathname.split('/').pop() || 'attachment';
                const extension = filename.includes('.') ? '.' + filename.split('.').pop() : '';
                downloadedFiles.push({ buffer, filename, extension });
            }
        } catch (error) {
            console.error(`Error downloading attachment from ${url}:`, error.message);
        }
    }
    return downloadedFiles;
}

function downloadFile(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        const request = protocol.get(url, { timeout: 10000 }, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                downloadFile(response.headers.location).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        });

        request.on('error', reject);
        request.on('timeout', () => {
            request.destroy();
            reject(new Error('Request timed out'));
        });
    });
}