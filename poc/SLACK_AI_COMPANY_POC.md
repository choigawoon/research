# Slack-First AI Company Platform - POC 분석 및 설계 보고서

**작성일**: 2025-12-12
**버전**: v0.1 (초안)
**상태**: 검토 중

---

## 목차

1. [비전 및 핵심 아이디어](#1-비전-및-핵심-아이디어)
2. [3-레이어 아키텍처](#2-3-레이어-아키텍처)
3. [레이어별 솔루션 분석](#3-레이어별-솔루션-분석)
4. [MVP 전략: 바로 돌아가는 제품부터](#4-mvp-전략-바로-돌아가는-제품부터)
5. [의사결정 포인트](#5-의사결정-포인트)
6. [구현 로드맵](#6-구현-로드맵)
7. [리스크 및 미결 사항](#7-리스크-및-미결-사항)
8. [다음 단계](#8-다음-단계)

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

### 1.3 목표 사용자 시나리오

```
[시나리오 1: 새 기능 개발]
PM: "@claude 로그인 페이지에 소셜 로그인 추가해줘"
Claude: "네, GitHub과 Google OAuth를 추가하겠습니다.
        작업 시작하겠습니다. 완료되면 프리뷰 URL 공유드릴게요."
...
Claude: "완료했습니다!
        - 프리뷰: https://pr-123-app.example.com
        - PR: https://github.com/org/repo/pull/123"
디자이너: "구글 버튼 색상 가이드라인에 맞게 수정해주세요"
Claude: "수정했습니다. 프리뷰 새로고침 해주세요."
```

---

## 2. 3-레이어 아키텍처

### 2.1 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                     LAYER 1: 상위개념 (Command)                  │
│            Slack에서 굵직한 작업들, 의사결정 수행                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                        Slack                            │    │
│  │    - 요구사항 논의, 의사결정                               │    │
│  │    - AI에게 작업 지시                                     │    │
│  │    - 진행 상황 확인, 피드백                               │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     LAYER 2: 중위개념 (Canvas)                   │
│            브레인스토밍, UI/UX 관점 작업, 화면 단위 작업              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Web Canvas UI                        │    │
│  │    - 실시간 프리뷰                                        │    │
│  │    - 시각적 피드백                                        │    │
│  │    - 디자인/UX 조정                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     LAYER 3: 로우레벨 (Code)                     │
│               실제 코드를 들여다보고 수정하는 작업환경                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    IDE / CLI                            │    │
│  │    - 코드 수정                                           │    │
│  │    - 디버깅                                              │    │
│  │    - 테스트 실행                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 레이어 간 전환

| 전환 | 트리거 | 예시 |
|-----|-------|------|
| L1 → L2 | "화면으로 보고 싶어" | Slack에서 Canvas UI 링크 공유 |
| L1 → L3 | "코드 직접 수정할게" | Slack에서 IDE/CLI 세션 연결 |
| L2 → L1 | "팀에 공유할게" | Canvas에서 Slack 채널로 스냅샷 전송 |
| L2 → L3 | "이 부분 코드 보고 싶어" | Canvas에서 해당 파일 IDE로 열기 |
| L3 → L1 | "PR 만들었어" | IDE에서 Slack으로 PR 링크 공유 |
| L3 → L2 | "프리뷰 확인해봐" | IDE에서 Canvas 프리뷰 URL 열기 |

---

## 3. 레이어별 솔루션 분석

### 3.1 LAYER 1: 상위개념 (Slack Integration)

#### 상용 솔루션

| 솔루션 | 특징 | 장점 | 단점 |
|-------|------|------|------|
| **[Claude and Slack](https://claude.com/claude-and-slack)** | Anthropic 공식 | 안정적, 기업용, Claude 최적화 | 커스터마이징 제한, 월 구독료 |

#### 오픈소스 재료

| 프로젝트 | 특징 | 적합도 |
|---------|------|--------|
| **[claudecodeui](https://github.com/siteboon/claudecodeui)** | Claude Code CLI → Web 프록시 | ⭐⭐⭐⭐⭐ |
| **[HumanLayer](https://github.com/humanlayer/humanlayer)** | Slack HITL SDK | ⭐⭐⭐⭐ |
| **[@slack/bolt](https://github.com/slackapi/bolt-js)** | Slack 봇 프레임워크 | ⭐⭐⭐⭐ |

#### claudecodeui 핵심 분석

> 참고: [POC_SYSTEM_ANALYSIS_REPORT.md](./POC_SYSTEM_ANALYSIS_REPORT.md) 섹션 2.2

**이미 갖춰진 것:**
- ✅ Claude SDK 프록시 (`/server/claude-sdk.js`)
- ✅ API 키 인증 (`/api/agent/query` + `x-api-key`)
- ✅ 세션 관리 (sessionId로 대화 컨텍스트 유지)
- ✅ 스트리밍 응답 지원

**Slack 연동에 필요한 것:**
- 🔧 Thread → Session 매핑 (Redis)
- 🔧 Channel → Project 매핑
- 🔧 Slack Bot 이벤트 핸들러

#### 추천 방향

```
Option A: claudecodeui + Slack Bolt 직접 연동 (선호)
- 완전한 커스터마이징 가능
- 비용 절감
- 작업량: 2-3주

Option B: Claude and Slack + claudecodeui 병행
- 빠른 시작 가능
- 월 구독 비용 발생
- 커스터마이징 제한
```

---

### 3.2 LAYER 2: 중위개념 (Canvas UI)

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

#### Claudable 핵심 분석

> 참고: [POC_SYSTEM_ANALYSIS_REPORT.md](./POC_SYSTEM_ANALYSIS_REPORT.md) 섹션 2.1

**이미 갖춰진 것:**
- ✅ 실시간 프리뷰 시스템 (`PreviewManager`)
- ✅ WebSocket 기반 변경 사항 브로드캐스트
- ✅ Vercel 자동 배포
- ✅ GitHub 통합

**해결해야 할 이슈:**
- ⚠️ SSH 포트포워딩 환경에서 프리뷰 동작 안 함 (localhost 하드코딩)
- 🔧 환경 인식 URL 생성 로직 필요

#### 추천 방향

```
Claudable UI + claudecodeui 백엔드 통합
- Claudable의 완성된 프리뷰 UI 활용
- claudecodeui의 안정적인 Claude SDK 통합 활용
- 작업량: 1-2주 (API 어댑터 작성)
```

---

### 3.3 LAYER 3: 로우레벨 (IDE/CLI)

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
| **Antigravity** | (정보 필요) | ? |

#### 추천 방향

```
Layer 3는 사용자 선택에 맡김
- 각 개발자가 익숙한 도구 사용
- Layer 1, 2와의 연결만 표준화 (Git 기반)
- 예: Cursor 사용자도, VSCode 사용자도 같은 Slack 채널에서 협업
```

---

## 4. MVP 전략: 바로 돌아가는 제품부터

### 4.1 핵심 원칙

> **"바로 돌아갈 수 있는 형태 → 점진적 기능 추가"**

1. **가장 작은 E2E 플로우** 먼저 완성
2. 각 단계에서 **실제 사용 가능한 상태** 유지
3. 피드백 → 개선 → 피드백 반복

### 4.2 MVP 단계 정의

#### MVP 0: 즉시 시작 가능 (Day 1)

```
claudecodeui 그대로 실행
- Web UI로 Claude와 대화
- 프로젝트/세션 관리
- 기본 기능 동작 확인
```

**체크리스트:**
- [ ] claudecodeui 설치 및 실행
- [ ] 로컬에서 대화 테스트
- [ ] 파일 수정 동작 확인

---

#### MVP 1: Slack 기본 연동 (Week 1-2)

```
Slack에서 Claude와 기본 대화
- @claude 멘션으로 질문
- 답변 받기
- Thread로 대화 이어가기
```

**아키텍처:**
```
Slack → Slack Bolt → claudecodeui API → Claude SDK
                          ↓
                     응답 → Slack
```

**체크리스트:**
- [ ] Slack App 생성 (Bot Token, Signing Secret)
- [ ] Slack Bolt 기본 설정
- [ ] claudecodeui `/api/agent/query` 연동
- [ ] Thread-Session 매핑 (메모리 또는 Redis)

**성공 기준:**
```
[Slack 채널에서]
사용자: @claude 안녕
Claude: 안녕하세요! 무엇을 도와드릴까요?
```

---

#### MVP 2: 프로젝트 연결 (Week 2-3)

```
Slack 채널 ↔ 프로젝트 연결
- #frontend 채널 → /repos/frontend 프로젝트
- 해당 프로젝트 컨텍스트에서 작업
```

**추가 기능:**
- Channel → Project 매핑 저장
- `/claude config` 슬래시 명령어
- 프로젝트 파일 읽기/수정

**체크리스트:**
- [ ] Redis 설정 (채널-프로젝트 매핑 저장)
- [ ] `/claude config project /path/to/project` 명령어
- [ ] 프로젝트 컨텍스트 기반 응답

**성공 기준:**
```
[#frontend 채널에서]
사용자: /claude config project /repos/frontend
Claude: ✅ #frontend 채널이 /repos/frontend 프로젝트에 연결되었습니다.

사용자: @claude App.tsx 파일 보여줘
Claude: [App.tsx 내용 표시]
```

---

#### MVP 3: 코드 수정 + 프리뷰 (Week 3-4)

```
Slack에서 코드 수정 → 프리뷰 URL 공유
```

**추가 기능:**
- 코드 수정 시 자동 dev 서버 시작
- 프리뷰 URL 생성 및 공유
- Claudable 프리뷰 매니저 통합

**체크리스트:**
- [ ] claudecodeui tool 실행 시 프리뷰 트리거
- [ ] Claudable PreviewManager 포팅 또는 API 연동
- [ ] 프리뷰 URL Slack으로 전송

**성공 기준:**
```
[#frontend 채널에서]
사용자: @claude 로그인 버튼을 파란색으로 바꿔줘
Claude: 수정했습니다!
        📺 프리뷰: https://preview-abc123.example.com
        변경 파일: src/components/LoginButton.tsx
```

---

#### MVP 4: Canvas UI 연결 (Week 4-5)

```
Slack ↔ Canvas UI 양방향 연결
- Slack에서 "화면으로 보고 싶어" → Canvas UI 링크
- Canvas UI에서 수정 → Slack으로 알림
```

**추가 기능:**
- Claudable UI 배포
- Slack에서 Canvas 세션 링크 공유
- Canvas 변경 사항 Slack 알림

**체크리스트:**
- [ ] Claudable 프론트엔드 배포
- [ ] `/claude canvas` 명령어로 세션 URL 생성
- [ ] Canvas → Slack 웹훅 알림

---

#### MVP 5: Git/배포 통합 (Week 5-6)

```
완성된 작업 → PR 생성 → 배포
```

**추가 기능:**
- PR 자동 생성
- 배포 트리거
- 상태 알림

**체크리스트:**
- [ ] Git commit/push 자동화
- [ ] GitHub PR 생성 연동
- [ ] Vercel/자체 호스팅 배포 연결

---

## 5. 의사결정 포인트

### 5.1 결정해야 할 사항들

| # | 결정 사항 | 옵션 | 현재 기울기 | 결정 기준 |
|---|----------|------|------------|----------|
| D1 | Slack 연동 방식 | A: claudecodeui 직접<br>B: Claude for Slack 병행 | A | 커스터마이징 필요성, 비용 |
| D2 | 세션 저장소 | A: Redis<br>B: SQLite<br>C: 메모리 | A | 확장성, 협업 세션 필요성 |
| D3 | 프리뷰 인프라 | A: Vercel<br>B: 자체 호스팅 (Traefik)<br>C: 둘 다 | C | 비용, 제어 필요성 |
| D4 | Canvas UI | A: Claudable 그대로<br>B: 커스텀 개발 | A | 개발 시간, 완성도 |
| D5 | 멀티테넌시 | A: 단일 팀<br>B: 다중 팀 | A (MVP) | 초기 사용자 규모 |

### 5.2 결정 기준 체크리스트

**D1: Slack 연동 방식**
```
[ ] Q1: 팀 규모가 5명 이상인가?
       → Yes: B (기업용 안정성)
       → No: A (유연성)

[ ] Q2: 월 $20+ 구독료 감당 가능한가?
       → Yes: B 고려
       → No: A

[ ] Q3: Slack 봇 개발 경험이 있는가?
       → Yes: A (직접 개발 부담 적음)
       → No: B (빠른 시작)
```

**D2: 세션 저장소**
```
[ ] Q1: 여러 사용자가 같은 세션 공유하나?
       → Yes: Redis (분산 처리)
       → No: SQLite 충분

[ ] Q2: 서버 재시작 시에도 세션 유지 필요한가?
       → Yes: Redis/SQLite
       → No: 메모리 가능

[ ] Q3: 수평 확장 계획이 있는가?
       → Yes: Redis
       → No: SQLite
```

### 5.3 검증 필요 사항

| # | 가설 | 검증 방법 | 상태 |
|---|-----|---------|------|
| H1 | claudecodeui API가 Slack 연동에 충분하다 | MVP 1에서 확인 | ⏳ 대기 |
| H2 | SSH 포트포워딩 이슈가 수정 가능하다 | Claudable 코드 분석 | ✅ 분석됨 |
| H3 | Thread-Session 매핑이 자연스럽게 작동한다 | MVP 1-2에서 확인 | ⏳ 대기 |
| H4 | Slack에서의 UX가 웹 UI만큼 좋다 | MVP 2 이후 사용자 테스트 | ⏳ 대기 |

---

## 6. 구현 로드맵

### Phase 1: Foundation (Week 1-2)

```
┌─────────────────────────────────────────┐
│ MVP 0: claudecodeui 환경 구축            │
│ MVP 1: Slack 기본 연동                   │
├─────────────────────────────────────────┤
│ 산출물:                                  │
│ - Slack에서 Claude와 기본 대화 가능       │
│ - 프로젝트 폴더 내 파일 조회/수정 가능     │
└─────────────────────────────────────────┘
```

### Phase 2: Integration (Week 3-4)

```
┌─────────────────────────────────────────┐
│ MVP 2: 프로젝트 연결                     │
│ MVP 3: 코드 수정 + 프리뷰                │
├─────────────────────────────────────────┤
│ 산출물:                                  │
│ - 채널-프로젝트 매핑                      │
│ - 코드 수정 시 프리뷰 URL 자동 공유       │
└─────────────────────────────────────────┘
```

### Phase 3: Canvas (Week 5-6)

```
┌─────────────────────────────────────────┐
│ MVP 4: Canvas UI 연결                    │
│ MVP 5: Git/배포 통합                     │
├─────────────────────────────────────────┤
│ 산출물:                                  │
│ - Slack ↔ Canvas 양방향 연결             │
│ - PR 생성 및 배포 자동화                  │
└─────────────────────────────────────────┘
```

### 마일스톤 체크포인트

| Week | 마일스톤 | 성공 기준 |
|------|---------|---------|
| W2 | 🎯 Slack 대화 가능 | @claude 멘션으로 응답 받기 |
| W4 | 🎯 코드 수정 + 프리뷰 | Slack에서 코드 수정 → 프리뷰 URL 확인 |
| W6 | 🎯 E2E 완성 | 요청 → 개발 → PR → 배포 전체 흐름 |

---

## 7. 리스크 및 미결 사항

### 7.1 기술적 리스크

| 리스크 | 영향 | 대응 방안 |
|-------|------|----------|
| SSH 포트포워딩 프리뷰 이슈 | 높음 | URL Resolver 구현 (분석 완료) |
| Slack API Rate Limit | 중간 | 응답 청킹, 큐잉 |
| 세션 동시성 충돌 | 중간 | Redis 잠금 메커니즘 |
| Claude API 비용 | 낮음 | 사용량 모니터링, 캐싱 |

### 7.2 미결 사항 (TBD)

- [ ] Antigravity 프로젝트 정보 추가 조사 필요
- [ ] Gemini CLI 실제 사용성 평가 필요
- [ ] 멀티테넌시 아키텍처 상세 설계 (Phase 2 이후)
- [ ] 보안 감사 범위 정의

### 7.3 열린 질문들

```
Q1: MVP 1 완료 후 사용자 피드백 수집 방법은?
Q2: 프리뷰 URL 유효 기간은 어떻게 설정할 것인가?
Q3: 팀 외부 사용자 접근 제어는 어떻게 할 것인가?
Q4: 에러 발생 시 Slack 알림 형식은?
```

---

## 8. 다음 단계

### 즉시 실행 (이번 주)

1. [ ] claudecodeui 로컬 설치 및 실행 테스트
2. [ ] Slack App 생성 (테스트 워크스페이스)
3. [ ] 의사결정 D1 (Slack 연동 방식) 최종 확정

### 피드백 필요 사항

이 보고서를 검토하고 다음 항목에 대한 피드백 부탁드립니다:

1. **3-레이어 구분**이 적절한가?
2. **MVP 단계 정의**가 현실적인가?
3. **의사결정 포인트**에서 빠진 것은?
4. **우선순위** 조정이 필요한가?

---

## 참고 자료

### 내부 문서
- [POC 시스템 분석 보고서](./POC_SYSTEM_ANALYSIS_REPORT.md) - Claudable, claudecodeui, coolify 상세 분석
- [기존 HITL 솔루션 리서치](../automation/EXISTING_SOLUTIONS_HITL.md) - Human-in-the-loop 솔루션 비교

### 외부 링크
- [claudecodeui GitHub](https://github.com/siteboon/claudecodeui)
- [Claudable GitHub](https://github.com/opactorai/Claudable)
- [Claude and Slack](https://claude.com/claude-and-slack)
- [Slack Bolt SDK](https://github.com/slackapi/bolt-js)

---

*이 문서는 작성 중이며, 피드백을 받으면서 계속 업데이트됩니다.*
