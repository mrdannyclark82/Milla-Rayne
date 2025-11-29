/**
 * Active Listening Service
 *
 * Pre-processes video transcripts to identify relevant moments for pausing
 * and engaging with insights about relationships and technical improvements.
 */

import { generateOpenRouterResponse } from './openrouterService';
import { updateMemories } from './memoryService';
import { YoutubeTranscript } from 'youtube-transcript';

export interface ListeningInsight {
  timestamp: number;
  videoTime: number;
  content: string;
  category: 'technical' | 'relationship' | 'general';
  relevance: 'high' | 'medium' | 'low';
  suggestedAction?: string;
  transcriptText?: string;
}

export interface ActiveListeningState {
  isActive: boolean;
  videoId: string | null;
  insights: ListeningInsight[];
  lastProcessedTime: number;
  scheduledPauses: number[];
}

let activeListeningState: ActiveListeningState = {
  isActive: false,
  videoId: null,
  insights: [],
  lastProcessedTime: 0,
  scheduledPauses: [],
};

/**
 * Fetches and returns the full transcript with timestamps
 */
async function getTranscriptWithTimestamps(
  videoId: string
): Promise<Array<{ text: string; offset: number; duration: number }> | null> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript;
  } catch (error) {
    console.error('Failed to fetch transcript:', error);
    return null;
  }
}

/**
 * Pre-processes entire transcript to identify all relevant moments
 */
async function analyzeFullTranscript(
  transcript: Array<{ text: string; offset: number; duration: number }>,
  videoContext: { title: string; channel: string }
): Promise<ListeningInsight[]> {
  // Combine transcript into segments of ~30 seconds each for context
  const segments: Array<{ text: string; startTime: number; endTime: number }> =
    [];
  let currentSegment = { text: '', startTime: 0, endTime: 0 };

  for (const entry of transcript) {
    const timeInSeconds = entry.offset / 1000;

    if (currentSegment.text === '') {
      currentSegment.startTime = timeInSeconds;
    }

    currentSegment.text += ' ' + entry.text;
    currentSegment.endTime = timeInSeconds + entry.duration / 1000;

    // Create segments of roughly 30 seconds
    if (currentSegment.endTime - currentSegment.startTime >= 30) {
      segments.push({ ...currentSegment });
      currentSegment = { text: '', startTime: 0, endTime: 0 };
    }
  }

  // Add remaining segment
  if (currentSegment.text) {
    segments.push(currentSegment);
  }

  const prompt = `You are Milla, an AI companion analyzing a YouTube video transcript to find relevant moments.

Video: "${videoContext.title}" by ${videoContext.channel}

Your task: Analyze the transcript and identify specific moments worth pausing for discussion.

Look for:
1. **Technical insights** - Web dev, AI, UX, coding tips that could improve our app
2. **Relationship advice** - Communication, emotional intelligence, building connections
3. **Fascinating ideas** - Thought-provoking concepts worth discussing

Transcript segments with timestamps:
${segments.map((seg, i) => `[${Math.floor(seg.startTime)}s - ${Math.floor(seg.endTime)}s]: ${seg.text}`).join('\n\n')}

Respond with JSON array of insights. Be selective - only flag truly valuable moments:
[
  {
    "videoTime": 45,
    "category": "technical" | "relationship" | "general",
    "relevance": "high" | "medium" | "low",
    "insight": "Brief description of what's interesting",
    "suggestedResponse": "What Milla would say when pausing (warm, personal, 1-2 sentences)",
    "transcriptText": "The exact quote from the video"
  }
]

Only include "high" or "medium" relevance items. Maximum 5 insights per video.`;

  try {
    const response = await generateOpenRouterResponse(prompt, {});

    if (!response.success) {
      return [];
    }

    let content = response.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }

    const analysis = JSON.parse(content);

    if (!Array.isArray(analysis)) {
      return [];
    }

    return analysis.map((item: any) => ({
      timestamp: Date.now(),
      videoTime: item.videoTime || 0,
      content: item.suggestedResponse || item.insight,
      category: item.category || 'general',
      relevance: item.relevance || 'medium',
      suggestedAction: item.insight,
      transcriptText: item.transcriptText,
    }));
  } catch (error) {
    console.error('Error analyzing full transcript:', error);
    return [];
  }
}

