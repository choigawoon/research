# Slack-First AI Company Platform - POC 분석 및 설계 보고서

**작성일**: 2025-12-12
**버전**: v0.3
**상태**: Self-host 중심 리서치 완료

---

## 문서 구조 안내

이 문서는 두 가지 목적으로 구성됩니다:

| 섹션 | 목적 | 내용 |
|-----|------|------|
| **섹션 1-5** | 📋 **현황 스냅샷** | 비전, 아키텍처, 기술 옵션 정리 |
| **섹션 6** | ✅ **의사결정 기록** | 결정된 사항과 근거 |
| **섹션 7-8** | 🚀 **실행 계획** | MVP 단계, 로드맵 |

---

## 목차

1. [비전 및 대전제](#1-비전-및-대전제)
2. [3-레이어 아키텍처](#2-3-레이어-아키텍처)
3. [Self-Host 핵심 부품 분석](#3-self-host-핵심-부품-분석)
4. [부품 조립: 시스템 구성](#4-부품-조립-시스템-구성)
5. [레이어별 오픈소스 재료](#5-레이어별-오픈소스-재료)
6. [의사결정 기록](#6-의사결정-기록)
7. [MVP 전략](#7-mvp-전략)
8. [다음 단계](#8-다음-단계)

---

## 1. 비전 및 대전제

### 1.1 핵심 비전

> **"Slack에서 모든 것을 지휘하는 AI Company"**

### 1.2 대전제

| # | 원칙 | 설명 |
|---|------|------|
| **P1** | **Git Repo 중심** | 모든 제품/주제는 Git Repo URL이 존재해야 함 |
| **P2** | **Self-Host 우선** | SaaS 의존 최소화, 완전한 제어권 확보 |
| **P3** | **핵심 부품 재조립** | 기존 오픈소스에서 필요한 부품만 추출하여 조합 |

### 1.3 결과물 형태

```
Type A: 웹앱/웹콘텐츠
└── URL로 바로 확인 (https://feature-x.app.preview.dev)

Type B: 문서화
└── GitHub Repo에 Markdown (docs/research/*.md)
```

---

## 2. 3-레이어 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 1: Command (Slack)                                        │
│ • 의사결정, 작업 지시, 리서치 요청                                 │
│ • 결과: 브랜치 → PR → 프리뷰 URL / 문서 PR                        │
└────────────────────────────┬────────────────────────────────────┘
                             │ "Canvas 열어줘"
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 2: Canvas (Web UI)                                        │
│ • 실시간 프리뷰 보면서 대화로 수정                                 │
│ • 혼자/공동 작업                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │ "코드 직접 볼게"
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 3: Code (Local IDE)                                       │
│ • git clone → Cursor/VSCode에서 직접 작업                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Self-Host 핵심 부품 분석

### 3.1 프리뷰 배포: 핵심 부품

> **목표**: 브랜치 푸시 → 격리된 프리뷰 URL 자동 생성

#### Option A: Traefik + Docker 직접 조립 (최소 부품)

```
┌─────────────────────────────────────────────────────────────────┐
│                     최소 부품 구성                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Wildcard DNS]     *.app.example.com → Server IP               │
│        │                                                         │
│        ▼                                                         │
│  [Traefik]          Reverse Proxy + Auto SSL (Let's Encrypt)    │
│        │            - Docker Labels로 라우팅 자동 설정             │
│        │            - Wildcard 인증서 (DNS-01 Challenge)         │
│        │                                                         │
│        ▼                                                         │
│  [Docker]           컨테이너별 격리 환경                          │
│        │            - 브랜치별 컨테이너 생성                       │
│        │            - 라벨로 Traefik 라우팅 등록                   │
│        │                                                         │
│        ▼                                                         │
│  [GitHub Webhook]   브랜치 푸시 → 빌드 → 배포 트리거               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**장점**: 완전한 제어, 최소 의존성, 가벼움
**단점**: 직접 구현 필요 (배포 스크립트, 정리 정책 등)

#### Option B: Dokploy 활용 (통합 솔루션)

> [Dokploy](https://dokploy.com/) - Vercel/Netlify/Heroku 대체 Self-host PaaS

**핵심 기능**:
- Docker/Docker Compose 네이티브
- Traefik 자동 통합, Let's Encrypt 자동
- Multi-server 지원 (Docker Swarm)
- GitHub Webhook 자동 배포
- 실시간 모니터링 (CPU, Memory, Network)
- UI 대시보드 제공

**요구사항**: Ubuntu 20.04+, 2GB RAM, 30GB Disk

```bash
# 설치 (3-5분)
curl -sSL https://dokploy.com/install.sh | sh
```

#### Option C: Coolify 활용 (더 많은 기능)

> [Coolify](https://coolify.io/) - 가장 완성도 높은 Self-host PaaS

**추가 기능** (Dokploy 대비):
- PR Preview 템플릿: `{{pr_id}}-{{domain}}`
- 더 많은 템플릿 (100+ one-click apps)
- S3 백업 지원
- 팀/권한 관리

**단점**: 더 무거움, Laravel 기반 (커스터마이징 시 PHP 필요)

#### 비교표

| 항목 | Traefik 직접 | Dokploy | Coolify |
|-----|-------------|---------|---------|
| **설정 복잡도** | 높음 | 낮음 | 낮음 |
| **커스터마이징** | 완전 | 중간 | 중간 |
| **PR Preview** | 직접 구현 | ✅ 지원 | ✅ 템플릿 |
| **UI 대시보드** | ❌ | ✅ | ✅ |
| **리소스 사용** | 최소 | 적음 | 보통 |
| **기술 스택** | Docker | Docker/Node | Docker/PHP |
| **Multi-server** | 직접 구현 | ✅ Swarm | ✅ |

### 3.2 Traefik 핵심 설정 (공통)

> Dokploy/Coolify 내부에서도 Traefik 사용. 직접 구현 시 참고.

```yaml
# docker-compose.traefik.yml
version: '3.8'
services:
  traefik:
    image: traefik:v3.0
    command:
      # API/Dashboard
      - --api.dashboard=true
      # Docker provider
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      # Entrypoints
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      # Let's Encrypt (Wildcard)
      - --certificatesresolvers.letsencrypt.acme.dnschallenge=true
      - --certificatesresolvers.letsencrypt.acme.dnschallenge.provider=cloudflare
      - --certificatesresolvers.letsencrypt.acme.email=admin@example.com
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
      # Wildcard domain
      - --entrypoints.websecure.http.tls.domains[0].main=example.com
      - --entrypoints.websecure.http.tls.domains[0].sans=*.example.com
    environment:
      - CF_API_EMAIL=${CF_EMAIL}
      - CF_API_KEY=${CF_API_KEY}
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    networks:
      - traefik-public

networks:
  traefik-public:
    external: true
```

```yaml
# 앱 배포 예시 (docker-compose.app.yml)
services:
  my-app:
    image: my-app:feature-login
    labels:
      - traefik.enable=true
      - traefik.http.routers.my-app.rule=Host(`feature-login.app.example.com`)
      - traefik.http.routers.my-app.entrypoints=websecure
      - traefik.http.routers.my-app.tls.certresolver=letsencrypt
      - traefik.http.services.my-app.loadbalancer.server.port=3000
    networks:
      - traefik-public
```

**참고 자료**:
- [Traefik 3 Wildcard Certificates](https://technotim.live/posts/traefik-3-docker-certificates/)
- [Coolify Wildcard SSL Setup](https://coolify.io/docs/knowledge-base/proxy/traefik/wildcard-certs)

### 3.3 Canvas/Web UI: 핵심 부품

#### claudecodeui (필수)

> [claudecodeui](https://github.com/siteboon/claudecodeui) - Claude Code CLI → Web 프록시

**추출할 핵심 부품**:
```
/server/claude-sdk.js      → Claude SDK 래퍼, 세션 관리
/server/routes/agent.js    → /api/agent/* API (Slack 연동용)
/server/database/db.js     → SQLite 사용자/API키 관리
```

**Self-host 방법**:
```bash
git clone https://github.com/siteboon/claudecodeui
cd claudecodeui
npm install
npm run dev  # localhost:3001
```

#### Claudable 프리뷰 컴포넌트 (선택)

> [Claudable](https://github.com/opactorai/Claudable) - 실시간 프리뷰 UI

**추출할 핵심 부품**:
```
/lib/services/preview.ts   → PreviewManager (dev 서버 관리)
/lib/server/websocket-manager.ts → 실시간 변경 브로드캐스트
```

**⚠️ 수정 필요**: localhost 하드코딩 → 환경 인식 URL 생성

### 3.4 Slack 통합: 핵심 부품

```
[@slack/bolt]              → Slack 봇 프레임워크
[Redis]                    → Thread-Session 매핑, 공동작업 잠금
[claudecodeui API]         → /api/agent/query 호출
```

**최소 구현**:
```javascript
// slack-bot/index.js
import { App } from '@slack/bolt';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

// Thread → Session 매핑
app.message(async ({ message, say }) => {
  const threadTs = message.thread_ts || message.ts;
  const sessionId = await redis.get(`thread:${threadTs}`);

  // claudecodeui API 호출
  const response = await fetch('http://claudecodeui:3001/api/agent/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message.text,
      sessionId,
      projectPath: await redis.get(`channel:${message.channel}:project`)
    })
  });

  const data = await response.json();
  await redis.set(`thread:${threadTs}`, data.sessionId);
  await say({ text: data.response, thread_ts: threadTs });
});

app.start();
```

---

## 4. 부품 조립: 시스템 구성

### 4.1 전체 아키텍처 (Self-Host)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Your Server                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         Docker Network                           │   │
│  │                                                                   │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌─────────────────────────┐   │   │
│  │  │ Traefik  │  │ claudecodeui │  │     Preview Apps        │   │   │
│  │  │ :80/:443 │  │    :3001     │  │  feature-a:3000         │   │   │
│  │  │          │◄─┤              │  │  feature-b:3000         │   │   │
│  │  │          │  │              │  │  ...                    │   │   │
│  │  └────┬─────┘  └──────┬───────┘  └─────────────────────────┘   │   │
│  │       │               │                                         │   │
│  │       │         ┌─────▼─────┐                                   │   │
│  │       │         │   Redis   │                                   │   │
│  │       │         │   :6379   │                                   │   │
│  │       │         └───────────┘                                   │   │
│  │       │                                                         │   │
│  │  ┌────▼─────┐  ┌──────────────┐                                │   │
│  │  │ Slack    │  │  Dokploy/    │                                │   │
│  │  │ Bot      │  │  Coolify     │ (Optional: 배포 관리 UI)        │   │
│  │  │ :3002    │  │  :3000       │                                │   │
│  │  └──────────┘  └──────────────┘                                │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  DNS: *.app.example.com → Server IP                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              │ Webhook
                              ▼
                    ┌─────────────────┐
                    │  GitHub Repo    │
                    │  (Source)       │
                    └─────────────────┘
```

### 4.2 docker-compose 구성 예시

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Reverse Proxy
  traefik:
    image: traefik:v3.0
    # ... (3.2 설정 참조)
    networks:
      - traefik-public

  # Claude Code Web Proxy
  claudecodeui:
    build: ./claudecodeui
    environment:
      - DATABASE_PATH=/data/app.db
      - REDIS_URL=redis://redis:6379
    volumes:
      - claudecodeui-data:/data
      - /home/user/.claude:/root/.claude:ro  # Claude 인증
    labels:
      - traefik.enable=true
      - traefik.http.routers.claude.rule=Host(`claude.app.example.com`)
      - traefik.http.routers.claude.tls.certresolver=letsencrypt
      - traefik.http.services.claude.loadbalancer.server.port=3001
    networks:
      - traefik-public
      - internal

  # Slack Bot
  slack-bot:
    build: ./slack-bot
    environment:
      - SLACK_BOT_TOKEN=${SLACK_BOT_TOKEN}
      - SLACK_SIGNING_SECRET=${SLACK_SIGNING_SECRET}
      - SLACK_APP_TOKEN=${SLACK_APP_TOKEN}
      - REDIS_URL=redis://redis:6379
      - CLAUDE_API_URL=http://claudecodeui:3001
    networks:
      - internal

  # Session Store
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    networks:
      - internal

  # (Optional) 배포 관리 UI
  dokploy:
    image: dokploy/dokploy:latest
    # ... Dokploy 설정
    networks:
      - traefik-public
      - internal

volumes:
  claudecodeui-data:
  redis-data:

networks:
  traefik-public:
    external: true
  internal:
```

### 4.3 프리뷰 배포 플로우

```
1. Slack: "@claude 로그인 페이지 만들어줘"
       │
       ▼
2. Slack Bot → claudecodeui API
       │
       ▼
3. Claude Code: 코드 생성 → Git commit → Push
       │
       ▼
4. GitHub Webhook → Dokploy/스크립트
       │
       ▼
5. Docker Build: my-app:feature-login
       │
       ▼
6. Docker Run + Traefik Labels
   labels:
     - traefik.http.routers.feature-login.rule=Host(`feature-login.app.example.com`)
       │
       ▼
7. Traefik: 자동 라우팅 + SSL
       │
       ▼
8. Slack: "📺 프리뷰: https://feature-login.app.example.com"
```

---

## 5. 레이어별 오픈소스 재료

### 5.1 LAYER 1: Slack Integration

| 부품 | 출처 | 용도 | Self-host |
|-----|------|------|----------|
| Claude SDK Proxy | [claudecodeui](https://github.com/siteboon/claudecodeui) | AI 대화 처리 | ✅ |
| Slack Framework | [@slack/bolt](https://github.com/slackapi/bolt-js) | 봇 이벤트 처리 | ✅ |
| Session Store | Redis | Thread-Session 매핑 | ✅ |
| HITL SDK (선택) | [HumanLayer](https://github.com/humanlayer/humanlayer) | 승인 워크플로우 | ✅ |

### 5.2 LAYER 2: Canvas UI

| 부품 | 출처 | 용도 | Self-host |
|-----|------|------|----------|
| Web UI | claudecodeui Frontend | 대화 인터페이스 | ✅ |
| Preview Manager | [Claudable](https://github.com/opactorai/Claudable) | 실시간 프리뷰 | ✅ (수정필요) |
| WebSocket | ws / Socket.io | 실시간 동기화 | ✅ |

### 5.3 LAYER 3: IDE (사용자 선택)

| 옵션 | 특징 | 비용 |
|-----|------|------|
| Cursor | AI 네이티브 | $20/월 |
| VSCode + Copilot | 가장 보편적 | $10/월 |
| VSCode + Continue | 오픈소스 AI | 무료 |

### 5.4 인프라 (Self-Host)

| 부품 | 옵션 | 추천 |
|-----|------|------|
| **배포 플랫폼** | Dokploy / Coolify / 직접구현 | **Dokploy** (가볍고 충분) |
| **Reverse Proxy** | Traefik / Caddy / nginx | **Traefik** (Docker 네이티브) |
| **SSL** | Let's Encrypt (자동) | Traefik 통합 |
| **DNS** | Cloudflare / Route53 | **Cloudflare** (무료 + DNS-01) |
| **서버** | Hetzner / DigitalOcean / Vultr | **Hetzner** (가성비) |

---

## 6. 의사결정 기록

### 6.1 결정된 사항

| # | 결정 | 선택 | 근거 |
|---|------|------|------|
| **D1** | 배포 플랫폼 | **Dokploy** | Self-host, 가벼움, Traefik 통합, Multi-server |
| **D2** | Reverse Proxy | **Traefik** | Docker 라벨 자동 설정, Wildcard SSL |
| **D3** | DNS Provider | **Cloudflare** | 무료, DNS-01 Challenge, 빠름 |
| **D4** | 세션 저장소 | **Redis** | 공동작업 지원, 분산 가능 |
| **D5** | Claude 연동 | **claudecodeui** | 검증됨, API 준비됨 |

### 6.2 보류/논의 필요

| # | 항목 | 옵션 | 논의 포인트 |
|---|------|------|-----------|
| **P1** | Canvas UI | Claudable 수정 vs 직접 개발 | 수정 범위 확인 필요 |
| **P2** | 문서 자동생성 | Claude 직접 vs LangChain | 품질/제어 트레이드오프 |
| **P3** | 프리뷰 정리 정책 | 7일 후 삭제? PR 닫히면? | 리소스 관리 |

---

## 7. MVP 전략

### 7.1 핵심 원칙

> **"핵심 부품만 조립 → 바로 동작 → 점진적 확장"**

### 7.2 MVP 단계

#### MVP 0: 인프라 구축 (Day 1-2)

```
서버 + Docker + Traefik + Dokploy 설치
```

**체크리스트**:
- [ ] 서버 준비 (Hetzner/DO, 4GB RAM+)
- [ ] Dokploy 설치
- [ ] Wildcard DNS 설정 (*.app.example.com)
- [ ] SSL 인증서 확인

**성공 기준**: `https://test.app.example.com` 접속 가능

---

#### MVP 1: claudecodeui 배포 (Day 3-4)

```
claudecodeui Self-host → 웹에서 Claude 대화
```

**체크리스트**:
- [ ] claudecodeui Docker 이미지 빌드
- [ ] Dokploy에 배포
- [ ] `https://claude.app.example.com` 접속
- [ ] 대화 테스트

---

#### MVP 2: Slack 연동 (Week 1)

```
Slack → claudecodeui API → 응답
```

**체크리스트**:
- [ ] Slack App 생성
- [ ] slack-bot 컨테이너 배포
- [ ] Redis 연결
- [ ] `@claude` 멘션 응답 확인

**성공 기준**:
```
[Slack #test 채널]
사용자: @claude 안녕
Claude: 안녕하세요!
```

---

#### MVP 3: Git + 프리뷰 연동 (Week 2)

```
Slack 요청 → 브랜치 생성 → 프리뷰 URL
```

**체크리스트**:
- [ ] Channel → Repo 매핑
- [ ] 브랜치 자동 생성
- [ ] Dokploy Webhook 연동
- [ ] 프리뷰 URL Slack 공유

**성공 기준**:
```
[Slack]
사용자: @claude 로그인 페이지 만들어줘
Claude: 📺 프리뷰: https://feature-login.app.example.com
```

---

#### MVP 4: Canvas 연결 (Week 3)

```
Slack 세션 → Canvas UI → 실시간 프리뷰
```

---

### 7.3 마일스톤

| Week | 마일스톤 | 검증 방법 |
|------|---------|---------|
| W1 | 🎯 Slack 대화 | @claude 응답 |
| W2 | 🎯 프리뷰 URL | 브랜치 → URL 자동 |
| W3 | 🎯 Canvas | 시각적 작업 가능 |

---

## 8. 다음 단계

### 즉시 실행

1. [ ] 서버 준비 (Hetzner 4GB 권장)
2. [ ] Dokploy 설치 테스트
3. [ ] Cloudflare DNS 설정
4. [ ] claudecodeui 로컬 테스트

### 피드백 요청

1. **Dokploy vs Coolify** - 더 가벼운 Dokploy로 시작?
2. **Canvas UI** - Claudable 수정 vs 최소 직접 구현?
3. **서버 스펙** - 예상 트래픽/사용자 규모?

---

## 참고 자료

### Self-Host 플랫폼
- [Dokploy](https://dokploy.com/) - 가벼운 Self-host PaaS
- [Coolify](https://coolify.io/) - 풀기능 Self-host PaaS
- [Northflank Coolify Alternatives](https://northflank.com/blog/coolify-alternatives-in-2025)

### Traefik 설정
- [Traefik 3 Wildcard Certificates](https://technotim.live/posts/traefik-3-docker-certificates/)
- [Traefik + Cloudflare](https://major.io/p/wildcard-letsencrypt-certificates-traefik-cloudflare/)

### 오픈소스 재료
- [claudecodeui](https://github.com/siteboon/claudecodeui)
- [Claudable](https://github.com/opactorai/Claudable)
- [Slack Bolt SDK](https://github.com/slackapi/bolt-js)

### 내부 문서
- [POC 시스템 분석 보고서](./POC_SYSTEM_ANALYSIS_REPORT.md)
- [HITL 솔루션 리서치](../automation/EXISTING_SOLUTIONS_HITL.md)

---

*v0.3 - Self-host 중심 리서치, 핵심 부품 분석, 의사결정 기록 추가*
