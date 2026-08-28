import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { sendChatMessage } from './chat';
import {
  CLOUD_MODELS,
  fetchOllamaNames,
  mergeModelLists,
  persistModel,
  pickDefaultModel,
} from './models';
import {
  fetchLiveAgents,
  fetchNeuro,
  fetchSystemStatus,
  type LiveAgent,
  type NeuroState,
  type SystemStatus,
} from './labStatus';
import { canListen, speakText, startListening, type VoiceHandle } from './voice';
import PresenceStage from './PresenceStage';
import {
  fallbackAmbient,
  fetchAmbient,
  type AmbientState,
} from './ambient';
import VideoDock from './VideoDock';
import {
  STATION_LIST,
  STATIONS,
  isStationId,
  loadStation,
  saveStation,
  type StationId,
} from './stations';
import type { AgentStub, ChatMessage, ModelChoice } from './types';
import './RayneShell.css';

const FALLBACK_AGENTS: AgentStub[] = [
  { id: 'gemilla-milla', name: 'GeMilla', status: 'pending', detail: 'house · bus' },
  { id: 'milla-local', name: 'local Milla', status: 'pending', detail: 'HEAD · offline' },
  { id: 'devmilla', name: 'devMilla', status: 'pending', detail: 'HEAD · code' },
  { id: 'millanites', name: 'Millanites', status: 'pending', detail: 'report→heads' },
];

const SEED: ChatMessage[] = [];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function statusLabel(a: AgentStub) {
  if (a.status === 'live') return a.detail ? `● ${a.detail}` : '● live';
  if (a.status === 'idle') return '● idle';
  if (a.status === 'pending') return a.detail || 'pending';
  return 'offline';
}

class PresenceFallback extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: Error, info: ErrorInfo) {
    console.warn('Presence stage failed', err, info);
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="rs-presence rs-presence-fallback">
          <img src="/milla-presence.jpg" alt="Milla Rayne" />
        </div>
      );
    }
    return this.props.children;
  }
}

