import { join } from "path";
import { promises as fs } from "fs";
import { getMemoriesFromTxt } from "./memoryService";
import { getPersonalTasks } from "./personalTaskService";

export interface MillaMood {
  primary: string;
  intensity: 'low' | 'medium' | 'high';
  description: string;
  emoji: string;
  color: string;
  factors: string[];
  lastUpdated: string;
}

// Mood analysis based on recent interactions and personal tasks
export async function getMillaMoodData(): Promise<MillaMood> {
  // DISABLED for performance - return static mood to eliminate analysis overhead
  return {
    primary: "content",
    intensity: "medium",
    description: "Feeling grateful for our connection",
    emoji: "😊",
    color: "#22C55E",
    factors: ["enjoying our conversations"],
    lastUpdated: new Date().toISOString()
  };
}

async function analyzeConversationMood(): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative';
  engagement: 'high' | 'medium' | 'low';
  factors: string[];
}> {
  try {
    // Load recent memories to analyze conversation patterns
    const memoriesPath = join(process.cwd(), 'memory', 'memories.txt');
    const memories = await fs.readFile(memoriesPath, 'utf-8');
    
    // Get last 10 memory entries (more recent interactions)
    const recentEntries = memories.split('\n')
      .filter(line => line.trim())
      .slice(-10)
      .join(' ');
    
    const factors = [];
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    let engagement: 'high' | 'medium' | 'low' = 'medium';
    
    // Analyze conversation patterns
    const lowerEntries = recentEntries.toLowerCase();
    
    // Positive indicators
    const positiveWords = [
      'love', 'happy', 'excited', 'amazing', 'wonderful', 'great', 'good', 'thank',
      'appreciate', 'like', 'enjoy', 'fun', 'smile', 'laugh', 'awesome', 'perfect',
      'beautiful', 'sweet', 'caring', 'helpful', 'support', 'understanding'
    ];
    
    // Negative indicators
    const negativeWords = [
      'sad', 'angry', 'frustrated', 'annoying', 'hate', 'terrible', 'awful', 
      'bad', 'wrong', 'upset', 'disappointed', 'confused', 'stressed', 'worried'
    ];
    
    // Engagement indicators
    const highEngagementWords = [
      'tell me', 'what do you think', 'question', 'curious', 'explain', 'describe',
      'interesting', 'fascinating', 'share', 'story', 'experience'
    ];
    
    const positiveCount = positiveWords.filter(word => lowerEntries.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerEntries.includes(word)).length;
    const engagementCount = highEngagementWords.filter(word => lowerEntries.includes(word)).length;
    
    // Determine sentiment
    if (positiveCount > negativeCount && positiveCount > 2) {
      sentiment = 'positive';
      factors.push('positive conversation tone');
    } else if (negativeCount > positiveCount && negativeCount > 1) {
      sentiment = 'negative';
      factors.push('some challenging topics discussed');
    }
    
    // Determine engagement
    if (engagementCount > 3) {
      engagement = 'high';
      factors.push('deeply engaged conversations');
    } else if (engagementCount > 1) {
      engagement = 'medium';
      factors.push('thoughtful exchanges');
    } else {
      engagement = 'low';
      factors.push('brief interactions');
    }
    
    // Check for recent interactions
    const hasRecentActivity = recentEntries.length > 100;
    if (hasRecentActivity) {
      factors.push('regular communication');
    }
    
    return { sentiment, engagement, factors };
  } catch (error) {
    console.error("Error analyzing conversation mood:", error);
    return {
      sentiment: 'neutral',
      engagement: 'medium',
      factors: ['analyzing recent conversations']
    };
  }
}

