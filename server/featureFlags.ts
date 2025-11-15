/**
 * Feature Flags Configuration
 * 
 * Central management of all feature flags across the application.
 * Reads from environment variables with sensible defaults.
 */

export interface FeatureFlags {
  // Active Listening
  activeListening: boolean;
  
  // Developer Mode
  developerMode: boolean;
  
  // YouTube Features
  youtubeAnalysis: boolean;
  youtubeKnowledgeBase: boolean;
  youtubeMillAlyzer: boolean;
  
  // Scene System
  sceneDetection: boolean;
  weatherEffects: boolean;
  dynamicBackgrounds: boolean;
  adaptiveScenes: boolean;
  
  // AI Conversation
  voiceAnalysis: boolean;
  imageGeneration: boolean;
  codeGeneration: boolean;
  webSearch: boolean;
  
  // Proactive Features
  breakReminders: boolean;
  milestoneTracking: boolean;
  moodTracking: boolean;
  dailySuggestions: boolean;
  proactiveMessages: boolean;
  proactiveRepositoryManagement: boolean;
  
  // Repository Features
  repositoryAnalysis: boolean;
  automatedPRs: boolean;
  codeAnalysis: boolean;
  
  // Smart Home
  smartHome: boolean;
  
  // Wellness
  guidedMeditation: boolean;
  meditationTracking: boolean;
  
  // Agent System
  agentSystem: boolean;
  calendarAgent: boolean;
  emailAgent: boolean;
  youtubeAgent: boolean;
  githubAgent: boolean;
  
  // Visual & Memory
  visualMemory: boolean;
  visualRecognition: boolean;
  faceRecognition: boolean;
  memorySummarization: boolean;
  
  // Advanced Features
  metacognitiveService: boolean;
  personalityFusion: boolean;
  tokenIncentives: boolean;
  userAnalytics: boolean;
  sandboxEnvironments: boolean;
  
  // Google Integration
  googleCalendar: boolean;
  googleGmail: boolean;
  googleDrive: boolean;
  googlePhotos: boolean;
  googleMaps: boolean;
  googleTasks: boolean;
  
  // External Services
  wolframAlpha: boolean;
  weatherService: boolean;
  
  // Performance & Testing
  performanceProfiling: boolean;
  autoTesting: boolean;
  abTesting: boolean;
  
  // Email
  sendEmails: boolean;
  
  // Parser
  advancedParser: boolean;
  
  // Dev Talk
  devTalk: boolean;
  
  // Predictive Updates
  predictiveUpdates: boolean;
}

/**
 * Parse boolean from environment variable
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
}

/**
 * Get all feature flags from environment
 */
