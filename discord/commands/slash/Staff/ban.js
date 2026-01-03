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

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient.js');
const { log } = require('../../../functions.js');

let toolsPromise;
try {
    toolsPromise = import('../../../../tools/punishment.mjs');
} catch (error) {
    console.error('Error importing tools:', error);
}

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
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    run: async (client, interaction) => {
        await interaction.deferReply();

        try {
            const mentionable = interaction.options.getUser('user');
            const reason = interaction.options.get('reason')?.value || 'No razón proporcionada';

            const targetUser = await interaction.guild.members.fetch(mentionable);

            if (!targetUser) {
                await interaction.editReply("Ese usuario no existe en este servidor.");
                return;
            }

            if (targetUser.id === interaction.guild.ownerId) {
                await interaction.editReply("No puedes banear a ese usuario porque es el propietario del servidor.");
                return;
            }

            const targetUserRolePosition = targetUser.roles.highest.position; // Highest role of the target user
            const requestUserRolePosition = interaction.member.roles.highest.position; // Highest role of the user running the cmd
            const botRolePosition = interaction.guild.members.me.roles.highest.position; // Highest role of the bot

            if (targetUserRolePosition >= requestUserRolePosition) {
                await interaction.editReply("No puedes banear a ese usuario porque tiene el mismo o un rol más alto que tú.");
                return;
            }

            if (targetUserRolePosition >= botRolePosition) {
                await interaction.editReply("No puedo banear a ese usuario porque tiene el mismo o un rol más alto que yo.");
                return;
            }

            const tools = await toolsPromise;
            const bannedEmbed = new EmbedBuilder()
                .setColor("#ff0000")
                .setTitle('Mensaje de la moderación de Logikk\'s Discord')
                .setDescription(`Hola, ${targetUser}. Nos ponemos en contacto con usted mediante el presente comunicado para informarle sobre las medidas que se han tomado debido a su conducta.

Sanción impuesta: **Suspensión permanente (Ban)**
Razón: **${reason}**

Puede encontrar su historial del servidor en [aquí](https://logikk.crujera.net/history).
Si considera que esta sanción ha sido aplicada de forma incorrecta o injusta, abra un ticket en <#928733150467735642>

Un saludo,
**Equipo administrativo de Logikk's Discord**`)
                .setTimestamp();

            let dmSent = true;
            try {
                await targetUser.send({ embeds: [bannedEmbed] });
            } catch (error) {
                dmSent = false;
                await interaction.followUp(`No se pudo enviar el mensaje directo al usuario ${targetUser.user.tag} (${targetUser.id}). Procediendo con el ban.`);
            }

            const punishmentApplied = await tools.applyPunishment(targetUser.id, 'ban', reason, interaction.user.id);

            if (!punishmentApplied.success) {
                await interaction.editReply({
                    content: 'Ha ocurrido un error al intentar registrar la sanción en el historial del usuario.',
                });
                return;
            }

            const finalReason = `${reason} | ID del Staff: ${interaction.user.id}`;

            await targetUser.ban({ reason: finalReason });
            await interaction.editReply(`${targetUser.user.tag} (${targetUser.id}) ha sido suspendido/a **permanentemente** con la razón: \`${reason}\`${dmSent ? '' : ' (No se pudo enviar DM al usuario)'}`);
        } catch (error) {
            log(`Hubo un error al intentar banear: ${error}`, 'err');
            await interaction.editReply({
                content: `Ha ocurrido un error desconocido al intentar aplicar el ban al usuario. (${error})`,
            });
        }
    }
};
