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

module.exports = {
    handler: {
        prefix: "lt!",
        deploy: true,
        commands: {
            prefix: true,
            slash: true,
            user: true,
            message: true,
        },
    },
    users: {
        developers: ["905124554303762552"],
    },
    roles: {
        staff: ["1452085335751131136"], // Array of Discord role IDs that have staff permissions
    },
    development: { 
        enabled: true,
        guild: "905124554303762552",
    }, 
    messageSettings: {
        developerMessage: "No estás autorizado/a a utilizar este comando.",
        cooldownMessage: "¡Más despacio amigo/a! Eres demasiado rápido/a para usar este comando. ({cooldown}s).",
        globalCooldownMessage: "¡Más despacio amigo/a! Eres demasiado rápido/a para usar este comando. ({cooldown}s).",
        notHasPermissionMessage: "No tienes permiso para utilizar este comando.",
        notHasPermissionComponent: "No tienes permiso para utilizar este componente.",
        missingDevIDsMessage: "No estás autorizado/a a utilizar este comando."
    }
};