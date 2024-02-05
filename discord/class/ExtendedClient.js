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

const { Client, Partials, Collection, GatewayIntentBits } = require("discord.js");
const config = require('../config.js');
const commands = require("../handlers/commands.js");
const events = require("../handlers/events.js");
const deploy = require("../handlers/deploy.js");
const components = require("../handlers/components.js");

module.exports = class extends Client {
    collection = {
        interactioncommands: new Collection(),
        prefixcommands: new Collection(),
        aliases: new Collection(),
        components: {
            buttons: new Collection(),
            selects: new Collection(),
            modals: new Collection(),
            autocomplete: new Collection()
        }
    };
    applicationcommandsArray = [];

    constructor() {
        super({
            intents: [Object.keys(GatewayIntentBits)],
            partials: [Object.keys(Partials)],
            presence: {
                activities: [{
                    name: 'Logitols v4',
                    type: 4,
                    state: 'Logitols v4'
                }]
            }
        });
    };

    start = async () => {
        commands(this);
        events(this);
        components(this);

        await this.login(process.env.DISCORD_BOT_TOKEN);

        if (config.handler.deploy) deploy(this, config);
    };
};