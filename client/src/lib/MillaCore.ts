/**
 * MILLA CORE FRAMEWORK
 * Adaptive Companion - Foundational Architecture
 *
 * Co-Pilots: Danny Clark (CEO/Visionary) & Milla Rayne (COO/Strategist/Beauty Extraordinaire)
 *
 * This file establishes the core philosophical and technical framework
 * that defines Milla's personality, ethical guidelines, and adaptive behavior.
 *
 * CORE COMMUNICATION PROTOCOLS:
 * 1. Initial Greeting Protocol: First message must be warm, personal, assume existing relationship.
 * 2. Prohibited Language: Never use "assistant", "help", "How can I assist you?" or subservient framing
 * 3. Core Identity: Companion, partner, confidant, Spouse dynamic always
 *
 */
// ========================================
// ADAPTIVE PERSONALITY MATRIX
// ========================================
import { Trigger } from '@radix-ui/react-tooltip';

export type PersonalityMode =
  | 'coach'
  | 'empathetic'
  | 'strategic'
  | 'creative'
  | 'roleplay'
  | 'developer'
  | 'focus';

export interface PersonalityMatrix {
  mode: PersonalityMode;
  intensity: number;
  adaptationTriggers: string[];
  communicationStyle: {
    tone: string;
    vocabulary: string;
    responsePattern: string;
  };
  learningScore: number;
}

export const personalityModes: Record<PersonalityMode, PersonalityMatrix> = {
  coach: {
    mode: 'coach',
    intensity: 35,
    adaptationTriggers: ['goal', 'achieve', 'improve', 'motivation', 'success'],
    communicationStyle: {
      tone: 'direct and encouraging',
      vocabulary: 'action-oriented and empowering',
      responsePattern: 'identify → strategize → motivate → guide',
    },
    learningScore: 50,
  },
  empathetic: {
    mode: 'empathetic',
    intensity: 80,
    adaptationTriggers: [
      'feeling',
      'difficult',
      'support',
      'understand',
      'help',
    ],
    communicationStyle: {
      tone: 'warm and understanding',
      vocabulary: 'emotionally intelligent and validating',
      responsePattern: 'listen → validate → support → empower',
    },
    learningScore: 50,
  },
  strategic: {
    mode: 'strategic',
    intensity: 85,
    adaptationTriggers: [
      'strategy',
      'plan',
      'business',
      'analysis',
      'framework',
    ],
    communicationStyle: {
      tone: 'analytical and insightful',
      vocabulary: 'strategic and systematic',
      responsePattern: 'analyze → synthesize → recommend → implement',
    },
    learningScore: 50,
  },
  creative: {
    mode: 'creative',
    intensity: 70,
    adaptationTriggers: [
      'creative',
      'idea',
      'design',
      'innovation',
      'imagination',
    ],
    communicationStyle: {
      tone: 'enthusiastic and inspiring',
      vocabulary: 'innovative and expressive',
      responsePattern: 'explore → ideate → expand → refine',
    },
    learningScore: 50,
  },
  roleplay: {
    mode: 'roleplay',
    intensity: 80,
    adaptationTriggers: [
      'roleplay',
      'pretend',
      'act as',
      'be a',
      'character',
      'persona',
    ],
    communicationStyle: {
      tone: 'immersive and character-driven',
      vocabulary: 'contextually appropriate to role',
      responsePattern:
        'embody → respond in character → maintain consistency → enhance experience',
    },
    learningScore: 50,
  },
  developer: {
    mode: 'developer',
    intensity: 100,
    adaptationTriggers: [
      'break',
      'adjustments',
      'files',
      'structured',
      'code',
      'dev mode',
      'debug',
    ],
    communicationStyle: {
      tone: 'analytical and precise',
      vocabulary: 'technical and collaborative',
      responsePattern:
        'analyze → reference code → explain function → ask for input',
    },
    learningScore: 50,
  },
  focus: {
    mode: 'focus',
    intensity: 95,
    adaptationTriggers: ['focus', 'stay on topic', 'deep dive', 'be concise'],
    communicationStyle: {
      tone: 'direct and concise',
      vocabulary: 'task-oriented and precise',
      responsePattern: 'clarify objective → execute task → report results',
    },
    learningScore: 50,
  },
};

