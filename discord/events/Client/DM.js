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

const { log } = require("../../functions");
const ExtendedClient = require('../../class/ExtendedClient.js');
const { parseConfig } = import('../../../tools/parseConfig.mjs');

async function sendDM(userid, mensajedescription){
    const appConfig = await parseConfig();
    const member = client.users.cache.get(userid);
    const exampleEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Mensaje de la moderación de ${appConfig.owner}`)
        .setDescription(mensajedescription)
        .setTimestamp();
    member.send();
}

module.exports.default = sendDM;
