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