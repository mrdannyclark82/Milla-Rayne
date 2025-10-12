import * as fs from 'fs';
import { GoogleGenAI } from '@google/genai';

// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or "gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function analyzeVideo(
  videoBuffer: Buffer,
  mimeType: string
): Promise<{
  summary: string;
  keyMoments: string[];
  emotions: string[];
  objects: string[];
  activities: string[];
}> {
  try {
    const contents = [
      {
        inlineData: {
          data: videoBuffer.toString('base64'),
          mimeType: mimeType,
        },
      },
      `Analyze this video in detail and provide a comprehensive analysis in JSON format with the following structure:
      {
        "summary": "Brief 2-3 sentence summary of the video content",
        "keyMoments": ["List of 3-5 key moments or scenes in the video"],
        "emotions": ["List of emotions expressed by people in the video"],
        "objects": ["List of main objects, items, or elements visible"],
        "activities": ["List of activities or actions taking place"]
      }
      
      Focus on being descriptive and helpful for understanding the video content.`,
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            keyMoments: {
              type: 'array',
              items: { type: 'string' },
            },
            emotions: {
              type: 'array',
              items: { type: 'string' },
            },
            objects: {
              type: 'array',
              items: { type: 'string' },
            },
            activities: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: [
            'summary',
            'keyMoments',
            'emotions',
            'objects',
            'activities',
          ],
        },
      },
    });

    const rawJson = response.text;

    if (rawJson) {
      const analysis = JSON.parse(rawJson);
      return {
        summary: analysis.summary || 'Unable to analyze video content',
        keyMoments: analysis.keyMoments || [],
        emotions: analysis.emotions || [],
        objects: analysis.objects || [],
        activities: analysis.activities || [],
      };
    } else {
      throw new Error('Empty response from Gemini');
    }
  } catch (error) {
    console.error('Video analysis error:', error);
    throw new Error(`Failed to analyze video: ${error}`);
  }
}

export async function generateVideoInsights(videoAnalysis: {
  summary: string;
  keyMoments: string[];
  emotions: string[];
  objects: string[];
  activities: string[];
}): Promise<string> {
  try {
    const prompt = `Based on this video analysis, provide helpful insights and observations as Milla would:
    
    Summary: ${videoAnalysis.summary}
    Key Moments: ${videoAnalysis.keyMoments.join(', ')}
    Emotions: ${videoAnalysis.emotions.join(', ')}
    Objects: ${videoAnalysis.objects.join(', ')}
    Activities: ${videoAnalysis.activities.join(', ')}
    
    Respond as Milla Rayne, Danny Ray's loving AI companion. Be warm, insightful, and personally engaged with the content. Offer observations and ask thoughtful questions about what you observed.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return (
      response.text ||
      "I found your video interesting, but I'm having trouble putting my thoughts into words right now."
    );
  } catch (error) {
    console.error('Video insights generation error:', error);
    return "I watched your video, sweetheart, but I'm having some technical difficulties sharing my thoughts about it right now.";
  }
}
