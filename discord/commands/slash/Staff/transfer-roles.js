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
const config = require('../../../config.js');

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("transfer-roles")
    .setDescription("[ADMIN] Transferir roles de un usuario a otro")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option
        .setName("from")
        .setDescription("Usuario del que transferir roles")
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName("to")
        .setDescription("Usuario al que transferir roles")
        .setRequired(true)
    ),

  run: async (client, interaction) => {
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

    const fromUser = interaction.options.getUser("from");
    const toUser = interaction.options.getUser("to");

    const guild = interaction.guild;
    const fromMember = await guild.members.fetch(fromUser.id);
    const toMember = await guild.members.fetch(toUser.id);

    if (!fromMember || !toMember) {
      return await interaction.reply({
        content: "Uno o ambos usuarios no están en este servidor.",
        ephemeral: true,
      });
    }

    if (fromUser.id === toUser.id) {
      return await interaction.reply({
        content: "No se pueden transferir roles al mismo usuario.",
        ephemeral: true,
      });
    }

    // Cache roles
    const oldRoles = fromMember.roles.cache.filter(role => role.id !== guild.id).map(role => role.id);
    const newRoles = toMember.roles.cache.filter(role => role.id !== guild.id).map(role => role.id);

    // Remove all roles from new user
    try {
      await toMember.roles.set([]);
    } catch (error) {
      console.error("Error removing roles from new user:", error);
      return await interaction.reply({
        content: "Falló al remover roles del usuario objetivo. Verifica los permisos del bot.",
        ephemeral: true,
      });
    }

    // Transfer roles
    let success = true;
    const addedRoles = [];
    const removedRoles = [];

    for (const roleId of oldRoles) {
      try {
        await toMember.roles.add(roleId);
        addedRoles.push(roleId);
        await fromMember.roles.remove(roleId);
        removedRoles.push(roleId);
      } catch (error) {
        console.error(`Error transferring role ${roleId}:`, error);
        success = false;
        break;
      }
    }

    // Verify
    const finalOldRoles = fromMember.roles.cache.filter(role => role.id !== guild.id).map(role => role.id);
    const finalNewRoles = toMember.roles.cache.filter(role => role.id !== guild.id).map(role => role.id);

    if (success && finalNewRoles.length === oldRoles.length && finalOldRoles.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle("Transferencia de Roles Exitosa")
        .setDescription(`Se transfirieron exitosamente ${oldRoles.length} roles de ${fromUser.username} a ${toUser.username}.`)
        .setColor("Green");

      await interaction.reply({ embeds: [embed] });
    } else {
      // Revert
      for (const roleId of addedRoles) {
        try {
          await toMember.roles.remove(roleId);
        } catch (error) {
          console.error(`Error reverting role ${roleId} from new user:`, error);
        }
      }
      for (const roleId of removedRoles) {
        try {
          await fromMember.roles.add(roleId);
        } catch (error) {
          console.error(`Error reverting role ${roleId} to old user:`, error);
        }
      }
      // Restore original roles to new user
      for (const roleId of newRoles) {
        try {
          await toMember.roles.add(roleId);
        } catch (error) {
          console.error(`Error restoring role ${roleId} to new user:`, error);
        }
      }

      const embed = new EmbedBuilder()
        .setTitle("Transferencia de Roles Fallida")
        .setDescription("La transferencia de roles falló y se ha revertido al estado original.")
        .setColor("Red");

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};