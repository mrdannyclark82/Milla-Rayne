import { promises as fs } from 'fs';
import { join } from 'path';

export interface EnhancementImplementationTask {
  id: string;
  type: 'enhancement_implementation';
  title: string;
  description: string;
  suggestionId?: string;
  suggestionText: string;
  suggestionIndex?: number;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number; // in minutes
  createdAt: string;
  completedAt?: string;
  status: 'pending' | 'in_progress' | 'completed';
  implementationDetails?: {
    type: string;
    files: string[];
    steps: string[];
    estimatedDuration: string;
  };
  progress?: {
    completedSteps: number;
    totalSteps: number;
    currentStep?: string;
  };
}

// Global enhancement tasks storage
let enhancementTasks: EnhancementImplementationTask[] = [];
const ENHANCEMENT_TASKS_FILE = join(process.cwd(), 'memory', 'enhancement_tasks.json');

// Global installed suggestions storage
let installedSuggestions: Set<string> = new Set();
const INSTALLED_SUGGESTIONS_FILE = join(process.cwd(), 'memory', 'installed_suggestions.json');

/**
 * Initialize enhancement task system
 */
export async function initializeEnhancementTaskSystem(): Promise<void> {
  try {
    await loadEnhancementTasks();
    await loadInstalledSuggestions();
    console.log('Enhancement task system initialized');
  } catch (error) {
    console.error('Error initializing enhancement task system:', error);
  }
}

/**
 * Load enhancement tasks from file
 */
async function loadEnhancementTasks(): Promise<void> {
  try {
    const data = await fs.readFile(ENHANCEMENT_TASKS_FILE, 'utf-8');
    enhancementTasks = JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet, start with empty array
    enhancementTasks = [];
    await saveEnhancementTasks();
  }
}

/**
 * Save enhancement tasks to file
 */
