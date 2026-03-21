'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/firebase/auth';
import { LogIn, LogOut, User } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Header = () => {
  const { user, userProfile, signInWithGoogle, logOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b-2 border-[#E5E5E5] px-4 md:px-8 py-3 md:py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl md:text-3xl font-extrabold text-[#58CC02] tracking-tight font-sans">
              KaniTube
            </span>
          </Link>
        </div>

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
