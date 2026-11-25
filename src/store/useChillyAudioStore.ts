import { create } from 'zustand';
import { ChillyTrack } from '../types';
import {
  getAllStoredTracks,
  saveTrackToStorage,
  deleteStoredTrack,
  getStoredTrackBlob,
  updateStoredTrackCloudUrl,
  syncCloudTracksToIndexedDB,
} from '../utils/chillyStorage';
import { uploadAudioToCloudinary } from '../utils/cloudinaryUpload';
import { useFaeQuestStore } from './useFaeQuestStore';

export const BUILT_IN_SYNTH_TRACKS: ChillyTrack[] = [
  {
    id: 'synth_afterglow_pad',
    title: 'Afterglow Ambient Pad',
    artist: 'Âm Nền FaeQuest',
    isBuiltInSynth: true,
    synthType: 'ambient_pad',
    sourceType: 'synth',
    duration: 360,
  },
  {
    id: 'synth_midnight_rain',
    title: 'Midnight Rain Lo-Fi',
    artist: 'Âm Nền FaeQuest',
    isBuiltInSynth: true,
    synthType: 'rain_lofi',
    sourceType: 'synth',
    duration: 300,
  },
];

export type DrawerTab = 'search' | 'youtube' | 'playlist';

const toSyncableTracks = (list: ChillyTrack[]): ChillyTrack[] =>
  list
    .filter((t) => !t.isBuiltInSynth)
    .map((t) => ({
      ...t,
      src: t.cloudUrl || (t.src && !t.src.startsWith('blob:') ? t.src : ''),
    }));

