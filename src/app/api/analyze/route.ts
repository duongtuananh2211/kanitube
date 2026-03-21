import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import crypto from "crypto";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { sentence, word, context } = await request.json();
    if (!sentence) return NextResponse.json({ error: "No sentence provided" }, { status: 400 });

    // 1. Create a unique hash for the sentence to use as a cache key
    const hash = crypto.createHash('sha256').update(sentence).digest('hex');
    const cacheRef = doc(db, 'ai_explanations', hash);
    
    // 2. Check Cache
    const cachedDoc = await getDoc(cacheRef);
    if (cachedDoc.exists()) {
      return NextResponse.json({ explanation: cachedDoc.data().explanation });
    }

    // 3. Cache Miss: Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
      Bạn là một chuyên gia ngôn ngữ học Tiếng Nhật và Tiếng Việt.
      Hãy phân tích ngữ pháp của câu tiếng Nhật sau đây, tập trung vào từ "${word || 'này'}":
      
      Câu: "${sentence}"
      
      Yêu cầu:
      1. Giải thích cấu trúc ngữ pháp của cả câu bằng tiếng Việt.
      2. Phân tích các trợ từ (particles) như は, が, を, に, v.v.
      3. Giải thích tại sao từ "${word}" lại được chia ở thể này (nếu là động từ/tính từ).
      4. Đưa ra các ví dụ tương đương hoặc lưu ý về độ lịch sự (Desu/Masu vs Plain).
      
      Định dạng phản hồi: Markdown gọn gàng, dễ đọc, sử dụng emoji để làm nổi bật các phần.
      CHỈ TRẢ VỀ NỘI DUNG GIẢI THÍCH, KHÔNG CHÀO HỎI.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 4. Save to Cache
    await setDoc(cacheRef, {
      sentence,
      explanation: text,
      createdAt: Date.now()
    });

    return NextResponse.json({ explanation: text });
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
