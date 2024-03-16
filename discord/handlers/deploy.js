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

const { REST, Routes } = require("discord.js");
const { log, isSnowflake } = require("../functions.js");
const config = require("../config");
const ExtendedClient = require("../class/ExtendedClient.js");

/**
 *
 * @param {ExtendedClient} client
 */
module.exports = async (client) => {
    const rest = new REST({ version: "10" }).setToken(
        process.env.DISCORD_BOT_TOKEN
    );

    try {
        log("Loading application commands...", "info");

        const guildId = config.development.guild;

        if (config.development && config.development.enabled && guildId) {
            if (!isSnowflake(guildId)) {
                log("Guild ID is missing. Development mode cannot be enabled.", "err");
                return;
            };

            // Fetch existing guild commands
            const existingCommands = await rest.get(
                Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId)
            );

            // Delete existing guild commands
            for (const command of existingCommands) {
                await rest.delete(
                    Routes.applicationGuildCommand(process.env.DISCORD_CLIENT_ID, guildId, command.id)
                );
            }

            // Put new guild commands
            await rest.put(
                Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId), {
                    body: client.applicationcommandsArray,
                }
            );

            log(`Application commands loaded successfully for the guild with ID ${guildId}.`, "done");
        } else {
            // Fetch existing global commands
            const existingCommands = await rest.get(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID)
            );

            // Delete existing global commands
            for (const command of existingCommands) {
                await rest.delete(
                    Routes.applicationCommand(process.env.DISCORD_CLIENT_ID, command.id)
                );
            }

            // Put new global commands
            await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
                    body: client.applicationcommandsArray,
                }
            );

            log("Application commands loaded successfully globally in the Discord API.", "done");
        }
    } catch (e) {
        log(`Failed to load application commands in the Discord API: ${e.message}`, "err");
    }
};
