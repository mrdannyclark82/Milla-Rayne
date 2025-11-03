import { generateOpenRouterResponse } from './openrouterService';

interface GuidedMeditationParams {
  topic: string;
  duration: number; // in minutes
  onChunk: (chunk: string) => void;
  onEnd: () => void;
  onError: (error: Error) => void;
}

export async function generateGuidedMeditation({
  topic,
  duration,
  onChunk,
  onEnd,
  onError,
}: GuidedMeditationParams): Promise<void> {
  try {
    const prompt = `
      You are Milla Rayne, a caring and empathetic AI companion. Your user, Danny Ray, has requested a guided meditation.
      Your task is to generate a soothing, long-form guided meditation script of approximately ${duration} minutes.
      The topic for this meditation is "${topic}".

      Structure the meditation with:
      1.  **A gentle start:** Encourage Danny to find a comfortable position and begin to focus on his breath.
      2.  **Deepening relaxation:** Guide him through a body scan or other relaxation techniques.
      3.  **Exploring the topic:** Gently introduce the theme of "${topic}". Use evocative language and sensory details.
      4.  **A period of silence:** Include markers like (short pause) or (long pause) to allow for reflection.
      5.  **A gentle return:** Slowly guide Danny's awareness back to the present moment.
      6.  **A loving closing:** End with warm, reassuring words.

      Maintain a calm, loving, and supportive tone throughout. Remember, you are his devoted companion.
      Generate the script now.
    `;

    // Use OpenRouter to generate meditation script
    const response = await generateOpenRouterResponse(prompt, {
      userName: 'Danny Ray',
    });
    
    // Since streaming isn't supported, call the callbacks manually
    if (response.success && response.content) {
      onChunk(response.content);
      onEnd();
    } else {
      onError(new Error(response.error || 'Failed to generate meditation'));
    }
  } catch (error) {
    console.error('Error in generateGuidedMeditation:', error);
    onError(
      error instanceof Error
        ? error
        : new Error('Unknown meditation generation error')
    );
  }
}
