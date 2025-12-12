import type { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from '@slack/bolt';
import {
  createSession,
  getSessionBySlack,
  cancelSession,
} from '../services/claude-proxy.js';

type CommandArgs = SlackCommandMiddlewareArgs & AllMiddlewareArgs;

const DEFAULT_WORKING_DIR = '/workspace';

export async function handleCommand({ command, ack, respond }: CommandArgs): Promise<void> {
  await ack();

  const args = command.text.trim().split(/\s+/);
  const subCommand = args[0]?.toLowerCase();

  switch (subCommand) {
    case 'new':
    case 'start': {
      const workingDir = args[1] || DEFAULT_WORKING_DIR;
      // 커맨드 스레드에서 새 세션 시작
      const session = await createSession(
        workingDir,
        command.channel_id,
        command.trigger_id // 임시로 trigger_id 사용
      );
      await respond({
        text: `🚀 새 Claude 세션이 시작되었습니다!\n• Session ID: \`${session.sessionId}\`\n• Working dir: \`${session.workingDir}\`\n\n이제 이 채널에서 @claude를 멘션하여 대화를 시작하세요.`,
        response_type: 'in_channel',
      });
      break;
    }

    case 'stop':
    case 'cancel': {
      const channelId = command.channel_id;
      // 현재 채널의 활성 세션 찾기 시도
      const existingSession = await getSessionBySlack(channelId, command.trigger_id);
      if (existingSession) {
        await cancelSession(existingSession.sessionId);
        await respond({
          text: '⏹️ 현재 진행 중인 작업을 취소했습니다.',
          response_type: 'in_channel',
        });
      } else {
        await respond({
          text: '취소할 활성 세션이 없습니다.',
          response_type: 'ephemeral',
        });
      }
      break;
    }

    case 'status': {
      await respond({
        text: '📊 세션 상태를 확인하려면 스레드에서 @claude status를 사용하세요.',
        response_type: 'ephemeral',
      });
      break;
    }

    case 'help':
    default: {
      await respond({
        text: `*Claude 명령어 도움말*

• \`/claude new [working_dir]\` - 새 세션 시작
• \`/claude stop\` - 진행 중인 작업 취소
• \`/claude status\` - 현재 세션 상태 확인
• \`/claude help\` - 이 도움말 보기

*사용 방법:*
1. 채널에서 @claude를 멘션하면 새 스레드에서 대화가 시작됩니다
2. 스레드 내에서는 멘션 없이 대화를 이어갈 수 있습니다
3. 각 스레드는 독립된 Claude 세션으로 유지됩니다`,
        response_type: 'ephemeral',
      });
      break;
    }
  }
}
