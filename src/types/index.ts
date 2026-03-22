export interface WordToken {
  surface_form: string;    // original word
  pos: string;             // Part of speech (Nouns, Verbs, Particles)
  reading: string;         // Katakana reading
  base_form: string;       // Dictionary form
  han_viet?: string;       // Hán-Việt reading (e.g., "Kinh Tế")
  definition_vn?: string;  // Primary Vietnamese meaning
}

export interface KanjiMap {
  [kanji: string]: {
    hv: string;      // Hán-Việt
    mean: string;    // Vietnamese meaning
    level?: number;   // JLPT Level
  }
}

export interface KanjiDictionary {
  [kanji: string]: {
    hv: string;          // Hán-Việt
    mean: string;        // Vietnamese meaning
    pos_mapping?: string; // Standardized POS in Vietnamese
  }
}

export interface TranscriptLine {
  text: string;
  start: number;
  duration: number;
  tokens?: WordToken[];
  translation_vn?: string;
}

export interface TranscriptData {
  videoId: string;
  lines: TranscriptLine[];
  isFullySegmented: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  preferredJlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  uiTheme: 'light' | 'dark';
}

export interface UserVideo {
  id: string;
  videoId: string;
  url: string;
  title?: string;
  source: 'youtube' | 'other';
  addedAt: number;
}

export interface SRSCard {
  id: string;
  kanji: string;
  reading: string;
  meaning: string;
  hanViet: string;
  nextReview: number; // timestamp
  interval: number;
  easeFactor: number;
  repetitions: number;
}

export interface DictionaryExample {
  content: string;
  mean: string;
  transcription: string;
}

export interface DictionaryMeaning {
  mean: string;
  kind: string;
  examples: DictionaryExample[];
}

export interface KanjiBreakdown {
  kanji: string;
  hanviet: string;
  meaning: string;
  onyomi: string;
  kunyomi: string;
}

export interface DictionaryData {
  word: string;
  phonetic: string;
  pos: string;
  hanviet: string | null;
  kanji_breakdown?: KanjiBreakdown[];
  meanings: DictionaryMeaning[];
}

export interface DictionaryCache {
  query: string;
  type: "word" | "kanji";
  dictionaryData: DictionaryData;
  createdAt: number;
}
