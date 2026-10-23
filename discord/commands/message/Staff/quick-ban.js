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
    ActionRowBuilder,
    ApplicationIntegrationType,
    InteractionContextType
} = require('discord.js');
const crypto = require("crypto");
const config = require("../../../config.js");

const { makeCaptcha } = require("../../../functions.js");

module.exports = {
  structure: new ContextMenuCommandBuilder()
    .setName("[Staff] Ban rápido")
    //.setType(ApplicationCommandType.Message)
    .setType(3)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild),

  /**
   * @param {import('../../class/ExtendedClient.js')} client
   * @param {import('discord.js').MessageContextMenuCommandInteraction} interaction
   */
  run: async (client, interaction) => {
    const staffRoles = config.roles?.staff || [];
    const hasStaffRole =
      interaction.member.roles.cache.some((r) => staffRoles.includes(r.id)) ||
      interaction.member.permissions.has("Administrator");

    if (!hasStaffRole) {
      return interaction.reply({
        content: "No tienes permisos para usar este comando.",
        ephemeral: true,
      });
    }

    const message = interaction.targetMessage;
    const target = message.author;
    const member = interaction.guild.members.cache.get(target.id);

    if (target.bot) {
      return interaction.reply({
        content: "No se puede aplicar la sanción a un bot",
        ephemeral: true,
      });
    }
    if (target.id === interaction.user.id) {
      return interaction.reply({
        content: "No puedes banearte a ti mismo.",
        ephemeral: true,
      });
    }
    if (member) {
      if (!member.bannable) {
        return interaction.reply({
          content: "No puedo banear a este usuario (jerarquía de roles o permisos).",
          ephemeral: true,
        });
      }
      const isOwner = interaction.guild.ownerId === interaction.user.id;
      if (!isOwner && member.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.reply({
          content: "No puedes banear a alguien con un rol igual o superior al tuyo.",
          ephemeral: true,
        });
      }
    }

    const captcha = makeCaptcha(4);
    if (!client.pendingBans) client.pendingBans = new Map();
    client.pendingBans.set(interaction.user.id, {
      targetUserId: target.id,
      channelId: message.channelId,
      messageId: message.id,
      attachments: [...message.attachments.values()].map((a) => a.url),
      captcha,
      expiresAt: Date.now() + 120_000,
    });

    const rawContent = (message.content || "").replace(/\s+/g, " ").trim();
    const excerpt = rawContent
      ? rawContent.length > 300
        ? rawContent.slice(0, 300) + "…"
        : rawContent
      : "(sin texto)";
    const attachmentsCount = message.attachments.size;

    const infoText =
      "Por favor, lee con atención antes de continuar.\n\n" +
      "Verifica que este es el mensaje que incumple las normas. " +
      "Una vez aplicado, el ban no podrá modificarse ni revertirse desde esta acción.\n\n" +
      `Usuario: ${target.username} (${target.id})\n` +
      `Mensaje: ${excerpt}\n` +
      `Adjuntos: ${attachmentsCount}\n\n` +
      "Como prueba se adjuntarán en el canal de evidencias este mensaje junto con " +
      "los 5 mensajes anteriores y los 5 posteriores (si existen) y sus imágenes. " +
      "Si no caben todos los archivos en un solo mensaje, el resto se enviará como respuestas adicionales.\n\n" +
      "Si decides eliminar mensajes (de 1 a 7 días), se borrarán todos los mensajes " +
      "del usuario de ese periodo y no podrán utilizarse como prueba posteriormente. " +
      "En el canal de evidencias solo quedará registrado el mensaje seleccionado y su contexto.\n\n" +
      "Este apartado es meramente informativo, cualquier cambio que hagas en él no se tendrá en cuenta.";

    const modal = new ModalBuilder()
      .setCustomId("quick-ban-modal")
      .setTitle(`Ban rápido - ${target.username}`.slice(0, 45));

    const infoInput = new TextInputBuilder()
      .setCustomId("ban-info")
      .setLabel("INFORMACIÓN IMPORTANTE")
      .setStyle(TextInputStyle.Paragraph)
      .setValue(infoText.slice(0, 4000))
      .setRequired(false);

    const reasonInput = new TextInputBuilder()
      .setCustomId("ban-reason")
      .setLabel("Razón del ban")
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(500)
      .setRequired(true);

    const daysInput = new TextInputBuilder()
      .setCustomId("ban-days")
      .setLabel("Borrar mensajes de los últimos días (0-7)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("0 = no eliminar mensajes")
      .setMaxLength(1)
      .setRequired(false);

    const captchaInput = new TextInputBuilder()
      .setCustomId("ban-captcha")
      .setLabel(`Repite el código: ${captcha}`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Confirma que has leído la información")
      .setMinLength(4)
      .setMaxLength(4)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(infoInput),
      new ActionRowBuilder().addComponents(reasonInput),
      new ActionRowBuilder().addComponents(daysInput),
      new ActionRowBuilder().addComponents(captchaInput)
    );

    await interaction.showModal(modal);
  },
};