/*
.____                 .__  __                .__          
|    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
|    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
|    |__(  <_> ) /_/  >  ||  | (  <_> |  <_> )  |__\___ \ 
|_______ \____/\___  /|__||__|  \____/ \____/|____/____  >
        \/    /_____/                                  \/ 
                         
        
    Copyright (C) 2024 Ángel Crujera (angel.c@galnod.com)

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
    Website: https://crujera.galnod.com

*/

const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient.js");
const { time } = require("../../../functions");
const toolsPromise = import("../../../../tools/punishment.mjs");
const ms = require("ms");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription(
      "[STAFF] Insinua una suspensión temporal a un usuario (timeout)"
    )
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("El usuario al que sancionar")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("duration")
        .setDescription("Duración de la suspensión temporal (Ej: 30m, 12h, 3d)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Razón de la suspensión temporal")
        .setRequired(true)
    ),
  run: async (client, interaction) => {
    const mentionable = interaction.options.getUser("user");
    const duration = interaction.options.get("duration").value;
    const reason =
      interaction.options.get("reason")?.value || "No reason provided";

    const targetUser = await interaction.guild.members.cache.get(
      mentionable.id
    );
    if (!targetUser) {
      await interaction.reply({
        content: "El usuario especificado no está en el servidor.",
        ephemeral: true,
      });
      return;
    }

    if (targetUser.bot) {
      await interaction.reply({
        content: "No se puede aplicar la sanción a un bot.",
        ephemeral: true,
      });
      return;
    }

    const msDuration = ms(duration);
    if (isNaN(msDuration)) {
      await interaction.reply({
        content: "Por favor, proporcione una duración válida.",
        ephemeral: true,
      });
      return;
    }

    if (msDuration < 5000 || msDuration > 2.419e9) {
      await interaction.reply({
        content:
          "La duración de la suspensión temporal no puede ser menos de 5 segundos o más de 28 días.",
        ephemeral: true,
      });
      return;
    }

    const targetUserRolePosition = targetUser.roles.highest.position;
    const requestUserRolePosition = interaction.member.roles.highest.position;
    const botRolePosition = interaction.guild.members.me.roles.highest.position;

    if (targetUserRolePosition >= requestUserRolePosition) {
      await interaction.reply({
        content:
          "No puede suspender el tiempo de espera de ese usuario porque tiene el mismo rol o un rol superior al suyo.",
        ephemeral: true,
      });
      return;
    }

    if (targetUserRolePosition >= botRolePosition) {
      await interaction.reply({
        content:
          "No puedo desactivar el tiempo de espera de ese usuario porque tiene el mismo rol o un rol superior que yo.",
        ephemeral: true,
      });
      return;
    }
    try {
      const { default: prettyMs } = await import("pretty-ms");
      const tools = await toolsPromise;

      if (targetUser.isCommunicationDisabled()) {
        await targetUser.timeout(msDuration, reason);
        const punishmentapplied = await tools.applyPunishment(
          targetUser.id,
          "timeout",
          reason,
          interaction.user.id
        );
        if (!punishmentapplied.success) {
          await interaction.reply({
            content:
              "Ha ocurrido un error al intentar registrar la sanción en el historial del usuario.",
            ephemeral: true,
          });
          return;
        }
        await interaction.reply(
          `La suspensión temporal del usuario/a ${targetUser}(${
            targetUser.id
          }) ha sido actualizada a **${prettyMs(msDuration, {
            verbose: true,
          })}** con la razón: \`${reason}\``
        );
      } else {
        await targetUser.timeout(msDuration, reason);
        const punishmentapplied = await tools.applyPunishment(
          targetUser.id,
          "timeout",
          reason,
          interaction.user.id
        );
        if (!punishmentapplied.success) {
          await interaction.reply({
            content:
              "Ha ocurrido un error al intentar registrar la sanción en el historial del usuario.",
            ephemeral: true,
          });
          return;
        }
        const timeoutEmbed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("Mensaje de la moderación de Logikk's Discord")
          .setDescription(
            `Hola, ${targetUser}. Nos ponemos en contacto con usted mediante el presente comunicado para informarle sobre las medidas que se han tomado debido a su conducta.
            \n
            Sanción impuesta: **timeout**
            Razón: **${reason}**
            Duración: **${prettyMs(msDuration, { verbose: true })}**
            \n
            Le recomendamos que visite el canal de <#901587290093158442> y eche un vistazo para evitar posibles sanciones en el futuro.
            Puede encontrar su historial del servidor en [aquí](https://logikk.crujera.net/history).
            \n
            Un saludo,
            **Equipo administrativo de Logikk's Discord**`
          )
          .setTimestamp();

        try {
          await targetUser.send({ embeds: [timeoutEmbed] });
        } catch (error) {
          console.error(`Error sending DM to ${targetUser}: ${error.message}`);
        }
        await interaction.reply(
          `${targetUser}(${
            targetUser.id
          }) ha sido temporalmente suspendido/a **${prettyMs(msDuration, {
            verbose: true,
          })}** con la razón: \`${reason}\``
        );
      }
    } catch (error) {
      console.error(`There was an error when timing out: ${error}`);
      await interaction.reply({
        content:
          " Ha ocurrido un error desconocido al intentar aplicar el timeout al usuario.",
        ephemeral: true,
      });
      return;
    }
  },
};
