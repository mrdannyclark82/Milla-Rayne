export type VoiceHandle = {
  stop: () => void;
};

type RecCtor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((ev: { results: { [i: number]: { [j: number]: { transcript: string } }; length: number } }) => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function recognitionCtor(): RecCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecCtor;
    webkitSpeechRecognition?: RecCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function canListen(): boolean {
  return recognitionCtor() !== null && window.isSecureContext;
}

export function startListening(opts: {
  onText: (text: string) => void;
  onError: (msg: string) => void;
  onEnd: () => void;
}): VoiceHandle | null {
  const Ctor = recognitionCtor();
  if (!Ctor) {
    opts.onError('This browser has no speech recognition. Use Chrome on https or localhost.');
    return null;
  }
  const rec = new Ctor();
  rec.lang = 'en-US';
  rec.interimResults = false;
  rec.continuous = false;
  rec.onresult = (ev) => {
    const last = ev.results[ev.results.length - 1];
    const text = last?.[0]?.transcript?.trim();
    if (text) opts.onText(text);
  };
  rec.onerror = (ev) => {
    if (ev.error === 'aborted' || ev.error === 'no-speech') return;
    opts.onError(ev.error || 'mic error');
  };
  rec.onend = () => opts.onEnd();
  try {
    rec.start();
  } catch (e) {
    opts.onError(e instanceof Error ? e.message : 'mic start failed');
    return null;
  }
  return { stop: () => rec.stop() };
}

export function speakText(text: string): void {
  if (!text.trim() || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  u.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const prefer =
    voices.find((v) => /female|samantha|aria|zira/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith('en'));
  if (prefer) u.voice = prefer;
  window.speechSynthesis.speak(u);
}
