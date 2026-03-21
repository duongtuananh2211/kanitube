"use client";

import React, { useEffect, useRef, useState } from "react";
import { TranscriptData, TranscriptLine, WordToken, SRSCard } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Plus, HelpCircle, X, Sparkles, Check, Bookmark } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { db } from "@/firebase/config";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/firebase/auth";
import * as wanakana from "wanakana";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TranscriptSidebarProps {
  transcript: TranscriptData | null;
  currentLineIndex: number;
  loading: boolean;
  error: string | null;
  onLineClick: (time: number) => void;
}

export const TranscriptSidebar: React.FC<TranscriptSidebarProps> = ({
  transcript,
  currentLineIndex,
  loading,
  error,
  onLineClick,
}) => {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLSpanElement>(null);
  const [selectedWord, setSelectedWord] = useState<{
    token: WordToken;
    rect: DOMRect;
    sentence: string;
  } | null>(null);
  const [selectedSentenceForAI, setSelectedSentenceForAI] = useState<{
    text: string;
    translation: string;
  } | null>(null);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number>(-1);

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [sentenceExplanation, setSentenceExplanation] = useState<string | null>(
    null,
  );
  const [isAnalyzingSentence, setIsAnalyzingSentence] = useState(false);

  // Dictionary State
  const [isFetchingDictionary, setIsFetchingDictionary] = useState(false);
  const [dictionaryResult, setDictionaryResult] = useState<any>(null);

  // Mining State
  const [isMining, setIsMining] = useState(false);
  const [minedSuccess, setMinedSuccess] = useState(false);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current && scrollRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentLineIndex]);

  const fetchDictionaryData = async (word: string) => {
    setIsFetchingDictionary(true);
    setDictionaryResult(null);
    try {
      const response = await fetch("/api/dictionary", {
        method: "POST",
        body: JSON.stringify({ query: word }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.success) {
        setDictionaryResult(data.data);
      }
    } catch (err) {
      console.error("Dictionary fetch failed:", err);
    } finally {
      setIsFetchingDictionary(false);
    }
  };

  const handleWordClick = (
    e: React.MouseEvent,
    token: WordToken,
    sentence: string,
    lineIdx: number,
    lineStart: number,
  ) => {
    e.stopPropagation();
    const isActuallySelected =
      lineIdx === selectedLineIndex ||
      (lineIdx === currentLineIndex && selectedLineIndex === -1);

    if (isActuallySelected) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setSelectedWord({ token, rect, sentence });
      setExplanation(null);
      setMinedSuccess(false);
      fetchDictionaryData(token.surface_form);
    } else {
      setSelectedLineIndex(lineIdx);
      onLineClick(lineStart);
    }
  };

  const handleSentenceClick = (
    e: React.MouseEvent,
    line: TranscriptLine,
    lineIdx: number,
  ) => {
    e.stopPropagation();
    const isActuallySelected =
      lineIdx === selectedLineIndex ||
      (lineIdx === currentLineIndex && selectedLineIndex === -1);

    if (isActuallySelected) {
      setSelectedSentenceForAI({
        text: line.text,
        translation: line.translation_vn || "",
      });
      setSentenceExplanation(null);
      handleExplainSentence(line.text);
    } else {
      setSelectedLineIndex(lineIdx);
      onLineClick(line.start);
    }
  };

  const handleExplainSentence = async (text: string) => {
    setIsAnalyzingSentence(true);
    setSentenceExplanation(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ sentence: text }),
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const { explanation } = await response.json();
        setSentenceExplanation(explanation);
      }
    } catch (err) {
      console.error("Sentence analysis failed:", err);
    } finally {
      setIsAnalyzingSentence(false);
    }
  };

  const handleExplain = async () => {
    if (!selectedWord) return;
    setIsAnalyzing(true);
    setExplanation(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({
          sentence: selectedWord.sentence,
          word: selectedWord.token.surface_form,
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const { explanation } = await response.json();
        setExplanation(explanation);
      }
    } catch (err) {
      console.error("AI Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMine = async () => {
    if (!selectedWord || !user) return;
    setIsMining(true);
    try {
      const deckRef = collection(db, "users", user.uid, "deck");

      // Check for duplicates
      const q = query(
        deckRef,
        where("kanji", "==", selectedWord.token.surface_form),
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Use dictionaryResult if available, fallback to token data
        const meaning = dictionaryResult
          ? dictionaryResult.meanings.map((m: any) => m.mean).join("; ")
          : selectedWord.token.definition_vn || "";

        const hanViet =
          dictionaryResult?.hanviet || selectedWord.token.han_viet || "";
        const reading =
          dictionaryResult?.phonetic || selectedWord.token.reading || "";

        await addDoc(deckRef, {
          kanji: selectedWord.token.surface_form,
          reading: reading,
          meaning: meaning,
          hanViet: hanViet,
          baseForm: selectedWord.token.base_form,
          addedAt: Date.now(),
          nextReview: Date.now(), // SRS Starts immediately
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
        });
      }
      setMinedSuccess(true);
    } catch (err) {
      console.error("Mining failed:", err);
    } finally {
      setIsMining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#F7F7F7] rounded-3xl border-2 border-[#E5E5E5] flex items-center justify-center p-8">
        <div className="text-[#AFAFAF] font-bold animate-pulse text-center">
          <div className="w-12 h-12 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Analyzing Video...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-[#F7F7F7] rounded-3xl border-2 border-red-100 flex items-center justify-center p-8">
        <div className="text-red-400 font-bold text-center">
          <p>Oops! {error}</p>
        </div>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="flex-1 bg-[#F7F7F7] rounded-3xl border-2 border-[#E5E5E5] flex items-center justify-center p-8">
        <div className="text-[#AFAFAF] font-bold text-center">
          <p>Paste a YouTube URL to begin immersion</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onClick={() => {
          setSelectedWord(null);
          setSelectedLineIndex(-1);
          setSelectedSentenceForAI(null);
        }}
      >
        <div className="p-2 md:p-4 leading-[1.8] md:leading-[2.5] text-lg md:text-2xl font-medium tracking-wide">
          {transcript.lines.map((line, lIdx) => {
            const isActive = lIdx === currentLineIndex;
            const isSelected = lIdx === selectedLineIndex;
            const isHighlighted = isActive || isSelected;

            return (
              <div
                key={`${line.start}-${lIdx}`}
                ref={isActive ? activeLineRef : null}
                className={cn(
                  "mb-3 md:mb-4 p-3 md:p-4 transition-all duration-300 rounded-xl border-2 touch-manipulation",
                  "active:scale-95 transition-transform cursor-pointer",
                  isHighlighted
                    ? "bg-[#E5FFD1] border-[#58CC02] text-[#111111] shadow-lg scale-[1.02] relative z-10"
                    : "bg-transparent border-transparent text-[#777777] hover:bg-[#F7F7F7] active:bg-[#F0F0F0] hover:text-[#111111]",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLineIndex(lIdx);
                  onLineClick(line.start);
                }}
              >
                <div className="flex flex-wrap items-end gap-x-2 gap-y-6 md:gap-y-10">
                  {line.tokens ? (
                    line.tokens.map((token, tIdx) => {
                      const hasKanji = /[\u4e00-\u9faf]/.test(
                        token.surface_form,
                      );
                      const hiragana = token.reading
                        ? wanakana.toHiragana(token.reading)
                        : "";
                      const romaji = token.reading
                        ? wanakana.toRomaji(token.reading)
                        : "";

                      return (
                        <span
                          key={`${tIdx}-${token.surface_form}`}
                          onClick={(e) =>
                            handleWordClick(
                              e,
                              token,
                              line.text,
                              lIdx,
                              line.start,
                            )
                          }
                          className={cn(
                            "relative cursor-help group/word flex flex-col items-center transition-all touch-manipulation",
                            "active:scale-105",
                          )}
                        >
                          {/* Top Layer: Hiragana (Only for Kanji) */}
                          <span
                            className={cn(
                              "text-[10px] md:text-xs font-bold transition-colors mb-0.5 h-4",
                              hasKanji && hiragana
                                ? "text-[#58CC02] opacity-100"
                                : "opacity-0",
                            )}
                          >
                            {hiragana}
                          </span>

                          {/* Middle Layer: Original Word */}
                          <span
                            className={cn(
                              "px-1 py-0.5 rounded-lg transition-colors leading-none",
                              token.han_viet
                                ? "underline decoration-[#1CB0F6]/40 underline-offset-4 md:underline-offset-6"
                                : "",
                              "group-hover/word:bg-[#E5FFD1] group-hover/word:text-[#58CC02] text-[#111111]",
                            )}
                          >
                            {token.surface_form}

                            {/* Hover Hán-Việt Overlay */}
                            {token.han_viet && (
                              <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#1CB0F6] opacity-0 group-hover/word:opacity-100 transition-opacity whitespace-nowrap bg-white px-2 py-1 rounded-md shadow-md border border-[#1CB0F6]/20 z-50">
                                {token.han_viet}
                              </span>
                            )}
                          </span>

                          {/* Bottom Layer: Romaji */}
                          <span className="text-[9px] md:text-[10px] font-medium text-[#777777] mt-1 leading-none uppercase tracking-tighter h-3">
                            {romaji}
                          </span>
                        </span>
                      );
                    })
                  ) : (
                    <div className="flex flex-col gap-2 w-full animate-pulse">
                      <div className="h-4 bg-[#E5E5E5] rounded w-3/4" />
                      <div className="h-3 bg-[#F0F0F0] rounded w-1/2" />
                    </div>
                  )}
                </div>

                {/* Bottom Layer: Sentence Translation */}
                {line.translation_vn && (
                  <div
                    className="mt-4 pt-3 border-t border-[#58CC02]/20 cursor-help active:bg-[#58CC02]/10 rounded-lg transition-colors"
                    onClick={(e) => handleSentenceClick(e, line, lIdx)}
                  >
                    <p className="text-sm md:text-base font-bold text-[#58CC02] italic leading-relaxed">
                      {line.translation_vn}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sentence Analysis Popover */}
      {selectedSentenceForAI && (
        <div
          className={cn(
            "fixed z-[100] bg-white border-2 border-[#E5E5E5] rounded-3xl shadow-2xl p-4 md:p-6 animate-in fade-in zoom-in duration-200 overflow-y-auto custom-scrollbar",
            "w-[90vw] md:w-[500px] max-h-[80vh]",
          )}
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setSelectedSentenceForAI(null)}
            className="absolute top-4 right-4 text-[#AFAFAF] hover:text-[#4B4B4B]"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-[#58CC02] uppercase tracking-widest mb-1">
                Original Sentence
              </p>
              <h3 className="text-xl md:text-2xl font-extrabold text-[#111111]">
                {selectedSentenceForAI.text}
              </h3>
            </div>

            <div className="bg-[#F7F7F7] rounded-2xl p-4">
              <p className="text-xs font-bold text-[#AFAFAF] uppercase tracking-widest mb-1">
                Vietnamese Meaning
              </p>
              <p className="text-[#4B4B4B] font-bold italic">
                {selectedSentenceForAI.translation}
              </p>
            </div>

            <div className="bg-[#FFF9E6] border-2 border-[#FFB800]/30 rounded-2xl p-4 prose prose-sm prose-stone max-w-none">
              <div className="flex items-center gap-2 mb-3 text-[#FFB800] font-bold text-xs uppercase tracking-widest">
                <Sparkles className="w-4 h-4" />
                Grammar & Context Analysis
              </div>

              {isAnalyzingSentence ? (
                <div className="flex flex-col items-center py-8 gap-3">
                  <div className="w-8 h-8 border-4 border-[#FFB800] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-[#FFB800] animate-pulse">
                    Gemini is analyzing...
                  </p>
                </div>
              ) : sentenceExplanation ? (
                <div className="text-[#111111] leading-relaxed overflow-y-auto">
                  <ReactMarkdown>{sentenceExplanation}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-[#AFAFAF] text-center py-4">
                  Failed to load analysis.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Word Deep-Dive Popover */}
      {selectedWord && (
        <div
          className={cn(
            "fixed z-[100] bg-white border-2 border-[#E5E5E5] rounded-3xl shadow-2xl p-4 md:p-6 animate-in fade-in zoom-in duration-200 overflow-y-auto custom-scrollbar",
            "w-[90vw] md:w-auto max-h-[60vh]",
            explanation ? "md:w-[400px]" : "md:w-72",
          )}
          style={{
            top:
              window.innerWidth < 768
                ? "50%"
                : Math.min(
                    window.innerHeight - 450,
                    selectedWord.rect.bottom + 10,
                  ),
            left:
              window.innerWidth < 768
                ? "50%"
                : Math.min(window.innerWidth - 450, selectedWord.rect.left),
            transform:
              window.innerWidth < 768 ? "translate(-50%, -50%)" : "none",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setSelectedWord(null)}
            className="absolute top-4 right-4 text-[#AFAFAF] hover:text-[#4B4B4B]"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-[#AFAFAF] uppercase tracking-widest">
                {selectedWord.token.reading}
              </p>
              <h3 className="text-3xl font-extrabold text-[#111111]">
                {selectedWord.token.surface_form}
              </h3>
            </div>

            {/* Dictionary Data (AI-Powered with Cache) */}
            <div className="space-y-3">
              {isFetchingDictionary ? (
                <div className="flex items-center gap-2 py-2 animate-pulse">
                  <div className="w-2 h-2 bg-[#AFAFAF] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[#AFAFAF] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-[#AFAFAF] rounded-full animate-bounce [animation-delay:-0.3s]" />
                </div>
              ) : dictionaryResult ? (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#F7F7F7] border border-[#E5E5E5] rounded-md text-[#AFAFAF] uppercase">
                    {selectedWord.token.pos}
                  </span>
                  <div className="space-y-2 max-h-40 mt-3 overflow-y-auto custom-scrollbar pr-1">
                    {dictionaryResult.meanings.map((m: any, idx: number) => (
                      <div
                        key={idx}
                        className="border-l-4 border-[#58CC02] pl-3 py-1"
                      >
                        <p className="text-sm font-bold text-[#111111] leading-snug">
                          {m.mean}
                        </p>
                        {m.examples?.[0] && (
                          <div className="mt-3 text-[11px] text-[#777777]">
                            <p className="font-medium">
                              • {m.examples[0].content}
                            </p>
                            {m.examples[0].transcription && (
                              <p className="italic opacity-80 pl-2">
                                {m.examples[0].transcription}
                              </p>
                            )}
                            <p className="text-[#AFAFAF] italic pl-2">
                              {m.examples[0].mean}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#F7F7F7] border border-[#E5E5E5] rounded-md text-[#AFAFAF] uppercase">
                    {selectedWord.token.pos}
                  </span>
                  <p className="mt-2 text-[#4B4B4B] font-medium leading-relaxed">
                    {selectedWord.token.definition_vn ||
                      "Cơ sở dữ liệu chưa có định nghĩa cụ thể. Hãy bấm 'Explain' để phân tích chi tiết."}
                  </p>
                </div>
              )}
            </div>

            {/* AI Explanation Content */}
            {explanation && (
              <div className="bg-[#FFF9E6] border-2 border-[#FFB800]/30 rounded-2xl p-4 prose prose-sm prose-stone">
                <div className="flex items-center gap-2 mb-2 text-[#FFB800] font-bold text-xs uppercase tracking-widest">
                  <Sparkles className="w-4 h-4" />
                  AI Analysis
                </div>
                <div className="text-[#111111] leading-relaxed">
                  <ReactMarkdown>{explanation}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Action Buttons hidden per user request */}
          </div>
        </div>
      )}
    </div>
  );
};
