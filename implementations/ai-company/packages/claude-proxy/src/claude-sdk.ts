import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface ClaudeMessage {
  type: 'text' | 'tool_use' | 'tool_result' | 'error';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ClaudeSession {
  id: string;
  workingDir: string;
  process: ChildProcess | null;
  history: ClaudeMessage[];
  createdAt: Date;
  lastActiveAt: Date;
}

export class ClaudeSDK extends EventEmitter {
  private sessions: Map<string, ClaudeSession> = new Map();

  async createSession(sessionId: string, workingDir: string): Promise<ClaudeSession> {
    const session: ClaudeSession = {
      id: sessionId,
      workingDir,
      process: null,
      history: [],
      createdAt: new Date(),
      lastActiveAt: new Date(),
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): ClaudeSession | undefined {
    return this.sessions.get(sessionId);
  }

  async query(sessionId: string, prompt: string): Promise<AsyncGenerator<ClaudeMessage>> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.lastActiveAt = new Date();

    return this.executeClaudeCommand(session, prompt);
  }

  private async *executeClaudeCommand(
    session: ClaudeSession,
    prompt: string
  ): AsyncGenerator<ClaudeMessage> {
    // Claude CLI를 subprocess로 실행
    // --print 모드로 실행하여 JSON 출력
    const args = [
      '--print',
      '--output-format', 'stream-json',
      prompt
    ];

    const proc = spawn('claude', args, {
      cwd: session.workingDir,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    session.process = proc;

    let buffer = '';

    // stdout에서 streaming JSON 파싱
    for await (const chunk of proc.stdout) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          const message = this.parseClaudeOutput(parsed);
          if (message) {
            session.history.push(message);
            yield message;
          }
        } catch {
          // Non-JSON output, treat as text
          const message: ClaudeMessage = { type: 'text', content: line };
          session.history.push(message);
          yield message;
        }
      }
    }

    // stderr 처리
    let stderr = '';
    for await (const chunk of proc.stderr) {
      stderr += chunk.toString();
    }

    if (stderr) {
      const errorMessage: ClaudeMessage = { type: 'error', content: stderr };
      session.history.push(errorMessage);
      yield errorMessage;
    }

    session.process = null;
  }

  private parseClaudeOutput(output: Record<string, unknown>): ClaudeMessage | null {
    // Claude CLI JSON 출력 형식에 맞춰 파싱
    if (output.type === 'assistant') {
      return {
        type: 'text',
        content: String(output.message || ''),
        metadata: output,
      };
    }
    if (output.type === 'tool_use') {
      return {
        type: 'tool_use',
        content: JSON.stringify(output),
        metadata: output,
      };
    }
    if (output.type === 'tool_result') {
      return {
        type: 'tool_result',
        content: JSON.stringify(output),
        metadata: output,
      };
    }
    if (output.type === 'error') {
      return {
        type: 'error',
        content: String(output.error || output.message || ''),
        metadata: output,
      };
    }
    return null;
  }

  async cancelSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (session?.process) {
      session.process.kill('SIGTERM');
      session.process = null;
      return true;
    }
    return false;
  }

  async destroySession(sessionId: string): Promise<void> {
    await this.cancelSession(sessionId);
    this.sessions.delete(sessionId);
  }
}

export const claudeSDK = new ClaudeSDK();
