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
    Licencia del proyecto: MIT

*/

const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient.js');
const { time } = require('../../../functions');
const toolsPromise = import('../../../../tools/punishment.mjs');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('[STAFF] Insinua una advertencia a un usuario, existen tres niveles, leve, medio y grave.')
        .addUserOption((opt) =>
            opt.setName('user')
                .setDescription('El usuario al que sancionar')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('level')
                .setDescription('Nivel del warn (leve, medio o grave)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Razón del warn')
                .setRequired(true)
        ),
    run: async (client, interaction) => {
        const target = interaction.options.getUser('user');
        const interactionlevel = interaction.options.get('level').value;
        const reason = interaction.options.get('reason').value;
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
                content: 'El usuario especificado no está en el servidor.',
                ephemeral: true
            });
            return;
        }

        if (target.bot) {
            await interaction.reply({
                content: 'No se puede aplicar la sanción a un bot',
                ephemeral: true
            });
            return;
        }

        if (level == null) {
            await interaction.reply({
                content: 'El nivel del warn proporcionado es inválido, solamente hay disponible: `leve`, `medio` o `grave`',
                ephemeral: true
            });
            return;
        }
        const tools = await toolsPromise;
        const punishmentapplied = await tools.applyPunishment(target.id, level, reason, interaction.user.id);

        if (!punishmentapplied.success) {
            await interaction.reply({
                content: 'Ha ocurrido un error al intentar aplicar el warn al usuario.',
                ephemeral: true
            });
            return;
        }

        await interaction.reply({
            content: `${target}(${target.id}) ha recibido un warn **${interactionlevel}** con la razón: \`${reason}\``
        });
    }
};
