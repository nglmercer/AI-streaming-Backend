import { Hono } from 'hono';
import { Mistral } from '@mistralai/mistralai';
import { MISTRAL_API_KEY } from '../constants.js';
const client = new Mistral({ apiKey: MISTRAL_API_KEY });
const router = new Hono();
async function transcribeAudio(audioBuffer) {
    const audioBase64 = audioBuffer.toString('base64');
    const { choices } = await client.chat.complete({
        model: 'voxtral-mini-2507',
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'input_audio', inputAudio: audioBase64 },
                    { type: 'text', text: 'Summarize this audio in one sentence.' },
                ],
            },
        ],
    });
    return choices[0]?.message?.content || 'No transcript returned';
}
// ✅ POST /base64
router.post('/base64', async (c) => {
    try {
        const { audio } = await c.req.json(); // audio es un string base64
        if (!audio || typeof audio !== 'string')
            return c.text('Invalid base64', 400);
        const buffer = Buffer.from(audio, 'base64');
        const transcript = await transcribeAudio(buffer);
        return c.json({ transcript });
    }
    catch (e) {
        return c.text(`Error: ${searchError(c)}`, 500);
    }
});
// ✅ POST /float32array
router.post('/float32array', async (c) => {
    try {
        const { audio } = await c.req.json(); // audio es un array de números
        if (!Array.isArray(audio))
            return c.text('Invalid Float32Array', 400);
        const buffer = Buffer.from(new Float32Array(audio).buffer);
        const transcript = await transcribeAudio(buffer);
        console.log("transcript", transcript);
        return c.json({ transcript });
    }
    catch (e) {
        return c.text(`Error: ${searchError(c)}`, 500);
    }
});
// ✅ POST /buffer
router.post('/buffer', async (c) => {
    try {
        const arrayBuffer = await c.req.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (!buffer || buffer.length === 0)
            return c.text('Empty buffer', 400);
        const transcript = await transcribeAudio(buffer);
        console.log("transcript", transcript);
        return c.json({ transcript });
    }
    catch (e) {
        return c.text(`Error: ${searchError(c)}`, 500);
    }
});
function searchError(c) {
    if (typeof c === 'string') {
        return c;
    }
    else if (c instanceof Error) {
        console.log("error", c);
        return c.message;
    }
    else {
        console.log("error", c);
        return 'Unknown error';
    }
}
export default router;
