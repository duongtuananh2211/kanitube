import { db } from "@/firebase/config";
import { TranscriptData, TranscriptLine } from "@/types";
import { doc, getDoc, setDoc } from "firebase/firestore";

export class YouTubeService {
  /**
   * Fetches transcript for a video, either from cache or YouTube API
   */
  static async getTranscript(videoId: string): Promise<TranscriptData> {
    // 1. Check Cache
    const cached = await this.getFromCache(videoId);
    if (cached) return cached;

    // 2. Fetch (Cache Miss)
    const transcript = await this.fetchFromYouTube(videoId);
    
    // 3. Save to Cache
    await this.saveToCache(videoId, transcript);
    
    return transcript;
  }

  private static async getFromCache(videoId: string): Promise<TranscriptData | null> {
    try {
      const docRef = doc(db, 'transcripts', videoId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as TranscriptData;
      }
    } catch (error) {
      console.error("Cache read error:", error);
    }
    return null;
  }

  static async saveToCache(videoId: string, data: TranscriptData) {
    try {
      const docRef = doc(db, 'transcripts', videoId);
      await setDoc(docRef, data);
    } catch (error) {
      console.error("Cache write error:", error);
    }
  }

  private static async fetchFromYouTube(videoId: string): Promise<TranscriptData> {
    // Note: In a production app, we would use captions.list and captions.download.
    // However, captions.download requires OAuth2 and higher quota.
    // For MVP, we can use a server-side proxy or an alternative scraper approach if allowed.
    // Since we are building the architecture, let's assume a function that gets the XML.
    
    // Simplified logic for MVP: Fetch the caption track list
    // This is a placeholder for the actual caption download logic which usually requires
    // a backend helper due to CORS and OAuth.
    
    // For now, let's return a Mock/Skeleton that we'll implement via an API Route in Next.js
    const response = await fetch(`/api/transcript?videoId=${videoId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch transcript from API");
    }
    return response.json();
  }

  static async getVideoTitle(videoId: string): Promise<string> {
    try {
      console.log(`[YouTubeService] Fetching title for ${videoId}...`);
      const response = await fetch(`/api/video-info?videoId=${videoId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[YouTubeService] API error (${response.status}):`, errorData);
        return "Untitled Lesson";
      }

      const data = await response.json();
      if (data && data.title) {
        return data.title;
      }
    } catch (error) {
      console.error("[YouTubeService] Network or unexpected error:", error);
    }
    
    return "Untitled Lesson";
  }

  static async saveUserVideo(userId: string, videoId: string): Promise<void> {
    try {
      const title = await this.getVideoTitle(videoId);
      const videoData = {
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title,
        source: 'youtube',
        addedAt: Date.now()
      };
      
      const docRef = doc(db, 'users', userId, 'videos', videoId);
      await setDoc(docRef, videoData, { merge: true });
      console.log(`[YouTubeService] Saved video ${videoId} for user ${userId}`);
    } catch (error) {
      console.error("[YouTubeService] Error saving user video:", error);
    }
  }

  static extractVideoId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  }
}

