import { type sendInputEvent } from "./ws_model.js";
import { buildModel } from "../../ai/factory.js";
import { generateText } from 'ai';
import { streamText } from 'ai';
import { exacPrompt } from "../../prompts/promptGenerator.js";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { type BaseMessage } from "@langchain/core/messages";

const memory = new InMemoryChatMessageHistory();
async function textResponse(msg: sendInputEvent) {
    if (!msg.text) return;
    // Handle the input event here
    console.log("textResponse",msg);
    try {
        const model = buildModel({provider: 'google', model: 'gemini-2.5-flash', apiKey: process.env.GEMINI_API_KEY});
        const { text } = await generateText({
            model,
            prompt: msg.text,
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
    console.log();
    const history = await memory.getMessages();
    const parsedHistory = JSON.stringify(history);
    try {
        const model = buildModel({provider: 'google', model: 'gemini-2.5-flash', apiKey: process.env.GEMINI_API_KEY});
        const { textStream } = streamText({
            
            model,
            system: exacPrompt,
            prompt: `context: ${parsedHistory}\nresponse:\n${msg.text}`,
        });
        
        return textStream;
    } catch (e) {
        console.log(e);
    }
}
export { textResponse,streamResponse,memory };