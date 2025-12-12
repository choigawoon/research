# Claude Code 자동화 및 Human-in-the-Loop 워크플로우 리서치

> **목표**: 인간의 의사결정이 필요한 상황에서 슬랙/메신저로 알림을 주는 자동화 워크플로우 구축

## 리서치 개요

### 연구 배경
Claude Code를 자동화하여 개발 작업을 위임하되, 중요한 의사결정이 필요한 순간에는 인간에게 알림을 보내고 승인/거절을 받는 시스템이 필요함.

### 핵심 요구사항
1. Claude Code 자동 실행 (헤드리스 모드)
2. 특정 조건에서 인간에게 알림 전송
3. 인간의 Yes/No 응답을 받아 워크플로우 계속 진행
4. 슬랙 또는 기타 메신저 연동

---

## 1. Claude Code 자동화 핵심 도구들

### 1.1 Claude Code SDK
> Anthropic 공식 SDK로 프로그래밍 방식의 Claude Code 통합 지원

**특징:**
- TypeScript, Python, CLI 지원
- MCP (Model Context Protocol) 기반
- JSON 또는 스트리밍 응답 지원
- subprocess로 실행 가능

**활용 예시:**
```bash
# 헤드리스 모드 실행
claude -p "your prompt here" --output-format stream-json
```

