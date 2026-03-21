'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase/auth';
import { YouTubeService } from '@/services/youtube';
import { db } from '@/firebase/config';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { LogIn, LogOut, Search, User } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Header = () => {
  const { user, userProfile, signInWithGoogle, logOut } = useAuth();
  const [videoUrl, setVideoUrl] = useState('');
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = YouTubeService.extractVideoId(videoUrl);
    if (videoId) {
      if (user) {
        try {
          const videosRef = collection(db, 'users', user.uid, 'videos');
          const q = query(videosRef, where('videoId', '==', videoId));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            const title = await YouTubeService.getVideoTitle(videoId);
            await addDoc(videosRef, {
              videoId,
              url: videoUrl,
              title,
              source: 'youtube',
              addedAt: Date.now(),
            });
          }
        } catch (error) {
          console.error("Error saving video:", error);
        }
      }
      router.push(`/watch/${videoId}`);
      setVideoUrl('');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b-2 border-[#E5E5E5] px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-[#58CC02] tracking-tight font-sans">
            KaniTube
          </span>
        </Link>

        {/* Search Bar */}
        <form 
          onSubmit={handleSearch}
          className="flex-1 max-w-2xl relative"
        >
          <input
            type="text"
            placeholder="Paste YouTube URL here..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-white border-2 border-[#E5E5E5] rounded-2xl focus:border-[#58CC02] focus:outline-none transition-colors font-medium"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AFAFAF] w-5 h-5" />
        </form>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-[#4B4B4B]">
                  {userProfile?.displayName || user.displayName}
                </p>
                <p className="text-xs text-[#AFAFAF]">
                  {userProfile?.preferredJlptLevel || 'N4'}
                </p>
              </div>
              <button
                onClick={logOut}
                className="p-2 text-[#AFAFAF] hover:text-red-500 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full border-2 border-[#E5E5E5]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#F7F7F7] flex items-center justify-center border-2 border-[#E5E5E5]">
                  <User className="w-6 h-6 text-[#AFAFAF]" />
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5",
                "bg-[#58CC02] text-white font-bold rounded-2xl",
                "border-b-4 border-[#46A302] active:border-b-0 active:translate-y-1",
                "transition-all duration-75 uppercase tracking-wide text-sm"
              )}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
