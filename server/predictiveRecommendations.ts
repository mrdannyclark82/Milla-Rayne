/**
 * Predictive Recommendations Engine
 * Generates concrete suggestions based on AI updates
 */

import { getAIUpdates, type AIUpdate } from './aiUpdatesService.js';

export interface Recommendation {
  title: string;
  rationale: string;
  suggestedChanges: string[];
  confidence: number;
  sourceUpdates: string[];
}

/**
 * Analyze an AI update and generate recommendations
 */
function analyzeUpdate(update: AIUpdate): Recommendation | null {
  const title = update.title.toLowerCase();
  const summary = (update.summary || '').toLowerCase();
  const tags = (update.tags || '').toLowerCase();
  const text = `${title} ${summary} ${tags}`;

  const recommendations: Recommendation[] = [];

  // Check for new model/API opportunities
  if (text.includes('model') || text.includes('api') || text.includes('gpt') || text.includes('claude')) {
    if (text.includes('openrouter') || text.includes('deepseek') || text.includes('qwen') || text.includes('grok')) {
      recommendations.push({
        title: `Consider integrating new AI model: ${update.title}`,
        rationale: `A new or updated AI model has been announced that may improve response quality or reduce costs. ${update.summary?.substring(0, 200) || ''}`,
        suggestedChanges: [
          'server/openrouterService.ts - Add new model endpoint',
          'server/routes.ts - Update model selection logic',
          'README.md - Document new model capability',
        ],
        confidence: update.relevance,
        sourceUpdates: [update.url],
      });
    }
  }

  // Check for security updates
  if (text.includes('security') || text.includes('vulnerability') || text.includes('cve')) {
    recommendations.push({
      title: `Security Update: ${update.title}`,
      rationale: `A security update or vulnerability has been disclosed that may affect the project dependencies or practices. Review: ${update.summary?.substring(0, 200) || ''}`,
      suggestedChanges: [
        'package.json - Review and update dependencies',
        'server/routes.ts - Add security headers if needed',
        'API_SECURITY_GUIDE.md - Update security documentation',
      ],
      confidence: Math.min(update.relevance + 0.2, 1.0),
      sourceUpdates: [update.url],
    });
  }

  // Check for voice/TTS/STT updates
  if (text.includes('voice') || text.includes('tts') || text.includes('stt') || text.includes('speech')) {
    recommendations.push({
      title: `Voice Feature Enhancement: ${update.title}`,
      rationale: `New voice/speech technology has been announced. Consider enhancing voice features. ${update.summary?.substring(0, 200) || ''}`,
      suggestedChanges: [
        'client/src/components - Add or enhance voice components',
        'VOICE_FEATURES_GUIDE.md - Update voice documentation',
        'server/routes.ts - Add voice processing endpoints if needed',
      ],
      confidence: update.relevance,
      sourceUpdates: [update.url],
    });
  }

  // Check for database/storage updates
  if (text.includes('sqlite') || text.includes('database') || text.includes('storage')) {
    recommendations.push({
      title: `Database Enhancement: ${update.title}`,
      rationale: `Database or storage improvements have been announced. ${update.summary?.substring(0, 200) || ''}`,
      suggestedChanges: [
        'server/sqliteStorage.ts - Review and apply optimizations',
        'MEMORY_MIGRATION_GUIDE.md - Update migration documentation',
      ],
      confidence: update.relevance,
      sourceUpdates: [update.url],
    });
  }

  // Check for GitHub Actions/CI updates
  if (text.includes('github actions') || text.includes('ci/cd') || text.includes('workflow')) {
    recommendations.push({
      title: `CI/CD Enhancement: ${update.title}`,
      rationale: `GitHub Actions or CI/CD improvements are available. ${update.summary?.substring(0, 200) || ''}`,
      suggestedChanges: [
        '.github/workflows - Review and update workflows',
        'README.md - Update CI/CD documentation',
      ],
      confidence: update.relevance,
      sourceUpdates: [update.url],
    });
  }

  // Check for API/TypeScript/React updates
  if (text.includes('typescript') || text.includes('react') || text.includes('express') || text.includes('api')) {
    recommendations.push({
      title: `Framework Update: ${update.title}`,
      rationale: `Updates to core frameworks or libraries. ${update.summary?.substring(0, 200) || ''}`,
      suggestedChanges: [
        'package.json - Review dependency updates',
        'tsconfig.json - Review TypeScript configuration',
        'README.md - Update framework documentation',
      ],
      confidence: update.relevance * 0.8,
      sourceUpdates: [update.url],
    });
  }

  return recommendations.length > 0 ? recommendations[0] : null;
}

/**
 * Merge similar recommendations
 */
function mergeRecommendations(recommendations: Recommendation[]): Recommendation[] {
  const merged: Map<string, Recommendation> = new Map();

  for (const rec of recommendations) {
    const key = rec.title.substring(0, 50); // Group by similar titles

    if (merged.has(key)) {
      const existing = merged.get(key)!;
      // Merge source updates
      existing.sourceUpdates = [...new Set([...existing.sourceUpdates, ...rec.sourceUpdates])];
      // Average confidence
      existing.confidence = (existing.confidence + rec.confidence) / 2;
      // Merge suggested changes
      existing.suggestedChanges = [...new Set([...existing.suggestedChanges, ...rec.suggestedChanges])];
    } else {
      merged.set(key, rec);
    }
  }

  return Array.from(merged.values());
}

/**
 * Generate recommendations from stored AI updates
 */
export function generateRecommendations(options: {
  minRelevance?: number;
  maxRecommendations?: number;
}): Recommendation[] {
  console.log('predictiveRecommendations.generateRecommendations called with', options);
  const minRelevance = options.minRelevance ?? 0.2;
  const maxRecommendations = options.maxRecommendations ?? 10;

  // Get high-relevance updates
  try {
    console.log('Fetching AI updates with minRelevance=', minRelevance);
    const updates = getAIUpdates({
      minRelevance,
      limit: 100, // Process top 100 relevant updates
    });

    console.log(`Retrieved ${updates.length} updates`);

    console.log('Analyzing updates for recommendations...');

    console.log(`Generating recommendations from ${updates.length} relevant updates...`);

    const recommendations: Recommendation[] = [];

    for (const update of updates) {
      const rec = analyzeUpdate(update);
      if (rec) {
        recommendations.push(rec);
      }
    }

    // Merge similar recommendations
    const merged = mergeRecommendations(recommendations);

    // Sort by confidence and return top N
    const sorted = merged.sort((a, b) => b.confidence - a.confidence);

    console.log(`Generated ${sorted.length} recommendations`);

    return sorted.slice(0, maxRecommendations);
  } catch (err) {
    console.error('Error inside generateRecommendations:', err);
    throw err;
  }
}

/**
 * Get recommendation summary for display
 */
export function getRecommendationSummary(): {
  totalUpdates: number;
  highRelevanceUpdates: number;
  recommendationsAvailable: number;
} {
  const allUpdates = getAIUpdates({ limit: 1000 });
  const highRelevance = getAIUpdates({ minRelevance: 0.3, limit: 1000 });
  const recommendations = generateRecommendations({ maxRecommendations: 100 });

  return {
    totalUpdates: allUpdates.length,
    highRelevanceUpdates: highRelevance.length,
    recommendationsAvailable: recommendations.length,
  };
}
