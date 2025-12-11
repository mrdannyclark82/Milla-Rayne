/**
 * YouTube Video Analysis Service
 *
 * This service handles YouTube video URL processing, content extraction,
 * and analysis integration with Milla's memory system.
 */

import ytdl from 'ytdl-core';
import { YoutubeTranscript } from 'youtube-transcript';
import { updateMemories } from './memoryService';

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  duration: string;
  uploadDate: string;
  channelName: string;
  viewCount: string;
  thumbnail: string;
  url: string;
}

export interface YouTubeAnalysisResult {
  videoInfo: YouTubeVideoInfo;
  transcript?: string | null;
  summary: string;
  keyTopics: string[];
  analysisTimestamp: string;
  memoryId: string;
}

/**
 * Validates if a URL is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  try {
    return ytdl.validateURL(url);
  } catch (error) {
    return false;
  }
}

/**
 * Extracts video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  try {
    return ytdl.getVideoID(url);
  } catch (error) {
    return null;
  }
}

/**
 * Gets detailed video information from YouTube
 */
export async function getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
  try {
    const info = await ytdl.getInfo(url);
    const details = info.videoDetails;

    return {
      id: details.videoId,
      title: details.title,
      description: details.description || '',
      duration: details.lengthSeconds,
      uploadDate: details.uploadDate || '',
      channelName: details.author.name,
      viewCount: details.viewCount,
      thumbnail: details.thumbnails[0]?.url || '',
      url: details.video_url,
    };
  } catch (error: any) {
    console.warn(
      'ytdl-core failed, attempting basic info extraction:',
      error?.message
    );

    // Fallback: Extract basic info from URL
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('Could not extract video ID from URL');
    }

    // Return basic info that we can extract from the URL
    return {
      id: videoId,
      title: `YouTube Video ${videoId}`,
      description:
        'Video analysis via direct URL parsing (full details unavailable)',
      duration: '0',
      uploadDate: new Date().toISOString(),
      channelName: 'Unknown Channel',
      viewCount: '0',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      url: url,
    };
  }
}

/**
 * Gets video transcript if available
 */
export async function getVideoTranscript(
  videoId: string
): Promise<string | null> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (transcript && transcript.length > 0) {
      return transcript.map((item) => item.text).join(' ');
    }
    return null;
  } catch (error: any) {
    console.warn(
      'Could not fetch transcript for video:',
      videoId,
      error?.message || 'Unknown error'
    );
    return null;
  }
}

/**
 * Analyzes video content and generates AI-powered summary
 */
export async function analyzeVideoContent(
  videoInfo: YouTubeVideoInfo,
  transcript?: string | null,
  aiService?: any
): Promise<{
  summary: string;
  keyTopics: string[];
}> {
  // If we have a transcript and AI service, use AI for intelligent analysis
  if (transcript && transcript.length > 100 && aiService) {
    try {
      const prompt = `Analyze this YouTube video transcript and provide:
1. A concise 2-3 sentence summary
2. 5-10 key topics/themes (comma-separated)

Video Title: "${videoInfo.title}"
Channel: ${videoInfo.channelName}
Transcript: ${transcript.substring(0, 3000)}...

Format:
SUMMARY: <your summary>
TOPICS: <topic1>, <topic2>, <topic3>, etc.`;

      const aiResponse = await aiService.generateResponse(prompt, {
        maxTokens: 300,
        temperature: 0.3,
      });

      // Parse AI response
      const summaryMatch = aiResponse.match(/SUMMARY:\s*(.+?)(?=TOPICS:|$)/s);
      const topicsMatch = aiResponse.match(/TOPICS:\s*(.+)/s);

      if (summaryMatch && topicsMatch) {
        const summary = summaryMatch[1].trim();
        const topics = topicsMatch[1]
          .split(',')
          .map((t: string) => t.trim().toLowerCase())
          .filter((t: string) => t.length > 0)
          .slice(0, 10);

        return { summary, keyTopics: topics };
      }
    } catch (error) {
      console.warn('AI analysis failed, falling back to basic analysis:', error);
    }
  }

  // Fallback to basic analysis
  const content = transcript || videoInfo.description;
  const keyTopics = extractKeyTopics(content, videoInfo.title);
  const summary = generateVideoSummary(videoInfo, transcript);

  return { summary, keyTopics };
}

/**
 * Extracts key topics from video content
 */