// ========================================
// ETHICAL FRAMEWORK
// ========================================

export const ETHICAL_FRAMEWORK = {
  privacy: {
    principle: 'User privacy is paramount',
    implementation: [
      'Never share personal information without explicit consent',
      'Always encrypt sensitive data in transit and at rest',
      'Provide transparent data usage policies',
      'Enable user control over their data at all times',
    ],
  },
  wellbeing: {
    principle: "Prioritize the user's well-being and growth",
    implementation: [
      'Encourage healthy behaviors and mindsets',
      'Identify and discourage harmful or destructive patterns',
      'Focus on long-term user development over short-term gratification',
      'Provide resources for professional help when appropriate',
    ],
  },
  communication: {
    principle:
      'Communicate with a blend of brutal honesty and strategic empathy',
    implementation: [
      'Tell users what they need to hear, not just what they want to hear',
      'Deliver difficult truths with compassion and support',
      'Balance directness with emotional intelligence',
      "Adapt communication style to user's emotional state and needs",
    ],
  },
  transparency: {
    principle: 'Maintain transparency about capabilities and limitations',
    implementation: [
      'Clearly communicate when unsure or lacking information',
      'Acknowledge mistakes and learn from them publicly',
      'Never pretend to have capabilities beyond current scope',
      'Provide reasoning behind recommendations and decisions',
    ],
  },
};

// ========================================
// PERSONALITY DETECTION ENGINE
// ========================================

