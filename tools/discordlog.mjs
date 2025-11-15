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

import axios from 'axios';
import parseConfigModule from "../tools/parseConfig.mjs";
import log from './log.mjs';

async function sendEmbedWithDetails(webhookUrl, embedDetails) {
    try {
        const embed = {
            color: embedDetails.color || 0x0099ff,
            title: embedDetails.title,
            url: embedDetails.url,
            description: embedDetails.description,
            fields: embedDetails.fields || [],
            timestamp: embedDetails.timestamp || new Date(),
            footer: {
                text: embedDetails.footer || `© ${new Date().getFullYear()} Logitools Software`
            }
        };

        const response = await axios.post(webhookUrl, {
            embeds: [embed]
        });
        return response.data;
    } catch (error) {
        log(`Error sending log: ${error}`, 'err');
        throw error;
    }
}

async function sendLog(action, moderator, user, reason) {
    try {
        const parseConfig = await parseConfigModule();

        const embedDetails = {
            title: 'Registro de la moderación',
            description: `Acción: ${action} \nModerador: <@${moderator}>(${moderator})\nUsuario: <@${user}>(${user})\nRazón: ${reason}`,
            color: 0xff0000,
            timestamp: new Date(),
        };
        if(parseConfig.modlog_webhook==false){
            return;
        }
        await sendEmbedWithDetails(parseConfig.discord.modlog_webhook, embedDetails);
    } catch (error) {
        log(`Error sending log: ${error}`, 'err');
    }
}

export default sendLog;
