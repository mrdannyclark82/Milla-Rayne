import { useEffect, useRef, useState } from 'react';
import { parseYoutubeId, STATION_VIDEO_KEY } from './stations';

type DockMode = 'expanded' | 'screen';

export default function VideoDock({
  onScreen,
}: {
  onScreen: (on: boolean) => void;
}) {
  const [draft, setDraft] = useState('');
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<DockMode>('expanded');
  const fileRef = useRef<HTMLInputElement>(null);
  const localUrlRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const last = window.localStorage.getItem(STATION_VIDEO_KEY);
      if (last) setDraft(last);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    onScreen(Boolean(youtubeId || localUrl));
  }, [youtubeId, localUrl, onScreen]);

  useEffect(() => {
    return () => {
      if (localUrlRef.current) URL.revokeObjectURL(localUrlRef.current);
    };
  }, []);

  const playLink = () => {
    const id = parseYoutubeId(draft);
    if (!id) {
      setError(
        'Need a YouTube URL or 11-character id. Local files use the folder button.'
      );
      return;
    }
    setError(null);
    if (localUrlRef.current) {
      URL.revokeObjectURL(localUrlRef.current);
      localUrlRef.current = null;
    }
    setLocalUrl(null);
    setYoutubeId(id);
    setMode('screen');
    try {
      window.localStorage.setItem(STATION_VIDEO_KEY, draft.trim());
    } catch {
      /* ignore */
    }
  };

  const onFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('That file is not a video.');
      return;
    }
    if (localUrlRef.current) URL.revokeObjectURL(localUrlRef.current);
    const url = URL.createObjectURL(file);
    localUrlRef.current = url;
    setError(null);
    setYoutubeId(null);
    setLocalUrl(url);
    setMode('screen');
  };

  const stop = () => {
    setYoutubeId(null);
    setLocalUrl(null);
    setError(null);
    setMode('expanded');
    if (localUrlRef.current) {
      URL.revokeObjectURL(localUrlRef.current);
      localUrlRef.current = null;
    }
  };

  const playing = Boolean(youtubeId || localUrl);
  const onScreenMode = playing && mode === 'screen';

  return (
    <div
      className={`rs-video-dock${onScreenMode ? ' rs-video-dock--on-screen' : ''}`}
      role="region"
      aria-label="Video station"
    >
      <div className="rs-video-row">
        {!onScreenMode && (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                playLink();
              }
            }}
            placeholder="YouTube URL or id"
            aria-label="YouTube URL"
          />
        )}
        {!playing && (
          <>
            <button type="button" className="rs-btn primary" onClick={playLink}>
              Play
            </button>
            <button
              type="button"
              className="rs-btn"
              title="Local video file"
              onClick={() => fileRef.current?.click()}
            >
              File
            </button>
          </>
        )}
        {playing && (
          <>
            <button
              type="button"
              className="rs-btn"
              title={
                onScreenMode
                  ? 'Expand player'
                  : 'Put player on my media screen'
              }
              onClick={() =>
                setMode((m) => (m === 'screen' ? 'expanded' : 'screen'))
              }
            >
              {onScreenMode ? 'Expand' : 'On screen'}
            </button>
            <button type="button" className="rs-btn" onClick={stop}>
              Stop
            </button>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          hidden
          accept="video/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) onFile(f);
          }}
        />
      </div>
      {error && <p className="rs-video-error">{error}</p>}
      {youtubeId && (
        <div className="rs-video-frame">
          <iframe
            title="YouTube"
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {localUrl && (
        <div className="rs-video-frame">
          <video src={localUrl} controls playsInline />
        </div>
      )}
      {!onScreenMode && (
        <p className="rs-video-note">
          Play drops onto my media screen. Expand when you want the big PIP.
          YouTube needs network; a local file always works.
        </p>
      )}
    </div>
  );
}
