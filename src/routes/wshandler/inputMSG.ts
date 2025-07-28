import { type sendInputEvent } from "./ws_model.js";
import { buildModel } from "../../ai/factory.js";
import { generateText } from 'ai';
import { streamText } from 'ai';
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
    try {
        const model = buildModel({provider: 'google', model: 'gemini-2.5-flash', apiKey: process.env.GEMINI_API_KEY});
        const { textStream } = streamText({
            model,
            prompt: msg.text,
        });
        return textStream;
    } catch (e) {
        console.log(e);
    }
}
export { textResponse,streamResponse };