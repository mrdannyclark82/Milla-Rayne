import { storage } from './storage';
import { loadMemoryCore, MemoryCoreEntry } from './memoryService';
import { dispatchAIResponse } from './aiDispatcherService';
import { InsertMemorySummary, MemorySummary } from '../shared/schema';
import { extractTopics, detectEmotionalTone } from './utils';

/**
 * Generates summaries of long-term memories using an AI model.
 * This function will group memories and create concise summaries.
 */
export async function generateMemorySummaries(
  userId: string
): Promise<MemorySummary[]> {
  const memoryCore = await loadMemoryCore();
  if (!memoryCore.success || memoryCore.entries.length === 0) {
    console.log('No memories to summarize.');
    return [];
  }

  const userMemories = memoryCore.entries.filter(
    (entry) => entry.speaker === 'user' || entry.speaker === 'milla'
  );
  if (userMemories.length === 0) {
    console.log('No user-related memories to summarize.');
    return [];
  }

  // Group memories by a simple heuristic (e.g., every 10 entries or by topic)
  const groupedMemories: MemoryCoreEntry[][] = [];
  let currentGroup: MemoryCoreEntry[] = [];
  let currentTopics: string[] = [];

  for (const entry of userMemories) {
    const entryTopics = extractTopics(entry.content);
    const commonTopics = entryTopics.filter((topic) =>
      currentTopics.includes(topic)
    );

    // Start a new group if current group is too large or topics diverge significantly
    if (
      currentGroup.length >= 10 ||
      (currentGroup.length > 0 &&
        commonTopics.length === 0 &&
        entryTopics.length > 0)
    ) {
      groupedMemories.push(currentGroup);
      currentGroup = [];
      currentTopics = [];
    }

    currentGroup.push(entry);
    currentTopics = Array.from(new Set([...currentTopics, ...entryTopics]));
  }
  if (currentGroup.length > 0) {
    groupedMemories.push(currentGroup);
  }

  const generatedSummaries: MemorySummary[] = [];

  for (const group of groupedMemories) {
    const combinedContent = group
      .map((entry) => `[${entry.speaker}]: ${entry.content}`)
      .join('\n');
    const summaryPrompt = `Please summarize the following conversation/memory snippets into a concise, coherent long-term memory entry. Focus on key events, topics, and emotional tone. The summary should be no more than 3-5 sentences.\n\n${combinedContent}\n\nSummary:`;

    try {
      const aiResponse = await dispatchAIResponse(summaryPrompt, {
        userId: userId,
        conversationHistory: [], // No specific conversation history for summarization prompt
        userName: 'System', // Or a specific summarization persona
      });

      if (aiResponse.success && aiResponse.content) {
        const summaryText = aiResponse.content;
        const summaryTitle = summaryText.split('.')[0].trim() + '.'; // Simple title extraction
        const summaryTopics = Array.from(
          new Set(group.flatMap((entry) => entry.topics || []))
        );
        const summaryEmotionalTone = detectEmotionalTone(summaryText);

        const newSummary: InsertMemorySummary = {
          userId: userId,
          title: summaryTitle,
          summaryText: summaryText,
          topics: summaryTopics,
          emotionalTone: summaryEmotionalTone as
            | 'positive'
            | 'negative'
            | 'neutral',
        };
        const storedSummary = await storage.createMemorySummary(newSummary);
        generatedSummaries.push(storedSummary);
      }
    } catch (error) {
      console.error('Error generating summary with AI:', error);
    }
  }

  return generatedSummaries;
}

/**
 * Retrieves relevant memory summaries for a given user and query.
 */
export async function retrieveMemorySummaries(
  userId: string,
  query: string,
  limit: number = 5
): Promise<MemorySummary[]> {
  return storage.searchMemorySummaries(userId, query, limit);
}
