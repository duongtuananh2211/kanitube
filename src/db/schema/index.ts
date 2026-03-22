import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  doublePrecision,
  uniqueIndex,
  boolean,
} from 'drizzle-orm/pg-core';

// 1. GLOBAL DICTIONARY (Source of Truth)
export const words = pgTable('words', {
  id: uuid('id').defaultRandom().primaryKey(),
  surface: text('surface').notNull(),
  reading: text('reading').notNull(),
  baseForm: text('base_form').notNull(),
  hanViet: text('han_viet'),
  jlptLevel: integer('jlpt_level'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  surfaceReadingIdx: uniqueIndex('surface_reading_idx').on(table.surface, table.reading),
}));

// 2. DICTIONARY DEFINITIONS (Cached Gemini results)
export const wordDefinitions = pgTable('word_definitions', {
  wordId: uuid('word_id').references(() => words.id).primaryKey(),
  data: jsonb('data').notNull(), // Full DictionaryData structure
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. USER FLASHCARDS (Link between user and word)
export const flashcards = pgTable('flashcards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(), // Changed from uuid to text for Firebase Auth compatibility
  wordId: uuid('word_id').references(() => words.id).notNull(),
  
  // SRS Metadata (SM-2 Algorithm)
  nextReview: timestamp('next_review').defaultNow().notNull(),
  interval: integer('interval').default(0).notNull(),
  easeFactor: doublePrecision('ease_factor').default(2.5).notNull(),
  repetitions: integer('repetitions').default(0).notNull(),
  
  status: text('status', { enum: ['learning', 'reviewing', 'mastered'] }).default('learning').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userWordIdx: uniqueIndex('user_word_idx').on(table.userId, table.wordId),
}));

// 4. VIDEO TRANSCRIPTS
export const videos = pgTable('videos', {
  id: text('id').primaryKey(), // YouTube Video ID
  title: text('title'),
  transcript: jsonb('transcript').notNull(), // Full TranscriptData structure
  isFullySegmented: boolean('is_fully_segmented').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. USER SAVED VIDEOS (To track which videos a user is studying)
export const userVideos = pgTable('user_videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(), // Changed from uuid to text
  videoId: text('video_id').references(() => videos.id).notNull(),
  addedAt: timestamp('added_at').defaultNow().notNull(),
}, (table) => ({
  userVideoIdx: uniqueIndex('user_video_idx').on(table.userId, table.videoId),
}));
