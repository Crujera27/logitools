/*
.____                 .__  __                .__          
|    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
|    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
|    |__(  <_> ) /_/  >  ||  | (  <_> |  <_> )  |__\___ \ 
|_______ \____/\___  /|__||__|  \____/ \____/|____/____  >
        \/    /_____/                                  \/ 
                         
        
    Copyright © 2024 Crujera27 y contribuidores. Todos los derechos reservados.
    
    GitHub: https://github.com/Crujera27/
    Web: https://crujera.galnod.com
    Licencia del proyecto: CC BY-NC-ND 4.0

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
      const parseConfigModule = (
        await import("../../../../tools/parseConfig.mjs")
      ).default;
      const parseConfig = await parseConfigModule;
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
          if (appConfig.reset_cnt_add_nextlvl_warn_on_limit == true) {
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
          if (appConfig.reset_cnt_add_nextlvl_warn_on_limit == true) {
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
