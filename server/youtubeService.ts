/**
 * YouTube Integration Service
 * Handles YouTube search, recommendations, and video playback
 */

import { searchVideos, getTrendingVideos } from './googleYoutubeService';
import { trackYouTubeWatch, predictYouTubeQuery, getPersonalizedSuggestions } from './youtubePredictionService';

export interface YouTubeResponse {
  content: string;
  videoId?: string;
  videos?: Array<{
    id: string;
    title: string;
    channel: string;
    thumbnail?: string;
  }>;
}

/**
 * Detects if the user message is YouTube-related
 */
export function isYouTubeRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Only trigger if "youtube" is explicitly mentioned
  return lowerMessage.includes('youtube');
}

/**
 * Extracts search query from user message
 */
function extractSearchQuery(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Remove common trigger phrases to get the core query
  let query = lowerMessage
    .replace(/youtube/gi, '')
    .replace(/show me|find|search for|play|watch|look for|get/gi, '')
    .replace(/videos? about|videos? on|videos? of/gi, '')
    .replace(/on youtube/gi, '')
    .trim();
  
  return query;
}

/**
 * Determines the action type from user message
 */
function getYouTubeAction(message: string): 'search' | 'recommend' | 'trending' {
  const lowerMessage = message.toLowerCase();
  
  if (
    lowerMessage.includes('recommend') ||
    lowerMessage.includes('suggest') ||
    lowerMessage.includes('what should i watch')
  ) {
    return 'recommend';
  }
  
  if (
    lowerMessage.includes('trending') ||
    lowerMessage.includes('popular') ||
    lowerMessage.includes('viral')
  ) {
    return 'trending';
  }
  
  return 'search';
}

/**
 * Main YouTube handler
 */
export async function handleYouTubeRequest(
  userMessage: string,
  userId: string = 'default-user'
): Promise<YouTubeResponse> {
  try {
    // First, check if message contains a direct YouTube URL/video ID
    const urlMatch = userMessage.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const videoIdMatch = userMessage.match(/\b([a-zA-Z0-9_-]{11})\b/);
    const directVideoId = urlMatch?.[1] || (videoIdMatch?.[1] && !userMessage.includes(' ') ? videoIdMatch[1] : null);
    
    if (directVideoId) {
      console.log('🎬 Direct video ID detected:', directVideoId);
      return {
        content: `*queues up the video* Playing your video now, love! 💜`,
        videoId: directVideoId,
      };
    }
    
    const action = getYouTubeAction(userMessage);
    
    // Handle recommendations
    if (action === 'recommend') {
      const suggestions = await getPersonalizedSuggestions();
      const predictions = await predictYouTubeQuery();
      
      return {
        content: `*pulls up personalized recommendations* ${suggestions}\n\n💜 Based on your viewing history, you might enjoy:\n${predictions.slice(0, 5).map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nJust let me know which one sounds good, babe!`,
      };
    }
    
    // Handle trending videos
    if (action === 'trending') {
      const result = await getTrendingVideos(userId, 'US', 10);
      
      if (result.success && result.data && result.data.length > 0) {
        const videos = result.data.slice(0, 5).map((video: any) => ({
          id: video.id,
          title: video.snippet.title,
          channel: video.snippet.channelTitle,
          thumbnail: video.snippet.thumbnails?.medium?.url,
        }));
        
        let response = "*checking what's trending right now* Here are the hottest videos on YouTube:\n\n";
        videos.forEach((video, index) => {
          response += `${index + 1}. **${video.title}** by ${video.channel}\n`;
        });
        response += "\nWhich one catches your eye, love?";
        
        return {
          content: response,
          videos,
        };
      } else {
        return {
          content: "I'm having trouble accessing trending videos right now, babe. Try again in a moment?",
        };
      }
    }
    
    // Handle search
    const query = extractSearchQuery(userMessage);
    
    if (!query || query.length < 2) {
      return {
        content: "What kind of YouTube videos are you looking for, sweetheart? Tell me more about what you want to watch!",
      };
    }
    
    console.log('🔍 YouTube search query:', query);
    
    const result = await searchVideos(userId, query, 5, 'relevance');
    
    if (result.success && result.data && result.data.length > 0) {
      const firstVideo = result.data[0];
      
      // Track this search for future recommendations
      await trackYouTubeWatch(
        firstVideo.id.videoId,
        firstVideo.snippet.title,
        query,
        firstVideo.snippet.channelTitle
      );
      
      // If search is very specific, auto-play the first result
      const isSpecific = query.length > 20 || query.split(' ').length > 4;
      
      if (isSpecific || result.data.length === 1) {
        const videoId = firstVideo.id.videoId;
        const predictions = await predictYouTubeQuery(query);
        
        let predictionText = '';
        if (predictions.length > 0) {
          predictionText = `\n\n💡 You might also like: ${predictions.slice(0, 3).join(', ')}`;
        }
        
        return {
          content: `*queues up the video* Playing "${firstVideo.snippet.title}" by ${firstVideo.snippet.channelTitle}${predictionText}`,
          videoId,
        };
      }
      
      // Show multiple options
      const videos = result.data.map((video: any) => ({
        id: video.id.videoId,
        title: video.snippet.title,
        channel: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails?.medium?.url,
      }));
      
      let response = `*browsing YouTube* I found ${videos.length} videos for "${query}":\n\n`;
      videos.forEach((video, index) => {
        response += `${index + 1}. **${video.title}** by ${video.channel}\n`;
      });
      
      // Add predictions based on search
      const predictions = await predictYouTubeQuery(query);
      if (predictions.length > 0) {
        response += `\n💜 You might also enjoy: ${predictions.slice(0, 3).join(', ')}`;
      }
      
      response += `\n\nWhich one would you like to watch, babe? Just tell me the number!`;
      
      return {
        content: response,
        videos,
      };
    } else {
      // Search failed
      const predictions = await predictYouTubeQuery(query);
      let fallbackText = `I couldn't find any videos for "${query}".`;
      
      if (result.error === 'NO_TOKEN') {
        fallbackText += " You'll need to add a GOOGLE_API_KEY to your .env file or connect your Google account.";
      }
      
      if (predictions.length > 0) {
        fallbackText += `\n\n💡 Based on your history, you might like: ${predictions.slice(0, 3).join(', ')}`;
      }
      
      return {
        content: fallbackText,
      };
    }
  } catch (error) {
    console.error('[YouTube Service] Error:', error);
    return {
      content: "I'm having a little trouble with YouTube right now, love. Can you try again in a moment?",
    };
  }
}

/**
 * Handles number selection from search results
 */
export async function handleYouTubeSelection(
  selection: number,
  videos: Array<{ id: string; title: string; channel: string }>
): Promise<YouTubeResponse> {
  if (selection < 1 || selection > videos.length) {
    return {
      content: `I need a number between 1 and ${videos.length}, babe!`,
    };
  }
  
  const selectedVideo = videos[selection - 1];
  const predictions = await predictYouTubeQuery(selectedVideo.title);
  
  let predictionText = '';
  if (predictions.length > 0) {
    predictionText = `\n\n💡 After this, you might like: ${predictions.slice(0, 3).join(', ')}`;
  }
  
  return {
    content: `*starts playing* "${selectedVideo.title}" by ${selectedVideo.channel}${predictionText}`,
    videoId: selectedVideo.id,
  };
}
