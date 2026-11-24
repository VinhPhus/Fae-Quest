import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ChillyMusicPlayer.css';
import { ChillyTrack } from '../../types';
import {
  getAllStoredTracks,
  saveCustomTrackFiles,
  saveCustomUrlTrack,
  deleteStoredTrack,
} from '../../utils/chillyStorage';
import { chillySynth } from '../../utils/chillySynth';
import {
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  ListMusic,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  Upload,
  Globe,
  X,
} from 'lucide-react';

const BUILT_IN_TRACKS: ChillyTrack[] = [
  {
    id: 'synth_afterglow_pad',
    title: 'Afterglow Ambient Pad',
    artist: 'Fae Chilly Synth (Web Audio)',
    isBuiltInSynth: true,
    synthType: 'ambient_pad',
    duration: 360,
  },
  {
    id: 'synth_midnight_rain',
    title: 'Midnight Rain Lo-Fi',
    artist: 'Fae Chilly Synth (Web Audio)',
    isBuiltInSynth: true,
    synthType: 'rain_lofi',
    duration: 300,
  },
];

export const ChillyMusicPlayer: React.FC<{ isCompact?: boolean }> = ({ isCompact = false }) => {
  const [playlist, setPlaylist] = useState<ChillyTrack[]>(BUILT_IN_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(360);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('all');
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seekBarRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const synthTimeTimerRef = useRef<any>(null);

  const currentTrack = playlist[currentTrackIndex] || playlist[0] || BUILT_IN_TRACKS[0];

  // 1. Tải danh sách bài hát cá nhân từ IndexedDB
  const refreshPlaylist = useCallback(async () => {
    try {
      const stored = await getAllStoredTracks();
      setPlaylist([...BUILT_IN_TRACKS, ...stored]);
    } catch {
      setPlaylist(BUILT_IN_TRACKS);
    }
  }, []);

  useEffect(() => {
    refreshPlaylist();
  }, [refreshPlaylist]);

  // 2. Xử lý Play / Pause âm thanh
  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      if (currentTrack.isBuiltInSynth) {
        chillySynth.stop();
        if (synthTimeTimerRef.current) clearInterval(synthTimeTimerRef.current);
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (currentTrack.isBuiltInSynth) {
        chillySynth.setVolume(isMuted ? 0 : volume);
        chillySynth.play(currentTrack.synthType || 'ambient_pad');
        setIsPlaying(true);
      } else if (audioRef.current) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((e) => console.warn('Audio play error:', e));
      }
    }
  }, [isPlaying, currentTrack, isMuted, volume]);

  // Chuyển bài hát
  const handleSelectTrack = useCallback((index: number) => {
    // Dừng nhạc hiện tại
    chillySynth.stop();
    if (synthTimeTimerRef.current) clearInterval(synthTimeTimerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setCurrentTime(0);
    setCurrentTrackIndex(index);
    setIsPlaying(false);

    // Tự động phát bài mới
    setTimeout(() => {
      const nextTrack = playlist[index];
      if (nextTrack) {
        if (nextTrack.isBuiltInSynth) {
          chillySynth.setVolume(isMuted ? 0 : volume);
          chillySynth.play(nextTrack.synthType || 'ambient_pad');
          setDuration(nextTrack.duration || 360);
          setIsPlaying(true);
        } else if (audioRef.current) {
          audioRef.current.src = nextTrack.src || '';
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      }
    }, 50);
  }, [playlist, isMuted, volume]);

  const handleNextTrack = useCallback(() => {
    const nextIdx = (currentTrackIndex + 1) % playlist.length;
    handleSelectTrack(nextIdx);
  }, [currentTrackIndex, playlist.length, handleSelectTrack]);

  const handlePrevTrack = useCallback(() => {
    const prevIdx = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    handleSelectTrack(prevIdx);
  }, [currentTrackIndex, playlist.length, handleSelectTrack]);

  // 3. Đồng bộ Audio Element thật
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack.isBuiltInSynth) {
      audio.pause();
      setDuration(currentTrack.duration || 360);
      return;
    }

    if (currentTrack.src && audio.src !== currentTrack.src) {
      audio.src = currentTrack.src;
      if (isPlaying) {
        audio.play().catch(() => setIsPlaying(false));
      }
    }
  }, [currentTrack, isPlaying]);

  // Timer giả lập thời gian chạy cho Web Audio Synth
  useEffect(() => {
    if (currentTrack.isBuiltInSynth && isPlaying) {
      synthTimeTimerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1;
          const maxD = currentTrack.duration || 360;
          if (next >= maxD) {
            if (repeatMode === 'one') return 0;
            if (repeatMode === 'all') handleNextTrack();
            return 0;
          }
          return next;
        });
      }, 1000);
    } else {
      if (synthTimeTimerRef.current) clearInterval(synthTimeTimerRef.current);
    }

    return () => {
      if (synthTimeTimerRef.current) clearInterval(synthTimeTimerRef.current);
    };
  }, [currentTrack.isBuiltInSynth, isPlaying, repeatMode, currentTrack.duration, handleNextTrack]);

  // Audio Event Listeners
  const onTimeUpdate = () => {
    if (!isDragging && audioRef.current && !currentTrack.isBuiltInSynth) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current && !currentTrack.isBuiltInSynth) {
      const d = audioRef.current.duration;
      if (!isNaN(d) && d > 0) {
        setDuration(d);
      }
    }
  };

  const onAudioEnded = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (repeatMode === 'all') {
      handleNextTrack();
    } else {
      setIsPlaying(false);
    }
  };

  // Đồng bộ âm lượng
  useEffect(() => {
    const vol = isMuted ? 0 : volume;
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    chillySynth.setVolume(vol);
  }, [volume, isMuted]);

  // Format mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) secs = 0;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // 4. Xử lý Seek Bar lò xo & Pointer Capture
  const handleSeekPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = seekBarRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    setIsDragging(true);

    const rect = el.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    setCurrentTime(newTime);
  };

  const handleSeekPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !seekBarRef.current) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    setCurrentTime(newTime);
  };

  const handleSeekPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !seekBarRef.current) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;

    if (!currentTrack.isBuiltInSynth && audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
    setIsDragging(false);
    try {
      seekBarRef.current.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // 5. Tải bài hát từ file máy tính
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    await saveCustomTrackFiles(fileList);
    await refreshPlaylist();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 6. Thêm bài hát từ link URL
  const handleAddUrlTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    await saveCustomUrlTrack(customTitle.trim() || 'Nhạc Trực Tuyến', 'Stream URL', customUrl.trim());
    setCustomUrl('');
    setCustomTitle('');
    setIsUrlModalOpen(false);
    await refreshPlaylist();
  };

  // 7. Xóa bài hát khỏi playlist
  const handleDeleteTrack = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteStoredTrack(id);
    await refreshPlaylist();
  };

  return (
    <div className={`u474-wrap ${isPlaying ? 'is-play' : ''} ${isCompact ? 'scale-90 sm:scale-100' : ''}`} data-theme="dark">
      {/* HTML5 Audio ẩn */}
      <audio
        ref={audioRef}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onAudioEnded}
      />

      {/* 1. Vầng sáng hít thở sau thẻ (.u474-gl) */}
      <div className="u474-gl" />

      {/* 2. Thẻ kính mờ (.u474-c) */}
      <div className="u474-c">
        {/* Khối trên: Bìa album + Tên bài hát + Nút Play morphing */}
        <div className="u474-top">
          {/* Ảnh bìa 64x64 (.u474-art) */}
          <div className="u474-art">
            {currentTrack.coverUrl ? (
              <img src={currentTrack.coverUrl} alt={currentTrack.title} className="u474-art-img" />
            ) : (
              /* SVG hoàng hôn mặt biển nguyên bản của Lucian Prompt #474 */
              <svg viewBox="0 0 64 64" className="u474-art-img">
                <defs>
                  <linearGradient id="u474Sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2D0A4E" />
                    <stop offset="50%" stopColor="#F2508C" />
                    <stop offset="100%" stopColor="#FF8A5B" />
                  </linearGradient>
                </defs>
                <rect width="64" height="64" fill="url(#u474Sky)" />
                <circle cx="32" cy="27" r="14" fill="#FFE66D" />
                {/* Các sọc kẻ ngang hoàng hôn pixel */}
                <line x1="18" y1="28" x2="46" y2="28" stroke="#F2508C" strokeWidth="1.2" />
                <line x1="20" y1="32" x2="44" y2="32" stroke="#F2508C" strokeWidth="1.5" />
                <line x1="23" y1="36" x2="41" y2="36" stroke="#F2508C" strokeWidth="1.8" />
                {/* Mặt biển */}
                <rect y="38" width="64" height="26" fill="#0B1720" />
                {/* Vệt sáng lăn tăn phản chiếu */}
                <line x1="26" y1="41" x2="38" y2="41" stroke="#FF8A5B" strokeWidth="1.2" opacity="0.9" />
                <line x1="22" y1="45" x2="42" y2="45" stroke="#FF8A5B" strokeWidth="1.2" opacity="0.8" />
                <line x1="18" y1="49" x2="46" y2="49" stroke="#F2508C" strokeWidth="1.2" opacity="0.7" />
                <line x1="14" y1="53" x2="50" y2="53" stroke="#F2508C" strokeWidth="1.2" opacity="0.6" />
                <line x1="10" y1="57" x2="54" y2="57" stroke="#7B4DD8" strokeWidth="1.2" opacity="0.5" />
              </svg>
            )}
          </div>

          {/* Thông tin bài hát */}
          <div className="u474-inf">
            <div className="u474-title-row">
              <span className="u474-tit">{currentTrack.title}</span>
              {/* Thanh sóng nhạc 3 cột (.u474-eq) */}
              <div className="u474-eq" title={isPlaying ? 'Đang phát' : 'Đang dừng'}>
                <span />
                <span />
                <span />
              </div>
            </div>
            <span className="u474-art-name">{currentTrack.artist}</span>
          </div>

          {/* Nút Play/Pause biến hình (.u474-pl & .u474-ic) */}
          <button
            type="button"
            className="u474-pl"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? 'Tạm dừng' : 'Phát nhạc'}
          >
            <div className="u474-ic">
              <i />
              <i />
            </div>
          </button>
        </div>

        {/* Thanh tua lò xo (.u474-sk) */}
        <div className="u474-sk-box">
          <div
            ref={seekBarRef}
            className={`u474-sk ${isDragging ? 'is-dragging' : ''}`}
            onPointerDown={handleSeekPointerDown}
            onPointerMove={handleSeekPointerMove}
            onPointerUp={handleSeekPointerUp}
            onPointerCancel={handleSeekPointerUp}
          >
            <div className="u474-tr">
              <div className="u474-fl" style={{ width: `${progressPercent}%` }} />
              <div className="u474-th" style={{ left: `${progressPercent}%` }} />
            </div>
          </div>

          {/* Thời gian đã phát & Còn lại */}
          <div className="u474-tm">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
          </div>
        </div>

        {/* Hàng điều khiển phụ tinh tế */}
        <div className="u474-subcontrols">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="u474-btn-sub"
              onClick={handlePrevTrack}
              title="Bài trước đó"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="u474-btn-sub"
              onClick={handleNextTrack}
              title="Bài tiếp theo"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={`u474-btn-sub ${repeatMode !== 'off' ? 'is-active' : ''}`}
              onClick={() => {
                setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
              }}
              title={`Chế độ lặp: ${repeatMode === 'all' ? 'Tất cả' : repeatMode === 'one' ? 'Một bài' : 'Tắt'}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Âm lượng */}
            <button
              type="button"
              className="u474-btn-sub"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Nút mở ngăn kéo Danh sách phát */}
            <button
              type="button"
              className={`u474-btn-sub text-xs gap-1.5 px-2.5 py-1 ${isDrawerOpen ? 'is-active' : ''}`}
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              title="Mở Danh sách phát"
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">Playlist ({playlist.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Ngăn kéo Danh sách phát (.u474-drawer) */}
      {isDrawerOpen && (
        <div className="u474-drawer animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <span className="text-xs font-bold text-[#CCD0CF] flex items-center gap-1.5">
              <span>Danh Sách Phát Yêu Thích</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#253745] text-[#9BA8AB]">
                {playlist.length}
              </span>
            </span>

            <div className="flex items-center gap-1">
              {/* Nút tải nhạc từ máy */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#253745] hover:bg-[#344857] text-[#CCD0CF] text-[11px] font-semibold transition"
                title="Tải bài hát (.mp3, .m4a, .wav, .ogg) từ máy"
              >
                <Upload className="w-3 h-3 text-[#7EE8C0]" />
                <span>+ Tải file</span>
              </button>

              {/* Nút thêm link URL */}
              <button
                type="button"
                onClick={() => setIsUrlModalOpen(true)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#11212D] hover:bg-[#253745] text-[#9BA8AB] hover:text-[#CCD0CF] text-[11px] transition"
                title="Nhập URL file nhạc trực tuyến"
              >
                <Globe className="w-3 h-3 text-amber-300" />
                <span>URL</span>
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Danh sách bài hát cuộn mượt */}
          <div className="max-h-[180px] overflow-y-auto space-y-1 pr-1 overscroll-contain no-scrollbar">
            {playlist.map((t, idx) => {
              const isSelected = idx === currentTrackIndex;
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTrack(idx)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition cursor-pointer group ${
                    isSelected
                      ? 'bg-[#253745] text-[#CCD0CF] font-bold border border-[#4A5C6A]'
                      : 'text-[#9BA8AB] hover:bg-[#11212D] hover:text-[#CCD0CF]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-4 text-center text-[10px] text-white/40 shrink-0">
                      {isSelected && isPlaying ? '▶' : idx + 1}
                    </span>
                    <div className="min-w-0 truncate">
                      <div className="truncate text-xs font-semibold text-[#CCD0CF]">{t.title}</div>
                      <div className="truncate text-[10px] text-[#9BA8AB]">{t.artist}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {t.isBuiltInSynth && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#7EE8C0]/15 text-[#7EE8C0] border border-[#7EE8C0]/30 font-bold">
                        Hệ thống
                      </span>
                    )}
                    {!t.isBuiltInSynth && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTrack(t.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-white/40 transition"
                        title="Xóa bài hát này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal nhập link URL nhạc */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/75 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddUrlTrack}
            className="w-full max-w-sm rounded-2xl bg-[#0B1720] border border-white/20 p-5 space-y-4 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setIsUrlModalOpen(false)}
              className="absolute top-3 right-3 p-1 text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h4 className="text-sm font-bold text-[#CCD0CF]">Thêm Bài Hát Từ URL</h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-[#9BA8AB] mb-1">Tên bài hát</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="VD: Lofi Chill Stream"
                  className="w-full px-3 py-2 rounded-xl bg-[#06141B] border border-white/10 text-[#CCD0CF] focus:outline-none focus:border-[#7EE8C0]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#9BA8AB] mb-1">Link file âm thanh (.mp3 / .ogg) *</label>
                <input
                  type="url"
                  required
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/song.mp3"
                  className="w-full px-3 py-2 rounded-xl bg-[#06141B] border border-white/10 text-[#CCD0CF] focus:outline-none focus:border-[#7EE8C0]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsUrlModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-[#11212D] text-xs font-semibold text-[#9BA8AB]"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-[#7EE8C0] text-[#06141B] text-xs font-bold hover:brightness-110"
              >
                Thêm Nhạc
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
