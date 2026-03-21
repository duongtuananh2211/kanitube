# UI/UX Design Specification: KaniTube

## 1. Visual Identity & Theme
*   **Design Philosophy:** "Gamified Focus" - clean, energetic, and high-readability. Inspired by modern language learning apps like Duolingo.
*   **Color Palette (Light Mode Primary):**
    *   **Background:** `#FFFFFF` (Pure White).
    *   **Surface/Transcript:** `#F7F7F7` (Very Light Grey) for subtle depth.
    *   **Primary Accent (Action/Buttons):** `#58CC02` (Duolingo Green).
    *   **Secondary Accent (Hán-Việt):** `#1CB0F6` (Sky Blue) for linguistic markers.
    *   **Grammar Highlight:** `#FFB800` (Gold) for particles and important structures.
    *   **Text (High Contrast):** `#4B4B4B` (Dark Grey) for readability.
    *   **Text (Secondary):** `#AFAFAF` (Medium Grey).
*   **Typography:** 
    *   **Japanese/Vietnamese:** `Inter`, `Noto Sans JP`, sans-serif. Rounded fonts preferred to match the friendly aesthetic.
    *   **Weights:** Regular (400), Medium (600), Bold (800).

---

## 2. Page Layout (Main Study View)

### 2.1 Navigation Header (Sticky)
*   **Left:** Logo ("KaniTube") in Duolingo Green, bold rounded font.
*   **Center:** Search/URL input field. Thick border (`2px solid #E5E5E5`), rounded corners (`border-radius: 16px`).
*   **Right:** User Profile / Login button with a 3D-effect (border-bottom: 4px).

### 2.2 Main Grid (Split View)
*   **Left Column (60%):** Fixed video player with a subtle "card" shadow.
*   **Right Column (40%):** Interactive Transcript Sidebar on a `#F7F7F7` surface.
    *   **Active Line Highlighting:** Current line has a white background, a green left-border, and a subtle drop shadow.

---

## 3. Interactive Components

### 3.1 The "Tokenized" Transcript
*   **Sentence Rendering:** Clean, spacious line-height.
*   **Word Hover State:** Text turns Green (`#58CC02`) with a subtle underline.
*   **Word Active State (On Click):** A rounded popover with a 2px Green border.

### 3.2 The Deep-Dive Popover (The "Magic" Moment)
*   **Trigger:** User clicks a word in the transcript.
*   **UI Structure:**
    *   **Header:** Large Kanji + Furigana reading.
    *   **Hán-Việt Section:** Large, bold Hán-Việt text (e.g., **LIÊN LẠC**).
    *   **Metadata:** Badge showing Word Type (e.g., [Danh từ], [Động từ]).
    *   **Definition:** Clear Vietnamese meaning.
    *   **Actions:** 
        *   `[+] Add to SRS` (Icon button).
        *   `[?] Explain Grammar` (Primary button).

### 3.3 The "AI Insight" Panel (Drawer)
*   **Trigger:** Clicking "Explain Grammar".
*   **Behavior:** Slides in from the right or expands within the popover.
*   **Content:** Gemini 3.0 Flash Preview response formatted with Markdown (bold particles, bullet points for nuances).

---

## 4. User Experience (UX) Enhancements
*   **Temporal Sync:** When the video reaches `0:45`, the transcript line at `0:45` automatically scrolls into view and highlights.
*   **Temporal Jump:** Clicking any line in the transcript immediately jumps the YouTube video to that timestamp.
*   **Dual Mode Toggle:**
    1.  **Immerse Mode:** Clean text, no highlights.
    2.  **Study Mode:** Tokens visible, Hán-Việt markers subtly underlined.

---

## 5. Responsive Strategy
*   **Desktop (Main Focus):** Split 60/40.
*   **Tablet/Mobile:** Stacked layout (Video on top, Transcript below). Focus shifts to "Review Mode" for SRS on smaller screens.

---

## 6. Micro-Interactions
*   **Hovering a word:** Shows a small "Hán-Việt" tag above the Kanji.
*   **Saving a word:** A small "Success" toast notification or a "Gold Star" appearing on the word in the transcript.
