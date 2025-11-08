/**
 * millAlyzer - Advanced YouTube Video Analysis
 * 
 * This service provides AI-powered analysis of YouTube videos with a focus on
 * extracting actionable content: code snippets, CLI commands, step-by-step instructions,
 * and key learning points.
 * 
 * Features:
 * - Intelligent video type detection (tutorial, news, discussion, etc.)
 * - Code snippet extraction with syntax highlighting
 * - CLI command identification
 * - Step-by-step instruction breakdown
 * - Key points with timestamps
 * - Knowledge base integration
 */

import { YoutubeTranscript } from 'youtube-transcript';
import { getVideoInfo, type YouTubeVideoInfo } from './youtubeAnalysisService';

// ===========================================================================================
// TYPE DEFINITIONS
// ===========================================================================================

export type VideoType = 'tutorial' | 'news' | 'discussion' | 'entertainment' | 'other';
export type ImportanceLevel = 'high' | 'medium' | 'low';
export type ActionableType = 'step' | 'tip' | 'warning' | 'resource';
export type Platform = 'linux' | 'mac' | 'windows' | 'all';

export interface KeyPoint {
  timestamp: string;  // "12:34"
  point: string;
  importance: ImportanceLevel;
}

export interface ActionableItem {
  type: ActionableType;
  content: string;
  order?: number;
  dependencies?: string[];
}

export interface CodeSnippet {
  language: string;
  code: string;
  description: string;
  timestamp?: string;
  copyable: true;
}

export interface CLICommand {
  command: string;
  description: string;
  platform: Platform;
  timestamp?: string;
  copyable: true;
}

export interface VideoAnalysis {
  videoId: string;
  title: string;
  type: VideoType;
  keyPoints: KeyPoint[];
  actionableItems: ActionableItem[];
  codeSnippets: CodeSnippet[];
  cliCommands: CLICommand[];
  summary: string;
  analysisDate: string;
  transcriptAvailable: boolean;
}

// ===========================================================================================
// AI PROMPT TEMPLATES
// ===========================================================================================

const VIDEO_TYPE_DETECTION_PROMPT = `Analyze this video title and description to determine its type.

Title: {title}
Description: {description}

Respond with ONLY one word: tutorial, news, discussion, entertainment, or other`;

const CODE_EXTRACTION_PROMPT = `Extract all code snippets from this transcript. For each code block, identify:
1. Programming language
2. The code itself
3. Brief description of what it does
4. Timestamp if mentioned

Transcript:
{transcript}

Format as JSON array:
[
  {
    "language": "javascript",
    "code": "const example = 'code here';",
    "description": "What this code does",
    "timestamp": "12:34"
  }
]

If no code found, return empty array: []`;

const CLI_EXTRACTION_PROMPT = `Extract all CLI/terminal commands from this transcript. For each command, identify:
1. The exact command
2. What it does
3. Which platform (linux/mac/windows/all)
4. Timestamp if mentioned

Transcript:
{transcript}

Format as JSON array:
[
  {
    "command": "npm install express",
    "description": "Install Express framework",
    "platform": "all",
    "timestamp": "05:30"
  }
]

If no commands found, return empty array: []`;

const KEY_POINTS_PROMPT = `Extract the main key points from this video transcript. For each point:
1. The key point/concept
2. Timestamp if mentioned
3. Importance level (high/medium/low)

Focus on actionable insights, important concepts, and main takeaways.

Transcript:
{transcript}

Format as JSON array:
[
  {
    "point": "Main concept explained",
    "timestamp": "03:45",
    "importance": "high"
  }
]`;

const TUTORIAL_STEPS_PROMPT = `This is a tutorial video. Extract step-by-step instructions in order.

Transcript:
{transcript}

Format as JSON array:
[
  {
    "type": "step",
    "content": "First, install the dependencies",
    "order": 1,
    "dependencies": []
  },
  {
    "type": "step",
    "content": "Next, create the server file",
    "order": 2,
    "dependencies": ["step 1"]
  }
]`;

const SUMMARY_PROMPT = `Create a concise 2-3 sentence summary of this video based on the transcript.

Title: {title}
Transcript:
{transcript}

Summary:`;

// ===========================================================================================
// UTILITY FUNCTIONS
// ===========================================================================================

/**
 * Formats seconds into MM:SS timestamp
 */
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parses timestamp string to seconds
 */
function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

/**
 * Detects programming language from code content
 */