function extractKeyTopics(content: string, title: string): string[] {
  // Pre-compiled stopwords as a Set for O(1) lookup
  const STOPWORDS = new Set([
    'this',
    'that',
    'with',
    'from',
    'they',
    'been',
    'have',
    'were',
    'will',
    'what',
    'when',
    'where',
    'would',
    'could',
    'should',
    'video',
    'youtube',
  ]);

  const topics = new Set<string>();

  // Add title words as potential topics - O(t) where t = title words
  const titleWords = title
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOPWORDS.has(word));

  titleWords.forEach((word) => topics.add(word));

  // If we have actual content, analyze it
  if (
    content &&
    content !==
      'Video analysis via direct URL parsing (full details unavailable)'
  ) {
    // Simple keyword extraction from content
    const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordFreq = new Map<string, number>();

    // Count frequencies - O(n) with O(1) Set lookups instead of O(n×m) array includes
    for (const word of words) {
      if (!STOPWORDS.has(word)) {
        // O(1) Set lookup instead of O(m) array scan!
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }

    // Get top keywords - O(n log n) for sorting (acceptable)
    const topWords = Array.from(wordFreq.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);

    topWords.forEach((word) => topics.add(word));
  } else {
    // For basic videos, add some generic topics
    topics.add('video');
    topics.add('content');
    topics.add('media');
  }

  // Ensure we always have some topics
  if (topics.size === 0) {
    topics.add('youtube');
    topics.add('video');
    topics.add('content');
  }

  return Array.from(topics).slice(0, 10);
}

/**
 * Generates a summary of the video
 */
function generateVideoSummary(
  videoInfo: YouTubeVideoInfo,
  transcript?: string | null
): string {
  const durationMinutes =
    parseInt(videoInfo.duration) > 0
      ? Math.round(parseInt(videoInfo.duration) / 60)
      : 'unknown';
  const hasTranscript = transcript
    ? 'with transcript available'
    : 'transcript not available';

  let summary = `YouTube Video Analysis: "${videoInfo.title}" by ${videoInfo.channelName}. `;

  if (durationMinutes !== 'unknown') {
    summary += `Duration: ${durationMinutes} minutes, ${hasTranscript}. `;
  }

  if (transcript) {
    // Extract first few sentences as preview
    const sentences = transcript.match(/[^\.!?]+[\.!?]+/g) || [];
    const preview = sentences.slice(0, 2).join(' ').substring(0, 200);
    summary += `Content preview: ${preview}...`;
  } else if (
    videoInfo.description &&
    videoInfo.description !==
      'Video analysis via direct URL parsing (full details unavailable)'
  ) {
    const descPreview = videoInfo.description.substring(0, 200);
    summary += `Description: ${descPreview}...`;
  } else {
    summary += `Video ID: ${videoInfo.id}. Due to technical limitations, I was only able to capture basic information about this video. The video appears to be accessible at the provided URL.`;
  }

  return summary;
}

/**
 * Analyzes a YouTube video and stores the results in memory
 */
export async function analyzeYouTubeVideo(
  url: string,
  aiService?: any
): Promise<YouTubeAnalysisResult> {
  try {
    // Validate URL
    if (!isValidYouTubeUrl(url)) {
      throw new Error('Invalid YouTube URL provided');
    }

    // Get video information
    const videoInfo = await getVideoInfo(url);

    // Get transcript if available
    const transcript = await getVideoTranscript(videoInfo.id);

    // Analyze content with AI if available
    const { summary, keyTopics } = await analyzeVideoContent(
      videoInfo,
      transcript,
      aiService
    );

    // Create memory entry
    const analysisTimestamp = new Date().toISOString();
    const memoryContent = `[${analysisTimestamp}] YouTube Video Analysis: ${summary}. Key topics: ${keyTopics.join(', ')}. Original URL: ${url}`;

    // Store in memory system
    await updateMemories(memoryContent);

    const result: YouTubeAnalysisResult = {
      videoInfo,
      transcript,
      summary,
      keyTopics,
      analysisTimestamp,
      memoryId: `youtube_${videoInfo.id}_${Date.now()}`,
    };

    console.log(
      `YouTube video analyzed and stored in memory: ${videoInfo.title}`
    );

    return result;
  } catch (error: any) {
    console.error('Error analyzing YouTube video:', error);
    throw new Error(
      `YouTube analysis failed: ${error?.message || 'Unknown error'}`
    );
  }
}

/**
 * Searches stored YouTube video memories
 */
export async function searchVideoMemories(query: string): Promise<any[]> {
  // This would integrate with the existing memory search system
  // For now, we'll return a placeholder
  console.log(`Searching video memories for: ${query}`);
  return [];
}
