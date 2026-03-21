# Product Requirements Document: KaniTube (YouTube Immersion for Vietnamese)

**Project Owner:** Anh (Founder)  
**Role:** CTO Advisor (Gemini CLI)  
**Status:** Draft / Discovery Phase  
**Target Market:** Vietnamese Japanese Learners (N4 to N1)

---

## 1. Executive Summary

KaniTube is an "Immersion + Mining" web application designed for the Vietnamese market. It transforms native Japanese YouTube content into interactive lessons by providing synchronized transcripts, word tokenization with Hán-Việt (Sino-Vietnamese) integration, AI-powered grammar analysis, and an integrated SRS (Spaced Repetition System).

---

## 2. Functional Requirements (MVP)

### FR-01: Authentication & User Profiles

- **Description:** Secure access to user-specific study data.
- **Requirement:** Social Login (Google) via **Firebase Auth**.
- **Requirement:** Persist user settings (preferred JLPT level, UI theme).

### FR-02: YouTube Sync-Engine

- **Description:** High-precision playback and transcript synchronization.
- **Requirement:** Fetch transcripts using **YouTube Data API v3**.
- **Requirement:** Real-time highlighting of the transcript based on `currentTime`.
- **Requirement:** Temporal Jump: Clicking a word/line jumps the video to that exact timestamp.

### FR-03: Instant Word Deep-Dive (USP)

- **Description:** Multi-layered information panel triggered by clicking a Japanese word.
- **Requirement:** Segment sentences using `kuromoji.js` with **POS (Part of Speech) tagging**.
- **Display Data:**
  - **Hán-Việt reading** (e.g., "Liên Lạc").
  - **Word Type** (e.g., Danh từ, Động từ nhóm 1, Trợ từ).
  - **Vietnamese Meaning** (Primary definition).
  - **Grammar Context:** A "Why this form?" section (e.g., explaining why "た" is used instead of "る").

### FR-04: AI-Powered Sentence Analysis

- **Description:** Contextual grammar explanation for the entire sentence.
- **Requirement:** Trigger a **Gemini 3.0 Flash Preview** call that analyzes the sentence structure relative to the clicked word.
- **Output:** Breakdown of particles (は, が, を), sentence endings, and politeness levels (Desu/Masu vs. Plain) in Vietnamese.

### FR-05: One-Click Word Mining & SRS

- **Description:** Efficient vocabulary retention loop.
- **Requirement:** Save words from the transcript directly to a personal deck in Firestore.
- **Requirement:** Basic SRS review mode (recognition/recall).

---

## 3. Technical Architecture (CTO Approved)

### 3.1 Stack Overview

- **Frontend:** Next.js (TypeScript) + Vanilla CSS Modules.
- **Auth/DB:** Firebase (Authentication + Cloud Firestore).
- **NLP:** Kuromoji.js (Tokenization) + Static Hán-Việt Dictionary.
- **AI:** Gemini 3.0 Flash Preview (Grammar Breakdown).

---

## 4. User Flow

1.  **Paste URL:** User pastes a YouTube link.
2.  **Load:** App fetches the video and the transcript via API.
3.  **Study:** User watches the video; transcript auto-scrolls and highlights.
4.  **Interact:** User clicks a word to see its Hán-Việt reading.
5.  **Mine:** User clicks "+" to save a difficult word to their SRS deck.

---

## 5. Success Metrics

- **Utility:** Average number of Hán-Việt lookups per session.
- **Retention:** Number of SRS cards reviewed daily per user.
- **Performance:** Speed of transcript loading and tokenization (< 2 seconds).
