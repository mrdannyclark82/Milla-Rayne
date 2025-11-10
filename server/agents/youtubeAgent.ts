import { registerAgent } from './registry';
import { AgentTask } from './taskStorage';
import {
  analyzeYouTubeVideo,
  searchVideoMemories,
} from '../youtubeAnalysisService';
import { getAmbientContext } from '../realWorldInfoService';

async function handleTask(task: AgentTask): Promise<any> {
  const { action, payload, metadata } = task;
  
  // Get ambient context if userId is available
  const userId = metadata?.userId;
  const ambientContext = userId ? getAmbientContext(userId) : null;

  if (action === 'analyze_video') {
    const { url } = payload || {};
    if (!url) throw new Error('Missing url in payload');
    const analysis = await analyzeYouTubeVideo(url);
    return { analysis };
  }

  if (action === 'search') {
    const { query } = payload || {};
    if (!query) throw new Error('Missing query in payload');
    
    // Adapt search based on ambient context
    let adaptedQuery = query;
    if (ambientContext) {
      // If user is jogging/running, prioritize high-tempo or spoken word content
      if (ambientContext.motionState === 'running' || ambientContext.motionState === 'walking') {
        adaptedQuery = `${query} energetic upbeat high-tempo`;
        console.log(`🏃 Adapted YouTube search for ${ambientContext.motionState} context:`, adaptedQuery);
      }
      
      // If in low light, might prefer audio-focused content
      if (ambientContext.lightLevel < 20) {
        adaptedQuery = `${query} audio podcast spoken word`;
        console.log(`🌙 Adapted YouTube search for low light context:`, adaptedQuery);
      }
      
      // If driving, prioritize safe audio content
      if (ambientContext.motionState === 'driving') {
        adaptedQuery = `${query} audio podcast hands-free`;
        console.log(`🚗 Adapted YouTube search for driving context:`, adaptedQuery);
      }
    }
    
    const results = await searchVideoMemories(adaptedQuery);
    return { results, contextAdapted: ambientContext !== null };
  }

  throw new Error(`Unknown action for YouTubeAgent: ${action}`);
}

// Register the YouTubeAgent on module load
registerAgent({
  name: 'YouTubeAgent',
  description: 'Search and analyze YouTube videos with context-aware adaptation',
  handleTask,
});

export default { handleTask };
