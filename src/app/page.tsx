'use client';

import React, { useEffect, useState } from 'react';
import { Header } from "@/components/Header";
import { useAuth } from "@/firebase/auth";
import { Sparkles, Brain, BookOpen, Layers, Play, Clock, Youtube } from "lucide-react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import { UserVideo } from "@/types";
import Link from 'next/link';
import { YouTubeService } from "@/services/youtube";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  const [recentVideos, setRecentVideos] = useState<UserVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setRecentVideos([]);
      setVideosLoading(false);
      return;
    }

    const videosRef = collection(db, 'users', user.uid, 'videos');
    const q = query(videosRef, orderBy('addedAt', 'desc'), limit(10));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const videos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserVideo[];
      setRecentVideos(videos);
      setVideosLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setVideosLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <main className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Header />

      <div className="flex-1 max-w-7xl mx-auto px-4 md:px-8 py-12 w-full">
        {!user ? (
          <>
            {/* ... rest of code same ... */}

            <section className="text-center space-y-8 mb-16 py-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-full text-sm font-bold text-[#AFAFAF] uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#FFB800]" />
                Immersion + Mining
              </div>
              
              <h1 className="text-5xl md:text-6xl font-extrabold text-[#4B4B4B] tracking-tight max-w-4xl mx-auto leading-tight">
                Learn Japanese with <span className="text-[#58CC02]">Hán-Việt</span> precision.
              </h1>
              
              <p className="text-xl text-[#AFAFAF] max-w-2xl mx-auto font-medium">
                Transform native Japanese YouTube content into interactive lessons with real-time tokenization, AI grammar analysis, and SRS.
              </p>

              <div className="pt-8">
                <button 
                  className="px-8 py-4 bg-[#58CC02] text-white font-extrabold text-lg rounded-2xl border-b-8 border-[#46A302] hover:border-b-4 hover:translate-y-1 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-wider"
                  onClick={signInWithGoogle}
                >
                  Start Learning Now
                </button>
              </div>
            </section>

            <div className="grid md:grid-cols-3 gap-8 pt-12 border-t-2 border-[#E5E5E5]">
              <FeatureCard 
                icon={<Layers className="w-8 h-8 text-[#1CB0F6]" />}
                title="Hán-Việt Integration"
                description="Deep-dive into Kanji with instant Sino-Vietnamese readings and meanings."
              />
              <FeatureCard 
                icon={<Brain className="w-8 h-8 text-[#FFB800]" />}
                title="AI Grammar Analysis"
                description="Understand complex sentence structures with Gemini-powered contextual explanations."
              />
              <FeatureCard 
                icon={<BookOpen className="w-8 h-8 text-[#58CC02]" />}
                title="One-Click Mining"
                description="Save new vocabulary directly to your personal SRS deck for long-term retention."
              />
            </div>
          </>
        ) : (
          <>
            {/* New Lesson Hero for Mobile/Quick Start */}
            <section className="mb-12 bg-[#E5FFD1] border-4 border-[#58CC02] rounded-[2rem] p-6 md:p-10 text-center shadow-[0_8px_0_0_#46A302]">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#4B4B4B] mb-4">
                Ready for your next immersion?
              </h2>
              <p className="text-[#58CC02] font-bold mb-8 md:text-lg">
                Paste a YouTube URL below to generate interactive Hán-Việt subtitles.
              </p>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const url = formData.get('url') as string;
                  const videoId = YouTubeService.extractVideoId(url);
                  
                  if (videoId) {
                    if (user) {
                      await YouTubeService.saveUserVideo(user.uid, videoId);
                    }
                    router.push(`/watch/${videoId}`);
                  }
                }}
                className="max-w-2xl mx-auto flex flex-col md:flex-row gap-4"
              >
                <input 
                  name="url"
                  type="text" 
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 px-6 py-4 bg-white border-2 border-[#E5E5E5] rounded-2xl focus:border-[#58CC02] focus:outline-none font-bold text-[#4B4B4B] shadow-inner"
                  required
                />
                <button 
                  type="submit"
                  className="px-8 py-4 bg-[#58CC02] text-white font-extrabold rounded-2xl border-b-4 border-[#46A302] active:border-b-0 active:translate-y-1 transition-all uppercase tracking-wider whitespace-nowrap"
                >
                  Start Lesson
                </button>
              </form>
            </section>

            <section className="mb-16">
              <h2 className="text-2xl font-extrabold text-[#4B4B4B] mb-8 flex items-center gap-3">
                <Clock className="w-6 h-6 text-[#1CB0F6]" />
                Your Recent Lessons
              </h2>
              
              {videosLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 bg-[#F7F7F7] rounded-3xl border-2 border-[#E5E5E5]" />
                  ))}
                </div>
              ) : recentVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentVideos.map((video) => (
                    <Link 
                      key={video.id} 
                      href={`/watch/${video.videoId}`}
                      className="group bg-white border-2 border-[#E5E5E5] rounded-3xl overflow-hidden hover:border-[#58CC02] transition-all hover:shadow-lg"
                    >
                      <div className="aspect-video bg-black relative flex items-center justify-center">
                        <img 
                          src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`} 
                          alt="Thumbnail"
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 bg-[#58CC02] rounded-full flex items-center justify-center shadow-xl">
                            <Play className="w-6 h-6 text-white fill-current" />
                          </div>
                        </div>
                        <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 rounded-lg flex items-center gap-1.5 text-[10px] font-bold text-white uppercase tracking-wider">
                          <Youtube className="w-3 h-3 text-red-500" />
                          {video.source}
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-bold text-[#4B4B4B] truncate">
                          {video.title || "Untitled Lesson"}
                        </p>
                        <p className="text-xs text-[#AFAFAF] mt-1 font-medium">
                          Added {new Date(video.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-[#F7F7F7] rounded-3xl border-2 border-dashed border-[#E5E5E5]">
                  <p className="text-[#AFAFAF] font-bold">No lessons added yet. Paste a URL above to start!</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
      
      {!user && (
        <footer className="py-8 text-center border-t-2 border-[#E5E5E5] text-[#AFAFAF] text-sm font-bold uppercase tracking-widest">
          KaniTube © 2026 • Made for Vietnamese Japanese Learners
        </footer>
      )}
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 bg-white border-2 border-[#E5E5E5] rounded-3xl hover:border-[#58CC02] transition-colors group">
      <div className="mb-4 p-3 bg-[#F7F7F7] w-fit rounded-2xl group-hover:bg-[#E5FFD1] transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-extrabold text-[#4B4B4B] mb-2">{title}</h3>
      <p className="text-[#AFAFAF] font-medium leading-relaxed">{description}</p>
    </div>
  );
}
