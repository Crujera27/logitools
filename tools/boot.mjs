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
    Website: https://crujera.galnod.com

*/

import fs from 'fs';
import log from './log.mjs';
import { boot as ollama} from './ollama.mjs';
try {
    const parseConfigModule = (
      await import("./parseConfig.mjs")
    ).default;
    const parseConfig = await parseConfigModule;
    var appConfig = await parseConfig();
} catch (error) {
    log(`❌> Error al intentar cargar la configuración: ${error.message}`, 'err');
    process.exit();
}
/* Disabled for now
if(appConfig.ai.enabled) {
    log('El asistente de inicio de Logitools está inicializando los paquetes de configuración; esto puede tardar un momento.', 'info');
    await ollama()
}
*/

console.log('> Cargando archivo index.js');
await import('../index.mjs').catch(error => {
    log(`❌> Error al cargar index.js: ${error.message}`, 'err');
    process.exit();

});