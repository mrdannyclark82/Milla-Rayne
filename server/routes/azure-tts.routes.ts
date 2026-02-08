import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { generateAzureSpeech } from '../api/azureTtsService';
import { asyncHandler } from '../utils/routeHelpers';

export function registerAzureTtsRoutes(app: any) {
  const router = Router();

  router.post(
    '/azure/tts',
    asyncHandler(async (req, res) => {
      const { text, voiceName, config } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const audioUrl = await generateAzureSpeech(text, voiceName, config);

      if (!audioUrl) {
        return res.status(500).json({ error: 'Failed to generate speech' });
      }

      // Resolve file path from the public URL
      // The URL is like /audio/azure/filename.mp3
      // The file is in client/public/audio/azure/filename.mp3
      const relativePath = audioUrl.replace('/audio/', '');
      const audioFilePath = path.resolve(
        process.cwd(),
        'client',
        'public',
        'audio',
        relativePath
      );

      if (!fs.existsSync(audioFilePath)) {
        return res
          .status(500)
          .json({ error: 'Generated audio file not found' });
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      const stream = fs.createReadStream(audioFilePath);
      stream.pipe(res);
    })
  );

  app.use('/api', router);
}