let cloudSyncLock = false;

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
  isChillyFullscreen: boolean;

  // Cờ lệnh tìm kiếm / thao tác tức thời gửi đến Audio Host
  seekRequestTime: number | null;
  seekRequestNonce: number;

  // Actions
  initAudioStore: () => Promise<void>;
  syncFromCloudTracks: (cloudTracks?: ChillyTrack[]) => Promise<void>;
  resetToBuiltInTracks: () => void;
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
  setIsChillyFullscreen: (fullscreen: boolean) => void;
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
  isChillyFullscreen: false,
  seekRequestTime: null,
  seekRequestNonce: 0,

  initAudioStore: async () => {
    try {
      const stored = await getAllStoredTracks();
      const cloudTracks = useFaeQuestStore.getState().chillyTracks;

      // Nếu đã có dữ liệu đám mây, ưu tiên đồng bộ từ đám mây
      if (Array.isArray(cloudTracks)) {
        await get().syncFromCloudTracks(cloudTracks);
        return;
      }

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

  syncFromCloudTracks: async (cloudTracks?: ChillyTrack[]) => {
    if (cloudSyncLock) return;
    cloudSyncLock = true;
    try {
      const prevState = get();
      const activeTrackId = prevState.playlist[prevState.currentTrackIndex]?.id;

      // 1. Đọc danh sách cục bộ hiện tại và tự động tải lên đám mây nếu có bài từ máy chưa có link từ xa
      const localStored = await getAllStoredTracks();
      const uploadedLocalTracks: ChillyTrack[] = [];
      let uploadedAnyNew = false;

      for (const localTrack of localStored) {
        if (localTrack.isBuiltInSynth) continue;
        const hasRemote = Boolean(
          localTrack.cloudUrl || (localTrack.src && localTrack.src.startsWith('http'))
        );

        if (!hasRemote && localTrack.blobId && typeof navigator !== 'undefined' && navigator.onLine) {
          const blobData = await getStoredTrackBlob(localTrack.blobId);
          if (blobData?.blob && blobData.blob.size <= 50 * 1024 * 1024) {
            try {
              const cloudUrl = await uploadAudioToCloudinary(blobData.blob, `${blobData.title}.mp3`);
              await updateStoredTrackCloudUrl(localTrack.id, cloudUrl);
              uploadedLocalTracks.push({
                ...localTrack,
                cloudUrl,
                src: localTrack.src || cloudUrl,
              });
              uploadedAnyNew = true;
              continue;
            } catch (uploadErr) {
              console.warn('Tự động đồng bộ file nhạc cục bộ thất bại:', uploadErr);
            }
          }
        }

        if (hasRemote || localTrack.youtubeVideoId) {
          uploadedLocalTracks.push({
            ...localTrack,
            cloudUrl:
              localTrack.cloudUrl ||
              (localTrack.src && localTrack.src.startsWith('http') ? localTrack.src : undefined),
          });
        }
      }

      let finalUserTracks: ChillyTrack[] = [];

      if (cloudTracks === undefined) {
        // Tài khoản chưa từng lưu danh sách nhạc lên đám mây -> đẩy danh sách cục bộ hiện có lên
        finalUserTracks = await syncCloudTracksToIndexedDB(uploadedLocalTracks);
        if (finalUserTracks.length > 0 || uploadedAnyNew) {
          useFaeQuestStore.getState().setChillyTracks(toSyncableTracks(finalUserTracks), true);
        }
      } else {
        // Đã có danh sách từ đám mây: hợp nhất thêm các bài vừa upload lần đầu trên thiết bị này (nếu có)
        const cloudIdSet = new Set(cloudTracks.map((t) => t.id));
        const newlyMigrated = uploadedLocalTracks.filter(
          (lt) => !cloudIdSet.has(lt.id) && (lt.cloudUrl || lt.youtubeVideoId)
        );

        const mergedCloud =
          newlyMigrated.length > 0 ? [...cloudTracks, ...newlyMigrated] : cloudTracks;

        finalUserTracks = await syncCloudTracksToIndexedDB(mergedCloud);

        if (newlyMigrated.length > 0 || uploadedAnyNew) {
          useFaeQuestStore.getState().setChillyTracks(toSyncableTracks(mergedCloud), true);
        }
      }

      const finalIds = new Set(finalUserTracks.map((t) => t.id));
      const newPlaylist = [
        ...BUILT_IN_SYNTH_TRACKS.filter((t) => !finalIds.has(t.id)),
        ...finalUserTracks,
      ];

      // Giữ nguyên bài đang phát nếu còn trong danh sách
      const preservedIdx = activeTrackId
        ? newPlaylist.findIndex((t) => t.id === activeTrackId)
        : -1;
      const nextIndex = preservedIdx !== -1 ? preservedIdx : 0;

      // Tránh cập nhật state dư thừa nếu danh sách và chỉ mục hiện tại không thay đổi
      const isPlaylistUnchanged =
        prevState.playlist.length === newPlaylist.length &&
        prevState.currentTrackIndex === nextIndex &&
        prevState.playlist.every((prevT, idx) => {
          const nextT = newPlaylist[idx];
          return (
            prevT.id === nextT.id &&
            prevT.src === nextT.src &&
            prevT.cloudUrl === nextT.cloudUrl &&
            prevT.youtubeVideoId === nextT.youtubeVideoId &&
            prevT.synthType === nextT.synthType &&
            prevT.title === nextT.title &&
            prevT.artist === nextT.artist
          );
        });

      if (!isPlaylistUnchanged) {
        set({
          playlist: newPlaylist,
          currentTrackIndex: nextIndex,
        });
      }
    } catch (err) {
      console.warn('Lỗi đồng bộ nhạc từ đám mây:', err);
    } finally {
      cloudSyncLock = false;
    }
  },

  resetToBuiltInTracks: () => {
    set({
      playlist: BUILT_IN_SYNTH_TRACKS,
      currentTrackIndex: 0,
      isPlaying: false,
      currentTime: 0,
      duration: BUILT_IN_SYNTH_TRACKS[0].duration || 360,
    });
  },

  playTrack: (index: number) => {
    const { playlist, currentTrackIndex } = get();
    if (index >= 0 && index < playlist.length) {
      set({
        currentTrackIndex: index,
        isPlaying: true,
        currentTime: 0,
        duration: playlist[index].duration || 240,
        ...(index === currentTrackIndex
          ? { seekRequestTime: 0, seekRequestNonce: Date.now() }
          : {}),
      });
    }
  },

  playSpecificTrack: async (track: ChillyTrack) => {
    const { playlist, currentTrackIndex, addTrackToFavorites } = get();
    const existingIndex = playlist.findIndex((t) => t.id === track.id);
    if (existingIndex !== -1) {
      set({
        currentTrackIndex: existingIndex,
        isPlaying: true,
        currentTime: 0,
        duration: track.duration || 240,
        ...(existingIndex === currentTrackIndex
          ? { seekRequestTime: 0, seekRequestNonce: Date.now() }
          : {}),
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
      const normalizedTrack: ChillyTrack = {
        ...track,
        cloudUrl:
          track.cloudUrl ||
          (track.src && track.src.startsWith('http') ? track.src : undefined),
      };
      newPlaylist = [...playlist, normalizedTrack];
      await saveTrackToStorage(normalizedTrack);
      // Đẩy danh sách mới lên đám mây để đồng bộ sang điện thoại / máy khác
      useFaeQuestStore.getState().setChillyTracks(toSyncableTracks(newPlaylist), true);
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
    if (trackId.startsWith('synth_')) return;

    await deleteStoredTrack(trackId);
    const newPlaylist = playlist.filter((t) => t.id !== trackId);
    let nextIdx = currentTrackIndex;
    if (nextIdx >= newPlaylist.length) {
      nextIdx = Math.max(0, newPlaylist.length - 1);
    }
    const finalPlaylist = newPlaylist.length > 0 ? newPlaylist : BUILT_IN_SYNTH_TRACKS;
    set({
      playlist: finalPlaylist,
      currentTrackIndex: nextIdx,
    });

    // Đồng bộ việc xóa bài lên đám mây
    useFaeQuestStore.getState().setChillyTracks(toSyncableTracks(finalPlaylist), true);
  },

  setIsSeeking: (isSeeking: boolean) => set({ isSeeking }),
  setCurrentTime: (currentTime: number) => set({ currentTime }),
  setDuration: (duration: number) => set({ duration }),
  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setIsDrawerOpen: (isDrawerOpen: boolean) => set({ isDrawerOpen }),
  setActiveDrawerTab: (activeDrawerTab: DrawerTab) => set({ activeDrawerTab }),
  setIsChillyFullscreen: (isChillyFullscreen: boolean) => set({ isChillyFullscreen }),

  handleTrackEnded: () => {
    const { repeatMode, playlist, currentTrackIndex } = get();
    if (playlist.length === 0) return;

    if (repeatMode === 'one') {
      set({ currentTime: 0, isPlaying: true, seekRequestTime: 0, seekRequestNonce: Date.now() });
    } else if (repeatMode === 'all') {
      const nextIdx = (currentTrackIndex + 1) % playlist.length;
      set({
        currentTrackIndex: nextIdx,
        currentTime: 0,
        isPlaying: true,
        duration: playlist[nextIdx].duration || 240,
      });
    } else {
      if (currentTrackIndex < playlist.length - 1) {
        const nextIdx = currentTrackIndex + 1;
        set({
          currentTrackIndex: nextIdx,
          currentTime: 0,
          isPlaying: true,
          duration: playlist[nextIdx].duration || 240,
        });
      } else {
        set({
          isPlaying: false,
          currentTime: 0,
          seekRequestTime: 0,
          seekRequestNonce: Date.now(),
        });
      }
    }
  },
}));