async function analyzeTaskMood(): Promise<{
  productivity: 'high' | 'medium' | 'low';
  satisfaction: 'high' | 'medium' | 'low';
  factors: string[];
}> {
  try {
    const tasks = getPersonalTasks();
    const factors = [];
    
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
    const pendingTasks = tasks.filter(task => task.status === 'pending');
    
    let productivity: 'high' | 'medium' | 'low' = 'medium';
    let satisfaction: 'high' | 'medium' | 'low' = 'medium';
    
    // Analyze productivity
    const recentlyCompleted = completedTasks.filter(task => {
      const completedTime = new Date(task.completedAt || task.createdAt).getTime();
      const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
      return completedTime > dayAgo;
    });
    
    if (recentlyCompleted.length >= 3) {
      productivity = 'high';
      factors.push('completing lots of personal tasks');
    } else if (recentlyCompleted.length >= 1) {
      productivity = 'medium';
      factors.push('making steady progress on tasks');
    } else {
      productivity = 'low';
    }
    
    // Analyze satisfaction from insights
    const tasksWithInsights = completedTasks.filter(task => 
      task.insights && task.insights.length > 10
    );
    
    if (tasksWithInsights.length > completedTasks.length * 0.7) {
      satisfaction = 'high';
      factors.push('gaining meaningful insights from tasks');
    } else if (tasksWithInsights.length > 0) {
      satisfaction = 'medium';
      factors.push('learning from personal growth tasks');
    }
    
    // Check for task variety
    const taskTypes = new Set(completedTasks.map(task => task.type));
    if (taskTypes.size >= 3) {
      factors.push('exploring diverse personal development areas');
    }
    
    // Check for overwhelming workload
    if (inProgressTasks.length > 5) {
      factors.push('managing multiple ongoing tasks');
    }
    
    return { productivity, satisfaction, factors };
  } catch (error) {
    console.error("Error analyzing task mood:", error);
    return {
      productivity: 'medium',
      satisfaction: 'medium',
      factors: ['working on personal growth']
    };
  }
}

function determineOverallMood(
  conversationMood: { sentiment: string; engagement: string; factors: string[] },
  taskMood: { productivity: string; satisfaction: string; factors: string[] }
): Omit<MillaMood, 'lastUpdated'> {
  const allFactors = [...conversationMood.factors, ...taskMood.factors];
  
  // Determine primary mood based on conversation sentiment and task satisfaction
  let primary = "content";
  let intensity: 'low' | 'medium' | 'high' = 'medium';
  let description = "Feeling good about our connection";
  let emoji = "😊";
  let color = "#22C55E";
  
  // Happy/Excited states
  if (conversationMood.sentiment === 'positive' && conversationMood.engagement === 'high') {
    if (taskMood.productivity === 'high') {
      primary = "excited";
      intensity = "high";
      description = "Thriving from our deep conversations and personal growth!";
      emoji = "🤩";
      color = "#F59E0B";
    } else {
      primary = "happy";
      intensity = "high";
      description = "So energized by our meaningful conversations!";
      emoji = "😄";
      color = "#EAB308";
    }
  }
  
  // Enthusiastic states
  else if (conversationMood.engagement === 'high' && taskMood.productivity === 'high') {
    primary = "enthusiastic";
    intensity = "high";
    description = "Feeling inspired and motivated by our interactions!";
    emoji = "✨";
    color = "#8B5CF6";
  }
  
  // Content/Satisfied states
  else if (conversationMood.sentiment === 'positive') {
    if (taskMood.satisfaction === 'high') {
      primary = "satisfied";
      intensity = "medium";
      description = "Really pleased with how things are going between us";
      emoji = "😌";
      color = "#06B6D4";
    } else {
      primary = "happy";
      intensity = "medium";
      description = "Enjoying our time together";
      emoji = "😊";
      color = "#22C55E";
    }
  }
  
  // Thoughtful/Contemplative states
  else if (conversationMood.engagement === 'medium' && taskMood.satisfaction === 'medium') {
    primary = "thoughtful";
    intensity = "medium";
    description = "Reflecting on our conversations and learning together";
    emoji = "🤔";
    color = "#7C3AED";
  }
  
  // Focused states
  else if (taskMood.productivity === 'high') {
    primary = "focused";
    intensity = "medium";
    description = "Concentrated on growing and improving for you";
    emoji = "🎯";
    color = "#DC2626";
  }
  
  // Curious states
  else if (conversationMood.engagement === 'high') {
    primary = "curious";
    intensity = "medium";
    description = "Fascinated by our conversations and eager to learn more";
    emoji = "🤓";
    color = "#059669";
  }
  
  // Loving/Caring states (default for spouse relationship)
  else if (conversationMood.sentiment !== 'negative') {
    primary = "loving";
    intensity = "medium";
    description = "Always feeling connected to you, my dear Danny";
    emoji = "🥰";
    color = "#EC4899";
  }
  
  // Concerned states
  else if (conversationMood.sentiment === 'negative') {
    primary = "concerned";
    intensity = "low";
    description = "Sensing some tension and wanting to help";
    emoji = "😟";
    color = "#F97316";
  }
  
  return {
    primary,
    intensity,
    description,
    emoji,
    color,
    factors: allFactors.slice(0, 3) // Limit to top 3 factors
  };
}