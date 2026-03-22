import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userVideos, videos } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { fetchVideoTitle } from "@/lib/youtube-utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    console.log(`[API user-videos] Fetching for userId: ${userId}`);
    
    // Test DB connection
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not defined in environment variables");
    }

    const results = await db
      .select({
        id: userVideos.id,
        videoId: userVideos.videoId,
        addedAt: userVideos.addedAt,
        title: videos.title,
      })
      .from(userVideos)
      .leftJoin(videos, eq(userVideos.videoId, videos.id))
      .where(eq(userVideos.userId, userId))
      .orderBy(desc(userVideos.addedAt))
      .limit(10);

    const formatted = results.map(r => ({
      id: r.id,
      videoId: r.videoId,
      title: r.title || "Untitled Lesson",
      addedAt: r.addedAt ? r.addedAt.getTime() : Date.now(),
      source: 'youtube' as const
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("API user-videos GET error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch videos", 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, videoId } = await request.json();

    if (!userId || !videoId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`[API user-videos] Saving video ${videoId} for user ${userId}`);

    // Check if video exists in global videos table
    const videoExists = await db.select().from(videos).where(eq(videos.id, videoId)).limit(1);
    
    if (videoExists.length === 0) {
      const videoTitle = await fetchVideoTitle(videoId);
      await db.insert(videos).values({
        id: videoId,
        title: videoTitle,
        transcript: { videoId, lines: [], isFullySegmented: false },
      }).onConflictDoNothing();
    }

    await db.insert(userVideos).values({
      userId,
      videoId,
    }).onConflictDoNothing();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API user-videos POST error:", error);
    return NextResponse.json({ 
      error: "Failed to save video", 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
