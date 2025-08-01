import { type sendInputEvent } from "../ws/handler/ws_model.js";
import { buildModel } from "./factory.js";
import { generateText } from 'ai';
import { streamText } from 'ai';
import { charactersPrompt } from "../prompts/promptGenerator.js";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { type BaseMessage } from "@langchain/core/messages";
import { getAllExpressions,getAllMotions } from '../tools/model-loader.js';
import { getCharacterTools } from "../tools/tools.js";
import { defaultConfig,getConfig,getApiKey } from "../config.js";
const memory = new InMemoryChatMessageHistory();
setTimeout(async()=>{
    console.log("textResponse", await memory.getMessages());
},1000)
async function textResponse(msg: sendInputEvent) {
    if (!msg.text) return;
    const characterTools = await getCharacterTools(); 
    const config = await getConfig();
    const apikey = await getApiKey(config.provider)
    try {
        const model = buildModel({provider: config.provider, model: config.model, apiKey: apikey});
        const { text } = await generateText({
            model,
            prompt: msg.text,
            tools: characterTools,
        });
        return text;
    } catch (e) {
        console.log(e);
    }
}
async function streamResponse(msg: sendInputEvent) {
    if (!msg.text) return;
    // Handle the input event here
    console.log("streamResponse",msg);
    const config = await getConfig();
    const history = await memory.getMessages();
    const expresions = await getAllExpressions(config.model2d);
    const motions = await getAllMotions(config.model2d);
    const characterTools = await getCharacterTools(); 
    const Prompt = charactersPrompt.lunaPrompt
        .replace('{AllExpressions}', JSON.stringify(expresions))
        .replace('{AllMotions}', JSON.stringify(motions));
    console.log("Prompt",Prompt)
    const parsedHistory = JSON.stringify(history);
    const apikey = await getApiKey(config.provider)

    try {
        const model = buildModel({provider: config.provider, model: config.model, apiKey: apikey});
        const { textStream } = streamText({
            model,
            system: Prompt,
            tools: characterTools,
            prompt: `context: ${parsedHistory}\nresponse:\n${msg.text}\n  tools: ${JSON.stringify(Object.keys(characterTools))}`,
        });
        
        return textStream;
    } catch (e) {
        console.log(e);
    }
}
export { textResponse,streamResponse,memory };