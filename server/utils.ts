/**
 * Utility functions for Milla Rayne server.
 */

/**
 * Utility functions for Milla Rayne server.
 */

/**
 * Extract topics from content using keyword analysis
 */
export function extractTopics(content: string): string[] {
  const topics: string[] = [];
  const text = content.toLowerCase();

  // Define topic keywords
  const topicKeywords = {
    relationship: [
      'love',
      'relationship',
      'together',
      'partner',
      'romance',
      'dating',
    ],
    work: ['work', 'job', 'career', 'professional', 'business', 'project'],
    family: [
      'family',
      'mother',
      'father',
      'son',
      'daughter',
      'parent',
      'child',
    ],
    technology: [
      'technology',
      'computer',
      'software',
      'coding',
      'programming',
      'ai',
    ],
    emotions: [
      'feel',
      'emotion',
      'sad',
      'happy',
      'angry',
      'excited',
      'worried',
    ],
    goals: ['goal', 'plan', 'future', 'dream', 'aspiration', 'objective'],
    health: ['health', 'medical', 'doctor', 'exercise', 'wellness', 'fitness'],
    creative: ['art', 'music', 'writing', 'creative', 'design', 'artistic'],
  };

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      topics.push(topic);
    }
  }

  return topics;
}

/**
 * Detect emotional tone of content
 */
export function detectEmotionalTone(content: string): 'positive' | 'negative' | 'neutral' {
  const text = content.toLowerCase();

  const positiveWords = [
    'happy',
    'excited',
    'love',
    'great',
    'wonderful',
    'amazing',
    'good',
    'excellent',
  ];
  const negativeWords = [
    'sad',
    'angry',
    'frustrated',
    'worried',
    'terrible',
    'bad',
    'hate',
    'awful',
  ];
  const neutralWords = [
    'think',
    'consider',
    'maybe',
    'perhaps',
    'question',
    'wondering',
  ];

  const positiveCount = positiveWords.filter((word) =>
    text.includes(word)
  ).length;
  const negativeCount = negativeWords.filter((word) =>
    text.includes(word)
  ).length;
  const neutralCount = neutralWords.filter((word) =>
    text.includes(word)
  ).length;

  if (positiveCount > negativeCount && positiveCount > 0) return 'positive';
  if (negativeCount > positiveCount && negativeCount > 0) return 'negative';
  if (neutralCount > 0) return 'neutral';

  return 'neutral';
}
