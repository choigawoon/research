# Slack AI Platform

Slack-First AI Company Platform - Slack을 통해 모든 제품 의사결정과 개발이 이루어지는 AI 플랫폼

## 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    Slack (Layer 1)                      │
│              의사결정, 승인, 주요 작업                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   slack-bot                              │
│              @slack/bolt + Socket Mode                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  claude-proxy                            │
│             Claude Agent SDK Wrapper                     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    Redis                                 │
│         Session Store (Thread → Session 매핑)            │
└─────────────────────────────────────────────────────────┘
```

## 패키지 구조

```
packages/
├── claude-proxy/     # Claude Agent SDK Proxy Server
├── slack-bot/        # Slack Bot (Socket Mode)
└── shared/           # 공유 타입 및 유틸리티
```

## 시작하기

### 사전 요구사항

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- Slack App 설정 (Bot Token, Signing Secret, App Token)
- Claude CLI 인증 (`~/.claude`)

### 설치

```bash
# 의존성 설치
pnpm install

# 환경변수 설정
cp .env.example .env
# .env 파일 수정

# 개발 서버 실행
pnpm dev
```

### Docker 실행

```bash
# 빌드
pnpm docker:build

# 실행
pnpm docker:up

# 중지
pnpm docker:down
```

## Slack App 설정

1. [Slack API](https://api.slack.com/apps)에서 새 앱 생성
2. Bot Token Scopes 추가:
   - `app_mentions:read`
   - `chat:write`
   - `channels:history`
   - `groups:history`
3. Event Subscriptions 활성화:
   - `app_mention`
   - `message.channels`
   - `message.groups`
4. Socket Mode 활성화
5. 슬래시 커맨드 추가: `/claude`

## 사용법

### 새 세션 시작
채널에서 `@claude` 멘션하면 새 스레드에서 세션이 시작됩니다.

### 스레드 대화
한번 시작된 스레드 내에서는 멘션 없이 대화를 이어갈 수 있습니다.

### 명령어
- `/claude new [working_dir]` - 새 세션 시작
- `/claude stop` - 진행 중인 작업 취소
- `/claude help` - 도움말

## 라이선스

Private
