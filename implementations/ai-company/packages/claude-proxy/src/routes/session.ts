import { Router, Request, Response } from 'express';
import { claudeSDK } from '../claude-sdk.js';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import Redis from 'ioredis';

export const sessionRouter = Router();

// Redis 연결 (세션 메타데이터 저장용)
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const CreateSessionSchema = z.object({
  workingDir: z.string().default('/workspace'),
  slackThreadTs: z.string().optional(),
  slackChannelId: z.string().optional(),
});

// POST /api/session/create - Create new Claude session
sessionRouter.post('/create', async (req: Request, res: Response) => {
  try {
    const { workingDir, slackThreadTs, slackChannelId } = CreateSessionSchema.parse(req.body);

    const sessionId = uuidv4();
    const session = await claudeSDK.createSession(sessionId, workingDir);

    // Redis에 세션 메타데이터 저장
    const metadata = {
      sessionId,
      workingDir,
      slackThreadTs,
      slackChannelId,
      createdAt: session.createdAt.toISOString(),
    };
    await redis.hset(`session:${sessionId}`, metadata);

    // Slack 스레드와 세션 매핑 저장
    if (slackThreadTs && slackChannelId) {
      await redis.set(`slack:${slackChannelId}:${slackThreadTs}`, sessionId);
    }

    res.json({
      sessionId,
      workingDir,
      createdAt: session.createdAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/session/:sessionId - Get session info
sessionRouter.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = claudeSDK.getSession(sessionId);
    const metadata = await redis.hgetall(`session:${sessionId}`);

    if (!session && Object.keys(metadata).length === 0) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({
      sessionId,
      workingDir: session?.workingDir || metadata.workingDir,
      historyLength: session?.history.length || 0,
      lastActiveAt: session?.lastActiveAt?.toISOString(),
      ...metadata,
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/session/by-slack/:channelId/:threadTs - Get session by Slack thread
sessionRouter.get('/by-slack/:channelId/:threadTs', async (req: Request, res: Response) => {
  try {
    const { channelId, threadTs } = req.params;

    const sessionId = await redis.get(`slack:${channelId}:${threadTs}`);
    if (!sessionId) {
      res.status(404).json({ error: 'No session found for this Slack thread' });
      return;
    }

    const session = claudeSDK.getSession(sessionId);
    const metadata = await redis.hgetall(`session:${sessionId}`);

    res.json({
      sessionId,
      workingDir: session?.workingDir || metadata.workingDir,
      historyLength: session?.history.length || 0,
      ...metadata,
    });
  } catch (error) {
    console.error('Get session by slack error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/session/:sessionId - Destroy session
sessionRouter.delete('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    // Get metadata to clean up Slack mapping
    const metadata = await redis.hgetall(`session:${sessionId}`);
    if (metadata.slackChannelId && metadata.slackThreadTs) {
      await redis.del(`slack:${metadata.slackChannelId}:${metadata.slackThreadTs}`);
    }

    await claudeSDK.destroySession(sessionId);
    await redis.del(`session:${sessionId}`);

    res.json({ deleted: true });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