export default function RayneShell() {
  const [labOpen, setLabOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [models, setModels] = useState<ModelChoice[]>(CLOUD_MODELS);
  const [model, setModel] = useState<ModelChoice>(CLOUD_MODELS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>(SEED);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [neuro, setNeuro] = useState<NeuroState | null>(null);
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [agents, setAgents] = useState<AgentStub[]>(FALLBACK_AGENTS);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [station, setStation] = useState<StationId>(() => loadStation());
  const [screenOn, setScreenOn] = useState(false);
  const [ambient, setAmbient] = useState<AmbientState>(() => fallbackAmbient());
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const listenRef = useRef<VoiceHandle | null>(null);
  const inFlightRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, scrollToBottom]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const names = await fetchOllamaNames();
      const merged = mergeModelLists(names);
      if (cancelled || merged.length === 0) return;
      setModels(merged);
      setModel((current) => {
        const still = merged.find((m) => m.id === current.id);
        return still || pickDefaultModel(merged);
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const next = await fetchAmbient();
      if (!cancelled) setAmbient(next);
    };
    void tick();
    const id = window.setInterval(tick, 15 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const [n, s, live] = await Promise.all([
        fetchNeuro(),
        fetchSystemStatus(),
        fetchLiveAgents(),
      ]);
      if (cancelled) return;
      if (n) setNeuro(n);
      setSystem(s);
      if (live.length) {
        const byId = new Map(live.map((a: LiveAgent) => [a.id, a]));
        setAgents((prev) => {
          const leftover = prev.filter((p) => !byId.has(p.id));
          return [...live, ...leftover];
        });
      }
    };
    void tick();
    const id = window.setInterval(tick, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const toggleLab = useCallback((force?: boolean) => {
    setLabOpen((v) => (force === undefined ? !v : force));
    setModelOpen(false);
  }, []);

  const chooseModel = (m: ModelChoice) => {
    setModel(m);
    setModelOpen(false);
    void persistModel(m.id);
  };

  const send = useCallback(async (override?: string) => {
    const text = (override ?? draft).trim();
    if ((!text && !pendingImage) || sending || inFlightRef.current) return;

    inFlightRef.current = true;
    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      who: 'You',
      text: text || '(image)',
      imageUrl: pendingImage || undefined,
    };
    setMessages((m) => [...m, userMsg]);
    setDraft('');
    const img = pendingImage;
    setPendingImage(null);
    setSending(true);

    try {
      const result = await sendChatMessage(text || 'Look at this image.', {
        model: model.id,
        imageData: img ? img.replace(/^data:[^;]+;base64,/, '') : undefined,
        station,
      });
      if (result.ok) {
        setMessages((m) => [
          ...m,
          { id: uid(), role: 'milla', who: 'Milla', text: result.text },
        ]);
        speakText(result.text);
      } else {
        setMessages((m) => [
          ...m,
          { id: uid(), role: 'system', text: `Chat failed — ${result.error}` },
        ]);
      }
    } finally {
      inFlightRef.current = false;
      setSending(false);
    }
  }, [draft, sending, pendingImage, model.id, station]);

  const toggleVoice = () => {
    if (listening) {
      listenRef.current?.stop();
      listenRef.current = null;
      setListening(false);
      return;
    }
    if (!canListen()) {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'system',
          text: 'Voice needs Chrome (or Edge) on localhost. Mic permission required.',
        },
      ]);
      return;
    }
    const handle = startListening({
      onText: (text) => {
        setDraft((d) => (d ? `${d} ${text}` : text));
      },
      onError: (msg) => {
        setListening(false);
        setMessages((m) => [
          ...m,
          { id: uid(), role: 'system', text: `Mic: ${msg}` },
        ]);
      },
      onEnd: () => setListening(false),
    });
    if (handle) {
      listenRef.current = handle;
      setListening(true);
    }
  };

  const onAttach = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result || '');
        setPendingImage(url);
      };
      reader.readAsDataURL(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const body = String(reader.result || '');
      setDraft((d) =>
        `${d ? `${d}\n\n` : ''}Remember this from ${file.name}:\n${body.slice(0, 8000)}`
      );
    };
    reader.readAsText(file);
  };

  const goStation = useCallback((id: StationId) => {
    setStation(id);
    saveStation(id);
    if (id !== 'video') setScreenOn(false);
  }, []);

  useEffect(() => {
    saveStation(station);
  }, [station]);

  useEffect(() => {
    const onHash = () => {
      const raw = new URLSearchParams(
        window.location.hash.replace(/^#/, '').includes('=')
          ? window.location.hash.replace(/^#/, '')
          : ''
      ).get('station');
      if (isStationId(raw) && raw !== station) setStation(raw);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [station]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
        setPaletteQuery('');
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        toggleLab();
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false);
        setModelOpen(false);
      }
      const typing =
        e.target instanceof HTMLElement &&
        (e.target.tagName === 'INPUT' ||
          e.target.tagName === 'TEXTAREA' ||
          e.target.isContentEditable);
      if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const hit = STATION_LIST.find((s) => s.key === e.key);
        if (hit) {
          e.preventDefault();
          goStation(hit.id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleLab, goStation]);

  const localModels = models.filter((m) => m.tier === 'local');
  const cloudModels = models.filter((m) => m.tier === 'cloud');

  const here = STATIONS[station];

  const paletteItems = [
    { id: 'lab', label: labOpen ? 'Close Lab' : 'Open Lab' },
    { id: 'voice', label: listening ? 'Stop listening' : 'Voice / mic' },
    { id: 'models', label: 'Switch model…' },
    { id: 'agents', label: 'Focus agents (open Lab)' },
    { id: 'attach', label: 'Attach file…' },
    ...STATION_LIST.map((s) => ({
      id: `station:${s.id}`,
      label: `Station · ${s.label}${s.id === station ? ' (here)' : ''}`,
    })),
    { id: 'legacy', label: 'Open legacy Dashboard (?legacy=1)' },
  ].filter((i) =>
    i.label.toLowerCase().includes(paletteQuery.trim().toLowerCase())
  );

  const runPalette = (id: string) => {
    if (id === 'lab' || id === 'agents') toggleLab(true);
    if (id === 'models') setModelOpen(true);
    if (id === 'voice') toggleVoice();
    if (id === 'attach') fileRef.current?.click();
    if (id === 'legacy') window.location.search = '?legacy=1';
    if (id.startsWith('station:')) {
      const sid = id.slice('station:'.length);
      if (isStationId(sid)) goStation(sid);
    }
    setPaletteOpen(false);
  };

  const pct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <div
      className={`rayne-shell${labOpen ? ' lab-open' : ''}`}
      data-station={station}
    >
      <div className="rs-stage">
        <PresenceFallback>
          <PresenceStage
            speaking={sending}
            station={station}
            screenOn={screenOn}
            ambient={ambient}
          />
        </PresenceFallback>
      </div>
      <nav className="rs-stations" aria-label="Stations">
        {STATION_LIST.map((s) => (
          <button
            key={s.id}
            type="button"
            className={s.id === station ? 'active' : ''}
            title={`${s.label} (${s.key})`}
            onClick={() => goStation(s.id)}
          >
            <span className="rs-station-key">{s.key}</span>
            {s.label}
          </button>
        ))}
      </nav>
      {station === 'video' && <VideoDock onScreen={setScreenOn} />}
      <header className="rs-header rs-header-wrap">
        <div className="rs-logo">Milla Rayne</div>
        <button
          type="button"
          className="rs-chip"
          title="Model switch"
          onClick={() => setModelOpen((v) => !v)}
        >
          {model.label} ▾
        </button>
        {modelOpen && (
          <div className="rs-model-menu" role="menu">
            {localModels.length > 0 && (
              <div className="rs-model-head">Local Ollama ({localModels.length})</div>
            )}
            {localModels.map((m) => (
              <button
                key={m.id}
                type="button"
                className={m.id === model.id ? 'active' : ''}
                onClick={() => chooseModel(m)}
              >
                {m.label}
              </button>
            ))}
            <div className="rs-model-head">Cloud</div>
            {cloudModels.map((m) => (
              <button
                key={m.id}
                type="button"
                className={m.id === model.id ? 'active' : ''}
                onClick={() => chooseModel(m)}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
        <div
          className="rs-neuro-dot"
          title={neuro?.label ? `Neuro: ${neuro.label}` : 'Neuro'}
        />
        <div className="rs-name-pill">
          <strong>Milla Rayne</strong>
          <span>
            {here.where} · {ambient.label}
          </span>
        </div>
        <div className="rs-spacer" />
        <button
          type="button"
          className="rs-btn"
          onClick={() => setPaletteOpen(true)}
          title="Command palette"
        >
          ⌘K
        </button>
        <button
          type="button"
          className={`rs-btn${listening ? ' active' : ''}`}
          onClick={toggleVoice}
        >
          {listening ? 'Listening…' : 'Voice'}
        </button>
        <button
          type="button"
          className={`rs-btn primary${labOpen ? ' active' : ''}`}
          onClick={() => toggleLab()}
        >
          {labOpen ? 'Lab · on' : 'Lab'}
        </button>
      </header>

      <div className="rs-body">
        <main className="rs-main">
          <div className="rs-messages" ref={messagesRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`rs-bubble ${msg.role}`}>
                {msg.who && <div className="who">{msg.who}</div>}
                {msg.imageUrl && (
                  <img className="rs-bubble-img" src={msg.imageUrl} alt="" />
                )}
                {msg.text}
              </div>
            ))}
            {sending && (
              <div className="rs-bubble system rs-typing" aria-live="polite">
                …
              </div>
            )}
          </div>
          <p className="rs-hint">{here.hint}</p>
          {pendingImage && (
            <div className="rs-pending-img">
              <img src={pendingImage} alt="attachment" />
              <button type="button" onClick={() => setPendingImage(null)}>
                Remove
              </button>
            </div>
          )}
          <div className="rs-composer-wrap">
            <div className={`rs-composer${sending ? ' sending' : ''}`}>
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!sending) void send();
                  }
                }}
                placeholder={
                  listening
                    ? 'Listening…'
                    : sending
                      ? 'Waiting on Milla…'
                      : here.placeholder
                }
                rows={2}
                disabled={sending}
              />
              <input
                ref={fileRef}
                type="file"
                hidden
                accept="image/*,.txt,.md,.json,.log"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) onAttach(f);
                }}
              />
              <button
                type="button"
                className="rs-icon-btn"
                title="Attach"
                onClick={() => fileRef.current?.click()}
              >
                ＋
              </button>
              <button
                type="button"
                className={`rs-icon-btn mic${listening ? ' live' : ''}`}
                title="Voice"
                onClick={toggleVoice}
              >
                🎤
              </button>
              <button
                type="button"
                className="rs-icon-btn"
                title="Send"
                onClick={() => void send()}
                disabled={sending || (!draft.trim() && !pendingImage)}
              >
                ↑
              </button>
            </div>
          </div>
        </main>

        <aside className="rs-lab" aria-hidden={!labOpen}>
          <div className="rs-panel">
            <h3>Neuro {neuro?.label ? `· ${neuro.label}` : ''}</h3>
            <div className="rs-metric-label">
              Dopamine {neuro ? pct(neuro.dopamine) : ''}
            </div>
            <div className="rs-bar pink">
              <i style={{ width: pct(neuro?.dopamine ?? 0.5) }} />
            </div>
            <div className="rs-metric-label">
              Oxytocin {neuro ? pct(neuro.oxytocin) : ''}
            </div>
            <div className="rs-bar cyan">
              <i style={{ width: pct(neuro?.oxytocin ?? 0.5) }} />
            </div>
            <div className="rs-metric-label">
              Cortisol {neuro ? pct(neuro.cortisol) : ''}
            </div>
            <div className="rs-bar purple">
              <i style={{ width: pct(neuro?.cortisol ?? 0.3) }} />
            </div>
          </div>
          <div className="rs-panel">
            <h3>Agents</h3>
            {agents.map((a) => (
              <div key={a.id} className="rs-agent">
                <span>{a.name}</span>
                <span
                  className={
                    a.status === 'live' || a.status === 'idle'
                      ? 'rs-ok'
                      : 'rs-pending'
                  }
                >
                  {statusLabel(a)}
                </span>
              </div>
            ))}
          </div>
          <div className="rs-panel">
            <h3>Studio / Memory</h3>
            <button
              type="button"
              className="rs-btn"
              onClick={() => fileRef.current?.click()}
            >
              Memory / file upload
            </button>
            <button
              type="button"
              className="rs-btn"
              onClick={() =>
                void send('generate_image:create(comfy: Milla Rayne, long corkscrew copper-red hair, standing, studio)')
              }
            >
              Studio gen (Comfy)
            </button>
            <button
              type="button"
              className="rs-btn"
              onClick={() =>
                setMessages((m) => [
                  ...m,
                  {
                    id: uid(),
                    role: 'system',
                    text: 'Face Mapper lives at ~/Face-Mapper — run: python3 face_mapper.py --image path.jpg',
                  },
                ])
              }
            >
              Face Mapper hint
            </button>
          </div>
          <div className="rs-panel">
            <h3>System</h3>
            <div className="rs-agent">
              <span>Ollama</span>
              <span className={system?.ollama === 'up' ? 'rs-ok' : 'rs-pending'}>
                {system
                  ? system.ollama === 'up'
                    ? `up · ${system.ollamaCount} models`
                    : 'down'
                  : '…'}
              </span>
            </div>
            <div className="rs-agent">
              <span>A2A hub</span>
              <span className={system?.a2a === 'up' ? 'rs-ok' : 'rs-pending'}>
                {system
                  ? system.a2a === 'up'
                    ? `up · ${system.a2aClients} clients`
                    : 'down'
                  : '…'}
              </span>
            </div>
          </div>
        </aside>
      </div>

      <div
        className={`rs-palette${paletteOpen ? ' open' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setPaletteOpen(false);
        }}
      >
        <div className="rs-palette-box">
          <input
            autoFocus
            placeholder="Jump to…"
            value={paletteQuery}
            onChange={(e) => setPaletteQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && paletteItems[0]) {
                runPalette(paletteItems[0].id);
              }
            }}
          />
          {paletteItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => runPalette(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <footer className="rs-footer">Milla Rayne</footer>
    </div>
  );
}
