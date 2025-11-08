const fetch = require('node-fetch');

async function testElevenLabsVoices() {
  try {
    console.log('Testing ElevenLabs API...');

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key':
          '38360714b364041bd9958ec2ba3d49e06ab4f2cc706ea590f24e97940699622a',
      },
    });

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log('Available female voices suitable for Milla:');

    const femaleVoices = data.voices.filter(
      (voice) => voice.labels && voice.labels.gender === 'female'
    );

    femaleVoices.slice(0, 3).forEach((voice) => {
      console.log(`\n- ${voice.name} (${voice.voice_id})`);
      console.log(`  Description: ${voice.description}`);
      console.log(`  Age: ${voice.labels.age}, Accent: ${voice.labels.accent}`);
      if (voice.preview_url) {
        console.log(`  Preview: ${voice.preview_url}`);
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testElevenLabsVoices();
