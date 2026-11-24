import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ChillyMusicPlayer.css';
import { ChillyTrack } from '../../types';
import { useChillyAudioStore, DrawerTab } from '../../store/useChillyAudioStore';
import { saveCustomTrackFiles } from '../../utils/chillyStorage';
import {
  searchAudiusTracks,
  AudiusTrackResult,
  extractYouTubeVideoId,
  fetchYouTubeMetadata,
} from '../../utils/audiusApi';
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
  Search,
  Music,
  Heart,
  Loader2,
  Sparkles,
  Play,
  Check,
} from 'lucide-react';

const YouTubeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const SUGGESTIONS = [
  'Lo-Fi Beats',
  'Chillhop',
  'Synthwave',
  'Ambient Piano',
  'Sleep & Relax',
  'Fantasy Tavern',
];

export const ChillyMusicPlayer: React.FC<{ isCompact?: boolean }> = ({ isCompact = false }) => {
  const {
    playlist,
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isLoading,
    isDrawerOpen,
    activeDrawerTab,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    cycleRepeatMode,
    playTrack,
    playSpecificTrack,
    addTrackToFavorites,
    removeTrack,
    setIsSeeking,
    setIsDrawerOpen,
    setActiveDrawerTab,
  } = useChillyAudioStore();

  const seekBarRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Trạng thái Tab 1: Tìm kiếm Audius
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AudiusTrackResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [favoriteSuccessId, setFavoriteSuccessId] = useState<string | null>(null);

  // Trạng thái Tab 2: Link YouTube & Upload
  const [ytUrl, setYtUrl] = useState('');
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Trạng thái kéo thanh tua (Seek bar)
  const [isDraggingSeek, setIsDraggingSeek] = useState(false);
  const [dragTime, setDragTime] = useState(0);

  const currentTrack: ChillyTrack =
    playlist[currentTrackIndex] || playlist[0] || {
      id: 'default',
      title: 'Chilly Ambient',
      artist: 'FaeQuest',
      duration: 300,
    };

  // Format mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) secs = 0;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const displayTime = isDraggingSeek ? dragTime : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  // ================= XỬ LÝ THANH TUA LÒ XO (SEEK BAR) =================
  const handleSeekPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = seekBarRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    setIsDraggingSeek(true);
    setIsSeeking(true);

    const rect = el.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    setDragTime(newTime);
  };

  const handleSeekPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSeek || !seekBarRef.current) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    setDragTime(newTime);
  };

  const handleSeekPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSeek || !seekBarRef.current) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;

    seekTo(newTime);
    setIsDraggingSeek(false);
    setIsSeeking(false);
    try {
      seekBarRef.current.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // ================= TAB 1: TÌM NHẠC AUDIUS API =================
  const handlePerformSearch = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) return;

    try {
      setIsSearching(true);
      setHasSearched(true);
      const results = await searchAudiusTracks(q);
      setSearchResults(results);
    } catch (err) {
      console.warn('Search Audius error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlayAudiusTrack = async (audiusTrack: AudiusTrackResult) => {
    const chillyTrack: ChillyTrack = {
      id: `audius_${audiusTrack.id}`,
      title: audiusTrack.title,
      artist: audiusTrack.artist,
      src: audiusTrack.streamUrl,
      coverUrl: audiusTrack.artworkUrl || undefined,
      duration: audiusTrack.duration,
      sourceType: 'audius',
      audiusTrackId: audiusTrack.id,
      addedAt: Date.now(),
    };

    await playSpecificTrack(chillyTrack);
  };

  const handleSaveAudiusFavorite = async (audiusTrack: AudiusTrackResult, e: React.MouseEvent) => {
    e.stopPropagation();
    const chillyTrack: ChillyTrack = {
      id: `audius_${audiusTrack.id}`,
      title: audiusTrack.title,
      artist: audiusTrack.artist,
      src: audiusTrack.streamUrl,
      coverUrl: audiusTrack.artworkUrl || undefined,
      duration: audiusTrack.duration,
      sourceType: 'audius',
      audiusTrackId: audiusTrack.id,
      addedAt: Date.now(),
    };

    await addTrackToFavorites(chillyTrack, false);
    setFavoriteSuccessId(audiusTrack.id);
    setTimeout(() => setFavoriteSuccessId(null), 1800);
  };

  // ================= TAB 2: THÊM YOUTUBE LINK HOẶC FILE TỪ MÁY =================
  const handleAddYouTubeTrack = async (playImmediately = false) => {
    setYtError(null);
    const videoId = extractYouTubeVideoId(ytUrl);
    if (!videoId) {
      setYtError('Link YouTube không hợp lệ. Vui lòng kiểm tra lại URL.');
      return;
    }

    try {
      setYtLoading(true);
      const meta = await fetchYouTubeMetadata(ytUrl, videoId);
      const track: ChillyTrack = {
        id: `yt_${videoId}_${Date.now()}`,
        title: meta.title,
        artist: meta.artist,
        youtubeVideoId: videoId,
        coverUrl: meta.thumbnail,
        sourceType: 'youtube',
        duration: 240,
        addedAt: Date.now(),
      };

      if (playImmediately) {
        await playSpecificTrack(track);
      } else {
        await addTrackToFavorites(track, false);
      }

      setYtUrl('');
      setActiveDrawerTab('playlist');
    } catch (err) {
      console.warn('YouTube add error:', err);
      setYtError('Không thể lấy thông tin bài hát từ YouTube.');
    } finally {
      setYtLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingFile(true);
      const saved = await saveCustomTrackFiles(Array.from(files));
      if (saved.length > 0) {
        for (const tr of saved) {
          await addTrackToFavorites(tr, false);
        }
        setActiveDrawerTab('playlist');
      }
    } catch (err) {
      console.warn('Upload file error:', err);
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Helper hiển thị badge nguồn gốc bài hát
  const renderSourceBadge = (track: ChillyTrack) => {
    if (track.isBuiltInSynth) {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/30 text-[9px] font-bold">
          <Sparkles className="w-2.5 h-2.5" />
          <span>Synth</span>
        </span>
      );
    }
    if (track.sourceType === 'youtube' || track.youtubeVideoId) {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[9px] font-bold">
          <YouTubeIcon className="w-2.5 h-2.5" />
          <span>YouTube</span>
        </span>
      );
    }
    if (track.sourceType === 'audius') {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[9px] font-bold">
          <Music className="w-2.5 h-2.5" />
          <span>Audius</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
        <Upload className="w-2.5 h-2.5" />
        <span>File máy</span>
      </span>
    );
  };

  return (
    <div
      className={`u474-wrap ${isPlaying ? 'is-play' : ''} ${isCompact ? 'scale-90 sm:scale-100' : ''}`}
      data-theme="dark"
    >
      {/* Ẩn file input upload nhạc */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/*"
        className="hidden"
        onChange={handleFileUpload}
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
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="u474-art-img w-full h-full object-cover"
              />
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
                <line x1="18" y1="28" x2="46" y2="28" stroke="#F2508C" strokeWidth="1.2" />
                <line x1="20" y1="32" x2="44" y2="32" stroke="#F2508C" strokeWidth="1.5" />
                <line x1="23" y1="36" x2="41" y2="36" stroke="#F2508C" strokeWidth="1.8" />
                <rect y="38" width="64" height="26" fill="#0B1720" />
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
              <span className="u474-tit truncate">{currentTrack.title}</span>
              {/* Thanh sóng nhạc 3 cột (.u474-eq) */}
              <div className="u474-eq" title={isPlaying ? 'Đang phát' : 'Đang dừng'}>
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="u474-art-name truncate">{currentTrack.artist}</span>
              {renderSourceBadge(currentTrack)}
            </div>
          </div>

          {/* Nút Play/Pause biến hình (.u474-pl & .u474-ic) */}
          <button
            type="button"
            className="u474-pl"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Tạm dừng' : 'Phát nhạc'}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <div className="u474-ic">
                <i />
                <i />
              </div>
            )}
          </button>
        </div>

        {/* Thanh tua lò xo (.u474-sk) */}
        <div className="u474-sk-box">
          <div
            ref={seekBarRef}
            className={`u474-sk ${isDraggingSeek ? 'is-dragging' : ''}`}
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
            <span>{formatTime(displayTime)}</span>
            <span>-{formatTime(Math.max(0, duration - displayTime))}</span>
          </div>
        </div>

        {/* Hàng điều khiển phụ tinh tế */}
        <div className="u474-subcontrols">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="u474-btn-sub"
              onClick={prevTrack}
              title="Bài trước đó (hoặc phát lại từ đầu)"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="u474-btn-sub"
              onClick={nextTrack}
              title="Bài tiếp theo"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={`u474-btn-sub ${repeatMode !== 'off' ? 'is-active' : ''}`}
              onClick={cycleRepeatMode}
              title={`Chế độ lặp: ${
                repeatMode === 'all'
                  ? 'Tất cả danh sách'
                  : repeatMode === 'one'
                  ? 'Lặp lại 1 bài'
                  : 'Không lặp'
              }`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Âm lượng */}
            <button
              type="button"
              className="u474-btn-sub"
              onClick={toggleMute}
              title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Nút mở ngăn kéo Danh sách phát & Tìm nhạc */}
            <button
              type="button"
              className={`u474-btn-sub text-xs gap-1.5 px-2.5 py-1 ${isDrawerOpen ? 'is-active' : ''}`}
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              title="Mở Tìm Kiếm & Danh Sách Nhạc"
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">Playlist ({playlist.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Ngăn kéo 3 TAB: Tìm Nhạc / Thêm YouTube & File / Nhạc Yêu Thích (.u474-drawer) */}
      {isDrawerOpen && (
        <div className="u474-drawer animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Thanh chuyển đổi 3 Tab */}
          <div className="flex items-center p-1 rounded-xl bg-[#06141B] border border-white/10 mb-3 gap-1">
            <button
              type="button"
              onClick={() => setActiveDrawerTab('search')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeDrawerTab === 'search'
                  ? 'bg-[#253745] text-[#7EE8C0] shadow-sm'
                  : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Tìm Nhạc</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDrawerTab('youtube')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeDrawerTab === 'youtube'
                  ? 'bg-[#253745] text-[#7EE8C0] shadow-sm'
                  : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
              }`}
            >
              <YouTubeIcon className="w-3.5 h-3.5 text-rose-400" />
              <span>YouTube / File</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDrawerTab('playlist')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeDrawerTab === 'playlist'
                  ? 'bg-[#253745] text-[#7EE8C0] shadow-sm'
                  : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-pink-400" />
              <span>Yêu Thích ({playlist.length})</span>
            </button>
          </div>

          {/* NỘI DUNG TAB 1: TÌM NHẠC AUDIUS API */}
          {activeDrawerTab === 'search' && (
            <div className="space-y-3">
              {/* Khung tìm kiếm */}
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePerformSearch(searchQuery)}
                    placeholder="Tìm bài hát, lofi, chillhop, piano..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#06141B] border border-white/10 text-xs text-[#CCD0CF] placeholder-white/30 focus:outline-none focus:border-[#7EE8C0]"
                  />
                  <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-2.5" />
                </div>
                <button
                  type="button"
                  disabled={isSearching || !searchQuery.trim()}
                  onClick={() => handlePerformSearch(searchQuery)}
                  className="px-3 py-1.5 rounded-xl bg-[#7EE8C0] disabled:opacity-40 text-[#06141B] text-xs font-bold hover:brightness-110 shrink-0 transition"
                >
                  {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Tìm'}
                </button>
              </div>

              {/* Gợi ý từ khóa nhanh */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <span className="text-[10px] font-semibold text-[#9BA8AB] shrink-0">Gợi ý:</span>
                {SUGGESTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSearchQuery(tag);
                      handlePerformSearch(tag);
                    }}
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[10px] text-[#CCD0CF] shrink-0 transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Danh sách kết quả */}
              <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1 overscroll-contain no-scrollbar">
                {isSearching && (
                  <div className="py-6 flex flex-col items-center justify-center text-xs text-[#9BA8AB] gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#7EE8C0]" />
                    <span>Đang kết nối Audius Public API...</span>
                  </div>
                )}

                {!isSearching && hasSearched && searchResults.length === 0 && (
                  <div className="py-6 text-center text-xs text-[#9BA8AB]">
                    Không tìm thấy bài hát phù hợp. Hãy thử từ khóa khác!
                  </div>
                )}

                {!isSearching && !hasSearched && (
                  <div className="py-6 text-center text-xs text-[#9BA8AB]/70 flex flex-col items-center gap-1">
                    <Sparkles className="w-4 h-4 text-[#7EE8C0]" />
                    <span>Hàng triệu bản nhạc trọn vẹn miễn phí từ Audius Public API</span>
                  </div>
                )}

                {!isSearching &&
                  searchResults.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handlePlayAudiusTrack(item)}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-left text-xs bg-[#06141B]/60 hover:bg-[#11212D] text-[#9BA8AB] hover:text-[#CCD0CF] transition cursor-pointer group border border-white/5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.artworkUrl ? (
                          <img
                            src={item.artworkUrl}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover shrink-0 bg-black/40"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                            <Music className="w-4 h-4 text-white/50" />
                          </div>
                        )}
                        <div className="min-w-0 truncate">
                          <div className="truncate text-xs font-semibold text-[#CCD0CF]">{item.title}</div>
                          <div className="truncate text-[10px] text-[#9BA8AB] flex items-center gap-1">
                            <span>{item.artist}</span>
                            <span>•</span>
                            <span>{formatTime(item.duration)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Nút Tim / Thêm vào Yêu thích */}
                        <button
                          type="button"
                          onClick={(e) => handleSaveAudiusFavorite(item, e)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-pink-400 transition"
                          title="Lưu vào danh sách Yêu Thích"
                        >
                          {favoriteSuccessId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Heart className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Nút Phát Ngay */}
                        <button
                          type="button"
                          className="px-2 py-1 rounded-lg bg-[#7EE8C0]/15 hover:bg-[#7EE8C0]/30 text-[#7EE8C0] text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Phát</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* NỘI DUNG TAB 2: LINK YOUTUBE HOẶC FILE TỪ MÁY */}
          {activeDrawerTab === 'youtube' && (
            <div className="space-y-4">
              {/* Khối thêm link YouTube */}
              <div className="p-3 rounded-xl bg-[#06141B] border border-white/10 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#CCD0CF]">
                  <YouTubeIcon className="w-4 h-4 text-rose-500" />
                  <span>Dán Link YouTube (Phát Trọn Bài Ẩn)</span>
                </div>
                <input
                  type="url"
                  value={ytUrl}
                  onChange={(e) => {
                    setYtUrl(e.target.value);
                    setYtError(null);
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-1.5 rounded-xl bg-[#11212D] border border-white/10 text-xs text-[#CCD0CF] focus:outline-none focus:border-[#7EE8C0]"
                />
                {ytError && <div className="text-[11px] text-rose-400 font-medium">{ytError}</div>}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={ytLoading || !ytUrl.trim()}
                    onClick={() => handleAddYouTubeTrack(false)}
                    className="flex-1 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-40 text-xs font-bold text-[#CCD0CF] transition"
                  >
                    + Lưu Vào Playlist
                  </button>
                  <button
                    type="button"
                    disabled={ytLoading || !ytUrl.trim()}
                    onClick={() => handleAddYouTubeTrack(true)}
                    className="flex-1 py-1.5 rounded-xl bg-[#7EE8C0] disabled:opacity-40 text-xs font-bold text-[#06141B] hover:brightness-110 transition flex items-center justify-center gap-1"
                  >
                    {ytLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                    <span>Phát Luôn</span>
                  </button>
                </div>
              </div>

              {/* Khối tải file từ máy */}
              <div className="p-3 rounded-xl bg-[#06141B] border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#CCD0CF] flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#7EE8C0]" />
                    <span>Tải File Từ Máy Tính / Điện Thoại</span>
                  </div>
                  <div className="text-[10px] text-[#9BA8AB] mt-0.5">
                    Hỗ trợ file .mp3, .m4a, .wav, .ogg (Lưu vĩnh viễn vào IndexedDB)
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isUploadingFile}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-[#253745] hover:bg-[#344857] text-[#CCD0CF] text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                >
                  {isUploadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Chọn File</span>
                </button>
              </div>
            </div>
          )}

          {/* NỘI DUNG TAB 3: NHẠC YÊU THÍCH (PLAYLIST CÁ NHÂN) */}
          {activeDrawerTab === 'playlist' && (
            <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1 overscroll-contain no-scrollbar">
              {playlist.map((t, idx) => {
                const isSelected = idx === currentTrackIndex;
                return (
                  <div
                    key={t.id}
                    onClick={() => playTrack(idx)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition cursor-pointer group ${
                      isSelected
                        ? 'bg-[#253745] text-[#CCD0CF] font-bold border border-[#7EE8C0]/40 shadow-sm'
                        : 'text-[#9BA8AB] hover:bg-[#11212D] hover:text-[#CCD0CF]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {t.coverUrl ? (
                        <img
                          src={t.coverUrl}
                          alt=""
                          className="w-7 h-7 rounded-md object-cover shrink-0 bg-black/40"
                        />
                      ) : (
                        <span className="w-5 text-center text-[10px] text-white/40 shrink-0">
                          {isSelected && isPlaying ? '▶' : idx + 1}
                        </span>
                      )}
                      <div className="min-w-0 truncate">
                        <div
                          className={`truncate text-xs font-semibold ${
                            isSelected ? 'text-[#7EE8C0]' : 'text-[#CCD0CF]'
                          }`}
                        >
                          {t.title}
                        </div>
                        <div className="truncate text-[10px] text-[#9BA8AB] flex items-center gap-1.5">
                          <span>{t.artist}</span>
                          <span>•</span>
                          <span>{renderSourceBadge(t)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!t.isBuiltInSynth && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTrack(t.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-white/40 transition"
                          title="Xóa bài hát này khỏi danh sách"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
