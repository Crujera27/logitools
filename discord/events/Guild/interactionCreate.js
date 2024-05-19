/*
.____                 .__  __                .__          
|    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
|    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
|    |__(  <_> ) /_/  >  ||  | (  <_> |  <_> )  |__\___ \ 
|_______ \____/\___  /|__||__|  \____/ \____/|____/____  >
        \/    /_____/                                  \/ 
                         
        
    Copyright (C) 2024  Ángel Crujera (angel.c@galnod.com)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
    
    GitHub: https://github.com/Crujera27/
    Website: https://crujera.galnod.com

*/

const config = require("../../config.js");
const { log } = require("../../functions");
const ExtendedClient = require("../../class/ExtendedClient.js");

const cooldown = new Map();

module.exports = {
    event: "interactionCreate",
    /**
     *
     * @param {ExtendedClient} client
     * @param {import('discord.js').Interaction} interaction
     * @returns
     */
    run: async (client, interaction) => {
        if (!interaction.isCommand()) return;

        if (
            config.handler.commands.slash === false &&
            interaction.isChatInputCommand()
        )
            return;
        if (
            config.handler.commands.user === false &&
            interaction.isUserContextMenuCommand()
        )
            return;
        if (
            config.handler.commands.message === false &&
            interaction.isMessageContextMenuCommand()
        )
            return;

        const command = client.collection.interactioncommands.get(
            interaction.commandName
        );

        if (!command) return;

        try {
            if (command.options?.developers) {
                if (
                    config.users?.developers?.length > 0 &&
                    !config.users?.developers?.includes(interaction.user.id)
                ) {
                    await interaction.reply({
                        content: "No estás autorizado a utilizar este comando.",
                        ephemeral: true,
                    });

                    return;
                } else if (config.users?.developers?.length <= 0) {
                    await interaction.reply({
                        content: "Este es un comando sólo para desarrolladores.",

                        ephemeral: true,
                    });

                    return;
                }
            }

            if (command.options?.cooldown) {
                const isGlobalCooldown = command.options.globalCooldown;
                const cooldownKey = isGlobalCooldown ? 'global_' + command.structure.name : interaction.user.id;
                const cooldownFunction = () => {
                    let data = cooldown.get(cooldownKey);

                    data.push(interaction.commandName);

                    cooldown.set(cooldownKey, data);

                    setTimeout(() => {
                        let data = cooldown.get(cooldownKey);

                        data = data.filter((v) => v !== interaction.commandName);

                        if (data.length <= 0) {
                            cooldown.delete(cooldownKey);
                        } else {
                            cooldown.set(cooldownKey, data);
                        }
                    }, command.options.cooldown);
                };

                if (cooldown.has(cooldownKey)) {
                    let data = cooldown.get(cooldownKey);

                    if (data.some((v) => v === interaction.commandName)) {
                        const cooldownMessage = (isGlobalCooldown
                            ? config.messageSettings.globalCooldownMessage ?? "¡Más despacio amigo! Este comando está en un tiempo de reutilización global. ({cooldown}s)."
                            : config.messageSettings.cooldownMessage ?? "¡Más despacio amigo! Eres demasiado rápido para usar este comando. ({cooldown}s).").replace(/{cooldown}/g, command.options.cooldown / 1000);

                        await interaction.reply({
                            content: cooldownMessage,
                            ephemeral: true,
                        });

                        return;
                    } else {
                        cooldownFunction();
                    }
                } else {
                    cooldown.set(cooldownKey, [interaction.commandName]);
                    cooldownFunction();
                }
            }

            command.run(client, interaction);
        } catch (error) {
            log(error, "err");
        }
    },
};