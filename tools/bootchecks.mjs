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

      // Check environment variables
      const requiredEnvVars = {
        DISCORD_CLIENT_ID: "",
        DISCORD_CLIENT_SECRET: "",
        DISCORD_BOT_TOKEN: "",
        SESSION_SECRET: "DEFAULT-SESSION-SECRET-CHANGE-ME",
        DB_HOST: "127.0.0.1",
        DB_USER: "",
      };

      for (const [key, defaultValue] of Object.entries(requiredEnvVars)) {
        if (process.env[key] === defaultValue || !process.env[key]) {
          console.log(fs.readFileSync('config/asccii/danger.txt', 'utf8'));
          console.log(`Environment variable ${key} is either using the default value or is not set. Please change it.`);
          return process.exit(1);
        }
      }

    } catch (error) {
      log(`Error occurred while trying to read the configuration file: ${error.message}`, 'err');
      process.exit(1);
    }
  };

export { postbootchecks }