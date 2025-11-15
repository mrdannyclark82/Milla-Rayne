/**
 * User Satisfaction Survey Service
 * 
 * Collects and analyzes user satisfaction data through periodic surveys.
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface SurveyQuestion {
  id: string;
  question: string;
  type: 'rating' | 'yes_no' | 'text';
  category: 'feature' | 'performance' | 'usability' | 'overall';
}

export interface SurveyResponse {
  id: string;
  questionId: string;
  userId: string;
  response: number | string | boolean;
  timestamp: number;
  context?: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  active: boolean;
  createdAt: number;
  responses: SurveyResponse[];
}

export interface SurveyAnalytics {
  totalResponses: number;
  averageRating: number;
  categoryScores: Record<string, number>;
  satisfaction: 'low' | 'medium' | 'high';
  trends: 'improving' | 'stable' | 'declining';
  topIssues: string[];
  topPraises: string[];
}

class UserSatisfactionSurveyService {
  private surveys: Survey[] = [];
  private readonly SURVEY_FILE = path.join(process.cwd(), 'memory', 'user_surveys.json');
  private readonly DEFAULT_SURVEY_ID = 'default-satisfaction-survey';

  async initialize(): Promise<void> {
    await this.loadSurveys();
    await this.ensureDefaultSurvey();
    console.log('User Satisfaction Survey Service initialized');
  }

  /**
   * Ensure default satisfaction survey exists
   */
  private async ensureDefaultSurvey(): Promise<void> {
    const existing = this.surveys.find(s => s.id === this.DEFAULT_SURVEY_ID);
    if (!existing) {
      await this.createDefaultSurvey();
    }
  }

  /**
   * Create default satisfaction survey
   */
  private async createDefaultSurvey(): Promise<void> {
    const survey: Survey = {
      id: this.DEFAULT_SURVEY_ID,
      title: 'User Satisfaction Survey',
      description: 'Help Milla improve by sharing your experience',
      active: true,
      createdAt: Date.now(),
      questions: [
        {
          id: 'q1',
          question: 'How satisfied are you with Milla\'s responses?',
          type: 'rating',
          category: 'overall',
        },
        {
          id: 'q2',
          question: 'How would you rate Milla\'s response speed?',
          type: 'rating',
          category: 'performance',
        },
        {
          id: 'q3',
          question: 'Are Milla\'s features easy to use?',
          type: 'rating',
          category: 'usability',
        },
        {
          id: 'q4',
          question: 'Are you satisfied with the available features?',
          type: 'rating',
          category: 'feature',
        },
        {
          id: 'q5',
          question: 'Would you recommend Milla to others?',
          type: 'yes_no',
          category: 'overall',
        },
        {
          id: 'q6',
          question: 'What feature would you like to see improved?',
          type: 'text',
          category: 'feature',
        },
        {
          id: 'q7',
          question: 'What do you like most about Milla?',
          type: 'text',
          category: 'overall',
        },
      ],
      responses: [],
    };

    this.surveys.push(survey);
    await this.saveSurveys();
  }

  /**
   * Get active survey
   */
  getActiveSurvey(): Survey | null {
    return this.surveys.find(s => s.active) || null;
  }

  /**
   * Submit survey response
   */
  async submitResponse(params: {
    surveyId: string;
    questionId: string;
    userId: string;
    response: number | string | boolean;
    context?: string;
  }): Promise<SurveyResponse> {
    const survey = this.surveys.find(s => s.id === params.surveyId);
    if (!survey) {
      throw new Error('Survey not found');
    }

    const response: SurveyResponse = {
      id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      questionId: params.questionId,
      userId: params.userId,
      response: params.response,
      timestamp: Date.now(),
      context: params.context,
    };

    survey.responses.push(response);
    await this.saveSurveys();

    console.log(`Survey response recorded: ${params.questionId} = ${params.response}`);
    return response;
  }

  /**
   * Submit complete survey
   */
  async submitCompleteSurvey(params: {
    surveyId: string;
    userId: string;
    responses: Record<string, number | string | boolean>;
    context?: string;
  }): Promise<SurveyResponse[]> {
    const submittedResponses: SurveyResponse[] = [];

    for (const [questionId, response] of Object.entries(params.responses)) {
      const surveyResponse = await this.submitResponse({
        surveyId: params.surveyId,
        questionId,
        userId: params.userId,
        response,
        context: params.context,
      });
      submittedResponses.push(surveyResponse);
    }

    return submittedResponses;
  }

  /**
   * Get survey analytics
   */
  getSurveyAnalytics(surveyId: string): SurveyAnalytics {
    const survey = this.surveys.find(s => s.id === surveyId);
    if (!survey) {
      throw new Error('Survey not found');
    }

    const ratingResponses = survey.responses.filter(
      r => {
        const question = survey.questions.find(q => q.id === r.questionId);
        return question?.type === 'rating';
      }
    );

    const totalResponses = new Set(survey.responses.map(r => r.userId)).size;
    const averageRating = ratingResponses.length > 0
      ? ratingResponses.reduce((sum, r) => sum + (r.response as number), 0) / ratingResponses.length
      : 0;

    // Calculate category scores
    const categoryScores: Record<string, number> = {};
    for (const question of survey.questions) {
      if (question.type === 'rating') {
        const responses = survey.responses.filter(r => r.questionId === question.id);
        if (responses.length > 0) {
          categoryScores[question.category] = 
            responses.reduce((sum, r) => sum + (r.response as number), 0) / responses.length;
        }
      }
    }

    // Determine satisfaction level
    let satisfaction: 'low' | 'medium' | 'high' = 'medium';
    if (averageRating >= 4) satisfaction = 'high';
    else if (averageRating < 3) satisfaction = 'low';

    // Analyze trends (compare recent vs older responses)
    const recentResponses = ratingResponses.slice(-20);
    const olderResponses = ratingResponses.slice(-40, -20);
    
    const recentAvg = recentResponses.length > 0
      ? recentResponses.reduce((sum, r) => sum + (r.response as number), 0) / recentResponses.length
      : 0;
    const olderAvg = olderResponses.length > 0
      ? olderResponses.reduce((sum, r) => sum + (r.response as number), 0) / olderResponses.length
      : 0;

    let trends: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentAvg > olderAvg + 0.3) trends = 'improving';
    else if (recentAvg < olderAvg - 0.3) trends = 'declining';

    // Extract top issues from text responses
    const textResponses = survey.responses.filter(r => {
      const question = survey.questions.find(q => q.id === r.questionId);
      return question?.type === 'text' && question.category === 'feature';
    });

    const topIssues = textResponses
      .map(r => r.response as string)
      .filter(r => r.length > 0)
      .slice(0, 5);

    // Extract top praises
    const praiseResponses = survey.responses.filter(r => {
      const question = survey.questions.find(q => q.id === r.questionId);
      return question?.type === 'text' && question.question.toLowerCase().includes('like');
    });

    const topPraises = praiseResponses
      .map(r => r.response as string)
      .filter(r => r.length > 0)
      .slice(0, 5);

    return {
      totalResponses,
      averageRating,
      categoryScores,
      satisfaction,
      trends,
      topIssues,
      topPraises,
    };
  }

  /**
   * Check if user should be surveyed
   */
  shouldSurveyUser(userId: string): boolean {
    const survey = this.getActiveSurvey();
    if (!survey) return false;

    // Check if user has already responded recently (within 7 days)
    const recentResponses = survey.responses.filter(r => 
      r.userId === userId && Date.now() - r.timestamp < 7 * 24 * 60 * 60 * 1000
    );

    return recentResponses.length === 0;
  }

  /**
   * Get all surveys
   */
  getAllSurveys(): Survey[] {
    return [...this.surveys];
  }

  /**
   * Get survey by ID
   */
  getSurvey(surveyId: string): Survey | undefined {
    return this.surveys.find(s => s.id === surveyId);
  }

  /**
   * Load surveys from file
   */
  private async loadSurveys(): Promise<void> {
    try {
      const data = await fs.readFile(this.SURVEY_FILE, 'utf-8');
      this.surveys = JSON.parse(data);
    } catch (error) {
      console.log('No existing survey data found, starting fresh');
    }
  }

  /**
   * Save surveys to file
   */
  private async saveSurveys(): Promise<void> {
    try {
      await fs.writeFile(this.SURVEY_FILE, JSON.stringify(this.surveys, null, 2));
    } catch (error) {
      console.error('Error saving survey data:', error);
    }
  }
}

// Singleton instance
const surveyService = new UserSatisfactionSurveyService();

export async function initializeUserSurveys(): Promise<void> {
  await surveyService.initialize();
}

export function getActiveSurvey(): Survey | null {
  return surveyService.getActiveSurvey();
}

export function submitSurveyResponse(params: {
  surveyId: string;
  questionId: string;
  userId: string;
  response: number | string | boolean;
  context?: string;
}): Promise<SurveyResponse> {
  return surveyService.submitResponse(params);
}

export function submitCompleteSurvey(params: {
  surveyId: string;
  userId: string;
  responses: Record<string, number | string | boolean>;
  context?: string;
}): Promise<SurveyResponse[]> {
  return surveyService.submitCompleteSurvey(params);
}

export function getSurveyAnalytics(surveyId: string): SurveyAnalytics {
  return surveyService.getSurveyAnalytics(surveyId);
}

export function shouldSurveyUser(userId: string): boolean {
  return surveyService.shouldSurveyUser(userId);
}

export function getAllSurveys(): Survey[] {
  return surveyService.getAllSurveys();
}

export function getSurvey(surveyId: string): Survey | undefined {
  return surveyService.getSurvey(surveyId);
}
