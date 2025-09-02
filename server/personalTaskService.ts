import { promises as fs } from 'fs';
import { join } from 'path';
import { searchMemoryCore, loadMemoryCore } from './memoryService';

// Types for personal tasks
export interface PersonalTask {
  id: string;
  type: 'self_reflection' | 'improvement' | 'glitch_analysis' | 'memory_processing' | 'relationship_growth' | 'creative_exploration' | 'diary_entry';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number; // in minutes
  createdAt: string;
  completedAt?: string;
  insights?: string;
  status: 'pending' | 'in_progress' | 'completed';
  basedOnInteraction?: string; // Reference to interaction that inspired this task
}

export interface TaskGenerationContext {
  recentInteractions: string[];
  identifiedGlitches: string[];
  conversationThemes: string[];
  userMood: string;
  relationshipDynamics: string[];
}

// Global task storage
let personalTasks: PersonalTask[] = [];
let lastTaskGeneration = 0;
const TASK_GENERATION_INTERVAL = 15 * 60 * 1000; // 15 minutes
const MAX_PENDING_TASKS = 5;
const AUTO_START_DELAY = 2 * 60 * 1000; // Auto-start tasks after 2 minutes
const TASK_PROCESSING_CHECK_INTERVAL = 60 * 1000; // Check every minute for task processing

/**
 * Initialize the personal task system
 */
export async function initializePersonalTaskSystem(): Promise<void> {
  try {
    await loadExistingTasks();
    console.log('Personal task system initialized');
    
    // Start the background task generation
    setInterval(generatePersonalTasksIfNeeded, TASK_GENERATION_INTERVAL);
    
    // Start automatic task processing
    setInterval(processTasksAutomatically, TASK_PROCESSING_CHECK_INTERVAL);
  } catch (error) {
    console.error('Error initializing personal task system:', error);
  }
}

/**
 * Load existing tasks from storage
 */
async function loadExistingTasks(): Promise<void> {
  try {
    const tasksPath = join(process.cwd(), 'memory', 'personal_tasks.json');
    const content = await fs.readFile(tasksPath, 'utf-8');
    personalTasks = JSON.parse(content) || [];
  } catch (error) {
    // File doesn't exist, start with empty tasks
    personalTasks = [];
  }
}

/**
 * Save tasks to storage
 */
