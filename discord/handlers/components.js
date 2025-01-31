/*
.____                 .__  __                .__          
|    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
|    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
|    |__(  <_> ) /_/  >  ||  | (  <_> |  <_> )  |__\___ \ 
|_______ \____/\___  /|__||__|  \____/ \____/|____/____  >
        \/    /_____/                                  \/ 
                         
        
    Copyright (C) 2024 Ángel Crujera (angel.c@galnod.com)

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
    Website: https://crujera.galnod.com

*/

const { readdirSync } = require('fs');
const { log } = require('../functions.js');
const ExtendedClient = require('../class/ExtendedClient');

/**
 * 
 * @param {ExtendedClient} client 
 */
module.exports = (client) => {
    for (const dir of readdirSync('./discord/components/')) {
        for (const file of readdirSync('./discord/components/' + dir).filter((f) => f.endsWith('.js'))) {
            const module = require('../components/' + dir + '/' + file);

            if (!module) continue;

            if (dir === 'buttons') {
                if (!module.customId || !module.run) {
                    log('No se puede cargar el componente ' + file + ' debido a la falta \'structure#customId\' or/and \'run\' properties.', 'warn');

                    continue;
                };

                client.collection.components.buttons.set(module.customId, module);
            } else if (dir === 'selects') {
                if (!module.customId || !module.run) {
                    log('No se puede cargar el componente ' + file + ' debido a la falta \'structure#customId\' or/and \'run\' properties.', 'warn');

                    continue;
                };

                client.collection.components.selects.set(module.customId, module);
            } else if (dir === 'modals') {
                if (!module.customId || !module.run) {
                    log('No se puede cargar el componente ' + file + ' debido a la falta \'structure#customId\' or/and \'run\' properties.', 'warn');

                    continue;
                };

                client.collection.components.modals.set(module.customId, module);
            } else if (dir === 'autocomplete') {
                if (!module.commandName || !module.run) {
                    log(`No se puede cargar el componente ${file} debido a la falta 'commandName' or 'run' properties.`, 'warn');
                    continue;
                }
                
                client.collection.components.autocomplete.set(module.commandName, module);
                
                log(`Nuevo componente de autocompletar cargado: ${file}`, 'info');
            } else {
                log(`Tipo de componente no válido: ${file}`, 'warn');
            }
        }
    }
};