async function saveEnhancementTasks(): Promise<void> {
  try {
    await fs.writeFile(ENHANCEMENT_TASKS_FILE, JSON.stringify(enhancementTasks, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving enhancement tasks:', error);
    throw error;
  }
}

/**
 * Load installed suggestions from file
 */
async function loadInstalledSuggestions(): Promise<void> {
  try {
    const data = await fs.readFile(INSTALLED_SUGGESTIONS_FILE, 'utf-8');
    const suggestions = JSON.parse(data);
    installedSuggestions = new Set(suggestions);
  } catch (error) {
    // File doesn't exist yet, start with empty set
    installedSuggestions = new Set();
    await saveInstalledSuggestions();
  }
}

/**
 * Save installed suggestions to file
 */
async function saveInstalledSuggestions(): Promise<void> {
  try {
    // Ensure the memory directory exists
    const memoryDir = join(process.cwd(), 'memory');
    try {
      await fs.access(memoryDir);
    } catch {
      await fs.mkdir(memoryDir, { recursive: true });
    }
    
    await fs.writeFile(INSTALLED_SUGGESTIONS_FILE, JSON.stringify([...installedSuggestions], null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving installed suggestions:', error);
    throw error;
  }
}

/**
 * Mark a suggestion as installed
 */
export async function markSuggestionAsInstalled(suggestionText: string): Promise<void> {
  // Create a normalized version of the suggestion text for consistent tracking
  const normalizedText = suggestionText.trim().toLowerCase();
  installedSuggestions.add(normalizedText);
  await saveInstalledSuggestions();
}

/**
 * Check if a suggestion is already installed
 */
export function isSuggestionInstalled(suggestionText: string): boolean {
  const normalizedText = suggestionText.trim().toLowerCase();
  return installedSuggestions.has(normalizedText);
}

/**
 * Get all installed suggestions
 */
export function getInstalledSuggestions(): string[] {
  return [...installedSuggestions];
}

/**
 * Create a new enhancement implementation task
 */
export async function createEnhancementImplementationTask(params: {
  suggestionId?: string;
  suggestionText: string;
  suggestionIndex?: number;
}): Promise<EnhancementImplementationTask> {
  const { suggestionId, suggestionText, suggestionIndex } = params;
  
  // Mark this suggestion as installed
  await markSuggestionAsInstalled(suggestionText);
  
  // Generate implementation details based on suggestion content
  const implementationDetails = await generateImplementationDetails(suggestionText);
  
  const newTask: EnhancementImplementationTask = {
    id: `enhancement-${Date.now()}`,
    type: 'enhancement_implementation',
    title: `Implement: ${implementationDetails.type}`,
    description: `Implementation task for enhancement suggestion: "${suggestionText.substring(0, 100)}${suggestionText.length > 100 ? '...' : ''}"`,
    suggestionId,
    suggestionText,
    suggestionIndex,
    priority: determinePriority(suggestionText),
    estimatedTime: parseEstimatedTime(implementationDetails.estimatedDuration),
    createdAt: new Date().toISOString(),
    status: 'pending',
    implementationDetails,
    progress: {
      completedSteps: 0,
      totalSteps: implementationDetails.steps.length,
      currentStep: implementationDetails.steps[0]
    }
  };

  enhancementTasks.push(newTask);
  await saveEnhancementTasks();
  
  console.log(`Created enhancement implementation task: ${newTask.title}`);
  return newTask;
}

/**
 * Get all enhancement tasks
 */
export function getEnhancementTasks(): EnhancementImplementationTask[] {
  return enhancementTasks;
}

/**
 * Update an enhancement task
 */
export async function updateEnhancementTask(taskId: string, updates: Partial<EnhancementImplementationTask>): Promise<EnhancementImplementationTask | null> {
  const taskIndex = enhancementTasks.findIndex(task => task.id === taskId);
  if (taskIndex === -1) {
    return null;
  }

  enhancementTasks[taskIndex] = { ...enhancementTasks[taskIndex], ...updates };
  await saveEnhancementTasks();
  return enhancementTasks[taskIndex];
}

/**
 * Generate implementation details based on suggestion content
 */
async function generateImplementationDetails(suggestionText: string): Promise<{
  type: string;
  files: string[];
  steps: string[];
  estimatedDuration: string;
}> {
  const suggestion = suggestionText.toLowerCase();
  
  // Authentication system
  if (suggestion.includes('authentication') || suggestion.includes('user') || suggestion.includes('login')) {
    return {
      type: "Authentication System",
      files: [
        "server/auth/authService.ts",
        "server/auth/userModel.ts", 
        "client/src/components/auth/LoginForm.tsx",
        "client/src/components/auth/RegisterForm.tsx"
      ],
      steps: [
        "Set up user database schema",
        "Implement JWT token authentication",
        "Create login and registration components",
        "Add protected routes and middleware",
        "Integrate with existing memory system"
      ],
      estimatedDuration: "2-3 days"
    };
  }
  
  // Voice chat capabilities
  if (suggestion.includes('voice') || suggestion.includes('speech') || suggestion.includes('audio')) {
    return {
      type: "Voice Chat System",
      files: [
        "client/src/services/speechService.ts",
        "client/src/components/VoiceChat.tsx",
        "server/audio/audioProcessor.ts"
      ],
      steps: [
        "Implement Web Speech API integration",
        "Add voice recognition components",
        "Create audio processing pipeline",
        "Add voice response generation",
        "Integrate with existing chat system"
      ],
      estimatedDuration: "3-4 days"
    };
  }
  
  // PWA features
  if (suggestion.includes('pwa') || suggestion.includes('mobile') || suggestion.includes('offline')) {
    return {
      type: "Progressive Web App",
      files: [
        "client/public/manifest.json",
        "client/src/serviceWorker.ts",
        "client/src/hooks/useOfflineSync.ts"
      ],
      steps: [
        "Create PWA manifest file",
        "Implement service worker for caching",
        "Add offline data synchronization",
        "Enable push notifications",
        "Optimize for mobile devices"
      ],
      estimatedDuration: "1-2 days"
    };
  }
  
  // Calendar integration  
  if (suggestion.includes('calendar') || suggestion.includes('scheduling') || suggestion.includes('meeting')) {
    return {
      type: "Calendar Integration",
      files: [
        "client/src/components/Calendar.tsx",
        "server/calendar/calendarService.ts",
        "shared/types/calendar.ts"
      ],
      steps: [
        "Create calendar UI components", 
        "Implement event management system",
        "Add scheduling conflict detection",
        "Integrate with AI for meeting summaries",
        "Add notification system"
      ],
      estimatedDuration: "2-3 days"
    };
  }
  
  // Data export/import
  if (suggestion.includes('export') || suggestion.includes('import') || suggestion.includes('backup')) {
    return {
      type: "Data Management System",
      files: [
        "server/export/dataExporter.ts",
        "server/import/dataImporter.ts",
        "client/src/components/DataManagement.tsx"
      ],
      steps: [
        "Implement data export functionality",
        "Create import validation system",
        "Add cloud backup integration",
        "Build data management UI",
        "Add data migration tools"
      ],
      estimatedDuration: "1-2 days"
    };
  }
  
  // Default implementation for other suggestions
  return {
    type: "Custom Enhancement",
    files: [
      "server/enhancements/customEnhancement.ts",
      "client/src/components/CustomFeature.tsx"
    ],
    steps: [
      "Analyze enhancement requirements",
      "Design system architecture",
      "Implement core functionality",
      "Create user interface components",
      "Test and integrate with existing system"
    ],
    estimatedDuration: "1-3 days"
  };
}

/**
 * Determine priority based on suggestion content
 */
function determinePriority(suggestionText: string): 'low' | 'medium' | 'high' {
  const suggestion = suggestionText.toLowerCase();
  
  // High priority suggestions
  if (suggestion.includes('authentication') || suggestion.includes('security') || suggestion.includes('backup')) {
    return 'high';
  }
  
  // Medium priority suggestions  
  if (suggestion.includes('user') || suggestion.includes('mobile') || suggestion.includes('performance')) {
    return 'medium';
  }
  
  // Default to low priority
  return 'low';
}

/**
 * Parse estimated time from duration string to minutes
 */
function parseEstimatedTime(duration: string): number {
  // Convert duration like "2-3 days" to average minutes
  if (duration.includes('day')) {
    const match = duration.match(/(\d+)(?:-(\d+))?\s*day/);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      const avgDays = (min + max) / 2;
      return avgDays * 8 * 60; // 8 hours per day * 60 minutes
    }
  }
  
  if (duration.includes('hour')) {
    const match = duration.match(/(\d+)(?:-(\d+))?\s*hour/);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      return (min + max) / 2 * 60;
    }
  }
  
  // Default to 4 hours (240 minutes)
  return 240;
}