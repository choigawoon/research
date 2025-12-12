const CLAUDE_PROXY_URL = process.env.CLAUDE_PROXY_URL || 'http://localhost:3001';

export interface SessionInfo {
  sessionId: string;
  workingDir: string;
  createdAt: string;
}

export interface ClaudeMessage {
  type: 'text' | 'tool_use' | 'tool_result' | 'error';
  content: string;
  metadata?: Record<string, unknown>;
}

export async function createSession(
  workingDir: string,
  slackChannelId: string,
  slackThreadTs: string
): Promise<SessionInfo> {
  const response = await fetch(`${CLAUDE_PROXY_URL}/api/session/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workingDir,
      slackChannelId,
      slackThreadTs,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`);
  }

  return response.json();
}

export async function getSessionBySlack(
  channelId: string,
  threadTs: string
): Promise<SessionInfo | null> {
  const response = await fetch(
    `${CLAUDE_PROXY_URL}/api/session/by-slack/${channelId}/${threadTs}`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to get session: ${response.statusText}`);
  }

  return response.json();
}

export async function queryClaudeStreaming(
  sessionId: string,
  prompt: string,
  onMessage: (message: ClaudeMessage) => void
): Promise<void> {
  const response = await fetch(`${CLAUDE_PROXY_URL}/api/agent/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      prompt,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Query failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          return;
        }
        try {
          const message = JSON.parse(data) as ClaudeMessage;
          onMessage(message);
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}

export async function cancelSession(sessionId: string): Promise<boolean> {
  const response = await fetch(`${CLAUDE_PROXY_URL}/api/agent/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });

  if (!response.ok) {
    return false;
  }

  const result = await response.json();
  return result.cancelled;
}