**공식 문서:** [Anthropic Claude Code SDK](https://www.infoq.com/news/2025/06/claude-code-sdk/)

---

### 1.2 Claude Code Hooks
> 특정 시점에 자동 실행되는 사용자 정의 쉘 명령어

**핵심 Hook 유형:**

| Hook Type | 실행 시점 | 활용 |
|-----------|----------|------|
| **PreToolUse** | 도구 실행 전 | 권한 제어, 알림 전송 |
| **PostToolUse** | 도구 실행 후 | 결과 검증, 로깅 |
| **Notification** | 알림 발생 시 | 슬랙 알림, 데스크톱 알림 |

**PreToolUse Decision Control:**
```javascript
// 세 가지 제어 옵션
Output.allow("Security check passed")   // 허용
Output.deny("Command blocked")          // 거부
Output.ask("Confirm deletion?")         // 사용자에게 확인 요청
```

**Notification Hook 설정 예시:**
```json
{
  "hooks": {
    "Notification": [{
      "matcher": "*",
      "command": "/path/to/notify-script.sh"
    }]
  }
}
```

**환경 변수:**
- `$CLAUDE_FILE_PATHS`: 관련 파일 경로
- `$CLAUDE_NOTIFICATION`: 알림 메시지
- `$CLAUDE_TOOL_OUTPUT`: 도구 실행 결과

**공식 문서:** [Claude Code Hooks Reference](https://docs.claude.com/en/docs/claude-code/hooks)

---

### 1.3 MCP (Model Context Protocol)
> AI와 외부 시스템 연결을 위한 오픈 표준 프로토콜

**특징:**
- Anthropic이 2024년 11월 오픈소스로 공개
- OpenAI, Google DeepMind 등도 채택
- 원격 MCP 서버 지원 (2025)

**프로젝트 설정:**
```json
// .mcp.json (프로젝트 루트)
{
  "mcpServers": {
    "slack": {
      "command": "node",
      "args": ["slack-mcp-server.js"]
    }
  }
}
```

**공식 문서:** [Claude Code MCP Integration](https://docs.anthropic.com/en/docs/claude-code/mcp)

---

### 1.4 Claude Code Plugins (2025년 11월 출시)
> 슬래시 명령, 에이전트, MCP 서버, 훅을 패키징한 확장 시스템

**구성 요소:**
- Slash commands
- Subagents
- MCP servers
- Hooks

**설치 방식:**
```bash
# 단일 명령으로 플러그인 설치
claude plugin install <plugin-name>
```

**공식 발표:** [Claude Code Plugins](https://www.anthropic.com/news/claude-code-plugins)

---

## 2. 슬랙 연동 방법

### 2.1 공식 Claude Code in Slack (2025년 12월 베타)
> Anthropic 공식 슬랙 통합 - @Claude 멘션으로 코딩 작업 위임

**작동 방식:**
1. 슬랙에서 `@Claude` 멘션으로 코딩 요청
2. Claude Code 세션 자동 생성 (웹)
3. 진행 상황 슬랙 스레드에 자동 업데이트
4. 완료 시 PR 생성 버튼 제공

**Human Review 기능:**
- 공개 스레드 응답 시 비공개로 초안 작성
- 검토/수정 후 공유 가능

**접근 방법:** 슬랙 App Marketplace에서 Claude 앱 설치

**공식 발표:** [TechCrunch - Claude Code in Slack](https://techcrunch.com/2025/12/08/claude-code-is-coming-to-slack-and-thats-a-bigger-deal-than-it-sounds/)

---

### 2.2 mpociot/claude-code-slack-bot (오픈소스)
> Claude Code SDK 기반 슬랙 봇

**주요 기능:**
- DM 지원 (개인 채팅)
- 스레드 지원 (컨텍스트 유지)
- 스트리밍 응답
- MCP 서버 지원

**설정:**
```bash
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
SLACK_SIGNING_SECRET=your-signing-secret
```

**GitHub:** [mpociot/claude-code-slack-bot](https://github.com/mpociot/claude-code-slack-bot)

---

### 2.3 Claude MCP Slack (atlasfutures)
> Claude Code Action용 독립 슬랙 MCP 서버

**특징:**
- GitHub Action 통합
- 슬랙 파일 다운로드 지원
- Docker 지원

**GitHub:** [atlasfutures/claude-mcp-slack](https://github.com/atlasfutures/claude-mcp-slack)

---

### 2.4 claude-notify (알림 도구)
> 멀티 OS 알림 도구 (Hooks용)

**지원 플랫폼:**
- macOS
- Linux
- Windows

**GitHub:** [jamez01/claude-notify](https://github.com/jamez01/claude-notify)

---

## 3. Human-in-the-Loop 워크플로우 구현 방법

### 3.1 방법 A: Hooks + 슬랙 웹훅
```
[Claude Code]
    ↓ PreToolUse Hook
[위험 명령 감지]
    ↓ 슬랙 웹훅
[슬랙 알림 전송]
    ↓
[인간 승인/거절]
    ↓ Webhook 응답
[Claude Code 계속 진행]
```

### 3.2 방법 B: n8n 워크플로우 자동화
> 노코드/로우코드 자동화 플랫폼

**패턴:**
1. Claude Code headless 실행
2. 특정 조건 시 n8n 웹훅 호출
3. n8n에서 슬랙 알림 전송
4. Human Approval 노드로 대기
5. 승인 시 다음 단계 진행

**관련 프로젝트:**
- [czlonkowski/n8n-mcp](https://github.com/czlonkowski/n8n-mcp)
- [czlonkowski/n8n-skills](https://github.com/czlonkowski/n8n-skills)
- n8n + Claude 통합: [n8n.io/integrations/claude](https://n8n.io/integrations/claude/)

---

### 3.3 방법 C: GitHub Actions + Claude Code Action
> CI/CD 파이프라인 통합

**공식 Action:**
```yaml
- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Human-in-the-Loop 패턴:**
- Branch protection 유지
- CODEOWNERS 설정
- 머지 전 인간 승인 필수
- PR 업데이트 시 인간 승인 요구

**GitHub:**
- [anthropics/claude-code-action](https://github.com/anthropics/claude-code-action)
- [anthropics/claude-code-security-review](https://github.com/anthropics/claude-code-security-review)

---

## 4. 추천 아키텍처

### 최소 구현 (MVP)
```
┌─────────────────┐
│  Claude Code    │
│  (Headless)     │
└────────┬────────┘
         │ Notification Hook
         ▼
┌─────────────────┐
│  Slack Webhook  │
│  (Incoming)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Slack Channel  │
│  (알림 수신)     │
└────────┬────────┘
         │ Interactive Message
         ▼
┌─────────────────┐
│  Webhook Server │
│  (승인/거절)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Claude Code    │
│  (계속 진행)     │
└─────────────────┘
```

### 완전 자동화 (고급)
```
┌─────────────────┐     ┌─────────────────┐
│  GitHub Action  │────▶│  Claude Code    │
│  (트리거)        │     │  Action         │
└─────────────────┘     └────────┬────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         │                                               │
         ▼                                               ▼
┌─────────────────┐                           ┌─────────────────┐
│  자동 처리 가능   │                           │  승인 필요 작업   │
│  (코드리뷰 등)   │                           │  (보안, 배포 등)  │
└────────┬────────┘                           └────────┬────────┘
         │                                              │
         │                                              ▼
         │                                    ┌─────────────────┐
         │                                    │  n8n Workflow   │
         │                                    │  + Slack 알림    │
         │                                    └────────┬────────┘
         │                                              │
         │                                              ▼
         │                                    ┌─────────────────┐
         │                                    │  Human Approval │
         │                                    └────────┬────────┘
         │                                              │
         ▼                                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PR 생성 / 머지                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. 유용한 오픈소스 프로젝트

| 프로젝트 | 설명 | 링크 |
|---------|------|------|
| claude-code-slack-bot | 슬랙 봇 + Claude Code SDK | [GitHub](https://github.com/mpociot/claude-code-slack-bot) |
| claude-mcp-slack | 슬랙 MCP 서버 | [GitHub](https://github.com/atlasfutures/claude-mcp-slack) |
| claude-notify | 멀티 OS 알림 도구 | [GitHub](https://github.com/jamez01/claude-notify) |
| claude-code-action | GitHub Actions 통합 | [GitHub](https://github.com/anthropics/claude-code-action) |
| claude-code-hooks-mastery | Hooks 활용 가이드 | [GitHub](https://github.com/disler/claude-code-hooks-mastery) |
| n8n-mcp | n8n + Claude MCP | [GitHub](https://github.com/czlonkowski/n8n-mcp) |
| claude-code-workflows | 워크플로우 모범 사례 | [GitHub](https://github.com/OneRedOak/claude-code-workflows) |
| awesome-claude-code | Claude Code 리소스 모음 | [GitHub](https://github.com/hesreallyhim/awesome-claude-code) |

---

## 6. 다음 단계 (To-Do)

### Phase 1: 기본 알림 시스템 구축
- [ ] Notification Hook 설정
- [ ] 슬랙 Incoming Webhook 연동
- [ ] 간단한 알림 테스트

### Phase 2: 양방향 통신 구현
- [ ] 슬랙 Interactive Message 설정
- [ ] 웹훅 서버 구축 (승인/거절 처리)
- [ ] Claude Code와 연동

### Phase 3: 완전 자동화
- [ ] GitHub Actions 통합
- [ ] n8n 워크플로우 설정
- [ ] 조건부 자동화 규칙 정의

---

## 참고 자료

### 공식 문서
- [Claude Code Docs - Hooks Reference](https://docs.claude.com/en/docs/claude-code/hooks)
- [Claude Code Docs - MCP Integration](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Claude Code Docs - Headless Mode](https://docs.claude.com/en/docs/claude-code/headless)
- [Claude Code GitHub Actions](https://code.claude.com/docs/en/github-actions)

### 블로그/아티클
- [Anthropic - Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Anthropic - Claude Code Plugins](https://www.anthropic.com/news/claude-code-plugins)
- [GitButler - Automate Your AI Workflows with Hooks](https://blog.gitbutler.com/automate-your-ai-workflows-with-claude-code-hooks)
- [Understanding Claude Code Full Stack](https://alexop.dev/posts/understanding-claude-code-full-stack/)

### 외부 가이드
- [Claude Code Headless Tutorial](https://adrianomelo.com/posts/claude-code-headless.html)
- [Claude Code Batch API Guide](https://smartscope.blog/en/generative-ai/claude/claude-code-batch-processing/)
- [CI/CD Integration Guide](https://developertoolkit.ai/en/claude-code/advanced-techniques/ci-cd-integration/)

---

*마지막 업데이트: 2025-12-12*
*리서치 진행: Phase 1 - 도구 현황 조사 완료*
