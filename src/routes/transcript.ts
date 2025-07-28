import { Hono } from 'hono';
import { Mistral } from '@mistralai/mistralai';
import { MISTRAL_API_KEY } from '../constants.js';
import prompts from '../prompts/transcript.js';
const client = new Mistral({ apiKey: MISTRAL_API_KEY });
const router = new Hono();

// --- Función para codificar a WAV ---
function encodeWAV(samples: Float32Array, sampleRate: number= 10000) {
  const numChannels = 1;
  const bitDepth = 32;

  const dataBuffer = Buffer.alloc(samples.length * 4);
  for (let i = 0; i < samples.length; i++) {
    dataBuffer.writeFloatLE(samples[i], i * 4);
  }

  const header = Buffer.alloc(44);
  const dataSize = dataBuffer.length;
  const fileSize = dataSize + 36;

  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(3, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  const byteRate = sampleRate * numChannels * (bitDepth / 8);
  header.writeUInt32LE(byteRate, 28);
  const blockAlign = numChannels * (bitDepth / 8);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, dataBuffer]);
}

async function generateTranscript(audioBytes: Buffer) {
    const audioBase64 = audioBytes.toString("base64");
    
    const { choices } = await client.chat.complete({
      model: "voxtral-small-latest",
      messages: [
        {
          role: 'assistant',
          content: 'Transcribe the audio in one sentence.',
        },
        {
          role: 'user',
          content: [
            { type: "input_audio", inputAudio: audioBase64 },
            { type: "text", text: prompts.transcript },
          ],
        }

      ],
    });
    console.log("Answer:", choices[0].message.content);
    return choices[0]?.message?.content || "No transcript returned";
}

// ✅ POST /base64 (sin cambios)
router.post('/base64', async (c) => {
  try {
    const { audio } = await c.req.json();
    if (!audio || typeof audio !== 'string') return c.text('Invalid base64', 400);
    const buffer = Buffer.from(audio, 'base64');
    const transcript = await generateTranscript(buffer);
    return c.json({ transcript });
  } catch (e) {
    return c.text(`Error: ${searchError(e)}`, 500);
  }
});

// ✅ POST /float32array (MODIFICADO)
router.post('/float32array', async (c) => {
  try {
    const { audio, sampleRate } = await c.req.json();
    if (!Array.isArray(audio)) {
      return c.text('Invalid audio data: must be an array', 400);
    }
    const float32Array = new Float32Array(audio);
    const wavBuffer = encodeWAV(float32Array, sampleRate);
    
    const transcript = await generateTranscript(wavBuffer);
    console.log("transcript", transcript);
    return c.json({ transcript: transcript });
  } catch (e) {
    const errorMessage = searchError(e);
    console.error('Error in /float32array:', errorMessage, e);
    return c.text(`Error: ${errorMessage}`, 500);
  }
});

// ✅ POST /buffer (sin cambios, asume que el buffer ya tiene el formato correcto, ej. de un archivo .wav)
router.post('/buffer', async (c) => {
  try {
    const arrayBuffer = await c.req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!buffer || buffer.length === 0) return c.text('Empty buffer', 400);

    const transcript = await generateTranscript(buffer);
    return c.json({ transcript });
  } catch (e) {
    return c.text(`Error: ${searchError(e)}`, 500);
  }
});

function searchError(c: Error | unknown) {
    if (typeof c === 'string') {
      return c;
    } else if (c instanceof Error) {
      console.error("Error object:", c);
      return c.message;
    } else {
      console.error("Unknown error type:", c);
      return 'Unknown error';
    }
}

export default router;