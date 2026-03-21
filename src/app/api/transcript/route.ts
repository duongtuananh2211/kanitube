import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { TranscriptData, TranscriptLine } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  try {
    // 1. Fetch transcript from YouTube
    // We try to find Japanese transcripts first
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'ja'
    });

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: "No Japanese transcript found" }, { status: 404 });
    }

    // 2. Format to TranscriptData
    const formattedLines: TranscriptLine[] = transcript.map(item => ({
      text: item.text,
      start: item.offset / 1000, // Convert to seconds
      duration: item.duration / 1000,
    }));

    const transcriptData: TranscriptData = {
      videoId,
      lines: formattedLines,
      isFullySegmented: false, // We'll segment this in Phase 3
    };

    return NextResponse.json(transcriptData);
  } catch (error: any) {
    console.error("Transcript API Error:", error);
    return NextResponse.json({ 
      error: "Could not fetch transcript", 
      details: error.message 
    }, { status: 500 });
  }
}
