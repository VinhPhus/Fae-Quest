import { formatFocusTime, type FocusSession } from './focusSession';
import type { AmbientType } from './soundEngine';

const mediaPath = `${import.meta.env.BASE_URL}assets/focus`;
const icon = `${import.meta.env.BASE_URL}logo-192.png`;
let audio: HTMLAudioElement | undefined;
let activeTrack: string | undefined;
let metadataTitle: string | undefined;

export function updateFocusMediaTitle(session: FocusSession, seconds: number): void {
  if (!navigator.mediaSession || typeof MediaMetadata === 'undefined') return;
  const title = `⚔️ ${formatFocusTime(seconds)} • ${session.questTitle}`;
  if (title === metadataTitle) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title,
    artist: 'FaeQuest • Đang tập trung',
    artwork: [{ src: icon, sizes: '192x192', type: 'image/png' }],
  });
  metadataTitle = title;
}

export function syncFocusMedia(
  session: FocusSession,
  seconds: number,
  ambient: AmbientType,
  volume: number,
  setRunning: (running: boolean) => void,
): void {
  const player = audio ??= new Audio();
  const track = `${mediaPath}/${volume > 0 ? ambient : 'off'}.wav`;
  player.loop = true;
  player.volume = volume > 0 ? volume / 100 : 1;
  if (activeTrack !== track) {
    activeTrack = track;
    player.src = track;
  }

  if (navigator.mediaSession) {
    updateFocusMediaTitle(session, seconds);
    navigator.mediaSession.playbackState = session.isPaused ? 'paused' : 'playing';
    setMediaControls(() => setRunning(true), () => setRunning(false));
  }
  if (session.isPaused) player.pause();
  else if (player.paused) void player.play().catch(() => {});
}

function setMediaControls(play: (() => void) | null, pause: (() => void) | null): void {
  const media = navigator.mediaSession;
  if (!media) return;
  // Browsers can expose Media Session with only a subset of actions.
  try { media.setActionHandler('play', play); } catch { }
  try { media.setActionHandler('pause', pause); } catch { }
}

export function stopFocusMedia(bellVolume = 0): void {
  audio?.pause();
  activeTrack = undefined;
  if (bellVolume > 0) {
    const player = audio ??= new Audio();
    player.loop = false;
    player.volume = bellVolume / 100;
    player.src = `${mediaPath}/bell.wav`;
    void player.play().catch(() => {});
  }
  metadataTitle = undefined;
  if (navigator.mediaSession) {
    setMediaControls(null, null);
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';
  }
}

export function requestFocusNotifications(): void {
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    void Notification.requestPermission().catch(() => {});
  }
}

export async function notifyFocusCompletion(session: FocusSession): Promise<void> {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const title = '⚔️ Hoàn thành Focus!';
  const options: NotificationOptions = {
    body: `Nhiệm vụ «${session.questTitle}» đã được nghiệm thu`,
    icon,
    tag: `faequest-focus-${session.id}`,
  };

  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration?.active) {
      await registration.showNotification(title, options);
      return;
    }
  } catch { }
  try { new Notification(title, options); } catch { }
}
