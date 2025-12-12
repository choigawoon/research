import { App, LogLevel } from '@slack/bolt';
import { handleMention } from './handlers/mention.js';
import { handleMessage } from './handlers/message.js';
import { handleCommand } from './handlers/command.js';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
  logLevel: LogLevel.INFO,
});

// @claude 멘션 처리
app.event('app_mention', handleMention);

// 스레드 메시지 처리 (기존 세션 이어가기)
app.event('message', handleMessage);

// 슬래시 커맨드 처리
app.command('/claude', handleCommand);

// 에러 핸들링
app.error(async (error) => {
  console.error('Slack app error:', error);
});

(async () => {
  await app.start();
  console.log('⚡ Slack bot is running in Socket Mode');
})();