function detectLanguage(code: string): string {
  // Simple heuristics for common languages
  if (code.includes('const ') || code.includes('let ') || code.includes('function ')) return 'javascript';
  if (code.includes('def ') || code.includes('import ') && code.includes('print(')) return 'python';
  if (code.includes('<?php')) return 'php';
  if (code.includes('SELECT ') || code.includes('FROM ')) return 'sql';
  if (code.includes('docker ') || code.includes('FROM ')) return 'dockerfile';
  if (code.includes('#!/bin/bash')) return 'bash';
  if (code.includes('public class ') || code.includes('public static void')) return 'java';
  if (code.includes('fn ') || code.includes('impl ')) return 'rust';
  if (code.includes('func ') && code.includes(':=')) return 'go';
  
  return 'plaintext';
}

/**
 * Cleans and validates JSON response from AI
 */
function parseAIResponse<T>(response: string, fallback: T): T {
  try {
    // Remove markdown code blocks if present
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.warn('Failed to parse AI response, using fallback:', error);
    return fallback;
  }
}

// ===========================================================================================
// CORE ANALYSIS FUNCTIONS
// ===========================================================================================

/**
 * Detects the type of video based on title and description
 */
export async function detectVideoType(videoInfo: YouTubeVideoInfo): Promise<VideoType> {
  const title = videoInfo.title.toLowerCase();
  const desc = videoInfo.description.toLowerCase();
  
  // Simple keyword-based detection (can be enhanced with AI later)
  const tutorialKeywords = ['tutorial', 'how to', 'guide', 'learn', 'course', 'lesson', 'walkthrough'];
  const newsKeywords = ['news', 'update', 'release', 'announced', 'breaking', 'latest'];
  const discussionKeywords = ['discussion', 'podcast', 'interview', 'talk', 'debate'];
  
  if (tutorialKeywords.some(kw => title.includes(kw) || desc.includes(kw))) {
    return 'tutorial';
  }
  if (newsKeywords.some(kw => title.includes(kw) || desc.includes(kw))) {
    return 'news';
  }
  if (discussionKeywords.some(kw => title.includes(kw) || desc.includes(kw))) {
    return 'discussion';
  }
  
  return 'other';
}

/**
 * Extracts code snippets from transcript using pattern matching
 */
