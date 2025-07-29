import { type sendInputEvent } from "../ws/handler/ws_model.js";
import { buildModel } from "./factory.js";
import { generateText } from 'ai';
import { streamText } from 'ai';
import { charactersPrompt } from "../prompts/promptGenerator.js";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { type BaseMessage } from "@langchain/core/messages";
import { getAllExpressions,getAllMotions } from '../tools/model-loader.js';
import { getCharacterTools } from "../tools/tools.js";
const memory = new InMemoryChatMessageHistory();
setTimeout(async()=>{
    console.log("textResponse", await memory.getMessages());
},1000)
async function textResponse(msg: sendInputEvent) {
    if (!msg.text) return;
    const characterTools = await getCharacterTools(); 
    // Handle the input event here
    try {
        const model = buildModel({provider: 'google', model: 'gemini-2.5-flash', apiKey: process.env.GEMINI_API_KEY});
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
    const history = await memory.getMessages();
    const expresions = await getAllExpressions('shizuku');
    const motions = await getAllMotions('shizuku');
    const characterTools = await getCharacterTools(); 
    const Prompt = charactersPrompt.lunaPrompt
        .replace('{AllExpressions}', JSON.stringify(expresions))
        .replace('{AllMotions}', JSON.stringify(motions));
    console.log("Prompt",Prompt)
    const parsedHistory = JSON.stringify(history);
    try {
        const model = buildModel({provider: 'google', model: 'gemini-2.5-flash', apiKey: process.env.GEMINI_API_KEY});
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