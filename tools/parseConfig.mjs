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

import fs from 'fs';
import toml from 'toml';

async function parseConfig() {
  try {
    const configFile = await fs.promises.readFile('./config/configuration.toml', 'utf-8');
    const config = toml.parse(configFile);
    return config;
  } catch (error) {
    console.error('Error parsing TOML configuration:', error);
    throw error;
  }
}

export default parseConfig;


