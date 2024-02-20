import fs from 'fs';
import toml from 'toml';

async function parseConfig() {
  try {
    const configFile = await fs.promises.readFile('./config/configuration.toml', 'utf-8');
    const config = toml.parse(configFile);
    return config;
  } catch (error) {
    console.error('Error parsing TOML configuration:', error);
    throw error; // Re-throw the error to propagate it to the caller
  }
}

export { parseConfig };
