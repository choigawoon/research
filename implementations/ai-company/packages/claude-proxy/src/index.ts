import express from 'express';
import { agentRouter } from './routes/agent.js';
import { sessionRouter } from './routes/session.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/agent', agentRouter);
app.use('/api/session', sessionRouter);

app.listen(PORT, () => {
  console.log(`Claude Proxy running on port ${PORT}`);
});
