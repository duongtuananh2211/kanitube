'use client';

import React, { useEffect, useRef, useState } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  onTimeUpdate?: (currentTime: number) => void;
  onReady?: (player: any) => void;
  stopTime?: number | null;
  onStopReached?: () => void;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ 
  videoId, 
  onTimeUpdate,
  onReady,
  stopTime,
  onStopReached
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stopTimeRef = useRef<number | null>(null);

  useEffect(() => {
    stopTimeRef.current = stopTime ?? null;
  }, [stopTime]);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    function initPlayer() {
      if (!containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
        events: {
          onReady: (event: any) => {
            onReady?.(event.target);
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              startTracking();
            } else {
              stopTracking();
            }
          },
        },
      });
    }

    function startTracking() {
      stopTracking();
      intervalRef.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const currentTime = playerRef.current.getCurrentTime();
          onTimeUpdate?.(currentTime);

          if (stopTimeRef.current !== null && currentTime >= stopTimeRef.current) {
            playerRef.current.pauseVideo();
            stopTimeRef.current = null;
            onStopReached?.();
          }
        }
      }, 100);
    }

    function stopTracking() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      stopTracking();
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-3xl border-4 border-[#E5E5E5] bg-black shadow-xl">
      <div ref={containerRef} />
    </div>
  );
};
