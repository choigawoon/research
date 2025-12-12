import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import {
  createSession,
  getSessionBySlack,
  queryClaudeStreaming,
  ClaudeMessage,
} from '../services/claude-proxy.js';

type AppMentionEvent = SlackEventMiddlewareArgs<'app_mention'> & AllMiddlewareArgs;

const DEFAULT_WORKING_DIR = '/workspace';

export async function handleMention({ event, client, say }: AppMentionEvent): Promise<void> {
  const channelId = event.channel;
  const threadTs = event.thread_ts || event.ts;
  const userMessage = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();

  if (!userMessage) {
    await say({
      text: '무엇을 도와드릴까요? 질문이나 작업을 말씀해주세요.',
      thread_ts: threadTs,
    });
    return;
  }

  // 기존 세션 확인 또는 새 세션 생성
  let session = await getSessionBySlack(channelId, threadTs);

  if (!session) {
    session = await createSession(DEFAULT_WORKING_DIR, channelId, threadTs);
    await say({
      text: `🚀 새 세션을 시작합니다. (Working dir: \`${session.workingDir}\`)`,
      thread_ts: threadTs,
    });
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

    // 결과 메시지 구성
    const textMessages = messages.filter((m) => m.type === 'text');
    const responseText =
      textMessages.map((m) => m.content).join('\n') || '(응답 없음)';

    // 처리 중 메시지 업데이트
    await client.chat.update({
      channel: channelId,
      ts: processingMsg.ts!,
      text: responseText,
    });

    // 도구 사용 내역 표시
    const toolMessages = messages.filter((m) => m.type === 'tool_use');
    if (toolMessages.length > 0) {
      const toolSummary = toolMessages
        .map((m) => {
          const meta = m.metadata as { tool?: string; input?: unknown };
          return `• ${meta?.tool || 'tool'}`;
        })
        .join('\n');

      await say({
        text: `🔧 *사용된 도구:*\n${toolSummary}`,
        thread_ts: threadTs,
      });
    }

    // 에러 메시지 표시
    const errorMessages = messages.filter((m) => m.type === 'error');
    if (errorMessages.length > 0) {
      await say({
        text: `⚠️ *오류:*\n${errorMessages.map((m) => m.content).join('\n')}`,
        thread_ts: threadTs,
      });
    }
  } catch (error) {
    console.error('Error processing mention:', error);

    await client.chat.update({
      channel: channelId,
      ts: processingMsg.ts!,
      text: `❌ 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}
