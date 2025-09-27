import { Mistral } from '@mistralai/mistralai';
import fs from 'fs/promises';
import path from 'path';
import express from 'express';

const router = express.Router();

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const model = "mistral-ai/mistral-medium-2505";

/**
 * Reads the project structure, task status report, and a sample of code for enhancement analysis.
 */
async function gatherProjectContext(): Promise<string> {
  // Read project structure
  const folders = await fs.readdir(path.resolve(__dirname, '../../'), { withFileTypes: true });
  const structure = folders.map(f => (f.isDirectory() ? f.name + '/' : f.name)).join('\n');

  // Read task status report
  let taskReport = '';
  try {
    taskReport = await fs.readFile(path.resolve(__dirname, '../../task_status_report.md'), 'utf8');
  } catch {}

  // Read a sample of code (e.g., main server file)
  let codeSample = '';
  try {
    codeSample = await fs.readFile(path.resolve(__dirname, '../server/fileStorage.ts'), 'utf8');
  } catch {}

  return `Project Structure:\n${structure}\n\nTask Status Report:\n${taskReport}\n\nSample Code:\n${codeSample}`;
}

router.post('/suggest-enhancements', async (req, res) => {
  try {
    const context = await gatherProjectContext();
    const client = new Mistral({ apiKey: token, serverURL: endpoint });
    const prompt = `You are an expert AI project advisor. Given the following project context, suggest 3 future enhancements or improvements.\n\n${context}`;
    const response = await client.chat.complete({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
  maxTokens: 500,
  topP: 1.0
    });
    res.json({ suggestions: response.choices[0].message.content });
  } catch (err) {
    let errorMsg = 'Unknown error';
    if (err && typeof err === 'object' && 'message' in err) {
      errorMsg = (err as any).message;
    } else if (typeof err === 'string') {
      errorMsg = err;
    }
    res.status(500).json({ error: errorMsg });
  }
});

export default router;
