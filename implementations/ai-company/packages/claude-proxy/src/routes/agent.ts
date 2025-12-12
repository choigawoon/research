import { Router, Request, Response } from 'express';
import { claudeSDK } from '../claude-sdk.js';
import { z } from 'zod';

export const agentRouter = Router();

const QuerySchema = z.object({
  sessionId: z.string(),
  prompt: z.string(),
  stream: z.boolean().optional().default(true),
});

// POST /api/agent/query - Send query to Claude
agentRouter.post('/query', async (req: Request, res: Response) => {
  try {
    const { sessionId, prompt, stream } = QuerySchema.parse(req.body);

    const session = claudeSDK.getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    if (stream) {
      // Server-Sent Events for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const generator = await claudeSDK.query(sessionId, prompt);
      for await (const message of generator) {
        res.write(`data: ${JSON.stringify(message)}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      // Collect all messages and return at once
      const messages = [];
      const generator = await claudeSDK.query(sessionId, prompt);
      for await (const message of generator) {
        messages.push(message);
      }
      res.json({ messages });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    console.error('Query error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/agent/cancel - Cancel ongoing query
agentRouter.post('/cancel', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    const cancelled = await claudeSDK.cancelSession(sessionId);
    res.json({ cancelled });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
