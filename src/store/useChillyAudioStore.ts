import { create } from 'zustand';
import { ChillyTrack } from '../types';
import {
  getAllStoredTracks,
  saveTrackToStorage,
  deleteStoredTrack,
} from '../utils/chillyStorage';

export const BUILT_IN_SYNTH_TRACKS: ChillyTrack[] = [
  {
    id: 'synth_afterglow_pad',
    title: 'Afterglow Ambient Pad',
    artist: 'Fae Chilly Synth (Web Audio)',
    isBuiltInSynth: true,
    synthType: 'ambient_pad',
    sourceType: 'synth',
    duration: 360,
  },
  {
    id: 'synth_midnight_rain',
    title: 'Midnight Rain Lo-Fi',
    artist: 'Fae Chilly Synth (Web Audio)',
    isBuiltInSynth: true,
    synthType: 'rain_lofi',
    sourceType: 'synth',
    duration: 300,
  },
];

export type DrawerTab = 'search' | 'youtube' | 'playlist';

interface ChillyAudioState {
  playlist: ChillyTrack[];
  currentTrackIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: 'off' | 'all' | 'one';
  isLoading: boolean;
  isSeeking: boolean;
  isDrawerOpen: boolean;
  activeDrawerTab: DrawerTab;

  // Cờ lệnh tìm kiếm / thao tác tức thời gửi đến Audio Host
  seekRequestTime: number | null;
  seekRequestNonce: number;

