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