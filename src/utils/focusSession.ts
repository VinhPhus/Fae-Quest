export interface FocusSession {
  id: string;
  questId: string;
  questTitle: string;
  durationMs: number;
  endTime: number;
  isPaused: boolean;
  remainingWhenPaused: number;
  finishRequested?: boolean;
}

export const focusStorageKey = (owner: string) => `faequest_focus_session:${owner}`;

export function readFocusSession(owner: string): FocusSession | null {
  try {
    const saved = JSON.parse(localStorage.getItem(focusStorageKey(owner)) ?? 'null');
    if (saved && typeof saved.id === 'string' && typeof saved.questId === 'string' &&
        typeof saved.questTitle === 'string' && Number.isFinite(saved.durationMs) && saved.durationMs > 0 &&
        Number.isFinite(saved.endTime) && typeof saved.isPaused === 'boolean' &&
        Number.isFinite(saved.remainingWhenPaused) && saved.remainingWhenPaused >= 0 &&
        saved.remainingWhenPaused <= saved.durationMs) {
      return saved;
    }
  } catch { }
  return null;
}

export function saveFocusSession(owner: string, session: FocusSession | null): void {
  try {
    const key = focusStorageKey(owner);
    if (session) localStorage.setItem(key, JSON.stringify(session));
    else localStorage.removeItem(key);
  } catch { }
}

export function getFocusRemainingMs(session: FocusSession, now = Date.now()): number {
  return session.isPaused ? session.remainingWhenPaused : Math.max(0, session.endTime - now);
}

export function formatFocusTime(seconds: number): string {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export function getFocusRewardMinutes(elapsedMs: number): number {
  return Math.min(180, Math.max(5, Math.floor(elapsedMs / 60_000)));
}
