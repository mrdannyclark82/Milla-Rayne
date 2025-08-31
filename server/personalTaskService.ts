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

/**
 * Initialize the personal task system
 */
export async function initializePersonalTaskSystem(): Promise<void> {
  try {
    await loadExistingTasks();
    console.log('Personal task system initialized');
    
    // Start the background task generation
    setInterval(generatePersonalTasksIfNeeded, TASK_GENERATION_INTERVAL);
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
  } catch (error) {
    console.error('Error generating personal tasks:', error);
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
  
  // Diary entry tasks - periodic emotional and relational reflection
  if (context.recentInteractions.length > 0) {
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
 * Get task summary for display
 */
export function getTaskSummary(): { pending: number; inProgress: number; completed: number } {
  return {
    pending: personalTasks.filter(t => t.status === 'pending').length,
    inProgress: personalTasks.filter(t => t.status === 'in_progress').length,
    completed: personalTasks.filter(t => t.status === 'completed').length
  };
}