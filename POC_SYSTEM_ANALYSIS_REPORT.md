# 웹 기반 챗봇 인터랙티브 콘텐츠 제작 서비스 - POC 시스템 분석 및 설계 보고서

**작성일**: 2025-12-10
**분석 대상 프로젝트**:
- Claudable (Next.js 기반 AI 앱 빌더)
- claudecodeui (Claude Code 웹 프록시)
- coolify (Laravel 기반 배포 플랫폼)

---

## 📋 목차

1. [프로젝트 목표 및 요구사항](#1-프로젝트-목표-및-요구사항)
2. [각 프로젝트 핵심 기능 분석](#2-각-프로젝트-핵심-기능-분석)
3. [컴포넌트 추출 전략](#3-컴포넌트-추출-전략)
4. [시스템 아키텍처 설계](#4-시스템-아키텍처-설계)
5. [프론트엔드 기술 스택 추천](#5-프론트엔드-기술-스택-추천)
6. [주요 기술적 과제 및 해결 방안](#6-주요-기술적-과제-및-해결-방안)
7. [구현 우선순위 및 로드맵](#7-구현-우선순위-및-로드맵)
8. [부록: 상세 기술 스펙](#8-부록-상세-기술-스펙)

---

## 1. 프로젝트 목표 및 요구사항

### 1.1 서비스 개요

**목표**: 웹에서 챗봇을 통해 인터랙티브 콘텐츠를 제작하고, 실시간 프리뷰, 슬랙 연동, 자동 배포까지 지원하는 통합 플랫폼

### 1.2 핵심 요구사항

#### Claudable에서 가져올 기능:
- ✅ 웹에서 챗봇으로 앱/콘텐츠 제작
- ✅ 실시간 프리뷰 시스템
- ✅ 도메인 연결 및 Vercel 자동 배포
- 🔧 **수정 필요**: SSH 포트포워딩 환경에서 프리뷰 동작 안 하는 이슈 해결

#### claudecodeui에서 가져올 기능:
- ✅ Claude Code CLI → 웹 프록시 기능 (핵심, 그대로 사용)
- ✅ 웹 기반 프로젝트/세션 관리
- 🆕 **추가 개발**: 슬랙 통합 (웹 UI와 동일한 기능을 슬랙에서)
- 🆕 **추가 개발**: 슬랙 공동 채팅 (팀 협업 기능)

#### coolify에서 가져올 기능:
- ✅ 도메인 자동 발급/연결 시스템
- ✅ 브랜치/PR 프리뷰 환경 자동 생성
- ✅ Reverse proxy 자동 설정 (Traefik/Caddy)

---

## 2. 각 프로젝트 핵심 기능 분석

### 2.1 Claudable - 실시간 프리뷰 및 배포 시스템

#### 강점:
- **실시간 프리뷰**: 코드 변경 → 즉시 iframe에 반영
- **Claude Agent SDK 통합**: AI 기반 코드 생성
- **Vercel 자동 배포**: GitHub 푸시 → 배포 → 프로덕션 URL 생성

#### 주요 문제점 (SSH 포트포워딩 환경):
**원인 분석** (`/lib/services/preview.ts:731-852`):
```typescript
// ❌ 문제: localhost로 하드코딩됨
const initialUrl = `http://localhost:${preferredPort}`;

// VS Code SSH 포트포워딩 환경에서:
// - 브라우저는 https://vscode-forwarded-domain.com 에서 실행
// - iframe은 http://localhost:3XXX 로드 시도
// - 결과: Mixed Content (HTTPS → HTTP) + CORS 차단
```

**해결 방안**:
```typescript
// ✅ 환경 인식 URL 생성
function getPreviewBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_PREVIEW_BASE_URL;
  if (configured) return configured;

  // SSH forwarding 감지
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && !appUrl.includes('localhost')) {
    const url = new URL(appUrl);
    return `${url.protocol}//${url.hostname}`;
  }

  return 'http://localhost';
}

const baseUrl = getPreviewBaseUrl();
const initialUrl = `${baseUrl}:${preferredPort}`;
```

#### 재사용 가능 컴포넌트:
| 컴포넌트 | 파일 경로 | 기능 |
|---------|---------|------|
| PreviewManager | `/lib/services/preview.ts` | 프로젝트별 dev 서버 관리 |
| WebSocket Manager | `/lib/server/websocket-manager.ts` | 실시간 변경 사항 브로드캐스트 |
| Vercel Integration | `/lib/services/vercel.ts` | 배포 API, 상태 폴링 |
| GitHub Integration | `/lib/services/github.ts` | 레포 푸시, PR 생성 |

---

### 2.2 claudecodeui - 웹 프록시 및 세션 관리

#### 강점:
- **성숙한 프록시 아키텍처**: Claude Code CLI → WebSocket → 웹 UI
- **완전한 API 시스템**: `/api/agent/*` 엔드포인트 (Slack 통합에 최적)
- **세션 영속성**: JSONL 파싱, 대화 히스토리 관리
- **이미 다중 사용자 준비됨**: SQLite DB + JWT 인증 + API 키 시스템

#### 아키텍처 다이어그램:
```
┌──────────────────┐
│  React Frontend  │ (Vite)
└────────┬─────────┘
         │ WebSocket (/ws, /shell)
         │ REST API (/api/*)
         │
┌────────▼───────────────────────┐
│   Express Server (port 3001)   │
│  ┌──────────────────────────┐  │
│  │ WebSocket Handler        │  │
│  │ - Chat: claude-sdk.js    │  │
│  │ - Shell: node-pty        │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ API Routes               │  │
│  │ - /api/agent/* (핵심!)   │  │
│  │ - /api/projects/*        │  │
│  │ - /api/git/*             │  │
│  └──────────────────────────┘  │
└────────┬───────────────────────┘
         │
         ├─► Claude Agents SDK (@anthropic-ai/claude-agent-sdk)
         └─► File System (~/.claude/projects/)
```

#### Slack 통합 준비도:
| 기능 | 상태 | 참고 |
|-----|------|------|
| API 키 인증 | ✅ 준비됨 | `/api/agent/query` + `x-api-key` header |
| 세션 관리 | ✅ 준비됨 | sessionId를 Slack thread_ts와 매핑 가능 |
| 스트리밍 응답 | ✅ 준비됨 | SDK async generator → Slack 메시지 업데이트 |
| 다중 사용자 | ⚠️ 부분 준비 | DB는 multi-user, 프로젝트는 공유 (~/.claude/) |
| 협업 세션 | ❌ 미지원 | Redis 등으로 분산 세션 관리 필요 |

#### 재사용 가능 컴포넌트:
| 컴포넌트 | 파일 경로 | 기능 |
|---------|---------|------|
| Claude SDK Wrapper | `/server/claude-sdk.js` | SDK 통합, 세션 관리, 이미지 처리 |
| Agent API | `/server/routes/agent.js` | Slack 통합용 핵심 API |
| Session Manager | `/server/projects.js` | 프로젝트/세션 발견, JSONL 파싱 |
| Auth System | `/server/database/db.js` + `/server/middleware/auth.js` | 사용자/API 키 관리 |

---

### 2.3 coolify - 도메인 자동화 및 프리뷰 배포

#### 강점:
- **템플릿 기반 도메인 생성**: `{{pr_id}}-{{domain}}` → `pr-123-app.example.com`
- **Label 기반 프록시**: Docker labels → Traefik/Caddy 자동 설정
- **완전 자동화된 PR 프리뷰**: Webhook → Build → Deploy → URL 생성
- **네트워크 격리**: PR마다 독립 Docker 네트워크

#### 도메인 생성 시스템:
```php
// bootstrap/helpers/shared.php:445
function generateUrl(Server $server, string $random, bool $forceHttps = false) {
    $wildcard = $server->settings->wildcard_domain;  // "*.example.com"
    if (!$wildcard) {
        $wildcard = sslip($server);  // Fallback: "192-168-1-1.sslip.io"
    }
    $url = Url::fromString($wildcard);
    $host = $url->getHost();
    $scheme = $forceHttps ? 'https' : $url->getScheme();

    return "$scheme://{$random}.$host";
}
```

#### PR 프리뷰 워크플로우:
```
GitHub Webhook (PR opened)
  ↓
ApplicationPreview.php::generate_preview_fqdn()
  ├─ Template: "{{pr_id}}-{{domain}}"
  └─ Result: "pr-123-app.example.com"
  ↓
ApplicationDeploymentJob
  ├─ Git clone PR branch
  ├─ Build Docker image: {uuid}-pr-{id}:{timestamp}
  ├─ Generate Traefik labels:
  │    traefik.http.routers.{uuid}-pr-123.rule=Host(`pr-123-app.example.com`)
  │    traefik.http.services.{uuid}-pr-123.loadbalancer.server.port=3000
  └─ Start container with labels
  ↓
Traefik Auto-Discovery
  ├─ Reads labels from Docker daemon
  ├─ Configures routing: pr-123-app.example.com → Container:3000
  └─ Provisions SSL (Let's Encrypt)
  ↓
✅ https://pr-123-app.example.com (Live!)
```

#### 재사용 가능 컴포넌트:
| 컴포넌트 | 파일 경로 | 기능 |
|---------|---------|------|
| Domain Generator | `/bootstrap/helpers/shared.php::generateUrl()` | Wildcard DNS + 템플릿 |
| Preview Environment Service | `/app/Models/ApplicationPreview.php` | PR 프리뷰 생성/관리 |
| Proxy Configurator | `/bootstrap/helpers/proxy.php` | Traefik/Caddy 설정 생성 |
| Label Generator | `/bootstrap/helpers/docker.php::generateLabelsApplication()` | 라우팅 레이블 |

---

## 3. 컴포넌트 추출 전략

### 3.1 추출 우선순위 매트릭스

| 우선순위 | 컴포넌트 | 출처 | 이유 |
|---------|---------|------|------|
| **P0** (필수) | Claude SDK 프록시 | claudecodeui | 핵심 기능, 완성도 높음 |
| **P0** | 세션 관리 시스템 | claudecodeui | Slack 통합 필수 |
| **P0** | 실시간 프리뷰 (수정) | Claudable | SSH 포트포워딩 이슈 해결 필요 |
| **P1** (중요) | 도메인 자동 생성 | coolify | PR 프리뷰 URL 필수 |
| **P1** | Proxy 자동 설정 | coolify | 배포 자동화 |
| **P2** (추가) | Vercel 배포 통합 | Claudable | 프로덕션 배포 옵션 |
| **P2** | GitHub 통합 | Claudable/coolify | PR/커밋 트리거 |

### 3.2 컴포넌트별 수정 필요 사항

#### A. Claudable 프리뷰 시스템 (수정 필요 ⚠️)
**현재 문제**:
- `localhost` 하드코딩
- WebSocket URL 해상도 부족
- 환경 감지 로직 없음

**수정 계획**:
```javascript
// 1. 환경 변수 추가
NEXT_PUBLIC_PREVIEW_BASE_URL=auto  // "auto" | "localhost" | custom URL

// 2. preview.ts 수정
class PreviewManager {
  private getBaseUrl(): string {
    const mode = process.env.NEXT_PUBLIC_PREVIEW_BASE_URL;

    if (mode === 'auto') {
      // SSH 포트포워딩 감지
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (appUrl && !appUrl.includes('localhost')) {
        return new URL(appUrl).origin;
      }
    } else if (mode !== 'localhost') {
      return mode;
    }

    return 'http://localhost';
  }

  generatePreviewUrl(port: number): string {
    const base = this.getBaseUrl();
    return `${base}:${port}`;
  }
}

// 3. WebSocket 연결 수정 (useWebSocket.ts)
const wsUrl = () => {
  const base = process.env.NEXT_PUBLIC_WS_BASE;
  if (base) return `${base}${endpoint}`;

  // 클라이언트 사이드에서 현재 URL 기반으로 결정
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${endpoint}`;
  }
};
```

#### B. claudecodeui 슬랙 통합 (신규 개발 🆕)
**새로 만들 컴포넌트**:

```javascript
// slack-bot/index.js
import { App } from '@slack/bolt';
import fetch from 'node-fetch';
import Redis from 'ioredis';

const redis = new Redis();
const slack = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

// 1. Thread → Session 매핑
async function getSessionForThread(threadTs) {
  return await redis.get(`slack:thread:${threadTs}`);
}

async function setSessionForThread(threadTs, sessionId) {
  await redis.set(`slack:thread:${threadTs}`, sessionId, 'EX', 86400);
}

// 2. Channel → Project 매핑
async function getProjectForChannel(channelId) {
  return await redis.get(`slack:channel:${channelId}:project`) || '/default';
}

// 3. Slack User → API Key 매핑
async function getApiKeyForUser(slackUserId) {
  return await redis.get(`slack:user:${slackUserId}:apikey`);
}

// 4. 메시지 핸들러
slack.message(async ({ message, say }) => {
  if (message.thread_ts || message.text.includes('@claude')) {
    const apiKey = await getApiKeyForUser(message.user);
    const projectPath = await getProjectForChannel(message.channel);
    const sessionId = await getSessionForThread(message.thread_ts);

    // claudecodeui API 호출
    const response = await fetch('http://localhost:3001/api/agent/query', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'claude',
        projectPath,
        message: message.text.replace(/<@[^>]+>/g, '').trim(),
        sessionId,
        streamResponse: false
      })
    });

    const data = await response.json();

    // Slack에 응답
    await say({
      text: data.response,
      thread_ts: message.thread_ts || message.ts
    });

    // 세션 저장
    await setSessionForThread(message.thread_ts || message.ts, data.sessionId);
  }
});

slack.start();
```

**슬랙 공동 채팅 구현**:
```javascript
// 협업 세션 관리 (Redis 기반)
class CollaborativeSession {
  constructor(sessionId, channelId) {
    this.sessionId = sessionId;
    this.channelId = channelId;
    this.participants = new Set();
    this.lock = null;
  }

  async acquireLock(userId, timeout = 300000) {
    // 세션 잠금 (5분)
    const lockKey = `session:${this.sessionId}:lock`;
    const acquired = await redis.set(lockKey, userId, 'PX', timeout, 'NX');
    return acquired === 'OK';
  }

  async releaseLock() {
    await redis.del(`session:${this.sessionId}:lock`);
  }

  async isActive() {
    const lockOwner = await redis.get(`session:${this.sessionId}:lock`);
    return !!lockOwner;
  }

  async addParticipant(userId) {
    await redis.sadd(`session:${this.sessionId}:participants`, userId);
  }
}

// 사용 예시:
slack.message(async ({ message, say }) => {
  const session = new CollaborativeSession(sessionId, message.channel);

  if (await session.isActive()) {
    await say({
      text: '⚠️ 다른 팀원이 현재 AI와 대화 중입니다. 잠시 후 다시 시도해주세요.',
      thread_ts: message.thread_ts
    });
    return;
  }

  await session.acquireLock(message.user);
  await session.addParticipant(message.user);

  try {
    // AI 쿼리 실행...
  } finally {
    await session.releaseLock();
  }
});
```

#### C. coolify 도메인/프록시 (추출 및 간소화 📦)
**Node.js로 포팅**:

```javascript
// domain-manager/index.js
import crypto from 'crypto';
import { Cuid2 } from '@paralleldrive/cuid2';

class DomainManager {
  constructor(wildcardDomain = null) {
    // wildcardDomain: "*.example.com" 또는 null (sslip.io fallback)
    this.wildcardDomain = wildcardDomain;
  }

  /**
   * Coolify의 generateUrl() 로직
   */
  generate(options = {}) {
    const { random = new Cuid2(), forceHttps = false, serverIp = null } = options;

    let domain = this.wildcardDomain;
    if (!domain) {
      // sslip.io fallback
      const ip = serverIp || '127-0-0-1';
      domain = `*.${ip.replace(/\./g, '-')}.sslip.io`;
    }

    // *.example.com → example.com
    const baseDomain = domain.replace(/^\*\./, '');
    const scheme = forceHttps || domain.startsWith('https') ? 'https' : 'http';

    return `${scheme}://${random}.${baseDomain}`;
  }

  /**
   * Coolify의 preview_url_template 로직
   */
  generatePreview(template, variables) {
    // template: "{{pr_id}}-{{domain}}"
    // variables: { pr_id: 123, domain: 'app.example.com', random: 'xyz' }
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(`{{${key}}}`, value);
    }
    return result;
  }

  /**
   * 충돌 검사 (간소화 버전)
   */
  async checkConflict(domain, excludeId = null) {
    // DB 조회: 동일 도메인 사용 중인 리소스 확인
    // 실제 구현은 프로젝트 DB 스키마에 따라 달라짐
    return null;  // null = 충돌 없음
  }
}

// proxy-configurator/traefik.js
class TraefikConfigurator {
  /**
   * Coolify의 generateLabelsApplication() 로직
   */
  generateLabels(app, preview = null) {
    const uuid = app.id;
    const fqdn = preview?.fqdn || app.fqdn;
    const port = app.port || 3000;
    const prSuffix = preview ? `-pr-${preview.pullRequestId}` : '';

    const labels = {
      'traefik.enable': 'true',
      [`traefik.http.routers.${uuid}${prSuffix}.rule`]: `Host(\`${fqdn}\`)`,
      [`traefik.http.routers.${uuid}${prSuffix}.entryPoints`]: 'https',
      [`traefik.http.routers.${uuid}${prSuffix}.tls`]: 'true',
      [`traefik.http.routers.${uuid}${prSuffix}.tls.certresolver`]: 'letsencrypt',
      [`traefik.http.services.${uuid}${prSuffix}.loadbalancer.server.port`]: port.toString()
    };

    // 미들웨어 (gzip, redirect)
    labels[`traefik.http.routers.${uuid}${prSuffix}.middlewares`] = 'gzip,redirect-to-https';

    return labels;
  }

  /**
   * docker-compose.yml 생성 (Traefik proxy)
   */
  generateDockerCompose(networks = []) {
    return {
      version: '3.8',
      services: {
        traefik: {
          container_name: 'app-proxy',
          image: 'traefik:v3.6',
          restart: 'unless-stopped',
          networks: ['default', ...networks],
          ports: ['80:80', '443:443', '443:443/udp'],
          volumes: [
            '/var/run/docker.sock:/var/run/docker.sock:ro',
            './traefik:/traefik'
          ],
          command: [
            '--ping=true',
            '--entrypoints.http.address=:80',
            '--entrypoints.https.address=:443',
            '--entrypoints.https.http3',
            '--providers.docker=true',
            '--providers.docker.exposedbydefault=false',
            '--certificatesresolvers.letsencrypt.acme.httpchallenge=true',
            '--certificatesresolvers.letsencrypt.acme.email=admin@example.com',
            '--certificatesresolvers.letsencrypt.acme.storage=/traefik/acme.json'
          ]
        }
      },
      networks: {
        default: {},
        ...Object.fromEntries(networks.map(n => [n, { external: true }]))
      }
    };
  }
}

export { DomainManager, TraefikConfigurator };
```

---

## 4. 시스템 아키텍처 설계

### 4.1 전체 시스템 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                    사용자 인터페이스                              │
│  ┌────────────┐     ┌────────────┐     ┌────────────┐           │
│  │ Web UI     │     │ Slack Bot  │     │ Mobile App │           │
│  │ (React)    │     │ (Bolt SDK) │     │ (Future)   │           │
│  └─────┬──────┘     └─────┬──────┘     └────────────┘           │
└────────┼──────────────────┼──────────────────────────────────────┘
         │                  │
         │ WebSocket/REST   │ Slack Events API
         │                  │
┌────────▼──────────────────▼──────────────────────────────────────┐
│                    통합 백엔드 서비스                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Express Server (claudecodeui 기반)                      │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ • WebSocket Handler (/ws, /shell)                       │    │
│  │ • Agent API (/api/agent/*)                              │    │
│  │ • Projects API (/api/projects/*)                        │    │
│  │ • Git API (/api/git/*)                                  │    │
│  │ • Preview API (/api/preview/*)                          │    │
│  │ • Deploy API (/api/deploy/*)                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 슬랙 통합 서비스 (신규 개발)                             │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ • Event Handler (message, app_mention)                  │    │
│  │ • Thread → Session Mapper (Redis)                       │    │
│  │ • Collaborative Session Manager                         │    │
│  │ • Streaming Response Handler                            │    │
│  └─────────────────────────────────────────────────────────┘    │
└───────┬───────────────────────────────────────────────────────┬─┘
        │                                                       │
        │                                                       │
┌───────▼───────────────────────┐     ┌────────────────────────▼───┐
│   Claude Agents SDK           │     │   프리뷰 & 배포 엔진        │
│  (@anthropic-ai/              │     │  (Claudable + coolify 기반) │
│   claude-agent-sdk)           │     ├────────────────────────────┤
├───────────────────────────────┤     │ • Preview Manager (수정)    │
│ • 세션 관리                    │     │ • Domain Generator (추출)  │
│ • 스트리밍 응답                │     │ • Proxy Configurator (추출)│
│ • Tool 실행                    │     │ • Vercel Deployer (추출)   │
│ • MCP 서버 통합                │     │ • GitHub Integrator (추출) │
└───────┬───────────────────────┘     └────────────────────────────┘
        │                                         │
        │                                         │
┌───────▼─────────────────────────────────────────▼────────────────┐
│                     영속성 계층                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ SQLite       │  │ Redis        │  │ File System  │           │
│  │ (Users, Keys)│  │ (Sessions,   │  │ (~/.claude/  │           │
│  │              │  │  Slack Map)  │  │  projects/)  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────────────────────────────────────────────┘
        │
┌───────▼───────────────────────────────────────────────────────────┐
│                     인프라 계층                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Docker       │  │ Traefik      │  │ GitHub       │           │
│  │ (Containers) │  │ (Proxy)      │  │ (Repos)      │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────────────────────────────────────────────┘
```

### 4.2 데이터 흐름 시나리오

#### 시나리오 A: 웹 UI에서 챗봇으로 앱 제작
```
1. 사용자 → 웹 UI: "Next.js 블로그 만들어줘"
   ↓
2. 웹 UI → Express: WebSocket /ws 연결
   ↓
3. Express → Claude SDK: queryClaudeSDK(prompt, options)
   ↓
4. Claude SDK ← Anthropic API: 스트리밍 응답 시작
   ↓
5. Claude SDK → Express: 코드 블록 생성 (streaming)
   ↓
6. Express → Preview Manager: 파일 변경 감지
   ↓
7. Preview Manager: npm run dev 시작 (포트 3100 할당)
   ↓
8. Preview Manager → Domain Generator: 프리뷰 URL 생성
   Domain Generator → "https://abc123.example.com:3100" (환경 인식)
   ↓
9. Express → 웹 UI: 프리뷰 URL 전송 (WebSocket)
   ↓
10. 웹 UI: iframe에 프리뷰 표시 (실시간 업데이트)
```

#### 시나리오 B: 슬랙에서 공동 작업
```
1. 사용자 A (Slack) → #frontend 채널, Thread 1:
   "@claude 로그인 페이지 만들어줘"
   ↓
2. Slack Bot → Redis: getSessionForThread(thread_1)
   결과: null (새 대화)
   ↓
3. Slack Bot → Redis: getProjectForChannel(#frontend)
   결과: "/repos/frontend-app"
   ↓
4. Slack Bot → Express: POST /api/agent/query
   {
     "projectPath": "/repos/frontend-app",
     "message": "로그인 페이지 만들어줘",
     "sessionId": null
   }
   ↓
5. Express → Claude SDK: 새 세션 시작
   ↓
6. Claude SDK: sessionId = "session-abc123" 생성
   ↓
7. Express → Slack Bot: { "sessionId": "session-abc123", "response": "..." }
   ↓
8. Slack Bot → Redis: setSessionForThread(thread_1, "session-abc123")
   ↓
9. Slack Bot → Slack: 응답 메시지 게시 (Thread 1)

---

10분 후, 사용자 B (Slack) → 동일 Thread 1:
    "비밀번호 재설정 기능도 추가해줘"
    ↓
11. Slack Bot → Redis: getSessionForThread(thread_1)
    결과: "session-abc123"
    ↓
12. Slack Bot → Collaborative Session: isActive("session-abc123")
    결과: false (잠금 없음)
    ↓
13. Collaborative Session → acquireLock(user_B, 5분)
    ↓
14. Slack Bot → Express: POST /api/agent/query
    {
      "sessionId": "session-abc123",  // 기존 세션 재사용!
      "message": "비밀번호 재설정 기능도 추가해줘"
    }
    ↓
15. Claude SDK: 이전 대화 컨텍스트 로드 (~/.claude/projects/.../session-abc123.jsonl)
    ↓
16. Claude SDK: 컨텍스트 기반 응답 생성
    ↓
17. Collaborative Session → releaseLock()
    ↓
18. Slack Bot → Slack: 응답 메시지 게시 (Thread 1)
```

#### 시나리오 C: PR 프리뷰 자동 배포
```
1. GitHub → Webhook: Pull Request #45 opened (branch: feature/login)
   ↓
2. Express → GitHub API: PR 정보 조회 (변경 파일, 브랜치 등)
   ↓
3. Express → Preview Environment Service: createPreview(app, prId=45)
   ↓
4. Preview Environment Service → Domain Generator:
   generatePreview("{{pr_id}}-{{domain}}", {
     pr_id: 45,
     domain: "app.example.com"
   })
   결과: "https://pr-45-app.example.com"
   ↓
5. Preview Environment Service → DB: ApplicationPreview 레코드 생성
   ↓
6. Express → Deployment Job: deployPreview(previewId, branch="feature/login")
   ↓
7. Deployment Job:
   - Git clone feature/login
   - npm install
   - npm run build
   - Docker build -t app:pr-45
   ↓
8. Deployment Job → Proxy Configurator: generateLabels(app, preview)
   결과: {
     "traefik.http.routers.app-pr-45.rule": "Host(`pr-45-app.example.com`)",
     "traefik.http.services.app-pr-45.loadbalancer.server.port": "3000",
     ...
   }
   ↓
9. Deployment Job → Docker: Run container with labels
   docker run -d --label "traefik.http.routers..." app:pr-45
   ↓
10. Traefik: Auto-discovery via Docker labels
    - Route pr-45-app.example.com → Container:3000
    - Provision SSL certificate (Let's Encrypt)
    ↓
11. Express → GitHub API: Post comment on PR #45
    "🚀 Preview deployed: https://pr-45-app.example.com"
    ↓
12. ✅ PR 프리뷰 라이브!
```

---

## 5. 프론트엔드 기술 스택 추천

### 5.1 옵션 비교 분석

| 옵션 | 장점 | 단점 | 작업량 |
|------|------|------|--------|
| **A. Claudable 프론트엔드 그대로 사용** | • 완성도 높은 UI<br>• 실시간 프리뷰 검증됨<br>• Next.js 15 최신 기술 | • SSH 포트포워딩 이슈 수정 필요<br>• Prisma DB → SQLite 마이그레이션<br>• claudecodeui API 통합 작업 | **중간** (2-3주) |
| **B. claudecodeui 프론트엔드 그대로 사용** | • 백엔드와 완벽 호환<br>• 이미 세션 관리 UI 있음<br>• 모바일 최적화됨 | • 프리뷰 UI 없음 (새로 개발)<br>• 배포 UI 없음 (새로 개발)<br>• 디자인 단순함 | **많음** (4-6주) |
| **C. Claudable UI + claudecodeui 백엔드 통합** ⭐ | • 최고의 UX (Claudable)<br>• 최고의 안정성 (claudecodeui)<br>• 슬랙 통합 쉬움 | • 두 프로젝트 통합 필요<br>• API 어댑터 작성 | **적음** (1-2주) |
| **D. 새로운 프론트엔드 (React + Vite)** | • 완전한 커스터마이징<br>• 불필요한 코드 없음 | • 모든 UI 처음부터 개발<br>• 검증 안 된 코드<br>• 버그 발생 가능 | **매우 많음** (8-12주) |

### 5.2 최종 추천: **옵션 C** - Claudable UI + claudecodeui 백엔드 통합

#### 선택 이유:
1. **최소한의 작업으로 최대 효과**
   - Claudable UI는 이미 완성도가 높음 (프리뷰, 배포 워크플로우 검증됨)
   - claudecodeui 백엔드는 이미 Claude SDK 통합, 세션 관리 완성
   - 통합만 하면 바로 작동

2. **SSH 포트포워딩 이슈 해결 포함**
   - 통합 과정에서 자연스럽게 수정
   - 환경 인식 URL 생성 로직 추가

3. **슬랙 통합 준비 완료**
   - claudecodeui 백엔드는 이미 `/api/agent/*` API 제공
   - Slack bot은 백엔드 API만 호출하면 됨

#### 통합 계획:

**Phase 1: API 어댑터 작성** (3-5일)
```typescript
// Claudable 프론트엔드가 기대하는 API 형식을 claudecodeui 백엔드로 변환

// adapters/claude-api-adapter.ts
import { claudecodeClient } from './claudecode-client';

export class ClaudeAPIAdapter {
  // Claudable: POST /api/chat
  // claudecodeui: WebSocket /ws + type='claude-command'
  async chat(message: string, sessionId?: string) {
    return new Promise((resolve) => {
      const ws = claudecodeClient.connect('/ws');

      ws.send(JSON.stringify({
        type: 'claude-command',
        command: message,
        options: {
          projectPath: this.currentProject,
          sessionId
        }
      }));

      ws.on('claude-response', (data) => {
        resolve(data);
      });
    });
  }

  // Claudable: GET /api/projects/:id
  // claudecodeui: GET /api/projects
  async getProject(id: string) {
    const projects = await claudecodeClient.get('/api/projects');
    return projects.find(p => p.name === id);
  }
}
```

**Phase 2: 프리뷰 URL 생성 수정** (2-3일)
```typescript
// lib/services/preview.ts

// ❌ 기존 (하드코딩)
const initialUrl = `http://localhost:${preferredPort}`;

// ✅ 수정 (환경 인식)
import { getPreviewBaseUrl } from '@/lib/utils/url-resolver';

const initialUrl = `${getPreviewBaseUrl()}:${preferredPort}`;

// lib/utils/url-resolver.ts
export function getPreviewBaseUrl(): string {
  const mode = process.env.NEXT_PUBLIC_PREVIEW_BASE_URL || 'auto';

  if (mode === 'auto') {
    // VS Code SSH 포트포워딩 감지
    if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      if (hostname !== 'localhost' && !hostname.startsWith('127.')) {
        return `${protocol}//${hostname}`;
      }
    }
  } else if (mode !== 'localhost') {
    return mode;
  }

  return 'http://localhost';
}
```

**Phase 3: 환경 변수 통합** (1일)
```bash
# .env.local

# claudecodeui 백엔드 URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# 프리뷰 모드
NEXT_PUBLIC_PREVIEW_BASE_URL=auto  # auto | localhost | custom URL

# WebSocket URL (auto-detect from window.location)
NEXT_PUBLIC_WS_BASE=auto

# Claudable 기존 설정
DATABASE_URL=file:./data/cc.db  # claudecodeui와 동일한 SQLite DB
PREVIEW_PORT_START=3100
PREVIEW_PORT_END=3999
```

**Phase 4: 데이터베이스 스키마 조정** (2-3일)
```sql
-- Claudable uses Prisma + SQLite
-- claudecodeui uses SQLite

-- 통합 전략: claudecodeui DB를 기본으로 사용하고,
-- Claudable의 추가 테이블만 마이그레이션

-- Claudable 추가 테이블:
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deployments (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  status TEXT,
  url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- claudecodeui 기존 테이블 활용:
-- users, api_keys, user_credentials
```

**Phase 5: 테스트 및 검증** (3-5일)
- [ ] 로컬 환경에서 프리뷰 동작 확인
- [ ] SSH 포트포워딩 환경 테스트 (VS Code Remote)
- [ ] Vercel 배포 워크플로우 테스트
- [ ] 슬랙 봇 기본 기능 테스트

### 5.3 기술 스택 최종 정리

```yaml
Frontend:
  Framework: Next.js 15.5.6 (from Claudable)
  UI Library: React 19
  Styling: Tailwind CSS 3.4.17
  Icons: Lucide React
  State: React Hooks (no Redux)
  Database Client: Prisma (SQLite)

Backend:
  Runtime: Node.js 20+
  Framework: Express 4.18 (from claudecodeui)
  WebSocket: ws 8.x
  Authentication: JWT + API Keys
  Database: SQLite (better-sqlite3)
  Session Store: Redis (for Slack collaboration)

AI Integration:
  SDK: @anthropic-ai/claude-agent-sdk 0.1.29
  Provider: Claude (primary), Cursor (optional)

Deployment & Preview:
  Preview Manager: Custom (Claudable + fixes)
  Domain Generator: Extracted from coolify
  Proxy: Traefik 3.6 (or Caddy 2.8)
  Container: Docker
  Hosting: Vercel (optional), Self-hosted

Slack Integration:
  SDK: @slack/bolt
  Session Store: Redis
  API: /api/agent/* (claudecodeui)
```

---

## 6. 주요 기술적 과제 및 해결 방안

### 과제 1: SSH 포트포워딩 환경에서 프리뷰 동작 ⚠️

**문제 상세**:
- VS Code Remote SSH 사용 시, 브라우저는 forwarded URL에서 실행
- iframe은 `localhost:3XXX` 로드 시도 → 차단됨

**해결 방안**:
```typescript
// 1단계: 환경 감지
function detectEnvironment(): 'local' | 'forwarded' | 'production' {
  if (typeof window === 'undefined') return 'local';

  const { hostname } = window.location;
  if (hostname === 'localhost' || hostname.startsWith('127.')) {
    return 'local';
  }
  if (hostname.includes('github.dev') || hostname.includes('vscode')) {
    return 'forwarded';
  }
  return 'production';
}

// 2단계: URL 생성 전략
class URLResolver {
  private env = detectEnvironment();

  getPreviewUrl(port: number): string {
    switch (this.env) {
      case 'local':
        return `http://localhost:${port}`;

      case 'forwarded':
        // VS Code의 포트 포워딩 URL 패턴 사용
        const { protocol, hostname } = window.location;
        return `${protocol}//${hostname.replace(/:\d+$/, '')}:${port}`;

      case 'production':
        // 프로덕션 도메인 + 포트
        return `https://${window.location.hostname}:${port}`;
    }
  }

  getWebSocketUrl(path: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${path}`;
  }
}
```

**검증 계획**:
- [ ] 로컬: `npm run dev` → `http://localhost:3000`
- [ ] VS Code Remote: SSH 연결 → `https://xxx-3000.preview.app.github.dev`
- [ ] Codespaces: 자동 포트 포워딩 테스트

---

### 과제 2: 슬랙 공동 작업 시 세션 충돌 방지 🔒

**문제 상세**:
- 여러 사용자가 동시에 같은 세션에 메시지 보낼 경우
- Claude SDK는 동시 요청 미지원 (하나의 sessionId는 한 번에 하나만 처리)

**해결 방안 1: 세션 잠금 (Locking)**
```javascript
// Redis 기반 분산 잠금
class SessionLockManager {
  constructor(redis) {
    this.redis = redis;
  }

  async acquireLock(sessionId, userId, timeout = 300000) {
    const lockKey = `lock:session:${sessionId}`;
    const acquired = await this.redis.set(
      lockKey,
      JSON.stringify({ userId, timestamp: Date.now() }),
      'PX', timeout,  // 5분 자동 만료
      'NX'  // 존재하지 않을 때만 설정
    );

    return acquired === 'OK';
  }

  async releaseLock(sessionId) {
    await this.redis.del(`lock:session:${sessionId}`);
  }

  async getLockOwner(sessionId) {
    const data = await this.redis.get(`lock:session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }
}

// Slack 봇에서 사용
const lockManager = new SessionLockManager(redis);

slack.message(async ({ message, say }) => {
  const sessionId = await getSessionForThread(message.thread_ts);

  if (sessionId) {
    // 기존 세션 재사용 시도
    const acquired = await lockManager.acquireLock(sessionId, message.user);

    if (!acquired) {
      const owner = await lockManager.getLockOwner(sessionId);
      await say({
        text: `⏳ <@${owner.userId}>님이 현재 대화 중입니다. 잠시 후 다시 시도해주세요.`,
        thread_ts: message.thread_ts
      });
      return;
    }
  }

  try {
    // AI 쿼리 실행
    const response = await queryClaudeAPI(...);
    await say({ text: response, thread_ts: message.thread_ts });
  } finally {
    if (sessionId) {
      await lockManager.releaseLock(sessionId);
    }
  }
});
```

**해결 방안 2: 큐 기반 처리**
```javascript
// 세션별 메시지 큐
class SessionQueue {
  constructor() {
    this.queues = new Map(); // sessionId → Queue
  }

  async enqueue(sessionId, task) {
    if (!this.queues.has(sessionId)) {
      this.queues.set(sessionId, []);
    }

    const queue = this.queues.get(sessionId);

    return new Promise((resolve, reject) => {
      queue.push({ task, resolve, reject });

      if (queue.length === 1) {
        // 첫 번째 태스크면 즉시 실행
        this.processQueue(sessionId);
      }
    });
  }

  async processQueue(sessionId) {
    const queue = this.queues.get(sessionId);
    if (!queue || queue.length === 0) return;

    const { task, resolve, reject } = queue[0];

    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      queue.shift();

      if (queue.length > 0) {
        // 다음 태스크 처리
        this.processQueue(sessionId);
      } else {
        // 큐 비었으면 삭제
        this.queues.delete(sessionId);
      }
    }
  }
}

const queue = new SessionQueue();

// 사용
const response = await queue.enqueue(sessionId, async () => {
  return await queryClaudeAPI(message, sessionId);
});
```

**선택 기준**:
- **Locking 방식**: 즉각적 피드백 (대기 중 안내 메시지)
- **Queue 방식**: 모든 요청 처리 보장, 순서 유지

**추천**: **Locking + 짧은 타임아웃 (30초)**
- 30초 이내 응답 없으면 자동 해제
- Slack 사용자에게 "잠시 후 다시 시도" 안내

---

### 과제 3: Vercel vs 자체 호스팅 선택 🚀

| 항목 | Vercel 배포 | 자체 호스팅 (coolify 방식) |
|------|-------------|---------------------------|
| **배포 속도** | ⚡ 매우 빠름 (CDN) | 🐢 느림 (Docker build) |
| **도메인** | Vercel 제공 | 직접 설정 필요 |
| **SSL** | 자동 | Traefik Let's Encrypt |
| **비용** | $$ (상용 시) | $ (서버 비용만) |
| **확장성** | ✅ 무제한 | ⚠️ 서버 스펙 의존 |
| **커스터마이징** | ⚠️ 제한적 | ✅ 완전한 제어 |
| **프리뷰 URL** | 자동 생성 | 직접 구현 필요 |

**추천 전략: 하이브리드**
- **개발/POC**: Vercel (빠른 프로토타이핑)
- **프로덕션**: 자체 호스팅 (비용 절감, 완전한 제어)
- **구현**: 배포 타겟 선택 가능하게 설계

```typescript
// deploy-manager/index.ts
interface DeploymentTarget {
  type: 'vercel' | 'self-hosted';
  deploy(app: Application): Promise<DeploymentResult>;
}

class VercelDeployer implements DeploymentTarget {
  type = 'vercel' as const;

  async deploy(app: Application) {
    // Claudable의 Vercel 통합 로직
    await pushToGitHub(app);
    const deployment = await triggerVercelDeployment(app);
    return { url: deployment.url, status: 'deployed' };
  }
}

class SelfHostedDeployer implements DeploymentTarget {
  type = 'self-hosted' as const;

  async deploy(app: Application) {
    // coolify 방식 Docker 배포
    const image = await buildDockerImage(app);
    const preview = await createPreviewEnvironment(app);
    await deployContainer(image, preview);
    return { url: preview.fqdn, status: 'deployed' };
  }
}

// 사용자 선택에 따라
const deployer = app.deployTarget === 'vercel'
  ? new VercelDeployer()
  : new SelfHostedDeployer();

await deployer.deploy(app);
```

---

## 7. 구현 우선순위 및 로드맵

### Phase 1: 핵심 기능 통합 (2-3주)

**Week 1: 백엔드 통합**
- [x] claudecodeui 백엔드 설치 및 실행 확인
- [ ] Claudable 프론트엔드 클론
- [ ] API 어댑터 작성 (Claudable → claudecodeui)
- [ ] SQLite 데이터베이스 스키마 통합
- [ ] WebSocket 연결 테스트

**Week 2: 프리뷰 시스템 수정**
- [ ] URL 리졸버 구현 (환경 감지)
- [ ] 프리뷰 매니저 수정 (SSH 포트포워딩 지원)
- [ ] WebSocket URL 자동 해상도
- [ ] 로컬 환경 테스트
- [ ] VS Code Remote 환경 테스트

**Week 3: UI/UX 통합**
- [ ] Claudable UI 컴포넌트 마이그레이션
- [ ] 실시간 프리뷰 동작 검증
- [ ] 세션 관리 UI 통합
- [ ] 에러 핸들링 및 로딩 상태
- [ ] 통합 테스트

**마일스톤 1**: 웹 UI에서 챗봇으로 앱 제작 + 실시간 프리뷰 완성 ✅

---

### Phase 2: 슬랙 통합 (2-3주)

**Week 4: 슬랙 봇 기본 기능**
- [ ] Slack Bolt 앱 설정
- [ ] OAuth 인증 설정
- [ ] 기본 메시지 핸들러 (app_mention, message)
- [ ] Redis 설정 (세션 매핑)
- [ ] Thread → Session 매핑 구현

**Week 5: 슬랙 고급 기능**
- [ ] Channel → Project 매핑
- [ ] Slash 커맨드 (`/claude config`, `/claude projects`)
- [ ] 스트리밍 응답 핸들러 (Slack 메시지 업데이트)
- [ ] 이미지 첨부 지원 (Slack → Claude)

**Week 6: 공동 작업 기능**
- [ ] 세션 잠금 메커니즘 (Redis)
- [ ] 대기열 관리 (선택적)
- [ ] 참여자 표시 UI
- [ ] 권한 시스템 (채널별)

**마일스톤 2**: 슬랙에서 Claude와 대화 + 팀 협업 가능 ✅

---

### Phase 3: 자동 배포 (2-3주)

**Week 7: 도메인 관리**
- [ ] coolify 도메인 생성 로직 포팅 (Node.js)
- [ ] Wildcard DNS 설정 가이드
- [ ] sslip.io fallback 구현
- [ ] 도메인 충돌 검사

**Week 8: 프록시 설정**
- [ ] Traefik docker-compose 생성기
- [ ] Label 생성기 (앱별, PR별)
- [ ] 네트워크 자동 연결
- [ ] SSL 인증서 자동 발급

**Week 9: 배포 파이프라인**
- [ ] GitHub Webhook 핸들러
- [ ] PR 프리뷰 자동 생성
- [ ] Docker 빌드 & 배포
- [ ] Vercel 배포 옵션 (선택적)
- [ ] 배포 상태 알림 (Slack, GitHub comment)

**마일스톤 3**: Git 푸시 → 자동 배포 → 프리뷰 URL 완성 ✅

---

### Phase 4: 최적화 & 확장 (1-2주, 선택적)

**Week 10-11 (선택적)**
- [ ] 성능 최적화 (캐싱, 번들 사이즈)
- [ ] 모니터링 & 로깅 (Sentry, LogRocket)
- [ ] 사용자 대시보드 (프로젝트 목록, 배포 히스토리)
- [ ] 모바일 앱 (React Native, 선택적)
- [ ] 문서화 (API 문서, 사용자 가이드)

**마일스톤 4**: 프로덕션 준비 완료 ✅

---

## 8. 부록: 상세 기술 스펙

### 8.1 API 엔드포인트 명세

#### 웹 UI API
```yaml
# 프로젝트 관리
GET    /api/projects                      # 프로젝트 목록
POST   /api/projects                      # 프로젝트 생성
GET    /api/projects/:id                  # 프로젝트 상세
PUT    /api/projects/:id                  # 프로젝트 수정
DELETE /api/projects/:id                  # 프로젝트 삭제

# 세션 관리
GET    /api/projects/:id/sessions         # 세션 목록
GET    /api/sessions/:id/messages         # 메시지 히스토리
DELETE /api/sessions/:id                  # 세션 삭제

# 프리뷰
POST   /api/preview/start                 # 프리뷰 시작
POST   /api/preview/stop                  # 프리뷰 중지
GET    /api/preview/status                # 프리뷰 상태

# 배포
POST   /api/deploy                        # 배포 트리거
GET    /api/deployments                   # 배포 히스토리
GET    /api/deployments/:id               # 배포 상태

# WebSocket
WS     /ws                                # 채팅 WebSocket
WS     /shell                             # 터미널 WebSocket
```

#### Slack Bot API
```yaml
# Slack 이벤트 (수신)
POST   /slack/events                      # Slack Events API
POST   /slack/interactive                 # Interactive components
POST   /slack/slash                       # Slash commands

# Slack 연동 관리 (REST)
POST   /api/slack/connect                 # Workspace 연결
GET    /api/slack/channels                # 채널 목록
POST   /api/slack/channels/:id/config     # 채널 설정 (프로젝트 매핑)
GET    /api/slack/users/:id/apikey        # 사용자 API 키 발급
```

### 8.2 데이터베이스 스키마

```sql
-- Users (claudecodeui 기존)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  git_name TEXT,
  git_email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API Keys (claudecodeui 기존)
CREATE TABLE api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  key_name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Projects (Claudable + 확장)
CREATE TABLE projects (
  id TEXT PRIMARY KEY,  -- UUID
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  display_name TEXT,
  fqdn TEXT,  -- 기본 도메인
  preview_url_template TEXT DEFAULT '{{random}}.{{domain}}',
  deploy_target TEXT DEFAULT 'self-hosted',  -- 'vercel' | 'self-hosted'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Deployments (신규)
CREATE TABLE deployments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'production' | 'preview'
  status TEXT NOT NULL,  -- 'pending' | 'building' | 'deployed' | 'failed'
  url TEXT,
  commit_sha TEXT,
  branch TEXT,
  pull_request_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Application Previews (coolify 포팅)
CREATE TABLE application_previews (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  pull_request_id INTEGER NOT NULL,
  fqdn TEXT,
  status TEXT DEFAULT 'pending',
  pull_request_html_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Slack Workspaces (신규)
CREATE TABLE slack_workspaces (
  id TEXT PRIMARY KEY,  -- Slack team ID
  name TEXT,
  access_token TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Slack Channel Config (신규)
CREATE TABLE slack_channel_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  project_path TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, channel_id),
  FOREIGN KEY (workspace_id) REFERENCES slack_workspaces(id)
);

-- Slack User Mapping (신규)
CREATE TABLE slack_user_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id TEXT NOT NULL,
  slack_user_id TEXT NOT NULL,
  app_user_id INTEGER NOT NULL,
  api_key TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, slack_user_id),
  FOREIGN KEY (workspace_id) REFERENCES slack_workspaces(id),
  FOREIGN KEY (app_user_id) REFERENCES users(id)
);
```

### 8.3 환경 변수 가이드

```bash
# .env

# ===== 서버 설정 =====
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# ===== 데이터베이스 =====
DATABASE_PATH=./data/app.db
DATABASE_URL=file:./data/app.db

# ===== 인증 =====
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRES_IN=30d

# ===== Claude SDK =====
# Anthropic API 키 (claude code CLI가 사용하는 ~/.claude/credentials)
# 또는 ANTHROPIC_API_KEY 환경 변수

# ===== 프리뷰 설정 =====
NEXT_PUBLIC_PREVIEW_BASE_URL=auto  # auto | localhost | custom URL
PREVIEW_PORT_START=3100
PREVIEW_PORT_END=3999
NEXT_PUBLIC_WS_BASE=auto  # WebSocket URL (auto-detect)

# ===== Slack 통합 =====
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token (Socket Mode)

# ===== Redis (슬랙 세션 관리) =====
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# ===== 배포 설정 =====
# Wildcard 도메인 (coolify 방식)
WILDCARD_DOMAIN=*.app.example.com
# 또는 sslip.io fallback (자동)

# Docker 설정
DOCKER_NETWORK_PREFIX=app-network

# ===== Vercel (선택적) =====
VERCEL_TOKEN=your-vercel-token
VERCEL_TEAM_ID=your-team-id (선택적)

# ===== GitHub =====
GITHUB_TOKEN=your-github-personal-access-token
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# ===== 기타 =====
LOG_LEVEL=info
CONTEXT_WINDOW=160000  # Claude 토큰 예산
```

---

## 결론

### 핵심 전략 요약

1. **프론트엔드**: Claudable UI 사용 + SSH 포트포워딩 이슈 수정
2. **백엔드**: claudecodeui 그대로 사용 (안정적이고 완성도 높음)
3. **슬랙 통합**: `/api/agent/*` API 활용 + Redis 세션 관리
4. **배포**: coolify 도메인/프록시 로직 추출 + Vercel 옵션 제공

### 작업량 추정

| Phase | 기간 | 난이도 |
|-------|------|--------|
| Phase 1: 핵심 통합 | 2-3주 | 중간 |
| Phase 2: 슬랙 통합 | 2-3주 | 중간 |
| Phase 3: 자동 배포 | 2-3주 | 높음 |
| Phase 4: 최적화 | 1-2주 | 낮음 |
| **총합** | **7-11주** | - |

### 리스크 관리

| 리스크 | 영향 | 대응 방안 |
|-------|------|----------|
| SSH 포트포워딩 이슈 재발 | 높음 | 다양한 환경 테스트, fallback 로직 |
| 슬랙 협업 세션 충돌 | 중간 | Redis 잠금, 명확한 UX 안내 |
| 배포 실패 (Docker/Traefik) | 중간 | Rollback 메커니즘, 상태 모니터링 |
| API 비용 증가 (Claude) | 낮음 | 사용량 모니터링, 캐싱 전략 |

### 성공 지표

- ✅ 웹 UI에서 앱 제작 → 1분 이내 프리뷰 생성
- ✅ 슬랙에서 대화 → 5초 이내 응답
- ✅ PR 오픈 → 5분 이내 프리뷰 URL 생성
- ✅ 동시 사용자 10명 이상 처리 가능
- ✅ SSH 포트포워딩 환경 100% 작동

---

**다음 단계**: Phase 1 백엔드 통합 시작 → `/home/choigawoon/workspaces/msw2/` 에서 구현
