const API_KEY = 'tu_api_key_aqui';
const VOICE_ID = 'voice_id_aqui'; // ID de la voz que quieres usar

async function generateSpeech(text:string) {
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    // Obtener el audio como blob
    const audioBlob = await response.blob();
    
    // Crear URL para reproducir el audio
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Reproducir el audio
    audio.play();
    
    return audioBlob;
  } catch (error) {
    console.error('Error generando voz:', error);
  }
}

// Uso del ejemplo
generateSpeech('Hola, esto es una prueba de text-to-speech con ElevenLabs');
