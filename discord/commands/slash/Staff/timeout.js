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
const ms = require('ms');



module.exports = {
    structure: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('[STAFF] Insinua una suspensión temporal a un usuario (timeout)')
        .addUserOption((opt) =>
            opt.setName('user')
                .setDescription('El usuario al que sancionar')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duración de la suspensión temporal (Ej: 30m, 12h, 3d)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Razón de la suspensión temporal')
                .setRequired(true)
        ),
    run: async (client, interaction) => {
        const mentionable = interaction.options.getUser('user');
        const duration = interaction.options.get('duration').value;
        const reason = interaction.options.get('reason')?.value || 'No reason provided';

        const targetUser = await interaction.guild.members.cache.get(mentionable.id);
        if (!targetUser) {
            await interaction.reply({
                content: 'El usuario especificado no está en el servidor.',
                ephemeral: true
            });
            return;
        }

        if (targetUser.bot) {
            await interaction.reply({
                content: 'No se puede aplicar la sanción a un bot.',
                ephemeral: true
            });
            return;
        }

        const msDuration = ms(duration);
        if (isNaN(msDuration)) {
            await interaction.reply({
                content: 'Por favor, proporcione una duración válida.',
                ephemeral: true
            });
            return;
        }

        if (msDuration < 5000 || msDuration > 2.419e9) {
            await interaction.reply({
                content: 'La duración de la suspensión temporal no puede ser menos de 5 segundos o más de 28 días.',
                ephemeral: true
            });
            return;
        }

        const targetUserRolePosition = targetUser.roles.highest.position;
        const requestUserRolePosition = interaction.member.roles.highest.position;
        const botRolePosition = interaction.guild.members.me.roles.highest.position;

        if (targetUserRolePosition >= requestUserRolePosition) {
            await interaction.reply({
                content: 'No puede suspender el tiempo de espera de ese usuario porque tiene el mismo rol o un rol superior al suyo.',
                ephemeral: true
            });
            return;
        }

        if (targetUserRolePosition >= botRolePosition) {
            await interaction.reply({
                content: 'No puedo desactivar el tiempo de espera de ese usuario porque tiene el mismo rol o un rol superior que yo.',
                ephemeral: true
            });
            return;
        }
        try {
            const { default: prettyMs } = await import('pretty-ms');
            const tools = await toolsPromise;
            

            if (targetUser.isCommunicationDisabled()) {
                await targetUser.timeout(msDuration, reason);
                const punishmentapplied = await tools.applyPunishment(targetUser.id, 'timeout', reason, interaction.user.id);
                if (!punishmentapplied.success) {
                    await interaction.reply({
                        content: 'Ha ocurrido un error al intentar registrar la sanción en el historial del usuario.',
                        ephemeral: true
                    });
                    return;
                }
                await interaction.reply(`La suspensión temporal del usuario/a ${targetUser}(${targetUser.id}) ha sido actualizada a **${prettyMs(msDuration, { verbose: true })}** con la razón: \`${reason}\``);
            } else {
                await targetUser.timeout(msDuration, reason);
                const punishmentapplied = await tools.applyPunishment(targetUser.id, 'timeout', reason, interaction.user.id);
                if (!punishmentapplied.success) {
                    await interaction.reply({
                        content: 'Ha ocurrido un error al intentar registrar la sanción en el historial del usuario.',
                        ephemeral: true
                    });
                    return;
                }
                await interaction.reply(`${targetUser}(${targetUser.id}) ha sido temporalmente suspendido/a **${prettyMs(msDuration, { verbose: true })}** con la razón: \`${reason}\``);
            }
        } catch (error) {
            console.error(`There was an error when timing out: ${error}`);
            await interaction.reply({
                content: ' Ha ocurrido un error desconocido al intentar aplicar el timeout al usuario.',
                ephemeral: true
            });
            return;
        }

    },
};