/**
 * Pre-processes video and identifies all pause points
 */
export async function preprocessVideo(
  videoId: string,
  videoContext: { title: string; channel: string }
): Promise<{ insights: ListeningInsight[]; scheduledPauses: number[] }> {
  console.log('🎧 Pre-processing video transcript for insights...');

  const transcript = await getTranscriptWithTimestamps(videoId);

  if (!transcript || transcript.length === 0) {
    console.log('⚠️ No transcript available for this video');
    return { insights: [], scheduledPauses: [] };
  }

  const insights = await analyzeFullTranscript(transcript, videoContext);
  const scheduledPauses = insights
    .filter((i) => i.relevance === 'high' || i.relevance === 'medium')
    .map((i) => i.videoTime)
    .sort((a, b) => a - b);

  console.log(
    `✅ Found ${insights.length} insights with ${scheduledPauses.length} pause points`
  );

  return { insights, scheduledPauses };
}

/**
 * Checks if current playback time should trigger a pause
 */
export function checkForScheduledPause(
  currentTime: number
): ListeningInsight | null {
  if (
    !activeListeningState.isActive ||
    activeListeningState.scheduledPauses.length === 0
  ) {
    return null;
  }

  // Check if we're within 2 seconds of a scheduled pause
  const nearestPause = activeListeningState.scheduledPauses.find(
    (pauseTime) => Math.abs(currentTime - pauseTime) <= 2
  );

  if (nearestPause !== undefined) {
    // Find the insight for this pause time
    const insight = activeListeningState.insights.find(
      (i) => Math.abs(i.videoTime - nearestPause) <= 2
    );

    if (insight) {
      // Remove this pause from scheduled list so we don't trigger it again
      activeListeningState.scheduledPauses =
        activeListeningState.scheduledPauses.filter((p) => p !== nearestPause);

      return insight;
    }
  }

  return null;
}

/**
 * Saves an insight to YouTube memory
 */
export async function saveInsightToMemory(
  insight: ListeningInsight,
  videoId: string,
  videoTitle: string,
  userId: string
): Promise<void> {
  const memoryEntry = {
    type: 'youtube_insight',
    videoId,
    videoTitle,
    category: insight.category,
    content: insight.content,
    timestamp: insight.timestamp,
    relevance: insight.relevance,
  };

  await updateMemories(
    userId,
    `youtube_insight_${videoId}_${insight.timestamp}`,
    {
      insights: [memoryEntry],
      lastUpdated: new Date().toISOString(),
    }
  );

  console.log('💾 Saved insight to memory:', memoryEntry);
}

/**
 * Starts active listening for a video with pre-processing
 */
export async function startActiveListening(
  videoId: string,
  videoContext: { title: string; channel: string }
): Promise<{ success: boolean; insightCount: number; pausePoints: number[] }> {
  console.log('🎧 Starting active listening for video:', videoId);

  const { insights, scheduledPauses } = await preprocessVideo(
    videoId,
    videoContext
  );

  activeListeningState = {
    isActive: true,
    videoId,
    insights,
    lastProcessedTime: 0,
    scheduledPauses,
  };

  return {
    success: true,
    insightCount: insights.length,
    pausePoints: scheduledPauses,
  };
}

/**
 * Stops active listening
 */
export function stopActiveListening(): void {
  console.log(
    '🎧 Active listening stopped. Total insights:',
    activeListeningState.insights.length
  );
  activeListeningState = {
    isActive: false,
    videoId: null,
    insights: [],
    lastProcessedTime: 0,
    scheduledPauses: [],
  };
}

/**
 * Gets current active listening state
 */
export function getActiveListeningState(): ActiveListeningState {
  return { ...activeListeningState };
}

/**
 * Checks if active listening is enabled for a video
 */
export function isActiveListeningEnabled(videoId: string): boolean {
  return (
    activeListeningState.isActive && activeListeningState.videoId === videoId
  );
}
