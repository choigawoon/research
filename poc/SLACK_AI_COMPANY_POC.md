# Slack-First AI Company Platform - POC 분석 및 설계 보고서

**작성일**: 2025-12-12
**버전**: v0.2
**상태**: 검토 중

---

## 목차

1. [비전 및 핵심 아이디어](#1-비전-및-핵심-아이디어)
2. [대전제: Git Repo 중심 아키텍처](#2-대전제-git-repo-중심-아키텍처)
3. [결과물 형태](#3-결과물-형태)
4. [3-레이어 아키텍처 상세](#4-3-레이어-아키텍처-상세)
5. [격리 배포 환경 및 PR 플로우](#5-격리-배포-환경-및-pr-플로우)
6. [레이어별 솔루션 분석](#6-레이어별-솔루션-분석)
7. [MVP 전략: 바로 돌아가는 제품부터](#7-mvp-전략-바로-돌아가는-제품부터)
8. [의사결정 포인트](#8-의사결정-포인트)
9. [구현 로드맵](#9-구현-로드맵)
10. [리스크 및 미결 사항](#10-리스크-및-미결-사항)
11. [다음 단계](#11-다음-단계)

---

## 1. 비전 및 핵심 아이디어

### 1.1 핵심 비전

> **"Slack에서 모든 것을 지휘하는 AI Company"**

- 모든 서비스, 프로덕트 관련 대화와 의사결정이 Slack에서 시작
- 대화 내용이 자연스럽게 실제 개발/배포로 연결
- 협업과 개발의 경계를 없앰

### 1.2 왜 Slack-First인가?

| 이점 | 설명 |
|-----|------|
| **컨텍스트 유지** | 대화 흐름 속에서 요구사항 → 구현까지 자연스러운 전환 |
| **협업 내재화** | 팀원들이 이미 있는 곳에서 AI와 협업 |
| **비동기 작업** | AI가 작업하는 동안 다른 일 가능 |
| **히스토리 자동 기록** | 모든 의사결정 과정이 Slack에 기록됨 |

---

## 2. 대전제: Git Repo 중심 아키텍처

### 2.1 핵심 원칙

> **"모든 주제/제품은 반드시 Git Repo URL이 존재해야 한다"**

```
┌─────────────────────────────────────────────────────────────────┐
│                     Git Repository (Source of Truth)             │
│                                                                   │
│  github.com/org/product-name                                     │
│  ├── src/                    # 소스 코드                          │
│  ├── docs/                   # 리서치, 의사결정 문서               │
│  │   ├── research/           # 시장/기술 리서치                   │
│  │   ├── decisions/          # 의사결정 기록 (ADR)                │
│  │   └── specs/              # 기능 명세                          │
│  ├── .github/                # PR 템플릿, 워크플로우               │
│  └── README.md               # 프로젝트 개요                       │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Repo가 중심인 이유

| 이유 | 설명 |
|-----|------|
| **단일 진실 소스** | 코드, 문서, 히스토리가 한 곳에 |
| **버전 관리** | 모든 변경 사항 추적 가능 |
| **협업 표준** | PR, Issue, Review 등 검증된 협업 방식 |
| **자동화 기반** | CI/CD, 프리뷰 배포 트리거 가능 |
| **레이어 간 연결** | 모든 레이어가 같은 repo를 바라봄 |

### 2.3 Slack Thread ↔ Git Repo 매핑

```
Slack Workspace
├── #product-alpha (채널)
│   └── Thread: "로그인 기능 논의"
│       ├── 연결된 Repo: github.com/org/product-alpha
│       ├── 현재 Branch: feature/login
│       └── 프리뷰 URL: https://feature-login.product-alpha.preview.dev
│
├── #product-beta (채널)
│   └── Thread: "결제 시스템 설계"
│       ├── 연결된 Repo: github.com/org/product-beta
│       └── ...
```

---

## 3. 결과물 형태

### 3.1 두 가지 결과물 유형

#### Type A: 웹앱/웹콘텐츠 (실시간 확인용)

> **URL로 바로 접근해서 확인할 수 있는 형태**

```
결과물 예시:
- https://feature-login.product-alpha.preview.dev (프리뷰)
- https://product-alpha.example.com (프로덕션)

특징:
- 대화 중 즉시 확인 가능
- 변경사항 실시간 반영
- 비개발자도 바로 피드백 가능
```

#### Type B: 문서화 (보고서/기록용)

> **GitHub Repo에 Markdown으로 정리되어 나중에 참조**

```
결과물 예시:
- docs/research/market-analysis.md (시장 리서치)
- docs/research/competitor-analysis.md (경쟁사 분석)
- docs/decisions/001-auth-provider.md (기술 의사결정)
- docs/specs/login-feature.md (기능 명세)

특징:
- Git 히스토리로 변경 추적
- PR 리뷰로 품질 관리
- 검색/참조 용이
```

### 3.2 결과물 생성 플로우

```
[Slack 대화]
    │
    ├─── "로그인 페이지 만들어줘" ──────┬──→ [코드 생성] → PR → 프리뷰 URL
    │                                   │
    ├─── "경쟁사 분석해줘" ─────────────┴──→ [문서 생성] → PR → Markdown
    │
    └─── "이 기능 어떻게 구현할지 정리해줘" ──→ [명세 작성] → PR → Markdown
```

---

## 4. 3-레이어 아키텍처 상세

### 4.1 전체 구조

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      LAYER 1: 상위개념 (Command Layer)                   │
│                       Slack에서 전략적 의사결정                            │
├─────────────────────────────────────────────────────────────────────────┤
│ 역할:                                                                    │
│ • Slack 스레드에서 대화 → PoC 제품 방향 결정                               │
│ • 시장/기술 리서치 검증 요청                                               │
│ • 핵심 문제 정의 → 최소 기능 정의                                          │
│ • A/B 테스트처럼 기능 추가 버전 미리보기 요청                               │
│                                                                          │
│ 결과물:                                                                   │
│ • 브랜치 생성 → PR → 격리된 프리뷰 URL                                     │
│ • 리서치/의사결정 문서 (Markdown)                                          │
│                                                                          │
│ 작업 방식:                                                                │
│ • 스타트업처럼: 핵심 문제 → 최소 동작 서비스 → 점진적 확장                   │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ "화면 보면서 작업하고 싶어"
                             │ "Canvas 열어줘"
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      LAYER 2: 중위개념 (Canvas Layer)                    │
│                   실시간 프리뷰 보면서 대화로 수정                          │
├─────────────────────────────────────────────────────────────────────────┤
│ 역할:                                                                    │
│ • 상위레벨 세션을 열어서 진입 (같은 컨텍스트 유지)                          │
│ • 격리 환경에서 git clone → npm run dev / docker                         │
│ • 실시간 프리뷰 보면서 대화로 수정                                         │
│ • 혼자 작업 또는 팀원과 공동 작업                                          │
│                                                                          │
│ 결과물:                                                                   │
│ • 실시간 프리뷰 URL                                                       │
│ • 코드 변경사항 → 자동 커밋                                               │
│                                                                          │
│ 작업 방식:                                                                │
│ • 시각적 피드백 기반 빠른 이터레이션                                       │
│ • "이 버튼 왼쪽으로" → 즉시 반영 → 확인                                    │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ "코드 직접 볼게"
                             │ "내 IDE에서 작업할게"
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      LAYER 3: 하위개념 (Code Layer)                      │
│                      로컬 IDE에서 직접 코드 작업                           │
├─────────────────────────────────────────────────────────────────────────┤
│ 역할:                                                                    │
│ • 해당 제품의 Git repo를 로컬에 clone                                     │
│ • Cursor IDE / VSCode 등 본인 환경에서 직접 코드 수정                      │
│ • 디버깅, 테스트, 복잡한 리팩토링                                          │
│                                                                          │
│ 결과물:                                                                   │
│ • 로컬 커밋 → Push → PR                                                  │
│                                                                          │
│ 작업 방식:                                                                │
│ • 개발자 본인이 익숙한 도구 사용                                           │
│ • AI 어시스턴트 (Cursor, Copilot 등) 활용 가능                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 레이어 간 전환 상세

| 전환 | 트리거 | 시스템 동작 |
|-----|-------|-----------|
| **L1 → L2** | "Canvas 열어줘" | Slack에서 Canvas URL 제공, 같은 세션 ID 유지 |
| **L1 → L3** | "repo clone 할게" | Git repo URL + 현재 브랜치 정보 제공 |
| **L2 → L1** | "팀에 공유" | Canvas에서 Slack 채널로 스냅샷/URL 전송 |
| **L2 → L3** | "이 파일 IDE로" | 해당 파일 경로 + 라인 번호 제공 |
| **L3 → L1** | "PR 만들었어" | PR URL이 Slack 스레드에 자동 공유 |
| **L3 → L2** | "프리뷰 봐줘" | 푸시된 브랜치의 프리뷰 URL 공유 |

### 4.3 레이어별 사용 시나리오

#### 시나리오: 새 제품 PoC 개발

```
[LAYER 1: Slack #product-idea 채널]

PM: "음식 배달 앱 MVP 만들어보자. 핵심은 주문-결제-배달추적이야"

Claude: "네, 스타트업 방식으로 접근하겠습니다.

         📋 핵심 문제: 사용자가 음식을 주문하고 배달 상태를 확인

         🎯 MVP 스코프 (최소 동작 버전):
         1. 메뉴 목록 보기
         2. 장바구니에 담기
         3. 주문하기 (결제는 목업)
         4. 주문 상태 확인

         먼저 리서치부터 할까요, 바로 만들어볼까요?"

PM: "경쟁사 분석 먼저 해줘"

Claude: "경쟁사 분석을 진행하겠습니다...

         📄 문서 생성됨: docs/research/competitor-analysis.md
         PR: #12 - Add competitor analysis

         주요 발견:
         - 배민: 슈퍼앱 전략, 배달+퀵커머스
         - 쿠팡이츠: 로켓배달 연계, 단건배달
         - 요기요: 프랜차이즈 중심

         우리의 차별점을 뭘로 잡을까요?"

PM: "일단 MVP 먼저 만들어봐. 메뉴 목록이랑 장바구니만"

Claude: "MVP v0.1 작업 시작합니다.

         🔀 Branch: feature/mvp-v0.1

         작업 완료!
         📺 프리뷰: https://mvp-v0-1.food-delivery.preview.dev
         PR: #13 - MVP v0.1: Menu list and cart

         확인해보시고 피드백 주세요!"

PM: "오 좋은데, 메뉴 카드 디자인 좀 다듬고 싶어. Canvas 열어줘"

Claude: "Canvas를 열었습니다.
         🎨 https://canvas.example.com/session/abc123

         같은 세션에서 계속 작업할 수 있습니다.
         실시간 프리뷰 보면서 수정해보세요!"

---
[LAYER 2: Canvas UI]

PM: (Canvas에서 프리뷰 보면서)
    "메뉴 카드 그림자 좀 더 진하게"

Claude: "수정했습니다. 프리뷰 확인해주세요."
        [프리뷰 자동 새로고침]

PM: "좋아. 이제 가격 폰트 더 크게"

Claude: "적용했습니다."

PM: "완벽해. 이거 Slack에 공유해줘"

Claude: "Slack #product-idea에 공유했습니다.
         다른 팀원들 피드백 기다려볼까요?"

---
[LAYER 3: 로컬 IDE - 개발자가 직접]

개발자: (Slack에서 repo URL 확인)
        $ git clone github.com/org/food-delivery
        $ git checkout feature/mvp-v0.1
        $ cursor .

        (Cursor IDE에서 결제 로직 직접 구현)

        $ git push origin feature/mvp-v0.1

[Slack에 자동 알림]
Bot: "🔔 feature/mvp-v0.1 브랜치에 새 커밋
      프리뷰 업데이트됨: https://mvp-v0-1.food-delivery.preview.dev"
```

---

## 5. 격리 배포 환경 및 PR 플로우

### 5.1 브랜치 기반 격리 배포

> **같은 repo 기반으로 격리된 배포 환경**

```
main (프로덕션)
  │
  ├── feature/login ──────→ https://feature-login.app.preview.dev
  │
  ├── feature/payment ────→ https://feature-payment.app.preview.dev
  │
  └── experiment/new-ui ──→ https://experiment-new-ui.app.preview.dev

각 브랜치 = 독립된 프리뷰 URL
```

### 5.2 A/B 테스트 스타일 기능 비교

```
[Slack에서]

PM: "로그인 UI를 두 가지 버전으로 만들어서 비교해보고 싶어"

Claude: "두 가지 버전을 만들겠습니다.

         Version A (기존 스타일):
         🔀 Branch: experiment/login-v-a
         📺 Preview: https://login-v-a.app.preview.dev

         Version B (새로운 스타일):
         🔀 Branch: experiment/login-v-b
         📺 Preview: https://login-v-b.app.preview.dev

         두 URL 비교해보시고 어떤 게 나은지 알려주세요!"

PM: "B가 낫네. B로 가자"

Claude: "Version B를 main에 머지하는 PR 생성했습니다.
         PR: #45 - Merge login UI version B

         리뷰 후 머지해주세요!"
```

### 5.3 프리뷰 배포 자동화 플로우

```
┌──────────────────────────────────────────────────────────────────┐
│                        PR/브랜치 프리뷰 플로우                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Slack에서 작업 요청                                            │
│     │                                                             │
│     ▼                                                             │
│  2. Claude가 브랜치 생성                                           │
│     $ git checkout -b feature/new-feature                        │
│     │                                                             │
│     ▼                                                             │
│  3. 코드 작성 & 커밋                                               │
│     $ git commit -m "Add new feature"                            │
│     │                                                             │
│     ▼                                                             │
│  4. Push → PR 생성                                                │
│     $ git push origin feature/new-feature                        │
│     $ gh pr create --title "New feature"                         │
│     │                                                             │
│     ▼                                                             │
│  5. CI/CD 트리거 (GitHub Actions / Vercel / coolify)              │
│     - 브랜치 감지                                                  │
│     - Docker build 또는 npm run build                            │
│     - 격리 환경에 배포                                             │
│     │                                                             │
│     ▼                                                             │
│  6. 프리뷰 URL 생성                                                │
│     https://{branch-name}.{app}.preview.dev                      │
│     │                                                             │
│     ▼                                                             │
│  7. Slack에 프리뷰 URL 자동 공유                                    │
│     "🚀 프리뷰 준비됨: https://feature-new-feature.app.preview.dev" │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 5.4 격리 환경 기술 옵션

| 옵션 | 장점 | 단점 | 적합한 경우 |
|-----|------|------|-----------|
| **Vercel Preview** | 설정 간단, 자동화됨 | 비용, 커스터마이징 제한 | 빠른 시작, Next.js 프로젝트 |
| **coolify + Traefik** | 완전한 제어, 비용 절감 | 초기 설정 복잡 | 장기적, 다양한 스택 |
| **Netlify Preview** | Vercel과 유사 | 비용 | 정적 사이트 중심 |
| **Railway** | 간단한 배포 | 비용 | 백엔드 포함 앱 |

---

## 6. 레이어별 솔루션 분석

### 6.1 LAYER 1: 상위개념 (Slack Integration)

#### 상용 솔루션

| 솔루션 | 특징 | 장점 | 단점 |
|-------|------|------|------|
| **[Claude and Slack](https://claude.com/claude-and-slack)** | Anthropic 공식 | 안정적, 기업용 | 커스터마이징 제한, 월 구독료 |

#### 오픈소스 재료

| 프로젝트 | 특징 | 적합도 |
|---------|------|--------|
| **[claudecodeui](https://github.com/siteboon/claudecodeui)** | Claude Code CLI → Web 프록시 | ⭐⭐⭐⭐⭐ |
| **[HumanLayer](https://github.com/humanlayer/humanlayer)** | Slack HITL SDK | ⭐⭐⭐⭐ |
| **[@slack/bolt](https://github.com/slackapi/bolt-js)** | Slack 봇 프레임워크 | ⭐⭐⭐⭐ |

#### 필요 기능 체크리스트

- [x] Claude SDK 프록시 (claudecodeui)
- [x] 세션 관리 (claudecodeui)
- [ ] Slack Thread ↔ Session 매핑
- [ ] Slack Channel ↔ Git Repo 매핑
- [ ] 브랜치 자동 생성 및 PR 생성
- [ ] 프리뷰 URL 자동 공유
- [ ] 문서 생성 및 커밋

---

### 6.2 LAYER 2: 중위개념 (Canvas UI)

#### 상용 솔루션

| 솔루션 | 특징 | 가격 |
|-------|------|------|
| **[bolt.new](https://bolt.new)** | StackBlitz 기반, 실시간 프리뷰 | Pro $20/월 |
| **[lovable](https://lovable.dev)** | 디자인 중심, Figma 연동 | Pro $20/월 |
| **[Replit](https://replit.com)** | 멀티 언어, 협업 | Pro $25/월 |

#### 오픈소스 재료

| 프로젝트 | 특징 | 적합도 |
|---------|------|--------|
| **[Claudable](https://github.com/opactorai/Claudable)** | Next.js 기반 AI 앱 빌더 | ⭐⭐⭐⭐⭐ |

#### 필요 기능 체크리스트

- [x] 실시간 프리뷰 (Claudable)
- [x] WebSocket 기반 변경 사항 브로드캐스트 (Claudable)
- [ ] Slack 세션과 연동 (같은 컨텍스트 유지)
- [ ] 격리 환경에서 git clone → dev 서버 실행
- [ ] 공동 작업 (여러 사용자 동시 접속)
- [ ] SSH 포트포워딩 환경 지원

---

### 6.3 LAYER 3: 하위개념 (IDE/CLI)

#### 상용 솔루션

| 솔루션 | 특징 | 가격 |
|-------|------|------|
| **[Cursor](https://cursor.com)** | VSCode 포크, AI 네이티브 | Pro $20/월 |
| **[Windsurf](https://windsurf.ai)** | Codeium 기반 | Pro $15/월 |

#### 오픈소스 재료

| 프로젝트 | 특징 | 적합도 |
|---------|------|--------|
| **VSCode + Copilot** | 가장 보편적 | ⭐⭐⭐⭐ |
| **[Gemini CLI](https://github.com/google/gemini-cli)** | Google Gemini 기반 | ⭐⭐⭐ |

#### Layer 3 접근 방식

> **사용자 선택에 맡김 - 연결만 표준화**

```
시스템이 제공하는 것:
- Git repo URL
- 현재 작업 브랜치
- 프리뷰 URL

사용자가 선택하는 것:
- IDE (Cursor, VSCode, WebStorm 등)
- AI 어시스턴트 (Copilot, Claude 등)
```

---

## 7. MVP 전략: 바로 돌아가는 제품부터

### 7.1 핵심 원칙

> **"바로 돌아갈 수 있는 형태 → 점진적 기능 추가"**
>
> 스타트업 방식: 핵심 문제 해결 → 최소 동작 서비스 → 피드백 → 개선

### 7.2 MVP 단계 정의

#### MVP 0: 환경 구축 (Day 1-2)

```
claudecodeui + Git 연동 기본 확인
```

**체크리스트:**
- [ ] claudecodeui 설치 및 실행
- [ ] 로컬에서 대화 테스트
- [ ] Git repo 생성 및 연결 테스트

---

#### MVP 1: Slack 기본 연동 (Week 1)

```
Slack에서 Claude와 기본 대화 + Git repo 연결
```

**성공 기준:**
```
[Slack #my-project 채널]
사용자: /claude init github.com/org/my-project
Claude: ✅ 채널이 github.com/org/my-project에 연결되었습니다.

사용자: @claude README.md 내용 보여줘
Claude: [README.md 내용 표시]
```

---

#### MVP 2: 코드 수정 + 브랜치 + 프리뷰 (Week 2-3)

```
Slack에서 코드 수정 요청 → 브랜치 생성 → 프리뷰 URL
```

**성공 기준:**
```
[Slack #my-project 채널]
사용자: @claude 로그인 페이지 만들어줘

Claude: 작업을 시작합니다.
        🔀 Branch: feature/login-page

        ...작업 중...

        완료했습니다!
        📺 프리뷰: https://feature-login-page.my-project.preview.dev
        PR: github.com/org/my-project/pull/5
```

---

#### MVP 3: Canvas 연결 (Week 3-4)

```
Slack 세션을 Canvas에서 열어서 시각적으로 작업
```

**성공 기준:**
```
[Slack]
사용자: @claude Canvas 열어줘

Claude: 🎨 Canvas 열었습니다: https://canvas.example.com/session/xyz
        현재 브랜치 feature/login-page의 프리뷰를 보면서 작업할 수 있습니다.

[Canvas에서]
사용자: 버튼 색상 빨간색으로
Claude: 수정했습니다. [프리뷰 자동 새로고침]
```

---

#### MVP 4: 문서화 + 리서치 (Week 4-5)

```
대화 기반 리서치 → Markdown 문서 생성 → PR
```

**성공 기준:**
```
[Slack]
사용자: @claude 우리 경쟁사 분석해서 문서로 정리해줘

Claude: 경쟁사 분석을 진행하겠습니다...

        📄 문서 생성: docs/research/competitor-analysis.md
        PR: github.com/org/my-project/pull/8

        주요 발견:
        - 경쟁사 A: ...
        - 경쟁사 B: ...
```

---

#### MVP 5: 공동 작업 (Week 5-6)

```
여러 사람이 같은 Canvas 세션에서 동시 작업
```

**성공 기준:**
```
[Canvas - 공동 작업 모드]
PM과 디자이너가 동시 접속
- PM: "이 버튼 텍스트 바꿔줘"
- 디자이너: "색상은 이 팔레트로"
- 변경사항 실시간 동기화
```

---

## 8. 의사결정 포인트

### 8.1 결정해야 할 사항들

| # | 결정 사항 | 옵션 | 현재 기울기 | 결정 기준 |
|---|----------|------|------------|----------|
| D1 | Slack 연동 방식 | A: claudecodeui 직접<br>B: Claude for Slack | A | 커스터마이징 필요 |
| D2 | 프리뷰 인프라 | A: Vercel<br>B: coolify/자체<br>C: 둘 다 | C | 유연성 + 비용 |
| D3 | 세션 저장소 | A: Redis<br>B: SQLite | A | 공동 작업 지원 |
| D4 | 문서 구조 | A: docs/ 폴더<br>B: Wiki<br>C: Notion 연동 | A | Git 중심 원칙 |

### 8.2 검증 필요 사항

| # | 가설 | 검증 방법 | 상태 |
|---|-----|---------|------|
| H1 | 브랜치별 격리 배포가 자동화 가능하다 | coolify 또는 Vercel 테스트 | ⏳ |
| H2 | Slack Thread-Session 매핑이 자연스럽다 | MVP 1에서 확인 | ⏳ |
| H3 | Canvas 공동 작업이 실용적이다 | MVP 5에서 확인 | ⏳ |
| H4 | 리서치 문서 자동 생성 품질이 충분하다 | MVP 4에서 확인 | ⏳ |

---

## 9. 구현 로드맵

### Phase 1: Foundation (Week 1-2)

```
┌─────────────────────────────────────────┐
│ MVP 0: 환경 구축                         │
│ MVP 1: Slack + Git 연결                  │
├─────────────────────────────────────────┤
│ 산출물:                                  │
│ - Slack에서 repo 연결 및 기본 대화        │
│ - 파일 조회/수정 가능                     │
└─────────────────────────────────────────┘
```

### Phase 2: Preview (Week 3-4)

```
┌─────────────────────────────────────────┐
│ MVP 2: 브랜치 + 프리뷰                   │
│ MVP 3: Canvas 연결                       │
├─────────────────────────────────────────┤
│ 산출물:                                  │
│ - 브랜치별 격리 프리뷰 URL               │
│ - Canvas에서 시각적 작업                 │
└─────────────────────────────────────────┘
```

### Phase 3: Documentation & Collaboration (Week 5-6)

```
┌─────────────────────────────────────────┐
│ MVP 4: 리서치 + 문서화                   │
│ MVP 5: 공동 작업                         │
├─────────────────────────────────────────┤
│ 산출물:                                  │
│ - 자동 문서 생성 및 PR                   │
│ - 다중 사용자 동시 작업                   │
└─────────────────────────────────────────┘
```

### 마일스톤

| Week | 마일스톤 | 성공 기준 |
|------|---------|---------|
| W2 | 🎯 Slack-Git 연결 | 채널에서 repo 파일 조회/수정 |
| W4 | 🎯 프리뷰 자동화 | 브랜치 푸시 → 프리뷰 URL 자동 |
| W6 | 🎯 E2E 완성 | 대화 → 개발 → 문서화 → 배포 전체 |

---

## 10. 리스크 및 미결 사항

### 10.1 기술적 리스크

| 리스크 | 영향 | 대응 방안 |
|-------|------|----------|
| 브랜치별 프리뷰 비용 | 중간 | 자동 정리 정책, coolify 활용 |
| Slack API Rate Limit | 중간 | 응답 청킹, 큐잉 |
| 공동 작업 동시성 | 높음 | Redis 잠금, 충돌 해결 UX |
| Claude API 비용 | 낮음 | 사용량 모니터링 |

### 10.2 미결 사항

- [ ] 프리뷰 환경 자동 정리 정책 (며칠 후 삭제?)
- [ ] 보안: 프리뷰 URL 접근 제어
- [ ] 대용량 repo 처리 전략
- [ ] 모바일에서의 Canvas 사용성

### 10.3 열린 질문

```
Q1: 프리뷰 URL 유효 기간?
Q2: 비개발자도 Canvas에서 편하게 작업 가능한가?
Q3: 기존 팀의 Git 워크플로우와 충돌하지 않는가?
Q4: 리서치 문서의 품질을 어떻게 보장하는가?
```

---

## 11. 다음 단계

### 즉시 실행 (이번 주)

1. [ ] claudecodeui 로컬 설치 및 테스트
2. [ ] Slack App 생성 (테스트 워크스페이스)
3. [ ] 테스트용 GitHub repo 생성
4. [ ] Vercel 또는 coolify 프리뷰 환경 테스트

### 피드백 요청

1. **Git Repo 중심 아키텍처**가 맞는 방향인가?
2. **3-레이어 구분**과 전환 플로우가 자연스러운가?
3. **격리 배포 환경** 구현 방식 선호도는?
4. **MVP 단계**가 현실적인가?

---

## 참고 자료

### 내부 문서
- [POC 시스템 분석 보고서](./POC_SYSTEM_ANALYSIS_REPORT.md)
- [기존 HITL 솔루션 리서치](../automation/EXISTING_SOLUTIONS_HITL.md)

### 외부 링크
- [claudecodeui GitHub](https://github.com/siteboon/claudecodeui)
- [Claudable GitHub](https://github.com/opactorai/Claudable)
- [coolify GitHub](https://github.com/coollabsio/coolify)
- [Slack Bolt SDK](https://github.com/slackapi/bolt-js)

---

*v0.2 - 대전제(Git Repo 중심), 결과물 형태, 격리 배포 환경 내용 추가*
