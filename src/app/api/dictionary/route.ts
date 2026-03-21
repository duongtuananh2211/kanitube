import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query, dict = "javi", type = "word" } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }

    // Use the base mazii.net domain which seems more stable for this unofficial endpoint
    const response = await fetch("https://mazii.net/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        dict,
        type,
        query,
        page: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mazii API failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Mazii response structure: { status: 200, found: true, data: [...] }
    if (data.status === 200 && data.data && data.data.length > 0) {
      const result = data.data[0];
      return NextResponse.json({
        success: true,
        data: {
          word: result.word,
          phonetic: result.phonetic,
          meanings: result.means?.map((m: any) => ({
            mean: m.mean,
            kind: m.kind,
            examples: m.examples?.map((e: any) => ({
              content: e.content,
              mean: e.mean,
              transcription: e.transcription
            }))
          })) || [],
        }
      });
    }

    // Try kanji search if word search failed (to get Hán-Việt)
    if (type === "word" && (!data.data || data.data.length === 0)) {
        const kanjiResponse = await fetch("https://mazii.net/api/search", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
            body: JSON.stringify({ dict: "javi", type: "kanji", query, page: 1 }),
        });
        const kanjiData = await kanjiResponse.json();
        if (kanjiData.status === 200 && kanjiData.data && kanjiData.data.length > 0) {
            const k = kanjiData.data[0];
            return NextResponse.json({
                success: true,
                data: {
                    word: k.kanji,
                    phonetic: k.kunyomi || k.onyomi,
                    meanings: [{ mean: k.mean, kind: "kanji" }],
                    hanviet: k.hanviet
                }
            });
        }
    }

    return NextResponse.json({ success: false, message: "No results found" });
  } catch (error: any) {
    console.error("Dictionary Proxy Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
