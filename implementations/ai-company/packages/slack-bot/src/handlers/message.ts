import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import {
  getSessionBySlack,
  queryClaudeStreaming,
  ClaudeMessage,
} from '../services/claude-proxy.js';

type MessageEvent = SlackEventMiddlewareArgs<'message'> & AllMiddlewareArgs;

export async function handleMessage({ event, client }: MessageEvent): Promise<void> {
  // 봇 메시지 무시
  if ('bot_id' in event || !('text' in event)) {
    return;
  }

  // 스레드 내 메시지만 처리
  if (!('thread_ts' in event) || !event.thread_ts) {
    return;
  }

  // 멘션 메시지는 mention handler에서 처리
  if (event.text?.includes('<@')) {
    return;
  }

  const channelId = event.channel;
  const threadTs = event.thread_ts;
  const userMessage = event.text || '';

  // 기존 세션 확인
  const session = await getSessionBySlack(channelId, threadTs);
  if (!session) {
    // 세션이 없으면 무시 (멘션으로 시작해야 함)
    return;
  }

  // 처리 중 메시지
  const processingMsg = await client.chat.postMessage({
    channel: channelId,
    thread_ts: threadTs,
    text: '⏳ 처리 중...',
  });

  try {
    const messages: ClaudeMessage[] = [];

    await queryClaudeStreaming(session.sessionId, userMessage, (message) => {
      messages.push(message);
    });

    const textMessages = messages.filter((m) => m.type === 'text');
    const responseText =
      textMessages.map((m) => m.content).join('\n') || '(응답 없음)';

    await client.chat.update({
      channel: channelId,
      ts: processingMsg.ts!,
      text: responseText,
    });
  } catch (error) {
    console.error('Error processing message:', error);

    await client.chat.update({
      channel: channelId,
      ts: processingMsg.ts!,
      text: `❌ 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}
