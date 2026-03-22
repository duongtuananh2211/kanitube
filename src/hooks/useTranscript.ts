'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { YouTubeService } from '@/services/youtube';
import { TranscriptData, TranscriptLine } from '@/types';

export const useTranscript = (videoId: string | null) => {
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load transcript when videoId changes
  useEffect(() => {
    if (!videoId) {
      setTranscript(null);
      setCurrentLineIndex(-1);
      return;
    }

    const loadTranscript = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await YouTubeService.getTranscript(videoId);
        setTranscript(data);
        
        // CTO Move: Batch tokenize everything at once
        if (!data.isFullySegmented) {
          await tokenizeLines(data);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load transcript");
        console.error("useTranscript load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTranscript();
  }, [videoId]);

  const tokenizeLines = async (data: TranscriptData) => {
    // Only process if not already fully segmented/tokenized
    if (data.isFullySegmented) return;

    const untokenizedTexts = data.lines.map(l => l.text);
    
    try {
      console.log(`[useTranscript] Batch tokenizing ${untokenizedTexts.length} lines...`);
      const response = await fetch('/api/tokenize', {
        method: 'POST',
        body: JSON.stringify({ texts: untokenizedTexts }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const { batchResults } = await response.json();
        
        setTranscript(prev => {
          if (!prev) return null;
          const updatedLines = prev.lines.map((line, idx) => ({
            ...line,
            tokens: batchResults[idx].tokens,
            translation_vn: batchResults[idx].translation_vn // Prepare for AI translation
          }));
          
          const updatedData = { 
            ...prev, 
            lines: updatedLines, 
            isFullySegmented: true 
          };

          // Background: Update Supabase cache with tokenized data
          fetch('/api/transcript/save', {
            method: 'POST',
            body: JSON.stringify({ videoId: data.videoId, transcript: updatedData }),
            headers: { 'Content-Type': 'application/json' }
          }).catch(err => console.error("Failed to save transcript cache:", err));
          
          return updatedData;
        });
        console.log("[useTranscript] Batch tokenization complete.");
      }
    } catch (err) {
      console.error("[useTranscript] Batch tokenization error:", err);
    }
  };

  // Sync current time to active line
  const updateCurrentTime = useCallback((time: number) => {
    if (!transcript) return;

    // Binary search for efficiency
    let low = 0;
    let high = transcript.lines.length - 1;
    let index = -1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const line = transcript.lines[mid];

      if (time >= line.start) {
        index = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (index !== currentLineIndex && index !== -1) {
      setCurrentLineIndex(index);
    }
  }, [transcript, currentLineIndex]);

  return {
    transcript,
    currentLineIndex,
    loading,
    error,
    updateCurrentTime,
  };
};
