import React, { useEffect, useRef, useCallback, useState } from 'react';
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

  const [ytReady, setYtReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytPlayerReadyRef = useRef<boolean>(false);
  const synthTimerRef = useRef<any>(null);
  const ytTickerRef = useRef<any>(null);
  const lastNonceRef = useRef<number>(0);
  const loadedSourceKeyRef = useRef<string | null>(null);
  const currentTrackRef = useRef<any>(null);
  const volumeRef = useRef<number>(volume);
  const isMutedRef = useRef<boolean>(isMuted);
  const isPlayingRef = useRef<boolean>(isPlaying);

  const currentTrack = playlist[currentTrackIndex] || playlist[0];
  currentTrackRef.current = currentTrack;
  volumeRef.current = volume;
  isMutedRef.current = isMuted;
  isPlayingRef.current = isPlaying;

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
              setYtReady(true);
              const effectiveVol = isMutedRef.current ? 0 : Math.round(volumeRef.current * 100);
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
  }, [handleTrackEnded, setIsLoading, setIsPlaying]);

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

  // 4. Nạp nguồn phát âm thanh CHỈ KHI thực sự đổi bài / đổi nguồn phát
  const isYoutube = currentTrack?.sourceType === 'youtube' && Boolean(currentTrack?.youtubeVideoId);
  const isSynth = Boolean(currentTrack?.isBuiltInSynth);
  const isStandardAudio = Boolean(currentTrack) && !isYoutube && !isSynth;

  const trackSourceKey = !currentTrack
    ? null
    : isYoutube
      ? `yt:${currentTrack.id}:${currentTrack.youtubeVideoId}`
      : isSynth
        ? `synth:${currentTrack.id}:${currentTrack.synthType || 'ambient_pad'}`
        : `audio:${currentTrack.id}:${currentTrack.src || currentTrack.cloudUrl || ''}`;

  useEffect(() => {
    if (!currentTrack || !trackSourceKey) return;

    // Nếu nguồn phát của bài hiện tại không đổi (ví dụ đồng bộ danh sách hoặc chuyển tab) thì không nạp lại từ đầu
    if (loadedSourceKeyRef.current === trackSourceKey) {
      return;
    }

    // TH 1: Nguồn phát là YouTube Video
    if (isYoutube) {
      if (audioRef.current) audioRef.current.pause();
      chillySynth.stop();

      if (!ytReady || !ytPlayerRef.current || !ytPlayerReadyRef.current) {
        return;
      }

      loadedSourceKeyRef.current = trackSourceKey;
      const videoId = currentTrack.youtubeVideoId!;
      try {
        if (isPlayingRef.current) {
          ytPlayerRef.current.loadVideoById(videoId, 0);
        } else {
          ytPlayerRef.current.cueVideoById(videoId, 0);
        }
      } catch (e) {
        console.warn('YT loadVideoById error:', e);
      }
      return;
    }

    loadedSourceKeyRef.current = trackSourceKey;

    // TH 2: Nguồn phát là Web Audio Synth
    if (isSynth) {
      if (audioRef.current) audioRef.current.pause();
      if (ytPlayerRef.current && ytPlayerReadyRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {}
      }

      setDuration(currentTrack.duration || 300);
      if (isPlayingRef.current) {
        chillySynth.setVolume(isMutedRef.current ? 0 : volumeRef.current);
        chillySynth.play(currentTrack.synthType || 'ambient_pad');
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
        const targetSrc = currentTrack.src || currentTrack.cloudUrl || '';
        audio.src = targetSrc;
        audio.currentTime = 0;

        if (isPlayingRef.current) {
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
    trackSourceKey,
    ytReady,
    isYoutube,
    isSynth,
    isStandardAudio,
    currentTrack,
    setDuration,
    setIsLoading,
  ]);

  // 5. Xử lý Play / Pause toggle & Ticker đồng bộ tiến độ phát
  useEffect(() => {
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    if (ytTickerRef.current) {
      clearInterval(ytTickerRef.current);
      ytTickerRef.current = null;
    }

    const track = currentTrackRef.current;
    if (!track || !trackSourceKey) return;

    if (isYoutube) {
      if (ytReady && ytPlayerRef.current && ytPlayerReadyRef.current) {
        try {
          if (isPlaying) {
            ytPlayerRef.current.playVideo();
          } else {
            ytPlayerRef.current.pauseVideo();
          }
        } catch (e) {
          console.warn('YT toggle play error:', e);
        }
      }

      if (isPlaying) {
        ytTickerRef.current = setInterval(() => {
          const activeTrack = currentTrackRef.current;
          if (ytPlayerRef.current && ytPlayerReadyRef.current && !useChillyAudioStore.getState().isSeeking) {
            try {
              const cur = ytPlayerRef.current.getCurrentTime() || 0;
              const dur = ytPlayerRef.current.getDuration() || activeTrack?.duration || 240;
              setCurrentTime(cur);
              if (dur > 0) setDuration(dur);
            } catch {}
          }
        }, 350);
      }
      return;
    }

    if (isSynth) {
      const expectedType = track.synthType || 'ambient_pad';
      if (isPlaying) {
        chillySynth.setVolume(isMutedRef.current ? 0 : volumeRef.current);
        if (!chillySynth.getIsPlaying() || chillySynth.getCurrentType() !== expectedType) {
          chillySynth.play(expectedType);
        }

        const totalDur = track.duration || 300;
        setDuration(totalDur);

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

    if (isStandardAudio && audioRef.current) {
      if (isPlaying) {
        if (audioRef.current.paused) {
          audioRef.current.play().catch((e) => console.warn('Audio resume error:', e));
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [
    isPlaying,
    trackSourceKey,
    ytReady,
    isYoutube,
    isSynth,
    isStandardAudio,
    handleTrackEnded,
    setCurrentTime,
    setDuration,
  ]);

  // 6. Xử lý Lệnh Tua (Seek Request)
  useEffect(() => {
    if (seekRequestNonce && seekRequestNonce !== lastNonceRef.current && seekRequestTime !== null) {
      lastNonceRef.current = seekRequestNonce;

      if (isYoutube && ytPlayerRef.current && ytPlayerReadyRef.current) {
        try {
          ytPlayerRef.current.seekTo(seekRequestTime, true);
          if (isPlayingRef.current) {
            ytPlayerRef.current.playVideo();
          }
        } catch {}
      } else if (isStandardAudio && audioRef.current) {
        audioRef.current.currentTime = seekRequestTime;
        if (isPlayingRef.current && audioRef.current.paused) {
          audioRef.current.play().catch((e) => console.warn('Audio seek play error:', e));
        }
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
