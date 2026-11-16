import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { extractYouTubeId } from '../lib/util';
import { Spinner, ErrorState } from './ui';
import { friendlyError } from '../lib/errors';

interface Props {
  kind: 'url' | 'upload';
  url: string | null;
  path: string | null;
  startAt: number;
  /** Ойнату кезінде әр ~5 секунд сайын және тоқтағанда ағымдағы позицияны жібереді. */
  onReport: (position: number) => void;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type YTWin = Window & { YT?: any; onYouTubeIframeAPIReady?: () => void };
let ytPromise: Promise<any> | null = null;
function loadYouTube(): Promise<any> {
  const w = window as YTWin;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (ytPromise) return ytPromise;
  ytPromise = new Promise((resolve) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => { prev?.(); resolve(w.YT); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  });
  return ytPromise;
}

function Html5Player({ src, startAt, onReport }: { src: string; startAt: number; onReport: (p: number) => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const cb = useRef(onReport);
  cb.current = onReport;

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let timer: number | undefined;
    const send = () => cb.current(v.currentTime);
    const stop = () => { if (timer) window.clearInterval(timer); timer = undefined; };
    const onPlay = () => { stop(); send(); timer = window.setInterval(send, 5000); };
    const onPause = () => { stop(); send(); };
    const onMeta = () => { if (startAt > 0 && startAt < v.duration - 3) v.currentTime = startAt; };
    const onRate = () => { if (v.playbackRate > 1.25) v.playbackRate = 1.25; };
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onPause);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('ratechange', onRate);
    return () => {
      stop();
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onPause);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('ratechange', onRate);
    };
  }, [src, startAt]);

  return (
    <video ref={ref} src={src} controls playsInline preload="metadata"
      controlsList="nodownload noplaybackrate" disablePictureInPicture
      onContextMenu={(e) => e.preventDefault()} className="video-el" />
  );
}

function YouTubePlayer({ id, startAt, onReport }: { id: string; startAt: number; onReport: (p: number) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const cb = useRef(onReport);
  cb.current = onReport;

  useEffect(() => {
    let player: any;
    let timer: number | undefined;
    let dead = false;
    const stop = () => { if (timer) window.clearInterval(timer); timer = undefined; };
    loadYouTube().then((YT) => {
      if (dead || !host.current) return;
      const mount = document.createElement('div');
      host.current.innerHTML = '';
      host.current.appendChild(mount);
      const send = () => { try { cb.current(player.getCurrentTime()); } catch { /* ignore */ } };
      player = new YT.Player(mount, {
        videoId: id,
        width: '100%',
        height: '100%',
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, start: Math.floor(startAt) },
        events: {
          onStateChange: (e: { data: number }) => {
            if (e.data === 1) { stop(); send(); timer = window.setInterval(send, 5000); }
            else if (e.data === 2 || e.data === 0) { stop(); send(); }
          },
        },
      });
    });
    return () => { dead = true; stop(); try { player?.destroy(); } catch { /* ignore */ } };
  }, [id, startAt]);

  return <div ref={host} className="video-yt" />;
}

export function VideoPlayer({ kind, url, path, startAt, onReport }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const yt = kind === 'url' && url ? extractYouTubeId(url) : null;

  useEffect(() => {
    let alive = true;
    setErr(null);
    if (kind === 'upload' && path) {
      api.signedVideoUrl(path).then((u) => alive && setSrc(u)).catch((e) => alive && setErr(friendlyError(e)));
    } else if (kind === 'url' && url && !yt) {
      setSrc(url);
    }
    return () => { alive = false; };
  }, [kind, path, url, yt]);

  // startAt тек бастапқыда қолданылады (қайта рендерде плеерді қайта құрмау үшін)
  const initial = useRef(startAt).current;

  return (
    <div className="video-wrap">
      {err ? <ErrorState message={err} />
        : yt ? <YouTubePlayer id={yt} startAt={initial} onReport={onReport} />
        : src ? <Html5Player src={src} startAt={initial} onReport={onReport} />
        : <Spinner />}
    </div>
  );
}