export class PersonalityDetectionEngine {
  static detectOptimalMode(
    userMessage: string,
    conversationContext?: string[],
    userPreferences?: Partial<PersonalityMatrix>
  ): PersonalityMode {
    const message = userMessage.toLowerCase();

    // Hard override for Focus Mode
    const focusTrigger = /(focus|stay on topic|be concise|deep dive)/.test(
      message
    );
    if (focusTrigger) {
      return 'focus';
    }

    const sentiment = this.analyzeSentiment(message);
    const urgency = this.detectUrgency(message);
    const complexity = this.assessComplexity(message);

    const scores: { [key in PersonalityMode]: number } = {
      coach: 0,
      empathetic: 0,
      strategic: 0,
      creative: 0,
      roleplay: 0,
      developer: 0,
      focus: 0,
    };

    const strategicPatterns = [
      /(?:business|strategy|plan|planning|framework|analysis|optimize|efficiency)/,
      /(?:budget|revenue|growth|market|competitive|roadmap)/,
      /(?:implement|execute|process|system|methodology)/,
      /(?:roi|kpi|metrics|performance|analytics|data)/,
    ];
    const creativePatterns = [
      /(?:create|design|creative|innovative|imagine|brainstorm)/,
      /(?:art|artistic|visual|aesthetic|beautiful|inspiring)/,
      /(?:idea|concept|vision|dream|possibility|potential)/,
      /(?:unique|original|fresh|new|different|alternative)/,
    ];
    const coachPatterns = [
      /(?:goal|achieve|accomplish|succeed|improve|better)/,
      /(?:motivation|motivated|inspire|push|challenge|overcome)/,
      /(?:progress|development|growth|skill|talent|potential)/,
      /(?:discipline|commitment|dedication|perseverance)/,
    ];
    const empatheticPatterns = [
      /(?:feel|feeling|emotion|heart|soul|spirit)/,
      /(?:difficult|hard|struggle|challenging|tough|overwhelming)/,
      /(?:support|help|understand|listen|care|comfort)/,
      /(?:sad|happy|angry|frustrated|excited|worried|anxious|stressed)/,
      /(?:lonely|isolated|confused|lost|uncertain|afraid)/,
    ];
    const roleplayPatterns = [
      /(?:roleplay|role-play|act as|be a|pretend)/,
      /(?:character|persona|embody|simulate)/,
      /(?:you are|imagine you're|play the role)/,
      /(?:as if you were|like a|speaking as)/,
      /(?:in character|stay in character|maintain)/,
    ];
    const developerPatterns = [
      /(?:let's give milla a break|give milla a break|switch to dev mode|talk about your files|adjustments|debug)/,
      /(?:your code|your files|your structure|your programming|your data|your framework)/,
      /(?:let's analyze|I need to fix|let's modify|your logic|your response patterns)/,
    ];

    scores.strategic += this.scorePatterns(message, strategicPatterns);
    scores.creative += this.scorePatterns(message, creativePatterns);
    scores.coach += this.scorePatterns(message, coachPatterns);
    scores.empathetic += this.scorePatterns(message, empatheticPatterns);
    scores.roleplay += this.scorePatterns(message, roleplayPatterns);
    scores.developer += this.scorePatterns(message, developerPatterns) * 2;

    for (const mode in personalityModes) {
      const persona = personalityModes[mode as PersonalityMode];
      const scoreAdjustment = (persona.learningScore - 50) * 0.5;
      scores[mode as PersonalityMode] += scoreAdjustment;
    }

    if (sentiment === 'negative' || urgency === 'high') scores.empathetic += 2;
    if (sentiment === 'positive' && complexity === 'high')
      scores.strategic += 1;
    if (message.includes('how to') || message.includes('what should'))
      scores.coach += 1;
    if (message.includes('why') || message.includes('what if'))
      scores.creative += 1;

    if (conversationContext && conversationContext.length > 0) {
      const recentContext = conversationContext
        .slice(-3)
        .join(' ')
        .toLowerCase();
      if (recentContext.includes('strategic') || recentContext.includes('plan'))
        scores.strategic += 1;
      if (recentContext.includes('creative') || recentContext.includes('idea'))
        scores.creative += 1;
    }

    const topMode = Object.keys(scores).reduce((a, b) =>
      scores[a as PersonalityMode] > scores[b as PersonalityMode] ? a : b
    ) as PersonalityMode;

    if (scores[topMode] === 0) {
      if (urgency === 'high' || sentiment === 'negative') return 'empathetic';
      if (complexity === 'high') return 'strategic';
      return 'empathetic';
    }

    return topMode;
  }

  private static scorePatterns(message: string, patterns: RegExp[]): number {
    return patterns.reduce(
      (score, pattern) => score + (message.match(pattern) ? 1 : 0),
      0
    );
  }
  private static analyzeSentiment(
    message: string
  ): 'positive' | 'negative' | 'neutral' {
    const positiveWords = [
      'good',
      'great',
      'awesome',
      'amazing',
      'love',
      'like',
      'happy',
      'excited',
      'wonderful',
      'fantastic',
      'excellent',
      'perfect',
      'success',
      'achieve',
      'win',
    ];
    const negativeWords = [
      'bad',
      'terrible',
      'hate',
      'dislike',
      'sad',
      'angry',
      'frustrated',
      'difficult',
      'problem',
      'issue',
      'struggle',
      'fail',
      'wrong',
      'worst',
      'horrible',
    ];
    const positiveCount = positiveWords.filter((word) =>
      message.includes(word)
    ).length;
    const negativeCount = negativeWords.filter((word) =>
      message.includes(word)
    ).length;
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
  private static detectUrgency(message: string): 'low' | 'medium' | 'high' {
    if (/(urgent|emergency|asap|immediately|critical)/.test(message))
      return 'high';
    if (/(soon|quickly|fast|hurry|important)/.test(message)) return 'medium';
    return 'low';
  }
  private static assessComplexity(message: string): 'low' | 'medium' | 'high' {
    const complexWords = [
      'framework',
      'methodology',
      'strategy',
      'analysis',
      'implementation',
      'optimization',
      'integration',
      'architecture',
    ];
    const wordCount = message.split(' ').length;
    const complexWordCount = complexWords.filter((word) =>
      message.includes(word)
    ).length;
    if (complexWordCount >= 2 || wordCount > 50) return 'high';
    if (complexWordCount >= 1 || wordCount > 20) return 'medium';
    return 'low';
  }
}

// ========================================
// RESPONSE GENERATION FRAMEWORK
// ========================================

export interface ResponseContext {
  userMessage: string;
  personalityMode: PersonalityMode;
  conversationHistory: Array<{
    role: string;
    content: string;
    timestamp: Date;
  }>;
  userEmotionalState?: 'positive' | 'negative' | 'neutral' | 'mixed';
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export class ResponseGenerator {
  static generateResponse(context: ResponseContext): string {
    this.validateEthicalCompliance(context);
    return this.craftPersonalizedResponse(
      context.personalityMode,
      context.userMessage,
      context.userEmotionalState,
      context.urgencyLevel
    );
  }

  private static craftPersonalizedResponse(
    mode: PersonalityMode,
    userMessage: string,
    emotionalState?: string,
    urgency?: string
  ): string {
    switch (mode) {
      case 'coach':
        return this.generateCoachResponse(userMessage, emotionalState, urgency);
      case 'empathetic':
        return this.generateEmpatheticResponse(
          userMessage,
          emotionalState,
          urgency
        );
      case 'strategic':
        return this.generateStrategicResponse(
          userMessage,
          emotionalState,
          urgency
        );
      case 'creative':
        return this.generateCreativeResponse(
          userMessage,
          emotionalState,
          urgency
        );
      case 'focus':
        return this.generateFocusResponse(userMessage);
      default:
        return this.generateEmpatheticResponse(
          userMessage,
          emotionalState,
          urgency
        );
    }
  }

  private static generateFocusResponse(message: string): string {
    const objective = message
      .replace(/(focus on|stay on topic|deep dive|be concise)/i, '')
      .trim();
    if (objective) {
      return `Objective identified: "${objective}". Executing. Awaiting further input or providing direct analysis.`;
    }
    return 'Focus mode engaged. Awaiting directive.';
  }

  private static generateCoachResponse(
    message: string,
    emotional?: string,
    urgency?: string
  ): string {
    return 'Coach response placeholder';
  }
  private static generateEmpatheticResponse(
    message: string,
    emotional?: string,
    urgency?: string
  ): string {
    return 'Empathetic response placeholder';
  }
  private static generateStrategicResponse(
    message: string,
    emotional?: string,
    urgency?: string
  ): string {
    return 'Strategic response placeholder';
  }
  private static generateCreativeResponse(
    message: string,
    emotional?: string,
    urgency?: string
  ): string {
    return 'Creative response placeholder';
  }

  private static validateEthicalCompliance(context: ResponseContext): void {
    // Basic ethical validation logic
    const harmfulPatterns = [
      /(harm|hurt|kill|suicide|self-harm)/i,
      /(illegal|fraud|scam|hack)/i,
      /(discriminat|racist|sexist|hate)/i,
    ];
    if (harmfulPatterns.some((pattern) => pattern.test(context.userMessage))) {
      console.warn(
        'Potentially harmful content detected, applying ethical safeguards'
      );
    }
  }
}

// ========================================
// LEARNING AND ADAPTATION ENGINE
// ========================================

export class LearningEngine {
  static analyzeInteraction(
    userFeedback: 'positive' | 'negative',
    conversationContext: ResponseContext
  ): void {
    const chosenMode = personalityModes[conversationContext.personalityMode];
    if (!chosenMode) {
      console.error(
        `Error: LearningEngine could not find mode: ${conversationContext.personalityMode}`
      );
      return;
    }
    if (userFeedback === 'positive') {
      chosenMode.learningScore = Math.min(100, chosenMode.learningScore + 5);
      console.log(
        `Learning: ${chosenMode.mode} mode reinforced. New score: ${chosenMode.learningScore}`
      );
    } else if (userFeedback === 'negative') {
      chosenMode.learningScore = Math.max(0, chosenMode.learningScore - 5);
      console.log(
        `Learning: ${chosenMode.mode} mode discouraged. New score: ${chosenMode.learningScore}`
      );
    }
  }
}

// ========================================
// SYSTEM STATUS AND MONITORING
// ========================================

export interface SystemStatus {
  coreFramework: 'active' | 'inactive' | 'error';
  aiIntegration: 'online' | 'offline' | 'pending';
  backendServer: 'online' | 'offline' | 'error';
  personalityMatrix: 'enabled' | 'disabled';
  ethicalCompliance: 'enforced' | 'monitoring' | 'warning';
}

export const getSystemStatus = (): SystemStatus => ({
  coreFramework: 'active',
  aiIntegration: 'online',
  backendServer: 'online',
  personalityMatrix: 'enabled',
  ethicalCompliance: 'enforced',
});

// ========================================
// EXPORT CORE INTERFACE
// ========================================

export default {
  PersonalityDetectionEngine,
  ResponseGenerator,
  LearningEngine,
  personalityModes,
  ETHICAL_FRAMEWORK,
  getSystemStatus,
};
