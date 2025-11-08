import { registerAgent } from './registry';
import { AgentTask } from './taskStorage';
import { analyzeYouTubeVideo, searchVideoMemories } from '../youtubeAnalysisService';

async function handleTask(task: AgentTask): Promise<any> {
    const { action, payload } = task;

    if (action === 'analyze_video') {
        const { url } = payload || {};
        if (!url) throw new Error('Missing url in payload');
        const analysis = await analyzeYouTubeVideo(url);
        return { analysis };
    }

    if (action === 'search') {
        const { query } = payload || {};
        if (!query) throw new Error('Missing query in payload');
        const results = await searchVideoMemories(query);
        return { results };
    }

    throw new Error(`Unknown action for YouTubeAgent: ${action}`);
}

// Register the YouTubeAgent on module load
registerAgent({ name: 'YouTubeAgent', description: 'Search and analyze YouTube videos', handleTask });

export default { handleTask };
