import { NextRequest, NextResponse } from "next/server";
import kuromoji from "kuromoji";
import path from "path";
import fs from "fs";
import { WordToken } from "@/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Cache the tokenizer promise to prevent parallel builds
let tokenizerPromise: Promise<any> | null = null;
let hanVietDict: any = null;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const getTokenizer = (): Promise<any> => {
  if (tokenizerPromise) return tokenizerPromise;

  tokenizerPromise = new Promise((resolve, reject) => {
    // Standard kuromoji dictionaries in node_modules
    const dictPath = path.join(
      process.cwd(),
      "node_modules",
      "kuromoji",
      "dict",
    );

    console.log("[Tokenize API] Starting tokenizer build with path:", dictPath);
    const startTime = Date.now();

    kuromoji.builder({ dicPath: dictPath }).build((err, _tokenizer) => {
      if (err) {
        console.error("[Tokenize API] Kuromoji build failed:", err);
        tokenizerPromise = null; // Reset promise so we can retry
        reject(err);
        return;
      }
      console.log(
        `[Tokenize API] Tokenizer built successfully in ${Date.now() - startTime}ms`,
      );
      resolve(_tokenizer);
    });
  });

  return tokenizerPromise;
};

const getHanVietDict = () => {
  if (hanVietDict) return hanVietDict;
  const dictPath = path.resolve("public/data/han_viet.json");
  const data = fs.readFileSync(dictPath, "utf-8");
  hanVietDict = JSON.parse(data);
  return hanVietDict;
};

export async function POST(request: NextRequest) {
  try {
    const { text, texts } = await request.json();

    if (!text && !texts) {
      return NextResponse.json(
        { error: "No text or texts provided" },
        { status: 400 },
      );
    }

    const _tokenizer = await getTokenizer();
    const _dict = getHanVietDict();

    // Helper to process a single string
    const processText = (input: string): WordToken[] => {
      const tokens = _tokenizer.tokenize(input);
      return tokens.map((t: any) => {
        const surface = t.surface_form;
        const base = t.basic_form === "*" ? surface : t.basic_form;
        const lookup = _dict[surface] || _dict[base];

        return {
          surface_form: surface,
          pos: t.pos,
          reading: t.reading,
          base_form: base,
          han_viet: lookup?.hv,
          definition_vn: lookup?.mean,
        };
      });
    };

    if (texts && Array.isArray(texts)) {
      console.log(`[Tokenize API] Batch processing ${texts.length} lines`);

      // 1. Tokenize everything first (Fast)
      const tokenResults = texts.map((t) => processText(t));

      // 2. Batch Translate with Gemini (AI)
      let translations: string[] = Array(texts.length).fill("");

      if (process.env.GEMINI_API_KEY) {
        try {
          const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
          });
          const prompt = `
            Bạn là một dịch giả chuyên nghiệp Nhật-Việt. 
            Hãy dịch danh sách các câu tiếng Nhật sau đây sang tiếng Việt một cách tự nhiên, trôi chảy nhất.
            
            Yêu cầu:
            1. Trả về kết quả dưới dạng một mảng JSON các chuỗi (string array).
            2. Mỗi chuỗi là bản dịch tương ứng của từng câu trong danh sách đầu vào.
            3. KHÔNG THÊM bất kỳ lời giải thích nào khác, CHỈ TRẢ VỀ JSON.
            
            Danh sách câu:
            ${JSON.stringify(texts)}
          `;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const aiText = response.text().trim();

          // Clean up potential markdown formatting in AI response
          const cleanJson = aiText.replace(/```json|```/g, "");
          const parsedTranslations = JSON.parse(cleanJson);

          if (Array.isArray(parsedTranslations)) {
            translations = parsedTranslations;
          }
        } catch (err) {
          console.error("[Tokenize API] Gemini Translation Failed:", err);
          // Fallback: translations stay as empty strings
        }
      }

      const finalResults = tokenResults.map((tokens, idx) => ({
        tokens,
        translation_vn: translations[idx] || "",
      }));

      return NextResponse.json({ batchResults: finalResults });
    }

    const enrichedTokens = processText(text);
    return NextResponse.json({ tokens: enrichedTokens });
  } catch (error: any) {
    console.error("Tokenization error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