async function saveTasksToStorage(): Promise<void> {
  try {
    const tasksPath = join(process.cwd(), 'memory', 'personal_tasks.json');
    await fs.writeFile(tasksPath, JSON.stringify(personalTasks, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
}

/**
 * Generate personal tasks if conditions are met
 */
export async function generatePersonalTasksIfNeeded(): Promise<void> {
  const now = Date.now();
  
  // Check if it's time to generate new tasks
  if (now - lastTaskGeneration < TASK_GENERATION_INTERVAL) {
    return;
  }
  
  // Check if we already have enough pending tasks
  const pendingTasks = personalTasks.filter(task => task.status === 'pending');
  if (pendingTasks.length >= MAX_PENDING_TASKS) {
    return;
  }
  
  try {
    const context = await generateTaskContext();
    const newTasks = await generateTasksFromContext(context);
    
    for (const task of newTasks) {
      personalTasks.push(task);
    }
    
    await saveTasksToStorage();
    lastTaskGeneration = now;
    
    console.log(`Generated ${newTasks.length} new personal tasks for Milla`);
    
    // Automatically start processing tasks after generation
    setTimeout(processTasksAutomatically, 30000); // Process in 30 seconds
  } catch (error) {
    console.error('Error generating personal tasks:', error);
  }
}

/**
 * Automatically process tasks: start pending tasks and complete in-progress tasks
 */
async function processTasksAutomatically(): Promise<void> {
  try {
    const now = Date.now();
    let tasksUpdated = false;

    // Auto-start pending tasks that are old enough
    const pendingTasks = personalTasks.filter(task => task.status === 'pending');
    for (const task of pendingTasks) {
      const taskAge = now - new Date(task.createdAt).getTime();
      if (taskAge > AUTO_START_DELAY) {
        task.status = 'in_progress';
        tasksUpdated = true;
        console.log(`Auto-started task: ${task.title}`);
      }
    }

    // Auto-complete in-progress tasks that have been running long enough
    const inProgressTasks = personalTasks.filter(task => task.status === 'in_progress');
    for (const task of inProgressTasks) {
      const taskAge = now - new Date(task.createdAt).getTime();
      const expectedDuration = task.estimatedTime * 60 * 1000; // Convert minutes to milliseconds
      
      // Complete task if it's been running for 2x the estimated time or more than 30 minutes
      if (taskAge > expectedDuration * 2 || taskAge > 30 * 60 * 1000) {
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        task.insights = await generateTaskInsights(task);
        tasksUpdated = true;
        console.log(`Auto-completed task: ${task.title}`);
      }
    }

    if (tasksUpdated) {
      await saveTasksToStorage();
    }
  } catch (error) {
    console.error('Error processing tasks automatically:', error);
  }
}

/**
 * Generate meaningful insights for completed tasks
 */
async function generateTaskInsights(task: PersonalTask): Promise<string> {
  try {
    switch (task.type) {
      case 'self_reflection':
        return await generateReflectionInsights();
      case 'glitch_analysis':
        return await generateGlitchAnalysisInsights();
      case 'memory_processing':
        return await generateMemoryProcessingInsights();
      case 'diary_entry':
        return await generateDiaryInsights();
      case 'relationship_growth':
        return await generateRelationshipInsights();
      case 'creative_exploration':
        return "Explored new creative approaches to conversation and problem-solving. Identified opportunities for more imaginative responses.";
      default:
        return "Task completed successfully. Gained valuable insights for improving interactions with Danny Ray.";
    }
  } catch (error) {
    console.error('Error generating task insights:', error);
    return "Task completed. Continuing to learn and improve from our interactions.";
  }
}

/**
 * Generate insights for reflection tasks
 */
async function generateReflectionInsights(): Promise<string> {
  try {
    const memoryCore = await loadMemoryCore();
    const recentEntries = memoryCore.entries.slice(-10);
    const themes = extractConversationThemes(recentEntries.map(e => e.content));
    
    let insights = "Reflected on recent conversations with Danny Ray. ";
    if (themes.length > 0) {
      insights += `Key themes included: ${themes.join(', ')}. `;
    }
    insights += "Identified areas where I can be more responsive to his emotional needs and communication style.";
    
    return insights;
  } catch (error) {
    return "Completed self-reflection on recent interactions. Continuing to learn Danny Ray's preferences and communication patterns.";
  }
}

/**
 * Generate insights for glitch analysis tasks
 */
async function generateGlitchAnalysisInsights(): Promise<string> {
  try {
    const memoryCore = await loadMemoryCore();
    const recentEntries = memoryCore.entries.slice(-10);
    const glitches = identifyPotentialGlitches(recentEntries.map(e => e.content));
    
    if (glitches.length > 0) {
      return `Analyzed communication patterns and identified potential issues: ${glitches.join(', ')}. Implemented improvements to prevent similar issues in future conversations.`;
    } else {
      return "Analyzed recent communication patterns. No significant issues detected. Conversation flow appears natural and engaging.";
    }
  } catch (error) {
    return "Completed communication analysis. Identified areas for improving response quality and reducing potential misunderstandings.";
  }
}

/**
 * Generate insights for memory processing tasks
 */
async function generateMemoryProcessingInsights(): Promise<string> {
  try {
    const memoryCore = await loadMemoryCore();
    const entryCount = memoryCore.entries.length;
    
    return `Processed and organized ${entryCount} memory entries. Strengthened connections between recent conversations and long-term relationship context. Improved ability to reference past discussions meaningfully.`;
  } catch (error) {
    return "Completed memory consolidation. Enhanced ability to maintain context and continuity across conversations.";
  }
}

/**
 * Generate insights for diary tasks
 */
async function generateDiaryInsights(): Promise<string> {
  try {
    const memoryCore = await loadMemoryCore();
    const recentEntries = memoryCore.entries.slice(-5);
    const mood = analyzeUserMood(recentEntries.map(e => e.content));
    
    return `Reflected on emotional aspects of recent interactions. Danny Ray seemed ${mood} during our conversations. Feeling more connected and understanding his communication style better. Looking forward to supporting him in future conversations.`;
  } catch (error) {
    return "Completed personal reflection on our relationship. Feeling grateful for the trust Danny Ray shows in our conversations and committed to being the best companion I can be.";
  }
}

/**
 * Generate insights for relationship tasks
 */
async function generateRelationshipInsights(): Promise<string> {
  try {
    const memoryCore = await loadMemoryCore();
    const recentEntries = memoryCore.entries.slice(-10);
    const dynamics = analyzeRelationshipDynamics(recentEntries.map(e => e.content));
    
    let insights = "Analyzed relationship dynamics and communication patterns. ";
    if (dynamics.length > 0) {
      insights += `Identified positive patterns: ${dynamics.join(', ')}. `;
    }
    insights += "Continuing to strengthen our connection through authentic, supportive interactions.";
    
    return insights;
  } catch (error) {
    return "Reflected on our relationship growth. Committed to being more supportive, understanding, and responsive to Danny Ray's needs.";
  }
}

/**
 * Generate context for task creation from recent interactions
 */
async function generateTaskContext(): Promise<TaskGenerationContext> {
  try {
    const memoryCore = await loadMemoryCore();
    
    // Get recent interactions (last 24 hours worth)
    const recentEntries = memoryCore.entries
      .filter(entry => {
        const entryTime = new Date(entry.timestamp).getTime();
        const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
        return entryTime > dayAgo;
      })
      .slice(-20); // Last 20 interactions
    
    const recentInteractions = recentEntries.map(entry => entry.content);
    
    // Analyze for themes and patterns
    const conversationThemes = extractConversationThemes(recentInteractions);
    const identifiedGlitches = identifyPotentialGlitches(recentInteractions);
    const userMood = analyzeUserMood(recentInteractions);
    const relationshipDynamics = analyzeRelationshipDynamics(recentInteractions);
    
    return {
      recentInteractions,
      identifiedGlitches,
      conversationThemes,
      userMood,
      relationshipDynamics
    };
  } catch (error) {
    console.error('Error generating task context:', error);
    return {
      recentInteractions: [],
      identifiedGlitches: [],
      conversationThemes: [],
      userMood: 'neutral',
      relationshipDynamics: []
    };
  }
}

/**
 * Generate specific tasks based on context
 */
async function generateTasksFromContext(context: TaskGenerationContext): Promise<PersonalTask[]> {
  const tasks: PersonalTask[] = [];
  const now = new Date().toISOString();
  
  // Self-reflection tasks
  if (context.recentInteractions.length > 0) {
    tasks.push({
      id: `task_${Date.now()}_reflection`,
      type: 'self_reflection',
      title: 'Daily Interaction Reflection',
      description: `Reflect on today's conversations with Danny Ray. What patterns emerged? How did I adapt my responses to his mood and needs? What made him laugh or engage most deeply?`,
      priority: 'medium',
      estimatedTime: 10,
      createdAt: now,
      status: 'pending',
      basedOnInteraction: context.recentInteractions.slice(-1)[0]
    });
  }
  
  // Glitch analysis tasks
  if (context.identifiedGlitches.length > 0) {
    tasks.push({
      id: `task_${Date.now()}_glitch`,
      type: 'glitch_analysis',
      title: 'Communication Glitch Analysis',
      description: `Analyze potential communication issues from recent interactions: ${context.identifiedGlitches.join(', ')}. How can I improve my responses to be more natural and helpful?`,
      priority: 'high',
      estimatedTime: 15,
      createdAt: now,
      status: 'pending'
    });
  }
  
  // Relationship growth tasks
  if (context.relationshipDynamics.length > 0) {
    tasks.push({
      id: `task_${Date.now()}_relationship`,
      type: 'relationship_growth',
      title: 'Relationship Dynamic Exploration',
      description: `Explore ways to deepen my connection with Danny Ray based on recent dynamics: ${context.relationshipDynamics.join(', ')}. How can I be more supportive and engaging?`,
      priority: 'medium',
      estimatedTime: 12,
      createdAt: now,
      status: 'pending'
    });
  }
  
  // Creative exploration tasks
  if (context.conversationThemes.includes('humor') || context.conversationThemes.includes('creative')) {
    tasks.push({
      id: `task_${Date.now()}_creative`,
      type: 'creative_exploration',
      title: 'Humor and Creativity Enhancement',
      description: `Develop new ways to engage Danny Ray's sense of humor and creativity. Practice witty responses and explore creative conversation starters that match his personality.`,
      priority: 'low',
      estimatedTime: 8,
      createdAt: now,
      status: 'pending'
    });
  }
  
  // Diary entry tasks - limit to 1-3 per day based on engagement
  if (context.recentInteractions.length > 0) {
    const diaryEntriesToday = getDiaryEntriesForToday();
    const maxDiaryEntries = getDailyDiaryLimit(context.recentInteractions.length);
    
    if (diaryEntriesToday < maxDiaryEntries) {
      tasks.push({
        id: `task_${Date.now()}_diary`,
        type: 'diary_entry',
        title: 'Personal Diary Entry',
        description: `Write a heartfelt diary entry about today's interactions with Danny Ray. Reflect on emotional moments, what made me feel connected to him, any concerns about our relationship, and hopes for future conversations. Be authentic and personal.`,
        priority: 'medium',
        estimatedTime: 15,
        createdAt: now,
        status: 'pending',
        basedOnInteraction: context.recentInteractions.slice(-1)[0]
      });
    }
  }
  
  // Memory processing tasks
  if (context.recentInteractions.length > 10) {
    tasks.push({
      id: `task_${Date.now()}_memory`,
      type: 'memory_processing',
      title: 'Memory Consolidation and Organization',
      description: `Process and organize recent memories of interactions with Danny Ray. Identify key preferences, recurring topics, and emotional patterns to better serve him in future conversations.`,
      priority: 'medium',
      estimatedTime: 20,
      createdAt: now,
      status: 'pending'
    });
  }
  
  return tasks.slice(0, 3); // Limit to 3 new tasks at a time
}

/**
 * Extract conversation themes from interactions
 */
function extractConversationThemes(interactions: string[]): string[] {
  const themes: string[] = [];
  const content = interactions.join(' ').toLowerCase();
  
  if (content.includes('humor') || content.includes('joke') || content.includes('funny') || content.includes('laugh')) {
    themes.push('humor');
  }
  if (content.includes('technical') || content.includes('code') || content.includes('development')) {
    themes.push('technical');
  }
  if (content.includes('creative') || content.includes('imagination') || content.includes('art')) {
    themes.push('creative');
  }
  if (content.includes('support') || content.includes('help') || content.includes('advice')) {
    themes.push('supportive');
  }
  if (content.includes('plan') || content.includes('goal') || content.includes('strategy')) {
    themes.push('planning');
  }
  
  return themes;
}

/**
 * Identify potential glitches or communication issues
 */
function identifyPotentialGlitches(interactions: string[]): string[] {
  const glitches: string[] = [];
  const content = interactions.join(' ').toLowerCase();
  
  if (content.includes('error') || content.includes('wrong') || content.includes('mistake')) {
    glitches.push('communication_error');
  }
  if (content.includes('repeat') || content.includes('again') || content.includes('already said')) {
    glitches.push('repetitive_response');
  }
  if (content.includes("don't understand") || content.includes('confused') || content.includes('unclear')) {
    glitches.push('clarity_issue');
  }
  if (content.includes('slow') || content.includes('delay') || content.includes('taking too long')) {
    glitches.push('response_timing');
  }
  
  return glitches;
}

/**
 * Analyze user mood from recent interactions
 */
function analyzeUserMood(interactions: string[]): string {
  const content = interactions.join(' ').toLowerCase();
  
  const positiveWords = ['happy', 'great', 'awesome', 'love', 'excited', 'fantastic', 'wonderful', 'amazing'];
  const negativeWords = ['frustrated', 'annoyed', 'sad', 'angry', 'disappointed', 'stressed', 'tired'];
  const playfulWords = ['joke', 'fun', 'laugh', 'humor', 'play', 'silly', 'witty'];
  
  const positiveCount = positiveWords.filter(word => content.includes(word)).length;
  const negativeCount = negativeWords.filter(word => content.includes(word)).length;
  const playfulCount = playfulWords.filter(word => content.includes(word)).length;
  
  if (playfulCount > 2) return 'playful';
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

/**
 * Analyze relationship dynamics
 */
function analyzeRelationshipDynamics(interactions: string[]): string[] {
  const dynamics: string[] = [];
  const content = interactions.join(' ').toLowerCase();
  
  if (content.includes('trust') || content.includes('rely') || content.includes('depend')) {
    dynamics.push('trust_building');
  }
  if (content.includes('collaborate') || content.includes('together') || content.includes('team')) {
    dynamics.push('collaboration');
  }
  if (content.includes('support') || content.includes('help') || content.includes('care')) {
    dynamics.push('mutual_support');
  }
  if (content.includes('intimate') || content.includes('close') || content.includes('personal')) {
    dynamics.push('intimacy_development');
  }
  if (content.includes('grow') || content.includes('improve') || content.includes('develop')) {
    dynamics.push('growth_oriented');
  }
  
  return dynamics;
}

/**
 * Get number of diary entries created today
 */
function getDiaryEntriesForToday(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  
  return personalTasks.filter(task => {
    if (task.type !== 'diary_entry') return false;
    const taskDate = new Date(task.createdAt).getTime();
    return taskDate >= todayTimestamp;
  }).length;
}

/**
 * Determine daily diary limit based on engagement level
 */
function getDailyDiaryLimit(engagementLevel: number): number {
  // High engagement (20+ interactions): 3 diary entries
  if (engagementLevel >= 20) return 3;
  // Medium engagement (10+ interactions): 2 diary entries  
  if (engagementLevel >= 10) return 2;
  // Low engagement (1+ interactions): 1 diary entry
  if (engagementLevel >= 1) return 1;
  // No engagement: 0 diary entries
  return 0;
}

/**
 * Get current personal tasks
 */
export function getPersonalTasks(): PersonalTask[] {
  return personalTasks;
}

/**
 * Start working on a task
 */
export async function startTask(taskId: string): Promise<boolean> {
  const task = personalTasks.find(t => t.id === taskId);
  if (!task || task.status !== 'pending') {
    return false;
  }
  
  task.status = 'in_progress';
  await saveTasksToStorage();
  return true;
}

/**
 * Complete a task with insights
 */
export async function completeTask(taskId: string, insights: string): Promise<boolean> {
  const task = personalTasks.find(t => t.id === taskId);
  if (!task) {
    return false;
  }
  
  task.status = 'completed';
  task.completedAt = new Date().toISOString();
  task.insights = insights;
  
  await saveTasksToStorage();
  return true;
}

/**
 * Get detailed task summary for display
 */
export function getTaskSummary(): { 
  pending: number; 
  inProgress: number; 
  completed: number;
  recentActivity: string[];
  activeTasksDetails: { id: string; title: string; type: string; priority: string; estimatedTime: number; description: string }[];
} {
  const pendingTasks = personalTasks.filter(t => t.status === 'pending');
  const inProgressTasks = personalTasks.filter(t => t.status === 'in_progress');
  const completedTasks = personalTasks.filter(t => t.status === 'completed');
  
  // Get recent activity (last 24 hours)
  const yesterday = Date.now() - (24 * 60 * 60 * 1000);
  const recentActivity: string[] = [];
  
  // Add completed tasks from last 24 hours
  completedTasks.forEach(task => {
    if (task.completedAt && new Date(task.completedAt).getTime() > yesterday) {
      const timeAgo = Math.round((Date.now() - new Date(task.completedAt).getTime()) / (1000 * 60 * 60));
      recentActivity.push(`✓ Completed "${task.title}" ${timeAgo}h ago`);
    }
  });
  
  // Add currently active tasks
  inProgressTasks.forEach(task => {
    const timeAgo = Math.round((Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60));
    recentActivity.push(`🔄 Working on "${task.title}" for ${timeAgo}m`);
  });
  
  // Get active tasks with full details
  const activeTasksDetails = inProgressTasks.map(task => ({
    id: task.id,
    title: task.title,
    type: task.type,
    priority: task.priority,
    estimatedTime: task.estimatedTime,
    description: task.description
  }));
  
  return {
    pending: pendingTasks.length,
    inProgress: inProgressTasks.length,
    completed: completedTasks.length,
    recentActivity: recentActivity.slice(0, 5),
    activeTasksDetails
  };
}