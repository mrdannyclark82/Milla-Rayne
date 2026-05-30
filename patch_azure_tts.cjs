const fs = require('fs');
const filePath = 'client/src/services/voiceService.ts';

let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `class AzureTTS implements ITTSProvider {
  async speak(request: VoiceSynthesisRequest): Promise<VoiceSynthesisResponse> {`;

const replaceStr = `class AzureTTS implements ITTSProvider {
  private audio: HTMLAudioElement | null = null;

  async speak(request: VoiceSynthesisRequest): Promise<VoiceSynthesisResponse> {`;

content = content.replace(targetStr, replaceStr);

const targetCancel = `  cancel(): void {
    // TODO: Implement cancellation
  }`;

const replaceCancel = `  cancel(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
  }`;

content = content.replace(targetCancel, replaceCancel);

fs.writeFileSync(filePath, content);
console.log('Patched voiceService.ts');
