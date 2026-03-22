import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import crypto from "crypto";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { query, type = "word" } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }

    // 1. Check Cache First
    const hash = crypto
      .createHash("sha256")
      .update(`${type}:${query}`)
      .digest("hex");
    const cacheRef = doc(db, "dictionary_cache", hash);

    const cachedDoc = await getDoc(cacheRef);
    if (cachedDoc.exists()) {
      return NextResponse.json({
        success: true,
        data: cachedDoc.data().dictionaryData,
        cached: true,
      });
    }

    // 2. Cache Miss: Call Gemini (following tokenize API pattern)
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 },
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
      Bạn là một từ điển Nhật-Việt chuyên nghiệp và chính xác.
      Hãy phân tích ${type === "kanji" ? "chữ Kanji" : "từ/cụm từ"} tiếng Nhật sau: "${query}"
      
      Yêu cầu trả về kết quả dưới dạng JSON chính xác theo cấu trúc:
      {
        "word": "từ gốc/chữ kanji",
        "phonetic": "cách đọc hiragana/katakana cho từ hoặc onyomi/kunyomi cho kanji",
        "pos": "loại từ (danh từ, động từ, tính từ, kanji, v.v.). Nếu có nhiều loại, liệt kê cách nhau bằng dấu phẩy",
        "hanviet": "âm Hán-Việt (nếu có, không có thì để null)",
        "kanji_breakdown": [
          {
            "kanji": "chữ kanji đơn lẻ",
            "hanviet": "âm Hán-Việt của chữ đó",
            "meaning": "nghĩa của chữ đó",
            "onyomi": "âm On của chữ đó",
            "kunyomi": "âm Kun của chữ đó"
          }
        ],
        "meanings": [
          {
            "mean": "nghĩa tiếng Việt chính xác nhất",
            "kind": "loại từ cụ thể cho nghĩa này",
            "examples": [
              {
                "content": "câu ví dụ tiếng Nhật",
                "mean": "nghĩa tiếng Việt của câu ví dụ",
                "transcription": "cách đọc câu ví dụ"
              }
            ]
          }
        ]
      }
      
      Lưu ý:
      - kanji_breakdown: Nếu từ có nhiều chữ Kanji, hãy liệt kê từng chữ. Nếu là 1 chữ Kanji, liệt kê chính nó. Nếu từ không có Kanji, trả về mảng rỗng [].
      - Trả về kết quả dưới dạng mảng JSON hoặc đối tượng JSON.
      - KHÔNG THÊM bất kỳ lời giải thích nào khác, CHỈ TRẢ VỀ JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text().trim();

    // Clean up potential markdown formatting (following tokenize API pattern)
    const cleanJson = aiText.replace(/```json|```/g, "");

    let dictionaryData;
    try {
      dictionaryData = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", aiText);
      throw new Error("Invalid dictionary data generated");
    }

    // 3. Save to Cache
    await setDoc(cacheRef, {
      query,
      type,
      dictionaryData,
      createdAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      data: dictionaryData,
      cached: false,
    });
  } catch (error: any) {
    console.error("AI Dictionary Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
