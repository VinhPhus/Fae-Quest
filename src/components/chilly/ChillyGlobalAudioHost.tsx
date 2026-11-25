import React, { useEffect, useRef, useCallback } from 'react';
import { useChillyAudioStore } from '../../store/useChillyAudioStore';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { chillySynth } from '../../utils/chillySynth';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export const ChillyGlobalAudioHost: React.FC = () => {
  const {
    playlist,
    currentTrackIndex,
    isPlaying,
    volume,
    isMuted,
    isSeeking,
    seekRequestTime,
    seekRequestNonce,
    initAudioStore,
    syncFromCloudTracks,
    resetToBuiltInTracks,
    setCurrentTime,
    setDuration,
    setIsLoading,
    setIsPlaying,
    handleTrackEnded,
  } = useChillyAudioStore();

  const currentUser = useFaeQuestStore((s) => s.currentUser);
  const authLoading = useFaeQuestStore((s) => s.authLoading);
  const cloudChillyTracks = useFaeQuestStore((s) => s.chillyTracks);
  const pullChillyTracksFromCloud = useFaeQuestStore((s) => s.pullChillyTracksFromCloud);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytPlayerReadyRef = useRef<boolean>(false);
  const synthTimerRef = useRef<any>(null);
  const ytTickerRef = useRef<any>(null);
  const lastNonceRef = useRef<number>(0);
  const currentTrackRef = useRef<any>(null);

  const currentTrack = playlist[currentTrackIndex] || playlist[0];
  currentTrackRef.current = currentTrack;

  // 1. Tải danh sách bài hát từ Storage khi ứng dụng khởi chạy
  useEffect(() => {
    initAudioStore();
  }, [initAudioStore]);

  // 1b. Đồng bộ hai chiều với tài khoản đám mây (khi đăng nhập / đổi thiết bị / có cập nhật realtime)
  useEffect(() => {
    if (authLoading) return;
    if (currentUser?.id) {
      syncFromCloudTracks(cloudChillyTracks);
    } else {
      resetToBuiltInTracks();
    }
  }, [currentUser?.id, authLoading, cloudChillyTracks, syncFromCloudTracks, resetToBuiltInTracks]);

  // 1c. Tự động làm mới danh sách nhạc khi điện thoại quay lại nền trước hoặc có mạng lại
  useEffect(() => {
    if (!currentUser?.id || typeof window === 'undefined') return;
    const handleResume = () => {
      if (document.visibilityState === 'visible') {
        pullChillyTracksFromCloud();
      }
    };
    const handleOnline = () => {
      pullChillyTracksFromCloud();
    };
    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('online', handleOnline);
    return () => {
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('online', handleOnline);
    };
  }, [currentUser?.id, pullChillyTracksFromCloud]);

  // 2. Khởi tạo YouTube IFrame Player ngầm một lần duy nhất
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initYT = () => {
      if (!window.YT || !window.YT.Player) return;
      if (ytPlayerRef.current) return;

      try {
        ytPlayerRef.current = new window.YT.Player('chilly-youtube-iframe-host', {
          height: '10',
          width: '10',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (e: any) => {
              ytPlayerReadyRef.current = true;
              const effectiveVol = isMuted ? 0 : Math.round(volume * 100);
              e.target.setVolume(effectiveVol);
            },
            onStateChange: (event: any) => {
              if (window.YT) {
                if (event.data === window.YT.PlayerState.ENDED) {
                  handleTrackEnded();
                } else if (event.data === window.YT.PlayerState.PLAYING) {
                  setIsLoading(false);
                  setIsPlaying(true);
                } else if (event.data === window.YT.PlayerState.BUFFERING) {
                  setIsLoading(true);
                }
              }
            },
            onError: (err: any) => {
              console.warn('YouTube Player Error:', err);
              setIsLoading(false);
            },
          },
        });
      } catch (e) {
        console.warn('Failed to initialize YouTube Player:', e);
      }
    };

    if (!window.YT) {
      const existingScript = document.getElementById('youtube-iframe-api-script');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        window.onYouTubeIframeAPIReady = initYT;
        document.body.appendChild(tag);
      } else {
        const prevReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (prevReady) prevReady();
          initYT();
        };
      }
    } else {
      initYT();
    }

    return () => {
      if (ytTickerRef.current) clearInterval(ytTickerRef.current);
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
    };
  }, [handleTrackEnded, isMuted, setIsLoading, setIsPlaying, volume]);

  // 3. Đồng bộ âm lượng sang tất cả các nguồn âm thanh
  useEffect(() => {
    const effectiveVol = isMuted ? 0 : volume;

    // HTML5 Audio
    if (audioRef.current) {
      audioRef.current.volume = effectiveVol;
    }

    // Web Audio Synth
    chillySynth.setVolume(effectiveVol);

    // YouTube IFrame Player
    if (ytPlayerRef.current && ytPlayerReadyRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      try {
        ytPlayerRef.current.setVolume(Math.round(effectiveVol * 100));
        if (effectiveVol === 0) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
        }
      } catch (e) {
        console.warn('YT setVolume error:', e);
      }
    }
  }, [volume, isMuted]);

  // 4. Xử lý chuyển bài hát và kiểm soát nguồn phát âm thanh (Audio / YouTube / Synth)
  const isYoutube = currentTrack?.sourceType === 'youtube' && Boolean(currentTrack?.youtubeVideoId);
  const isSynth = Boolean(currentTrack?.isBuiltInSynth);
  const isStandardAudio = !isYoutube && !isSynth;

  useEffect(() => {
    if (!currentTrack) return;

    // Dừng Web Audio Synth timer nếu đang chạy
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    // Dừng YouTube ticker nếu đang chạy
    if (ytTickerRef.current) {
      clearInterval(ytTickerRef.current);
      ytTickerRef.current = null;
    }

    // TH 1: Nguồn phát là YouTube Video
    if (isYoutube) {
      // Dừng Audio thường & Synth
      if (audioRef.current) audioRef.current.pause();
      chillySynth.stop();

      const videoId = currentTrack.youtubeVideoId!;
      if (ytPlayerRef.current && ytPlayerReadyRef.current) {
        try {
          if (isPlaying) {
            ytPlayerRef.current.loadVideoById(videoId, 0);
          } else {
            ytPlayerRef.current.cueVideoById(videoId, 0);
          }
        } catch (e) {
          console.warn('YT loadVideoById error:', e);
        }
      }

      // Khởi động Ticker đồng bộ thời gian từ YouTube
      if (isPlaying) {
        ytTickerRef.current = setInterval(() => {
          if (ytPlayerRef.current && ytPlayerReadyRef.current && !useChillyAudioStore.getState().isSeeking) {
            try {
              const cur = ytPlayerRef.current.getCurrentTime() || 0;
              const dur = ytPlayerRef.current.getDuration() || currentTrack.duration || 240;
              setCurrentTime(cur);
              if (dur > 0) setDuration(dur);
            } catch {}
          }
        }, 350);
      }
      return;
    }

    // TH 2: Nguồn phát là Web Audio Synth
    if (isSynth) {
      // Dừng Audio thường & YouTube
      if (audioRef.current) audioRef.current.pause();
      if (ytPlayerRef.current && ytPlayerReadyRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {}
      }

      if (isPlaying) {
        chillySynth.setVolume(isMuted ? 0 : volume);
        chillySynth.play(currentTrack.synthType || 'ambient_pad');

        const totalDur = currentTrack.duration || 300;
        setDuration(totalDur);

        // Timer đếm thời gian cho synth
        synthTimerRef.current = setInterval(() => {
          const state = useChillyAudioStore.getState();
          if (!state.isSeeking) {
            const nextTime = state.currentTime + 0.5;
            if (nextTime >= totalDur) {
              handleTrackEnded();
            } else {
              setCurrentTime(nextTime);
            }
          }
        }, 500);
      } else {
        chillySynth.stop();
      }
      return;
    }

    // TH 3: Nguồn phát là file âm thanh tiêu chuẩn (Audius / Local / URL)
    if (isStandardAudio) {
      chillySynth.stop();
      if (ytPlayerRef.current && ytPlayerReadyRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {}
      }

      const audio = audioRef.current;
      if (audio) {
        const targetSrc = currentTrack.src || '';
        if (audio.src !== targetSrc) {
          audio.src = targetSrc;
          audio.currentTime = 0;
        }

        if (isPlaying) {
          setIsLoading(true);
          audio
            .play()
            .then(() => setIsLoading(false))
            .catch((e) => {
              console.warn('Audio play error:', e);
              setIsLoading(false);
            });
        } else {
          audio.pause();
        }
      }
    }
  }, [
    currentTrackIndex,
    isPlaying,
    isYoutube,
    isSynth,
    isStandardAudio,
    currentTrack,
    handleTrackEnded,
    isMuted,
    setCurrentTime,
    setDuration,
    setIsLoading,
    volume,
  ]);

  // 5. Xử lý Play / Pause toggle
  useEffect(() => {
    if (!currentTrack) return;

    if (isYoutube && ytPlayerRef.current && ytPlayerReadyRef.current) {
      try {
        if (isPlaying) {
          ytPlayerRef.current.playVideo();
        } else {
          ytPlayerRef.current.pauseVideo();
        }
      } catch (e) {
        console.warn('YT toggle play error:', e);
      }
    } else if (isSynth) {
      if (isPlaying) {
        chillySynth.setVolume(isMuted ? 0 : volume);
        chillySynth.play(currentTrack.synthType || 'ambient_pad');
      } else {
        chillySynth.stop();
      }
    } else if (isStandardAudio && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((e) => console.warn('Audio resume error:', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, isYoutube, isSynth, isStandardAudio, currentTrack, isMuted, volume]);

  // 6. Xử lý Lệnh Tua (Seek Request)
  useEffect(() => {
    if (seekRequestNonce && seekRequestNonce !== lastNonceRef.current && seekRequestTime !== null) {
      lastNonceRef.current = seekRequestNonce;

      if (isYoutube && ytPlayerRef.current && ytPlayerReadyRef.current) {
        try {
          ytPlayerRef.current.seekTo(seekRequestTime, true);
        } catch {}
      } else if (isStandardAudio && audioRef.current) {
        audioRef.current.currentTime = seekRequestTime;
      }
    }
  }, [seekRequestNonce, seekRequestTime, isYoutube, isStandardAudio]);

  // 7. Lắng nghe các sự kiện của thẻ <audio>
  const handleAudioTimeUpdate = useCallback(() => {
    if (audioRef.current && !isSeeking) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [isSeeking, setCurrentTime]);

  const handleAudioDurationChange = useCallback(() => {
    if (audioRef.current && !isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
      setDuration(audioRef.current.duration);
    }
  }, [setDuration]);

  const handleAudioEnded = useCallback(() => {
    handleTrackEnded();
  }, [handleTrackEnded]);

  return (
    <>
      {/* 
        Thẻ <audio> duy nhất trong toàn hệ thống.
        Đặt tại đây và không bao giờ bị unmount khi bật/tắt Fullscreen!
      */}
      <audio
        ref={audioRef}
        preload="auto"
        onTimeUpdate={handleAudioTimeUpdate}
        onDurationChange={handleAudioDurationChange}
        onLoadedMetadata={handleAudioDurationChange}
        onEnded={handleAudioEnded}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        className="hidden"
      />

      {/* 
        Khung YouTube IFrame ngầm. 
        Kích thước cực nhỏ, đặt ngoài màn hình hiển thị để phát âm thanh mượt mà.
      */}
      <div
        id="chilly-youtube-iframe-host"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: -9999,
          left: -9999,
          width: '1px',
          height: '1px',
          opacity: 0.001,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
    </>
  );
};