  // Actions
  initAudioStore: () => Promise<void>;
  playTrack: (index: number) => void;
  playSpecificTrack: (track: ChillyTrack) => Promise<void>;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  cycleRepeatMode: () => void;
  addTrackToFavorites: (track: ChillyTrack, playImmediately?: boolean) => Promise<void>;
  removeTrack: (trackId: string) => Promise<void>;
  setIsSeeking: (seeking: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsDrawerOpen: (open: boolean) => void;
  setActiveDrawerTab: (tab: DrawerTab) => void;
  handleTrackEnded: () => void;
}

export const useChillyAudioStore = create<ChillyAudioState>((set, get) => ({
  playlist: BUILT_IN_SYNTH_TRACKS,
  currentTrackIndex: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 360,
  volume: 0.8,
  isMuted: false,
  repeatMode: 'all',
  isLoading: false,
  isSeeking: false,
  isDrawerOpen: false,
  activeDrawerTab: 'playlist',
  seekRequestTime: null,
  seekRequestNonce: 0,

  initAudioStore: async () => {
    try {
      const stored = await getAllStoredTracks();
      // Loại trừ các track trùng ID nếu đã có
      const storedIds = new Set(stored.map((t) => t.id));
      const combined = [
        ...BUILT_IN_SYNTH_TRACKS.filter((t) => !storedIds.has(t.id)),
        ...stored,
      ];
      set({ playlist: combined });
    } catch (err) {
      console.warn('Lỗi load playlist Chilly:', err);
    }
  },

  playTrack: (index: number) => {
    const { playlist } = get();
    if (index >= 0 && index < playlist.length) {
      set({
        currentTrackIndex: index,
        isPlaying: true,
        currentTime: 0,
        duration: playlist[index].duration || 240,
      });
    }
  },

  playSpecificTrack: async (track: ChillyTrack) => {
    const { playlist, addTrackToFavorites } = get();
    const existingIndex = playlist.findIndex((t) => t.id === track.id);
    if (existingIndex !== -1) {
      set({
        currentTrackIndex: existingIndex,
        isPlaying: true,
        currentTime: 0,
        duration: track.duration || 240,
      });
    } else {
      await addTrackToFavorites(track, true);
    }
  },

  togglePlay: () => {
    const { isPlaying } = get();
    set({ isPlaying: !isPlaying });
  },

  nextTrack: () => {
    const { playlist, currentTrackIndex } = get();
    if (playlist.length === 0) return;
    const nextIdx = (currentTrackIndex + 1) % playlist.length;
    set({
      currentTrackIndex: nextIdx,
      isPlaying: true,
      currentTime: 0,
      duration: playlist[nextIdx].duration || 240,
    });
  },

  prevTrack: () => {
    const { playlist, currentTrackIndex, currentTime } = get();
    if (playlist.length === 0) return;
    // Nếu đã phát quá 3 giây, cho phát lại từ đầu bài hiện tại
    if (currentTime > 3) {
      set({ currentTime: 0, seekRequestTime: 0, seekRequestNonce: Date.now() });
      return;
    }
    const prevIdx = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    set({
      currentTrackIndex: prevIdx,
      isPlaying: true,
      currentTime: 0,
      duration: playlist[prevIdx].duration || 240,
    });
  },

  seekTo: (seconds: number) => {
    set({
      currentTime: seconds,
      seekRequestTime: seconds,
      seekRequestNonce: Date.now(),
    });
  },

  setVolume: (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    set({ volume: clamped, isMuted: clamped === 0 ? true : false });
  },

  toggleMute: () => {
    const { isMuted } = get();
    set({ isMuted: !isMuted });
  },

  cycleRepeatMode: () => {
    const { repeatMode } = get();
    const modes: ('off' | 'all' | 'one')[] = ['all', 'one', 'off'];
    const nextMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    set({ repeatMode: nextMode });
  },

  addTrackToFavorites: async (track: ChillyTrack, playImmediately = false) => {
    const { playlist } = get();
    const exists = playlist.some((t) => t.id === track.id);
    let newPlaylist = playlist;
    if (!exists) {
      newPlaylist = [...playlist, track];
      await saveTrackToStorage(track);
    }
    const newIdx = newPlaylist.findIndex((t) => t.id === track.id);
    set({
      playlist: newPlaylist,
      ...(playImmediately && newIdx !== -1
        ? {
            currentTrackIndex: newIdx,
            isPlaying: true,
            currentTime: 0,
            duration: track.duration || 240,
          }
        : {}),
    });
  },

  removeTrack: async (trackId: string) => {
    const { playlist, currentTrackIndex } = get();
    // Không cho xóa 2 bản synth mặc định
    if (trackId.startsWith('synth_')) return;

    await deleteStoredTrack(trackId);
    const newPlaylist = playlist.filter((t) => t.id !== trackId);
    let nextIdx = currentTrackIndex;
    if (nextIdx >= newPlaylist.length) {
      nextIdx = Math.max(0, newPlaylist.length - 1);
    }
    set({
      playlist: newPlaylist.length > 0 ? newPlaylist : BUILT_IN_SYNTH_TRACKS,
      currentTrackIndex: nextIdx,
    });
  },

  setIsSeeking: (isSeeking: boolean) => set({ isSeeking }),
  setCurrentTime: (currentTime: number) => set({ currentTime }),
  setDuration: (duration: number) => set({ duration }),
  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setIsDrawerOpen: (isDrawerOpen: boolean) => set({ isDrawerOpen }),
  setActiveDrawerTab: (activeDrawerTab: DrawerTab) => set({ activeDrawerTab }),

  handleTrackEnded: () => {
    const { repeatMode, playlist, currentTrackIndex } = get();
    if (playlist.length === 0) return;

    if (repeatMode === 'one') {
      // Lặp lại bài này
      set({ currentTime: 0, isPlaying: true, seekRequestTime: 0, seekRequestNonce: Date.now() });
    } else if (repeatMode === 'all') {
      // Chuyển bài kế tiếp
      const nextIdx = (currentTrackIndex + 1) % playlist.length;
      set({
        currentTrackIndex: nextIdx,
        currentTime: 0,
        isPlaying: true,
        duration: playlist[nextIdx].duration || 240,
      });
    } else {
      // Repeat off: nếu còn bài thì sang tiếp, hết danh sách thì dừng
      if (currentTrackIndex < playlist.length - 1) {
        const nextIdx = currentTrackIndex + 1;
        set({
          currentTrackIndex: nextIdx,
          currentTime: 0,
          isPlaying: true,
          duration: playlist[nextIdx].duration || 240,
        });
      } else {
        set({ isPlaying: false, currentTime: 0 });
      }
    }
  },
}));
