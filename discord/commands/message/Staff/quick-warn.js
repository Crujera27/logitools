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

const { 
    MessageContextMenuCommandInteraction, 
    ContextMenuCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient.js');
const config = require('../../../config.js');

module.exports = {
    structure: new ContextMenuCommandBuilder()
        .setName('[Staff] Warn rápido')
        .setType(3),
    /**
     * @param {ExtendedClient} client 
     * @param {MessageContextMenuCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        try {
            // Check if user has a staff role from config
            const staffRoles = config.roles?.staff || [];
            
            const hasStaffRole = interaction.member.roles.cache.some(role => 
                staffRoles.includes(role.id)
            ) || interaction.member.permissions.has('Administrator');

            if (!hasStaffRole) {
                return await interaction.reply({
                    content: 'No tienes permisos para usar este comando.',
                    ephemeral: true,
                });
            }

            const targetMessage = interaction.targetMessage;
            const targetUser = targetMessage.author;

            if (targetUser.id === interaction.user.id) {
                return await interaction.reply({
                    content: 'No puedes warnearte a ti mismo/a.',
                    ephemeral: true,
                });
            }

            if (targetUser.bot) {
                return await interaction.reply({
                    content: 'No puedes aplicar un warn a un bot.',
                    ephemeral: true,
                });
            }

            if (targetUser.id === interaction.guild.ownerId) {
                return await interaction.reply({
                    content: 'No puedes aplicar un warn al dueño/a del servidor.',
                    ephemeral: true,
                });
            }

            if (!client.pendingWarns) {
                client.pendingWarns = new Map();
            }
            
            client.pendingWarns.set(interaction.user.id, {
                messageId: targetMessage.id,
                messageContent: targetMessage.content,
                messageUrl: targetMessage.url,
                channelId: targetMessage.channel.id,
                targetUserId: targetUser.id,
                targetUserTag: targetUser.tag,
                targetUserAvatar: targetUser.displayAvatarURL({ size: 128 }),
                timestamp: targetMessage.createdTimestamp,
                attachments: Array.from(targetMessage.attachments.values()).map(a => a.url)
            });

            const modal = new ModalBuilder()
                .setCustomId('quick-warn-modal')
                .setTitle('Warn Rápido');

            const reasonInput = new TextInputBuilder()
                .setCustomId('warn-reason')
                .setLabel('Razón del warn')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Escribe la razón del warn...')
                .setRequired(true)
                .setMaxLength(500);

            const levelInput = new TextInputBuilder()
                .setCustomId('warn-level')
                .setLabel('Nivel (leve, medio, grave)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('leve / medio / grave')
                .setRequired(true)
                .setMaxLength(10);

            const reasonRow = new ActionRowBuilder().addComponents(reasonInput);
            const levelRow = new ActionRowBuilder().addComponents(levelInput);

            modal.addComponents(reasonRow, levelRow);

            await interaction.showModal(modal);

        } catch (error) {
            console.error('Error in quick-warn context menu:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'Ha ocurrido un error inesperado.',
                    ephemeral: true,
                });
            }
        }
    }
};
