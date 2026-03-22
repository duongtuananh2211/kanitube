'use client';

import React, { useRef } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { YouTubePlayer } from '@/components/video/YouTubePlayer';
import { TranscriptSidebar } from '@/components/transcript/TranscriptSidebar';
import { useTranscript } from '@/hooks/useTranscript';

export default function WatchPage() {
  const params = useParams();
  const videoId = params.videoId as string;
  const playerRef = useRef<any>(null);
  const [stopTime, setStopTime] = React.useState<number | null>(null);

  const {
    transcript,
    currentLineIndex,
    loading,
    error,
    updateCurrentTime
  } = useTranscript(videoId);

  const handleTimeUpdate = (time: number) => {
    updateCurrentTime(time);
  };

  const handleLineClick = (startTime: number, endTime: number) => {
    if (playerRef.current) {
      // Stop 0.1 seconds before the next sentence to avoid "bleeding" into the next line
      setStopTime(Math.max(startTime, endTime - 0.1));
      playerRef.current.seekTo(startTime);
      playerRef.current.playVideo();
    }
  };

  const handlePlayerReady = (player: any) => {
    playerRef.current = player;
  };

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <div className="flex-1 max-w-[1600px] mx-auto w-full p-2 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 h-full">
          {/* Left Column: Video Player */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 sticky top-[68px] md:top-[84px] self-start z-20 bg-white py-2">
            <YouTubePlayer
              videoId={videoId}
              onTimeUpdate={handleTimeUpdate}
              onReady={handlePlayerReady}
              stopTime={stopTime}
              onStopReached={() => setStopTime(null)}
            />
            </div>
          {/* Right Column: Transcript */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
            <TranscriptSidebar
              transcript={transcript}
              currentLineIndex={currentLineIndex}
              loading={loading}
              error={error}
              onLineClick={handleLineClick}
            />
          </div>        </div>
      </div>
    </main>
  );
}
