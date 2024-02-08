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
const { log } = require('../../../functions.js');
const toolsPromise = import('../../../../tools/punishment.mjs');



module.exports = {
    structure: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('[STAFF] Suspende a un usuario del servidor de manera permanente.')
        .addUserOption((opt) =>
            opt.setName('user')
                .setDescription('El usuario al que sancionar')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Razón de la suspensión temporal')
                .setRequired(true)
        ),
    run: async (client, interaction) => {
        const mentionable = interaction.options.getUser('user');
        const reason = interaction.options.get('reason')?.value || 'No razón proporcionada';

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


        const targetUserRolePosition = targetUser.roles.highest.position;
        const requestUserRolePosition = interaction.member.roles.highest.position;
        const botRolePosition = interaction.guild.members.me.roles.highest.position;

        if (targetUserRolePosition >= requestUserRolePosition) {
            await interaction.reply({
                content: 'No puede suspender a ese usuario porque tiene el mismo rol o un rol superior al suyo.',
                ephemeral: true
            });
            return;
        }

        if (targetUserRolePosition >= botRolePosition) {
            await interaction.reply({
                content: 'No puedo banear ese usuario porque tiene el mismo rol o un rol superior que yo.',
                ephemeral: true
            });
            return;
        }
        try {
            const tools = await toolsPromise;
            const bannedEmbed = new EmbedBuilder()
                .setColor()
                .setTitle('Mensaje de la moderación de Logikk\'s Discord')
                .setDescription(`Hola, ${targetUser}. Nos ponemos en contacto con usted mediante el presente comunicado para informarle sobre las medidas que se han tomado debido a su conducta.\n\n Sanción impuesta: **Suspensión permanente (Ban)**\nRazón: ${reason}\n\nSi considera que esta sanción ha sido aplicada de forma incorrecta / injusta, puede enviar una solitud de apelación en https://logikk.galnod.com/support\n\n Un saludo, **Departamento de Certidumbre y Seguridad de Logikk's Discord**`)
                .setTimestamp();
        
            targetUser.send({ embeds: [bannedEmbed] });
            const punishmentapplied = await tools.applyPunishment(targetUser.id, 'ban', reason, interaction.user.id);
            
            if (!punishmentapplied.success) {
                await interaction.reply({
                    content: 'Ha ocurrido un error al intentar registrar la sanción en el historial del usuario.',
                    ephemeral: true
                });
                return;
            }
            const finalreason = reason+'ID Staff: '+interaction.user.id
            await targetUser.ban({ finalreason });
            await interaction.reply(`${targetUser}(${targetUser.id}) ha sido suspendido/a **permanentemente** con la razón: \`${reason}\``);
            return;
        } catch (error) {
            log(`There was an error when baning: ${error}`, 'err');
            await interaction.reply({
                content: 'Ha ocurrido un error desconocido al intentar aplicar el ban al usuario.',
                ephemeral: true
            });
            return;
        }
}}
