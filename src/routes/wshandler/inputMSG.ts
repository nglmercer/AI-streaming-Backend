import { type sendInputEvent } from "./ws_model.js";
import { buildModel } from "../../ai/factory.js";
import { generateText } from 'ai';
async function handleInputEvent(msg: sendInputEvent) {
    if (!msg.text) return;
    // Handle the input event here
    console.log("handleInputEvent",msg);
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
export { handleInputEvent };