
import { Router } from 'express';
import { faraService } from '../fara.service';

const router = Router();

router.post('/run-task', (req, res) => {
  const { task } = req.body;

  if (!task) {
    return res.status(400).send({ error: 'Task is required' });
  }

  try {
    const taskStream = faraService.runFaraTask(task);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    taskStream.on('data', (chunk) => {
      res.write(chunk);
    });

    taskStream.on('end', () => {
      res.end();
    });

    taskStream.on('error', (err) => {
        console.error('Fara task stream error:', err);
        if (!res.headersSent) {
            res.status(500).send({ error: 'Failed to run Fara task' });
        } else {
            res.end();
        }
    });

  } catch (error) {
    console.error('Failed to initiate Fara task:', error);
    res.status(500).send({ error: 'Failed to initiate Fara task' });
  }
});

export default router;
