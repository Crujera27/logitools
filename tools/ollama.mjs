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

import fs from 'fs';
import log  from './log.mjs';
import { Ollama }  from 'ollama';
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
const llama = new Ollama({ host: appConfig.ai.ollama_host || 'http://127.0.0.1:11434'});

async function chat(msg, role){
    const response = await llama.chat({
        model: appConfig.ai.model || 'dolphin-mistral',
        messages: [{ role: role, content: msg }],
    });
    return response;
}

async function boot(){
    await chat(`From now on your name is ${appConfig.ai.assistant_name}`, 'system')
    async function boot(){
        try {
            const automodFile = fs.readFileSync('./config/automod.txt', 'utf8');
            await chat(automodFile, 'system');
        } catch (error) {
            log(`❌> Error al intentar cargar el archivo automod.txt: ${error.message}`, 'err');
            process.exit();
        }
    }

}

async function checkmsg(msg) { 
    await chat(msg, 'assistant')
}

export { checkmsg as default, boot }