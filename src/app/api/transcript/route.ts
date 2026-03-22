import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { TranscriptData, TranscriptLine } from "@/types";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchVideoTitle } from "@/lib/youtube-utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  try {
    // 1. Check Cache (Supabase)
    const cached = await db.select().from(videos).where(eq(videos.id, videoId)).limit(1);
    
    // Only return cache if it's NOT a skeleton (has lines)
    if (cached.length > 0) {
      const data = cached[0].transcript as TranscriptData;
      if (data && data.lines && data.lines.length > 0) {
        console.log(`[API transcript] Serving from cache: ${videoId}`);
        return NextResponse.json(data);
      }
    }

    console.log(`[API transcript] Cache miss or skeleton. Fetching from YouTube: ${videoId}`);

    // 2. Fetch transcript from YouTube
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'ja'
    });

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: "No Japanese transcript found" }, { status: 404 });
    }

    // 3. Format to TranscriptData
    const formattedLines: TranscriptLine[] = transcript.map(item => ({
      text: item.text,
      start: item.offset / 1000, 
      duration: item.duration / 1000,
    }));

    const transcriptData: TranscriptData = {
      videoId,
      lines: formattedLines,
      isFullySegmented: false,
    };

    // 4. Save to Cache (Update the skeleton with real data)
    const videoTitle = await fetchVideoTitle(videoId);
    await db.insert(videos).values({
      id: videoId,
      transcript: transcriptData,
      isFullySegmented: false,
      title: videoTitle, 
    }).onConflictDoUpdate({
      target: videos.id,
      set: { 
        transcript: transcriptData,
        title: videoTitle
      }
    });

    return NextResponse.json(transcriptData);
  } catch (error: any) {
    console.error("Transcript API Error:", error);
    return NextResponse.json({ 
      error: "Could not fetch transcript", 
      details: error.message 
    }, { status: 500 });
  }
}
