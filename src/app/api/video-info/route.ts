import { NextRequest, NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: "YouTube API Key is not configured on the server" }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("YouTube API error response:", errorData);
      throw new Error(`YouTube API responded with status ${response.status}`);
    }

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return NextResponse.json({
        title: data.items[0].snippet.title,
        thumbnail: data.items[0].snippet.thumbnails.high.url,
        channelTitle: data.items[0].snippet.channelTitle
      });
    }

    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Video Info API Error:", error);
    return NextResponse.json({ 
      error: "Could not fetch video info", 
      details: error.message 
    }, { status: 500 });
  }
}
