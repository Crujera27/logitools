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

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("warn")
    .setDescription(
      "[STAFF] Insinua una advertencia a un usuario, existen tres niveles, leve, medio y grave."
    )
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("El usuario al que sancionar")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("level")
        .setDescription("Nivel del warn (leve, medio o grave)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Razón del warn")
        .setRequired(true)
    ),
  run: async (client, interaction) => {
    const target = interaction.options.getUser("user");
    const interactionlevel = interaction.options.get("level").value;
    const reason = interaction.options.get("reason").value;
    const member = interaction.guild.members.cache.get(target.id);
    let level = null;

    if (interactionlevel == "leve") {
      level = "warn_mild";
    } else if (interactionlevel == "medio") {
      level = "warn_middle";
    } else if (interactionlevel == "grave") {
      level = "warn_severe";
    }

    if (!member) {
      await interaction.reply({
        content: "El usuario especificado no está en el servidor.",
        ephemeral: true,
      });
      return;
    }

    if (target.bot) {
      await interaction.reply({
        content: "No se puede aplicar la sanción a un bot",
        ephemeral: true,
      });
      return;
    }

    if (level == null) {
      await interaction.reply({
        content:
          "El nivel del warn proporcionado es inválido, solamente hay disponible: `leve`, `medio` o `grave`",
        ephemeral: true,
      });
      return;
    }

    try {
      const toolsModule = await import("../../../../tools/punishment.mjs");
      const tools = await toolsModule;
      const punishmentapplied = await tools.applyPunishment(
        target.id,
        level,
        reason,
        interaction.user.id
      );

      if (!punishmentapplied.success) {
        await interaction.reply({
          content:
            "Ha ocurrido un error al intentar aplicar el warn al usuario.",
          ephemeral: true,
        });
        return;
      }

      // Check warns
      const parseConfigModule = await import("../../../../tools/parseConfig.mjs");
      const parseConfig = parseConfigModule.default;
      const appConfig = await parseConfig();

      const checkPunishments = await tools.getUserVigentPunishments(target.id);

      if (checkPunishments.success) {
        const warnsleves = checkPunishments.punishments.filter(
          (punishment) => punishment.punishment_type === "warn_mild"
        );
        const warnsmedios = checkPunishments.punishments.filter(
          (punishment) => punishment.punishment_type === "warn_middle"
        );
        const warnsgrave = checkPunishments.punishments.filter(
          (punishment) => punishment.punishment_type === "warn_severe"
        );

        if (warnsleves.length >= appConfig.punishments.limit_warns_mild) {

          await tools.updateExpirationStatusByUserAndType(
            target.id,
            "warn_mild"
          );
          console.log(await appConfig.punishments.reset_cnt_add_nextlvl_warn_on_limit)
          if (appConfig.punishments.reset_cnt_add_nextlvl_warn_on_limit == true) {
            await tools.applyPunishment(
              target.id,
              "warn_middle",
              "Límite de warns leves superados",
              interaction.user.id
            );
          }
          if (appConfig.punishments.punishment_limit_warn_mild == "ban") {
            const banEmbed = new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle("Mensaje de la moderación de Logikk's Discord")
            .setDescription(
              `Hola, ${target}. Nos ponemos en contacto con usted mediante el presente comunicado para informarle sobre las medidas que se han tomado debido a su conducta.
              \n\n
              Sanción impuesta: **Ban**
              Razón: **Límite de warns leves superado.**
              \n\n
              Un saludo,
              **Equipo administrativo de Logikk's Discord**
              `
            )
            .setTimestamp();

            try {
                await target.send({ embeds: [banEmbed] });
              } catch (error) {
                console.error(
                  `Error sending DM to ${target.username}: ${error.message}`
                );
              }
            const banTarget = await interaction.guild.members.fetch(target);
            await banTarget.ban({ reason: "Límite de warns graves superado." });
          }
          return;
        }

        if (warnsmedios.length >= appConfig.punishments.limit_warns_milddle) {
          await tools.updateExpirationStatusByUserAndType(
            target.id,
            "warn_middle"
          );
          if (appConfig.punishments.reset_cnt_add_nextlvl_warn_on_limit == true) {
            await tools.applyPunishment(
              target.id,
              "warn_severe",
              "Límite de warns medios superados",
              interaction.user.id
            );
            if (appConfig.punishments.punishment_limit_warn_milddle == "ban") {
                const banEmbed = new EmbedBuilder()
                .setColor("#ff0000")
                .setTitle("Mensaje de la moderación de Logikk's Discord")
                .setDescription(
                  `Hola, ${target}. Nos ponemos en contacto con usted mediante el presente comunicado para informarle sobre las medidas que se han tomado debido a su conducta.
                  \n\n
                  Sanción impuesta: **Ban**
                  Razón: **Límite de warns medios superado.**
                  \n\n
                  Un saludo,
                  **Equipo administrativo de Logikk's Discord**
                  `
                )
                .setTimestamp();
    
                try {
                    await target.send({ embeds: [banEmbed] });
                  } catch (error) {
                    console.error(
                      `Error sending DM to ${target.username}: ${error.message}`
                    );
                  }
                const banTarget = await interaction.guild.members.fetch(target);
                await banTarget.ban({ reason: "Límite de warns graves superado." });
              }
          }
          return;
        }
  if (warnsgrave.length >= appConfig.punishments.limit_warns_severe) {
          await tools.updateExpirationStatusByUserAndType(
            target.id,
            "warn_severe"
          );
          if (appConfig.punishments.punishment_limit_warn_severe == "ban") {
            const banEmbed = new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle("Mensaje de la moderación de Logikk's Discord")
            .setDescription(
              `Hola, ${target}. Nos ponemos en contacto con usted mediante el presente comunicado para informarle sobre las medidas que se han tomado debido a su conducta.
              \n\n
              Sanción impuesta: **Ban**
              Razón: **Límite de warns graves superado.**
              \n\n
              Un saludo,
              **Equipo administrativo de Logikk's Discord**
              `
            )
            .setTimestamp();

            try {
                await target.send({ embeds: [banEmbed] });
              } catch (error) {
                console.error(
                  `Error sending DM to ${target.username}: ${error.message}`
                );
              }
            const banTarget = await interaction.guild.members.fetch(target);
            await banTarget.ban({ reason: "Límite de warns graves superado." });
          }
          await tools.applyPunishment(
            target.id,
            "ban",
            "Límite de warns graves superados",
            interaction.user.id
          );
          return;
        }
      } else {
        console.log("Error:", checkPunishments.message);
        await interaction.reply({
          content:
            "Ha ocurrido un error al intentar comprobar los warns del usuario.",
          ephemeral: true,
        });
        return;
      }
      const warnEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("Mensaje de la moderación de Logikk's Discord")
        .setDescription(
          `Hola, ${target}. Nos ponemos en contacto con usted mediante el presente comunicado para informarle sobre las medidas que se han tomado debido a su conducta.
          \n
          Sanción impuesta: **Warn ${interactionlevel}**
          Razón: **${reason}**
          \n
          Le recomendamos que visite el canal de <#901587290093158442> y eche un vistazo para evitar posibles sanciones en el futuro.
          Puede encontrar su historial del servidor en [aquí](https://logikk.galnod.com/history).
          Si considera que esta sanción ha sido aplicada de forma incorrecta o injusta, abra un ticket en <#928733150467735642>
          \n
          Un saludo,
          **Equipo administrativo de Logikk's Discord**`
        )
        .setTimestamp();

      try {
        await target.send({ embeds: [warnEmbed] });
      } catch (error) {
        console.error(
          `Error sending DM to ${target.username}: ${error.message}`
        );
      }

      await interaction.reply({
        content: `${target}(${target.id}) ha recibido un warn **${interactionlevel}** con la razón: \`${reason}\``,
      });
      return;
    } catch (error) {
      console.error("Error:", error);
      await interaction.reply({
        content: "Ha ocurrido un error inesperado.",
        ephemeral: true,
      });
    }
  },
};
