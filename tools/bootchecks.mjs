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
    Licencia del proyecto: CC BY-NC-ND 4.0

*/

import log from './log.mjs'
import fs from 'fs'

const postbootchecks = async () => {
    try {
      const parseConfigModule = (
        await import("./parseConfig.mjs")
      ).default;
      const parseConfig = await parseConfigModule;
      const appConfig = await parseConfig();

      // Check webook link

      if(appConfig.discord.modlog_webhook==null || appConfig.discord.modlog_webhook==""){
        console.log(fs.readFileSync('config/asccii/danger.txt', 'utf8'));
        console.log('There is no Discord webhook configured for this application')
        console.log('Please review the config and make sure that there are no errors')
        console.log('If you really want to run the APP with no moderation login, WHICH IS NOT RECOMMENDED FOR PRODUCTIONS ENVIRONMENTS, set the webhook value to \'false\' in the config file.')
        return process.exit(1)
      }
    } catch (error) {
      log(`Error occurred while trying to read the configuration file: ${error.message}`, 'err');
      process.exit(1);
    }
  };

export { postbootchecks }