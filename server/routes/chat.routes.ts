import { Router, type Express } from 'express';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { config } from '../config';
import { 
  validateSession,
  getUserAIModel,
  updateUserAIModel
} from '../authService';
import { 
  generateAIResponse,
  validateAndSanitizePrompt
} from '../services/chatOrchestrator.service';
import { analyzeVoiceInput } from '../voiceAnalysisService';
import { getSmartHomeSensorData } from '../smartHomeService';
import { detectSceneContext } from '../sceneDetectionService';
import { sceneService } from '../services/scene.service';
import { upload } from '../middleware/upload.middleware';
import { asyncHandler } from '../utils/routeHelpers';

/**
 * Chat and AI Routes
 */
export function registerChatRoutes(app: Express) {
  const router = Router();

  // Get current AI model preference
  router.get('/ai-model/current', asyncHandler(async (req, res) => {
    const sessionToken = req.cookies.session_token;

    if (!sessionToken) {
      return res.json({ success: true, model: 'minimax' });
    }

    const sessionResult = await validateSession(sessionToken);
    if (!sessionResult.valid || !sessionResult.user) {
      return res.json({ success: true, model: 'minimax' });
    }

    const result = await getUserAIModel(sessionResult.user.id as string);
    res.json(result);
  }));

  // Set AI model preference
  router.post('/ai-model/set', asyncHandler(async (req, res) => {
    const { model } = req.body;
    const sessionToken = req.cookies.session_token;

    if (!model) {
      return res.status(400).json({ success: false, error: 'Model is required' });
    }

    const validModels = ['minimax', 'xai', 'venice-uncensored', 'deepseek-coder', 'grok-2', 'gemini-2-flash'];
    if (!validModels.includes(model)) {
      return res.status(400).json({ success: false, error: `Invalid model. Must be one of: ${validModels.join(', ')}` });
    }

    if (!sessionToken) {
      return res.json({ success: true, model });
    }

    const sessionResult = await validateSession(sessionToken);
    if (!sessionResult.valid || !sessionResult.user) {
      return res.json({ success: true, model });
    }

    const result = await updateUserAIModel(sessionResult.user.id as string, model);
    res.json({ ...result, model });
  }));

  // Chat/Audio endpoint
  router.post('/chat/audio', upload.single('audio'), asyncHandler(async (req, res) => {
    const shouldStubAudio = process.env.ENABLE_AUDIO_STUB !== 'false';

    if (shouldStubAudio) {
      return res.status(200).json({
        success: true,
        response: 'This is a test AI response',
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const audioFile = fs.createReadStream(req.file.path);
    const formData = new FormData();
    formData.append('file', audioFile, {
      filename: req.file.filename,
      contentType: req.file.mimetype,
    });
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openai.apiKey}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    const aiResponse = await generateAIResponse(
      data.text,
      [],
      'Danny Ray',
      undefined,
      'default-user',
      undefined
    );

    res.json({
      response: aiResponse.content,
      success: true,
    });
  }));

  // Chat endpoint
  router.post('/chat', asyncHandler(async (req, res) => {
    let { message } = req.body;
    const { audioData, audioMimeType } = req.body;
    let userEmotionalState: any;

    if (audioData && audioMimeType) {
      const audioBuffer = Buffer.from(audioData, 'base64');
      const voiceAnalysis = await analyzeVoiceInput(audioBuffer, audioMimeType);

      if (voiceAnalysis.success) {
        message = voiceAnalysis.text;
        userEmotionalState = voiceAnalysis.emotionalTone;
      } else {
        return res.status(500).json({ error: voiceAnalysis.error });
      }
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    message = validateAndSanitizePrompt(message);

    const sessionToken = req.cookies.session_token;
    let userId: string = 'default-user';
    if (sessionToken) {
      const sessionResult = await validateSession(sessionToken);
      if (sessionResult.valid && sessionResult.user) {
        userId = sessionResult.user.id || 'default-user';
      }
    }

    const bypassFunctionCalls = message.trim().startsWith('##');
    const processedMessage = bypassFunctionCalls ? message.trim().substring(2).trim() : message;

    // Handle Scene Context
    const sensorData = await getSmartHomeSensorData();
    const sceneContext = detectSceneContext(processedMessage, sceneService.getLocation() as any, sensorData || undefined);
    
    if (sceneContext.hasSceneChange) {
      sceneService.updateScene(sceneContext.location as any, sceneContext.mood);
    }

    // Generate AI Response
    const aiResponse = await generateAIResponse(
      processedMessage,
      [], // History could be fetched here
      'Danny Ray',
      undefined,
      userId,
      userEmotionalState,
      bypassFunctionCalls
    );

    res.json({
      response: aiResponse.content,
      ...aiResponse, // Include imageUrl, youtube_play, etc.
      sceneContext: sceneService.getSceneContext()
    });
  }));

  // Mount routes
  app.use('/api', router);
}
