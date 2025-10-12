export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  labels: {
    accent: string;
    gender: string;
  };
}