export function getFeatureFlags(): FeatureFlags {
  return {
    // Active Listening
    activeListening: parseBoolean(process.env.ENABLE_ACTIVE_LISTENING, true),
    
    // Developer Mode
    developerMode: parseBoolean(process.env.ENABLE_DEVELOPER_MODE, false),
    
    // YouTube Features
    youtubeAnalysis: parseBoolean(process.env.ENABLE_YOUTUBE_ANALYSIS, true),
    youtubeKnowledgeBase: parseBoolean(process.env.ENABLE_YOUTUBE_KNOWLEDGE_BASE, true),
    youtubeMillAlyzer: parseBoolean(process.env.ENABLE_YOUTUBE_MILLALYZER, true),
    
    // Scene System
    sceneDetection: parseBoolean(process.env.ENABLE_SCENE_DETECTION, true),
    weatherEffects: parseBoolean(process.env.ENABLE_WEATHER_EFFECTS, true),
    dynamicBackgrounds: parseBoolean(process.env.ENABLE_DYNAMIC_BACKGROUNDS, true),
    adaptiveScenes: parseBoolean(process.env.ADAPTIVE_SCENES_ENABLED, true),
    
    // AI Conversation
    voiceAnalysis: parseBoolean(process.env.ENABLE_VOICE_ANALYSIS, true),
    imageGeneration: parseBoolean(process.env.ENABLE_IMAGE_GENERATION, true),
    codeGeneration: parseBoolean(process.env.ENABLE_CODE_GENERATION, true),
    webSearch: parseBoolean(process.env.ENABLE_WEB_SEARCH, true),
    
    // Proactive Features
    breakReminders: parseBoolean(process.env.ENABLE_BREAK_REMINDERS, true),
    milestoneTracking: parseBoolean(process.env.ENABLE_MILESTONE_TRACKING, true),
    moodTracking: parseBoolean(process.env.ENABLE_MOOD_TRACKING, true),
    dailySuggestions: parseBoolean(process.env.ENABLE_DAILY_SUGGESTIONS, true),
    proactiveMessages: parseBoolean(process.env.ENABLE_PROACTIVE_MESSAGES, true),
    proactiveRepositoryManagement: parseBoolean(process.env.ENABLE_PROACTIVE_REPOSITORY_MANAGEMENT, true),
    
    // Repository Features
    repositoryAnalysis: parseBoolean(process.env.ENABLE_REPOSITORY_ANALYSIS, true),
    automatedPRs: parseBoolean(process.env.ENABLE_AUTOMATED_PRS, true),
    codeAnalysis: parseBoolean(process.env.ENABLE_CODE_ANALYSIS, true),
    
    // Smart Home
    smartHome: parseBoolean(process.env.ENABLE_SMART_HOME, true),
    
    // Wellness
    guidedMeditation: parseBoolean(process.env.ENABLE_GUIDED_MEDITATION, true),
    meditationTracking: parseBoolean(process.env.ENABLE_MEDITATION_TRACKING, true),
    
    // Agent System
    agentSystem: parseBoolean(process.env.ENABLE_AGENT_SYSTEM, true),
    calendarAgent: parseBoolean(process.env.ENABLE_CALENDAR_AGENT, true),
    emailAgent: parseBoolean(process.env.ENABLE_EMAIL_AGENT, true),
    youtubeAgent: parseBoolean(process.env.ENABLE_YOUTUBE_AGENT, true),
    githubAgent: parseBoolean(process.env.ENABLE_GITHUB_AGENT, true),
    
    // Visual & Memory
    visualMemory: parseBoolean(process.env.ENABLE_VISUAL_MEMORY, true),
    visualRecognition: parseBoolean(process.env.ENABLE_VISUAL_RECOGNITION, true),
    faceRecognition: parseBoolean(process.env.ENABLE_FACE_RECOGNITION, false),
    memorySummarization: parseBoolean(process.env.ENABLE_MEMORY_SUMMARIZATION, true),
    
    // Advanced Features
    metacognitiveService: parseBoolean(process.env.ENABLE_METACOGNITIVE_SERVICE, true),
    personalityFusion: parseBoolean(process.env.ENABLE_PERSONALITY_FUSION, true),
    tokenIncentives: parseBoolean(process.env.ENABLE_TOKEN_INCENTIVES, true),
    userAnalytics: parseBoolean(process.env.ENABLE_USER_ANALYTICS, true),
    sandboxEnvironments: parseBoolean(process.env.ENABLE_SANDBOX_ENVIRONMENTS, false),
    
    // Google Integration
    googleCalendar: parseBoolean(process.env.ENABLE_GOOGLE_CALENDAR, true),
    googleGmail: parseBoolean(process.env.ENABLE_GOOGLE_GMAIL, true),
    googleDrive: parseBoolean(process.env.ENABLE_GOOGLE_DRIVE, true),
    googlePhotos: parseBoolean(process.env.ENABLE_GOOGLE_PHOTOS, true),
    googleMaps: parseBoolean(process.env.ENABLE_GOOGLE_MAPS, true),
    googleTasks: parseBoolean(process.env.ENABLE_GOOGLE_TASKS, true),
    
    // External Services
    wolframAlpha: parseBoolean(process.env.ENABLE_WOLFRAM_ALPHA, true),
    weatherService: parseBoolean(process.env.ENABLE_WEATHER_SERVICE, true),
    
    // Performance & Testing
    performanceProfiling: parseBoolean(process.env.ENABLE_PERFORMANCE_PROFILING, false),
    autoTesting: parseBoolean(process.env.ENABLE_AUTO_TESTING, false),
    abTesting: parseBoolean(process.env.ENABLE_AB_TESTING, false),
    
    // Email
    sendEmails: parseBoolean(process.env.SEND_EMAILS, false),
    
    // Parser
    advancedParser: parseBoolean(process.env.ENABLE_ADVANCED_PARSER, true),
    
    // Dev Talk
    devTalk: parseBoolean(process.env.ENABLE_DEV_TALK, false),
    
    // Predictive Updates
    predictiveUpdates: parseBoolean(process.env.ENABLE_PREDICTIVE_UPDATES, false),
  };
}

/**
 * Get a specific feature flag value
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature];
}

/**
 * Get all enabled features as an array
 */
export function getEnabledFeatures(): string[] {
  const flags = getFeatureFlags();
  return Object.entries(flags)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature);
}

/**
 * Get feature flags as JSON for client-side use
 */
export function getFeatureFlagsJSON(): string {
  return JSON.stringify(getFeatureFlags(), null, 2);
}

// Export singleton instance
export const featureFlags = getFeatureFlags();