export async function extractCodeSnippets(transcript: string): Promise<CodeSnippet[]> {
  const snippets: CodeSnippet[] = [];
  
  // Pattern 1: Code mentioned with keywords
  const codePatterns = [
    /(?:here's|this is|the|use) (?:the )?code[:\s]+([^.!?]+)/gi,
    /```(\w+)?\n([\s\S]+?)```/g,  // Markdown code blocks in transcript
    /(?:function|const|let|var|class|def|import)\s+\w+/g,  // Code-like patterns
  ];
  
  for (const pattern of codePatterns) {
    const matches = transcript.matchAll(pattern);
    for (const match of matches) {
      const code = match[2] || match[1] || match[0];
      if (code && code.length > 10 && code.length < 1000) {
        snippets.push({
          language: detectLanguage(code),
          code: code.trim(),
          description: 'Code snippet from video',
          copyable: true,
        });
      }
    }
  }
  
  return snippets.slice(0, 20);  // Limit to 20 snippets
}

/**
 * Extracts CLI commands from transcript
 */
export async function extractCLICommands(transcript: string): Promise<CLICommand[]> {
  const commands: CLICommand[] = [];
  
  // Common CLI command patterns
  const commandPatterns = [
    /(?:run|execute|type|enter)\s+[`"]?((?:npm|yarn|pip|docker|git|cargo|go|kubectl|terraform|aws|gcloud)\s+[^`".\n]+)[`"]?/gi,
    /\$\s+([^\n]+)/g,  // Shell prompt
    />`\s*([^\n]+)/g,  // PowerShell prompt
  ];
  
  for (const pattern of commandPatterns) {
    const matches = transcript.matchAll(pattern);
    for (const match of matches) {
      const command = match[1]?.trim();
      if (command && command.length > 3 && command.length < 200) {
        // Determine platform
        let platform: Platform = 'all';
        if (command.includes('apt-get') || command.includes('yum')) platform = 'linux';
        if (command.includes('brew')) platform = 'mac';
        if (command.includes('choco') || command.includes('winget')) platform = 'windows';
        
        commands.push({
          command,
          description: `Command from video`,
          platform,
          copyable: true,
        });
      }
    }
  }
  
  // Remove duplicates
  const unique = commands.filter((cmd, index, self) =>
    index === self.findIndex(c => c.command === cmd.command)
  );
  
  return unique.slice(0, 30);  // Limit to 30 commands
}

/**
 * Extracts key points with timestamps from transcript
 */
export async function extractKeyPoints(
  transcript: string | { text: string; offset: number }[]
): Promise<KeyPoint[]> {
  const keyPoints: KeyPoint[] = [];
  
  // If transcript has timestamps, use them
  if (Array.isArray(transcript)) {
    // Look for important phrases in timestamped transcript
    const importantPhrases = [
      'important', 'key', 'remember', 'note that', 'crucial', 'essential',
      'main point', 'takeaway', 'first', 'second', 'third', 'finally',
      'step one', 'step two', 'step three'
    ];
    
    for (const segment of transcript) {
      const text = segment.text.toLowerCase();
      const hasImportantPhrase = importantPhrases.some(phrase => text.includes(phrase));
      
      if (hasImportantPhrase || segment.text.length > 100) {
        keyPoints.push({
          timestamp: formatTimestamp(segment.offset / 1000),
          point: segment.text,
          importance: hasImportantPhrase ? 'high' : 'medium',
        });
      }
    }
  }
  
  return keyPoints.slice(0, 15);  // Limit to 15 key points
}

/**
 * Generates a summary of the video
 */
export async function generateVideoSummary(
  videoInfo: YouTubeVideoInfo,
  transcript: string
): Promise<string> {
  // For now, use a simple extractive summary
  // Can be enhanced with AI later
  
  const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [];
  const firstSentences = sentences.slice(0, 3).join(' ');
  
  const duration = Math.round(parseInt(videoInfo.duration) / 60);
  
  return `"${videoInfo.title}" by ${videoInfo.channelName} (${duration} min). ${firstSentences.substring(0, 200)}...`;
}

// ===========================================================================================
// MAIN ANALYSIS FUNCTION
// ===========================================================================================

/**
 * Performs comprehensive millAlyzer analysis on a YouTube video
 */
export async function analyzeVideoWithMillAlyzer(
  videoId: string
): Promise<VideoAnalysis> {
  try {
    console.log(`🔍 millAlyzer: Starting analysis of video ${videoId}`);
    
    // Get video info
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const videoInfo = await getVideoInfo(videoUrl);
    
    // Get transcript
    let transcriptText = '';
    let transcriptData: any[] = [];
    let transcriptAvailable = false;
    
    try {
      transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
      transcriptText = transcriptData.map(t => t.text).join(' ');
      transcriptAvailable = true;
      console.log(`📝 millAlyzer: Transcript retrieved (${transcriptText.length} chars)`);
    } catch (error) {
      console.warn(`⚠️ millAlyzer: Transcript not available for ${videoId}`);
    }
    
    // Detect video type
    const type = await detectVideoType(videoInfo);
    console.log(`🎬 millAlyzer: Video type detected as "${type}"`);
    
    // Extract components
    const [codeSnippets, cliCommands, keyPoints] = await Promise.all([
      extractCodeSnippets(transcriptText),
      extractCLICommands(transcriptText),
      extractKeyPoints(transcriptData.length > 0 ? transcriptData : transcriptText),
    ]);
    
    console.log(`💻 millAlyzer: Extracted ${codeSnippets.length} code snippets`);
    console.log(`⚡ millAlyzer: Extracted ${cliCommands.length} CLI commands`);
    console.log(`📌 millAlyzer: Extracted ${keyPoints.length} key points`);
    
    // Generate summary
    const summary = await generateVideoSummary(videoInfo, transcriptText);
    
    // Build actionable items for tutorials
    const actionableItems: ActionableItem[] = [];
    if (type === 'tutorial' && cliCommands.length > 0) {
      cliCommands.forEach((cmd, index) => {
        actionableItems.push({
          type: 'step',
          content: `Run: ${cmd.command}`,
          order: index + 1,
        });
      });
    }
    
    const analysis: VideoAnalysis = {
      videoId,
      title: videoInfo.title,
      type,
      keyPoints,
      actionableItems,
      codeSnippets,
      cliCommands,
      summary,
      analysisDate: new Date().toISOString(),
      transcriptAvailable,
    };
    
    console.log(`✅ millAlyzer: Analysis complete for "${videoInfo.title}"`);
    
    return analysis;
    
  } catch (error: any) {
    console.error(`❌ millAlyzer: Analysis failed for ${videoId}:`, error);
    throw new Error(`millAlyzer analysis failed: ${error.message}`);
  }
}

/**
 * Quick analysis - returns only essential information
 */
export async function quickAnalyze(videoId: string): Promise<{
  summary: string;
  type: VideoType;
  hasCode: boolean;
  hasCommands: boolean;
}> {
  try {
    const analysis = await analyzeVideoWithMillAlyzer(videoId);
    
    return {
      summary: analysis.summary,
      type: analysis.type,
      hasCode: analysis.codeSnippets.length > 0,
      hasCommands: analysis.cliCommands.length > 0,
    };
  } catch (error) {
    throw error;
  }
}
