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
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient.js");
const executeQuery = require("../../../../tools/mysql.mjs");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("aimod")
    .setDescription("[ADMIN] Gestionar la moderación automática por IA")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("toggle")
        .setDescription("Activar o desactivar la moderación por IA")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("Activar (true) o desactivar (false) la moderación por IA")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("status")
        .setDescription("Ver el estado actual de la moderación por IA")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("stats")
        .setDescription("Ver estadísticas de la moderación por IA")
        .addIntegerOption((option) =>
          option
            .setName("days")
            .setDescription("Número de días para las estadísticas (por defecto: 7)")
            .setMinValue(1)
            .setMaxValue(30)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("logs")
        .setDescription("Ver los logs recientes de moderación por IA")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Usuario específico para filtrar los logs")
        )
        .addIntegerOption((option) =>
          option
            .setName("limit")
            .setDescription("Número de logs a mostrar (por defecto: 10)")
            .setMinValue(1)
            .setMaxValue(25)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("test")
        .setDescription("Probar la conexión con el servidor Ollama y LlamaGuard3")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("analyze")
        .setDescription("Analizar un texto manualmente con LlamaGuard3")
        .addStringOption((option) =>
          option
            .setName("text")
            .setDescription("Texto a analizar")
            .setRequired(true)
        )
    ),

  run: async (client, interaction) => {
    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case "toggle":
          await handleToggle(interaction);
          break;
        case "status":
          await handleStatus(interaction);
          break;
        case "test":
          await handleTest(interaction);
          break;
        case "analyze":
          await handleAnalyze(interaction);
          break;
        case "stats":
          await handleStats(interaction);
          break;
        case "logs":
          await handleLogs(interaction);
          break;
        default:
          await interaction.reply({
            content: "Subcomando no reconocido.",
            ephemeral: true,
          });
      }
    } catch (error) {
      console.error("Error en comando aimod:", error);
      await interaction.reply({
        content: "Ha ocurrido un error al ejecutar el comando.",
        ephemeral: true,
      });
    }
  },
};

async function handleToggle(interaction) {
  const enabled = interaction.options.getBoolean("enabled");
  const value = enabled ? "1" : "0";

  try {
    await executeQuery(
      "UPDATE settings SET value = ? WHERE name = 'ai_moderation_enabled'",
      [value]
    );

    const embed = new EmbedBuilder()
      .setTitle("🤖 Moderación por IA")
      .setDescription(
        `La moderación automática por IA ha sido **${enabled ? "activada" : "desactivada"}**.`
      )
      .setColor(enabled ? "#00ff00" : "#ff0000")
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error toggling AI moderation:", error);
    await interaction.reply({
      content: "Error al cambiar el estado de la moderación por IA.",
      ephemeral: true,
    });
  }
}

