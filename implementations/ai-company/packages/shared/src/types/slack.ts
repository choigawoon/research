export interface SlackContext {
  channelId: string;
  threadTs: string;
  userId: string;
  teamId: string;
}

export interface SlackMessageEvent {
  type: string;
  channel: string;
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
  team?: string;
}

export interface SlackMentionEvent extends SlackMessageEvent {
  type: 'app_mention';
}
