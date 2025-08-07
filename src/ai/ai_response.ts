import { type sendInputEvent } from "../ws/handler/ws_model.js";
import { buildModel } from "./factory.js";
import { generateText } from 'ai';
import { streamText } from 'ai';
import { charactersPrompt } from "../prompts/promptGenerator.js";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { type BaseMessage } from "@langchain/core/messages";
import { getAllExpressions,getAllMotions } from '../tools/model-loader.js';
import { getCharacterTools } from "../tools/tools.js";
import { defaultConfig,getConfig,getApiKey,type DefaultConfig } from "../config.js";
import { emitterConfig } from "../config.js";
const memory = new InMemoryChatMessageHistory();
setTimeout(async()=>{
    console.log("textResponse", await memory.getMessages());
},1000)
async function textResponse(msg: sendInputEvent) {
    if (!msg.text) return;
    console.log("streamResponse INPUT",msg);
    const { system,txtprompt,apikey,config } = await get2dPrompt(msg.text);
    try {
        const model = buildModel({provider: config.provider || 'google', model: config.model, apiKey: apikey});
        const { text } = await generateText({
            model,
            system,
            prompt: txtprompt,
        });
        return text;
    } catch (e) {
        console.log(e);
    }
}
async function streamResponse(msg: sendInputEvent) {
    if (!msg.text) return;
    // Handle the input event here
    console.log("streamResponse INPUT",msg);
    const { system,txtprompt,apikey,config } = await get2dPrompt(msg.text);
    try {
        const model = buildModel({provider: config.provider || 'google', model: config.model, apiKey: apikey});
        const { textStream } = streamText({
            model,
            system,
            prompt: `${txtprompt}`,
        });
        
        return textStream;
    } catch (err) {
        console.log("err",err);
    }
}
async function get2dPrompt(Question:string=''):Promise<{system:string,txtprompt:string,apikey:string,config:DefaultConfig}> {
    const config = await getConfig();
    const expresions = await getAllExpressions(config.model2d);
    const motions = await getAllMotions(config.model2d);
    const history = await memory.getMessages();
    const parsedHistory = JSON.stringify(history);
    const Prompt = charactersPrompt.lunaPrompt
        .replace('{AllExpressions}', JSON.stringify(expresions))
        .replace('{AllMotions}', JSON.stringify(motions));
    const apikey = await getApiKey(config.provider)
    if (!apikey || apikey.length === 0)sendErrorEvent(config);
    return {
        system: Prompt,
        txtprompt: `context: ${parsedHistory}\nquestion:\n${Question}\n`,
        apikey,
        config
    }
}
async function sendErrorEvent(config: DefaultConfig) {
    console.log("sendErrorEvent",config);
    emitterConfig.emit('ERROR',{
        message: 'No API key found for provider',
        provider: config.provider,
        model: config.model,
        event: 'streamResponse'
    });
}

export { textResponse,streamResponse,memory };