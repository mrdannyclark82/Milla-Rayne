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
      url: details.video_url
    };
  } catch (error: any) {
    console.error('Error getting video info:', error);
    throw new Error(`Failed to get video information: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Gets video transcript if available
 */
export async function getVideoTranscript(videoId: string): Promise<string | null> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (transcript && transcript.length > 0) {
      return transcript.map(item => item.text).join(' ');
    }
    return null;
  } catch (error: any) {
    console.warn('Could not fetch transcript for video:', videoId, error?.message || 'Unknown error');
    return null;
  }
}

/**
 * Analyzes video content and generates summary
 */
export function analyzeVideoContent(videoInfo: YouTubeVideoInfo, transcript?: string | null): {
  summary: string;
  keyTopics: string[];
} {
  const content = transcript || videoInfo.description;
  
  // Simple topic extraction (can be enhanced with NLP)
  const keyTopics = extractKeyTopics(content, videoInfo.title);
  
  // Generate summary
  const summary = generateVideoSummary(videoInfo, transcript);
  
  return { summary, keyTopics };
}

/**
 * Extracts key topics from video content
 */
function extractKeyTopics(content: string, title: string): string[] {
  const topics: Set<string> = new Set();
  
  // Add title words as potential topics
  const titleWords = title.toLowerCase().split(/\s+/).filter(word => word.length > 3);
  titleWords.forEach(word => topics.add(word));
  
  // Simple keyword extraction from content
  const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const wordFreq: { [key: string]: number } = {};
  
  words.forEach(word => {
    // Skip common words
    if (!['this', 'that', 'with', 'from', 'they', 'been', 'have', 'were', 'will', 'what', 'when', 'where', 'would', 'could', 'should'].includes(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  // Get top keywords
  const topWords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
  
  topWords.forEach(word => topics.add(word));
  
  return Array.from(topics).slice(0, 15);
}

/**
 * Generates a summary of the video
 */
function generateVideoSummary(videoInfo: YouTubeVideoInfo, transcript?: string | null): string {
  const durationMinutes = Math.round(parseInt(videoInfo.duration) / 60);
  const hasTranscript = transcript ? 'with full transcript available' : 'transcript not available';
  
  let summary = `YouTube Video Analysis: "${videoInfo.title}" by ${videoInfo.channelName}. `;
  summary += `Duration: ${durationMinutes} minutes, ${hasTranscript}. `;
  
  if (transcript) {
    // Extract first few sentences as preview
    const sentences = transcript.match(/[^\.!?]+[\.!?]+/g) || [];
    const preview = sentences.slice(0, 2).join(' ').substring(0, 200);
    summary += `Content preview: ${preview}...`;
  } else if (videoInfo.description) {
    const descPreview = videoInfo.description.substring(0, 200);
    summary += `Description: ${descPreview}...`;
  }
  
  return summary;
}

/**
 * Analyzes a YouTube video and stores the results in memory
 */
export async function analyzeYouTubeVideo(url: string): Promise<YouTubeAnalysisResult> {
  try {
    // Validate URL
    if (!isValidYouTubeUrl(url)) {
      throw new Error('Invalid YouTube URL provided');
    }
    
    // Get video information
    const videoInfo = await getVideoInfo(url);
    
    // Get transcript if available
    const transcript = await getVideoTranscript(videoInfo.id);
    
    // Analyze content
    const { summary, keyTopics } = analyzeVideoContent(videoInfo, transcript);
    
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
      memoryId: `youtube_${videoInfo.id}_${Date.now()}`
    };
    
    console.log(`YouTube video analyzed and stored in memory: ${videoInfo.title}`);
    
    return result;
    
  } catch (error: any) {
    console.error('Error analyzing YouTube video:', error);
    throw new Error(`YouTube analysis failed: ${error?.message || 'Unknown error'}`);
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