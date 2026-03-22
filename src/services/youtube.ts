import { TranscriptData } from "@/types";

/**
 * THIS SERVICE RUNS ON THE CLIENT
 * It should only call API routes or Server Actions.
 */
export class YouTubeService {
  static async getTranscript(videoId: string): Promise<TranscriptData> {
    const response = await fetch(`/api/transcript?videoId=${videoId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch transcript from API");
    }
    return response.json();
  }

  static async getVideoTitle(videoId: string): Promise<string> {
    try {
      const response = await fetch(`/api/video-info?videoId=${videoId}`);
      if (!response.ok) return "Untitled Lesson";
      const data = await response.json();
      return data.title || "Untitled Lesson";
    } catch (error) {
      return "Untitled Lesson";
    }
  }

  static async saveUserVideo(userId: string, videoId: string): Promise<void> {
    // We will call an API or Server Action here instead of direct DB access
    await fetch('/api/user-videos', {
      method: 'POST',
      body: JSON.stringify({ userId, videoId })
    });
  }

  static extractVideoId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  }
}
