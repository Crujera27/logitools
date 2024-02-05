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

module.exports = {
    event: 'ready',
    once: true,
    /**
     * 
     * @param {ExtendedClient} _ 
     * @param {import('discord.js').Client<true>} client 
     * @returns 
     */
    run: (_, client) => {

        log('Conectado como: ' + client.user.tag, 'done');

    }
};