import { useEffect } from 'react';
import { useFaeQuestStore } from '../store/useFaeQuestStore';
import { focusStorageKey } from '../utils/focusSession';

export function useFocusTimer(): void {
  const owner = useFaeQuestStore((state) => state.currentUser?.id);
  const authLoading = useFaeQuestStore((state) => state.authLoading);
  const isRunning = useFaeQuestStore((state) => state.isFocusRunning);
  const soundEnabled = useFaeQuestStore((state) => state.soundEnabled);
  const soundVolume = useFaeQuestStore((state) => state.soundVolume);
  const ambient = useFaeQuestStore((state) => state.focusAmbient);

  useEffect(() => {
    if (authLoading || !owner) return;
    const resume = () => {
      const state = useFaeQuestStore.getState();
      state.tickFocusTimer();
      state.refreshFocusMedia();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') resume();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === focusStorageKey(owner) || event.key === null) {
        useFaeQuestStore.getState().restoreFocusSession();
      }
    };
    useFaeQuestStore.getState().restoreFocusSession();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onVisible);
    window.addEventListener('online', resume);
    window.addEventListener('storage', onStorage);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onVisible);
      window.removeEventListener('online', resume);
      window.removeEventListener('storage', onStorage);
    };
  }, [owner, authLoading]);

  useEffect(() => {
    if (authLoading || !owner || !isRunning) return;
    const interval = window.setInterval(() => useFaeQuestStore.getState().tickFocusTimer(), 250);
    return () => window.clearInterval(interval);
  }, [owner, authLoading, isRunning]);

  useEffect(() => {
    if (owner && !authLoading) useFaeQuestStore.getState().refreshFocusMedia();
  }, [owner, authLoading, soundEnabled, soundVolume, ambient]);
}
