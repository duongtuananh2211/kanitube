# Technical Design Document: KaniTube

## 1. Project Structure (Next.js + Firebase)

```text
/
├── src/
│   ├── components/       (Tailwind CSS)
│   │   ├── video/        (YouTube Player logic)
│   │   ├── transcript/   (Interactive text engine)
│   │   └── srs/          (Flashcard UI)
│   ├── firebase/         (Config, Auth, Firestore hooks)
│   ├── services/         (YouTube API, NLP logic, Gemini API)
│   ├── hooks/            (useTranscript, useSRS)
│   └── types/            (Shared TypeScript interfaces)
├── public/
│   └── data/             (Static Hán-Việt dictionary files)
└── functions/            (Firebase Cloud Functions for NLP/Gemini)
```

## 2. The Backend & Data Layer (Firebase)

- **Authentication:** Firebase Auth (Google Login).
- **Database:** Cloud Firestore (NoSQL).
  - `users/{uid}`: Profile and preferences.
  - `decks/{uid}/cards/{cardId}`: Mined words with SRS metadata (intervals, ease factor).
- **Storage:** Firebase Storage (optional, for custom assets).

## 3. The "Hán-Việt" Core Engine

- **Lookup Strategy:** The dictionary is loaded as a compressed JSON/Map in the application tier for instant lookup.
- **Mapping:**
  ```typescript
  interface KanjiMap {
    [kanji: string]: {
      hv: string; // Hán-Việt
      mean: string; // Vietnamese meaning
      level: number; // JLPT Level
    };
  }
  ```

## 4. Tokenization & POS Tagging Strategy

- **Engine:** `kuromoji.js` (Server-side via Next.js API Routes).
- **Output Data Structure (Token):**
  ```typescript
  interface WordToken {
    surface_form: string; // original word
    pos: string; // Part of speech (Nouns, Verbs, Particles)
    reading: string; // Katakana reading
    base_form: string; // Dictionary form
    han_viet?: string; // Hán-Việt reading (e.g., "Kinh Tế")
    definition_vn?: string; // Primary Vietnamese meaning
  }
  ```
- **Enrichment:** Tokens are matched against the Hán-Việt dictionary. For verbs, the base form is used for lookup to ensure high hit-rates.

## 5. Hán-Việt Dictionary Structure

- **Source:** Aggregated from open-source Kanji-Vietnamese mapping projects.
- **Data Model:**
  ```typescript
  interface KanjiDictionary {
    [kanji: string]: {
      hv: string; // Hán-Việt
      mean: string; // Vietnamese meaning
      pos_mapping?: string; // Standardized POS in Vietnamese
    };
  }
  ```

## 6. YouTube Integration & Caching Strategy

- **Player:** YouTube IFrame API (No quota cost).
- **Transcripts:** **YouTube Data API v3** with a **Firestore Cache Layer**.
- **Workflow:**
  1.  **Check Cache:** Query `transcripts/{videoId}` in Firestore.
  2.  **Fetch (Cache Miss):**
      - `captions.list` (1 unit) -> Find `trackId`.
      - `captions.download` (~200 units) -> Get XML transcript.
  3.  **Process:** Segment text using `kuromoji.js` and map to Hán-Việt.
  4.  **Save:** Store the fully segmented/mapped transcript back to Firestore for all future users.
- **Quota Optimization:** By caching, we only pay the ~201 unit "tax" **once per video**, regardless of how many thousands of users watch it.

## 7. AI Strategy (Gemini 3.0 Flash Preview)

- **Usage Pattern:** **Lazy/On-Demand.** Triggered only by user interaction ("Explain Grammar" button).
- **Global Grammar Cache:**
  1.  **Hashing:** Sentence text is hashed (SHA-256) to create a unique ID.
  2.  **Firestore Lookup:** Check `ai_explanations/{hash}` before calling the Gemini API.
  3.  **Cache Shared:** If User A triggers an explanation for a sentence in Video X, User B will get it for free if they encounter the same sentence in Video Y.
- **Prompt Engineering:**
  - **System Prompt:** "Expert Japanese-Vietnamese Linguist. Output JSON ONLY."
  - **Response Schema:** Detailed breakdown of grammar, particles, and Vietnamese cultural equivalents.
- **Cost Optimization:** The AI is never called for the whole transcript, only for user-selected "confusing" fragments.

## 8. Deployment

- **Hosting:** Vercel (Frontend/API) and Google Cloud/Firebase (Functions/DB).
- **CI/CD:** GitHub Actions for automated testing and deployment.
