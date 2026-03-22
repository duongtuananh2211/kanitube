export async function fetchVideoTitle(videoId: string): Promise<string> {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) {
    console.error("YOUTUBE_API_KEY is not defined in environment variables!");
    return "Untitled Lesson";
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) {
      console.error("YouTube API error fetching title:", response.status);
      return "Untitled Lesson";
    }

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return data.items[0].snippet.title;
    }
  } catch (error) {
    console.error("Error fetching video title:", error);
  }
  
  return "Untitled Lesson";
}
