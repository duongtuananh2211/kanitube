import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { videoId, transcript } = await request.json();

    if (!videoId || !transcript) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await db.insert(videos).values({
      id: videoId,
      transcript,
      isFullySegmented: transcript.isFullySegmented,
      title: "Updated Video"
    }).onConflictDoUpdate({
      target: videos.id,
      set: { 
        transcript,
        isFullySegmented: transcript.isFullySegmented
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API transcript-save POST error:", error);
    return NextResponse.json({ error: "Failed to save transcript" }, { status: 500 });
  }
}