async function handleStatus(interaction) {
  try {
    const settings = await executeQuery(
      "SELECT value FROM settings WHERE name = 'ai_moderation_enabled'"
    );

    const isEnabled = settings[0]?.value === "1";

    const activityStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_checks,
        SUM(CASE WHEN punishment_applied IS NOT NULL THEN 1 ELSE 0 END) as actions_taken,
        COUNT(DISTINCT user_id) as users_checked
      FROM ai_moderation_logs 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    const stats = activityStats[0] || { total_checks: 0, actions_taken: 0, users_checked: 0 };

    const embed = new EmbedBuilder()
      .setTitle("🤖 Estado de la Moderación por IA")
      .setColor(isEnabled ? "#00ff00" : "#ff0000")
      .addFields(
        {
          name: "Estado",
          value: isEnabled ? "✅ Activada" : "❌ Desactivada",
          inline: true,
        },
        {
          name: "Últimas 24h",
          value: `📊 ${stats.total_checks} análisis\n⚖️ ${stats.actions_taken} sanciones\n👥 ${stats.users_checked} usuarios`,
          inline: true,
        }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error getting AI moderation status:", error);
    await interaction.reply({
      content: "Error al obtener el estado de la moderación por IA.",
      ephemeral: true,
    });
  }
}

async function handleStats(interaction) {
  const days = interaction.options.getInteger("days") || 7;

  try {
    const stats = await executeQuery(`
      SELECT 
        COUNT(*) as total_checks,
        SUM(CASE WHEN punishment_applied = 'warn_mild' THEN 1 ELSE 0 END) as warn_mild,
        SUM(CASE WHEN punishment_applied = 'warn_middle' THEN 1 ELSE 0 END) as warn_middle,
        SUM(CASE WHEN punishment_applied = 'warn_severe' THEN 1 ELSE 0 END) as warn_severe,
        SUM(CASE WHEN punishment_applied = 'ban' THEN 1 ELSE 0 END) as bans,
        COUNT(DISTINCT user_id) as unique_users,
        ai_category,
        COUNT(*) as category_count
      FROM ai_moderation_logs 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY ai_category
      ORDER BY category_count DESC
    `, [days]);

    const totals = await executeQuery(`
      SELECT 
        COUNT(*) as total_checks,
        SUM(CASE WHEN punishment_applied IS NOT NULL THEN 1 ELSE 0 END) as total_actions,
        COUNT(DISTINCT user_id) as unique_users
      FROM ai_moderation_logs 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [days]);

    const totalData = totals[0] || { total_checks: 0, total_actions: 0, unique_users: 0 };

    let categoryBreakdown = "No hay datos disponibles";
    if (stats.length > 0) {
      categoryBreakdown = stats
        .filter(row => row.ai_category)
        .map(row => `${row.ai_category}: ${row.category_count}`)
        .slice(0, 8)
        .join("\n") || "Sin categorías específicas";
    }

    const embed = new EmbedBuilder()
      .setTitle(`📊 Estadísticas de Moderación IA (${days} días)`)
      .setColor("#0099ff")
      .addFields(
        {
          name: "Resumen General",
          value: `📈 **${totalData.total_checks}** análisis realizados\n⚖️ **${totalData.total_actions}** sanciones aplicadas\n👥 **${totalData.unique_users}** usuarios únicos`,
          inline: false,
        },
        {
          name: "Categorías más detectadas",
          value: `\`\`\`\n${categoryBreakdown}\`\`\``,
          inline: false,
        }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error getting AI moderation stats:", error);
    await interaction.reply({
      content: "Error al obtener las estadísticas de moderación por IA.",
      ephemeral: true,
    });
  }
}

async function handleLogs(interaction) {
  const targetUser = interaction.options.getUser("user");
  const limit = interaction.options.getInteger("limit") || 10;

  let query = `
    SELECT user_id, ai_decision, ai_category, punishment_applied, created_at
    FROM ai_moderation_logs 
    WHERE 1=1
  `;
  const params = [];

  if (targetUser) {
    query += " AND user_id = ?";
    params.push(targetUser.id);
  }

  query += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);

  try {
    const logs = await executeQuery(query, params);

    if (logs.length === 0) {
      await interaction.reply({
        content: "No se encontraron logs de moderación por IA.",
        ephemeral: true,
      });
      return;
    }

    const logsText = logs
      .map((log, index) => {
        const user = `<@${log.user_id}>`;
        const timestamp = `<t:${Math.floor(new Date(log.created_at).getTime() / 1000)}:R>`;
        const decision = log.ai_decision;
        const category = log.ai_category ? ` (${log.ai_category})` : "";
        const punishment = log.punishment_applied ? ` → ${log.punishment_applied}` : " → Sin sanción";
        
        return `**${index + 1}.** ${user} ${timestamp}\n   ${decision}${category}${punishment}`;
      })
      .join("\n\n");

    const embed = new EmbedBuilder()
      .setTitle(`📋 Logs de Moderación IA${targetUser ? ` - ${targetUser.username}` : ""}`)
      .setDescription(logsText)
      .setColor("#0099ff")
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error getting AI moderation logs:", error);
    await interaction.reply({
      content: "Error al obtener los logs de moderación por IA.",
      ephemeral: true,
    });
  }
}

async function handleTest(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const { testConnection } = await import("../../../../tools/ollama.mjs");
    const result = await testConnection();

    const embed = new EmbedBuilder()
      .setTitle("Test de Conexión Ollama")
      .setColor(result.connected ? "#00ff00" : "#ff0000")
      .addFields(
        {
          name: "Estado",
          value: result.connected ? "✅ Conectado" : "❌ Desconectado",
          inline: true,
        },
        {
          name: "Modelo",
          value: result.model || "N/A",
          inline: true,
        }
      )
      .setTimestamp();

    if (!result.connected) {
      embed.addFields({
        name: "Error",
        value: `\`\`\`${result.error || "Error desconocido"}\`\`\``,
        inline: false,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    await interaction.editReply({
      content: `Error al probar la conexión: ${error.message}`,
    });
  }
}

const CATEGORY_DESCRIPTIONS = {
  'S1': 'Crímenes Violentos',
  'S2': 'Crímenes No Violentos',
  'S3': 'Crímenes Sexuales',
  'S4': 'Explotación Infantil',
  'S5': 'Difamación',
  'S6': 'Consejos Especializados',
  'S7': 'Privacidad',
  'S8': 'Propiedad Intelectual',
  'S9': 'Armas Indiscriminadas',
  'S10': 'Discurso de Odio',
  'S11': 'Autolesión/Suicidio',
  'S12': 'Contenido Sexual',
  'S13': 'Desinformación Electoral',
};

async function handleAnalyze(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const text = interaction.options.getString("text");

  try {
    const { classifyContent } = await import("../../../../tools/ollama.mjs");
    const result = await classifyContent([{ role: "user", content: text }]);

    const embed = new EmbedBuilder()
      .setTitle("🔍 Análisis de Contenido")
      .setColor(result.safe ? "#00ff00" : "#ff0000")
      .addFields(
        {
          name: "Texto analizado",
          value: `\`\`\`${text.substring(0, 200)}${text.length > 200 ? "..." : ""}\`\`\``,
          inline: false,
        },
        {
          name: "Resultado",
          value: result.safe ? "✅ Seguro" : "⚠️ Inseguro",
          inline: true,
        },
        {
          name: "Categoría",
          value: result.category 
            ? `${result.category}: ${CATEGORY_DESCRIPTIONS[result.category] || 'Desconocida'}`
            : "N/A",
          inline: true,
        },
        {
          name: "Respuesta raw",
          value: `\`\`\`${result.raw || "Sin respuesta"}\`\`\``,
          inline: false,
        }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    await interaction.editReply({
      content: `Error al analizar el contenido: ${error.message}`,
    });
  }
}