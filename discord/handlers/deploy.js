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
        log("Limpiando comandos de la aplicación existentes...", "info");

        const guildId = config.development.guild;

        if (config.development && config.development.enabled && guildId) {
            if (!isSnowflake(guildId)) {
                log("Falta el ID de la guild. El modo de desarrollo no se puede habilitar.", "err");
                return;
            };

            // Clear all existing guild commands first
            await rest.put(
                Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId), {
                    body: [],
                }
            );
            log(`Comandos de la guild ${guildId} eliminados.`, "info");

            // Register new commands
            log("Registrando nuevos comandos de la aplicación...", "info");
            await rest.put(
                Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId), {
                    body: client.applicationcommandsArray,
                }
            );

            log(`Comandos de aplicación cargados exitosamente para la guild con ID ${guildId}.`, "done");
        } else {
            // Clear all existing global commands first
            await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
                    body: [],
                }
            );
            log("Comandos globales eliminados.", "info");

            // Register new commands
            log("Registrando nuevos comandos de la aplicación...", "info");
            await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
                    body: client.applicationcommandsArray,
                }
            );

            log("Los comandos de la aplicación se cargaron con éxito globalmente en la API de Discord.", "done");
        }
    } catch (e) {
        log(`No se pueden cargar los comandos de la aplicación en la API de Discord: ${e.message}`, "err");
    }
};