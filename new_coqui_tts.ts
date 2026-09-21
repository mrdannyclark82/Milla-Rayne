class CoquiTTS implements ITTSProvider {
  private audio: HTMLAudioElement | null = null;

  async speak(request: VoiceSynthesisRequest): Promise<VoiceSynthesisResponse> {
    const { text, config } = request;
    const voiceId = config.voiceName;

    try {
      const response = await fetch('/api/coqui/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || response.statusText;
        console.error('Coqui TTS API Error:', errorMessage);
        return {
          success: false,
          error: `Coqui TTS API Error: ${errorMessage}`,
        };
      }

      const data = await response.json();
      const audioUrl = data.audioUrl;

      if (!audioUrl) {
        return {
          success: false,
          error: 'No audio URL returned from Coqui TTS API',
        };
      }

      this.cancel(); // Cancel any previous audio
      this.audio = new Audio(audioUrl);

      // Set volume/rate if supported
      this.audio.playbackRate = config.rate ?? 1.0;
      this.audio.volume = config.volume ?? 1.0;

      request.onStart?.();

      this.audio.play();

      return new Promise((resolve) => {
        this.audio!.onended = () => {
          request.onEnd?.();
          resolve({ success: true, audioUrl });
        };
        this.audio!.onerror = (err) => {
          const error = new Error('Error playing Coqui TTS audio.');
          request.onError?.(error);
          console.error('Error playing Coqui TTS audio:', err);
          resolve({ success: false, error: error.message });
        };
      });
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error('Unknown error during Coqui TTS request.');
      request.onError?.(err);
      console.error('Coqui TTS request failed:', err);
      return { success: false, error: err.message };
    }
  }

  cancel(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
  }
}
