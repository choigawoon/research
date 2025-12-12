# 기존 Human-in-the-Loop 솔루션 리서치

> 직접 만들지 않고 쓸 수 있는 상용 솔루션 및 인기 오픈소스 프로젝트

---

## TL;DR - 추천 솔루션

| 용도 | 추천 솔루션 | 특징 |
|-----|-----------|------|
| **빠른 구축 (SaaS)** | gotoHuman | 슬랙 연동, 무료 플랜 있음 |
| **기업용 (SaaS)** | Approveit | SOC2 인증, 엔터프라이즈 |
| **오픈소스 (코딩 가능)** | HumanLayer | 슬랙/이메일/디스코드, Apache 2 |
| **워크플로우 빌더** | n8n (100k stars) | Human Approval 노드 내장 |
| **Agent 프레임워크** | LangGraph (20k stars) | `interrupt()` 함수 제공 |

---

## 1. SaaS 솔루션 (유료)

### 1.1 gotoHuman
> AI 에이전트 human-in-the-loop 전문 플랫폼

**링크:** https://www.gotohuman.com/

**핵심 기능:**
- API-first 설계 (REST API, Python/TypeScript SDK)
- 슬랙/Teams 알림 → Agent Inbox에서 승인
- 커스터마이징 가능한 승인 UI
- Webhook 기반 워크플로우 재개
- n8n, Dify 등 통합 지원

**보안:**
- GDPR, CCPA/CPRA 준수
- SOC 3, ISO 27001 인증 서버
- 유럽 서버에 데이터 저장

**가격:** 무료 플랜 있음 (상세 가격은 문의)

**Dify 연동:** `goto_human` 플러그인으로 Dify Marketplace에서 사용 가능

---

### 1.2 Approveit
> 엔터프라이즈급 워크플로우 승인 플랫폼

**링크:** https://approveit.today/

**핵심 기능:**
- 슬랙, Teams, 이메일, Webhook, API 트리거
- 분기 로직, SLA, 에스컬레이션, 위임
- AI 모델 → 결정 제안 → 사람 검토 → 승인
- SDK로 자체 제품에 내장 가능

**주요 수치:**
- 효율성 120% 향상
- 처리 비용 50% 절감
- SOC 2 Type I 인증 완료

**가격:** 기업별 맞춤 (IT, Finance, HR, Ops)

**대상:** 중견/대기업

---

### 1.3 엔터프라이즈 AI 코딩 플랫폼

| 플랫폼 | Human Approval | 특징 |
|-------|---------------|------|
| **GitHub Agent HQ** | RBAC, 정책 설정, 감사 로그 | 에이전트 거버넌스 컨트롤 플레인 |
| **Qodo** | 코딩 표준/규정 준수 자동 검사 | 15+ agentic 워크플로우 |
| **Tabnine** | 엔터프라이즈 보안 정책 적용 | 온프레미스/에어갭 지원 |
| **Factory** | 엔터프라이즈 보안, 확장성 | Droids로 코딩/테스트/배포 자동화 |

---

## 2. 오픈소스 솔루션

### 2.1 HumanLayer (Apache 2)
> AI 에이전트 human-in-the-loop SDK

**GitHub:** https://github.com/humanlayer/humanlayer

**핵심 기능:**
- **멀티채널:** 슬랙, 이메일, 디스코드
- **데코레이터:** `@require_approval`, `human_as_tool`
- **Framework Agnostic:** LangChain, CrewAI, LlamaIndex, OpenAI, Claude 등 지원
- **Python/TypeScript SDK**

**사용 예시:**
```python
import humanlayer
hl = humanlayer.HumanLayer()

@hl.require_approval()
def send_email(to: str, subject: str, body: str):
    # 이 함수 실행 전 슬랙에서 승인 요청
    pass
```

**추가 프로젝트:**
- **AgentControlPlane (ACP):** 분산 에이전트 스케줄러, MCP 지원
  - https://github.com/humanlayer/agentcontrolplane

---

### 2.2 n8n (100k+ GitHub Stars)
> AI-Native 워크플로우 자동화 플랫폼

**GitHub:** https://github.com/n8n-io/n8n (100k+ stars)

**핵심 기능:**
- **AI Agent 노드:** LangChain 기반
- **Human-in-the-loop:** 승인 대기 노드
- **400+ 통합:** 슬랙, GitHub, Jira 등
- **셀프호스팅 가능**

**Human Approval 패턴:**
```
[AI Agent] → [Slack 알림] → [Wait for Webhook] → [승인 시 계속]
```

**MCP 연동:**
- https://github.com/czlonkowski/n8n-mcp
- https://github.com/czlonkowski/n8n-skills

---

### 2.3 LangGraph (20k GitHub Stars)
> LangChain 에이전트 오케스트레이션 프레임워크

**GitHub:** https://github.com/langchain-ai/langgraph (19.8k stars)

**핵심 기능:**
- **`interrupt()` 함수:** 워크플로우 일시정지
- **Checkpointer:** 상태 저장 후 재개
- **`Command(resume=...)`:** 승인 후 재개

**사용 예시:**
```python
from langgraph.prebuilt import interrupt

def human_approval_node(state):
    # 사용자에게 승인 요청
    response = interrupt({
        "question": "이 작업을 승인하시겠습니까?",
        "action": state["proposed_action"]
    })
    if response["approved"]:
        return {"approved": True}
    return {"approved": False}
```

**패턴:**
- Approval: 액션 전 승인 요청
- Editing: 에이전트 상태 수정 허용
- Input: 명시적 사용자 입력 수집

---

### 2.4 CrewAI
> 멀티에이전트 프레임워크

**문서:** https://docs.crewai.com/en/learn/human-in-the-loop

**HITL 기능:**
- Webhook 알림 → "Pending Human Input" 상태
- `human_feedback`, `is_approve` 파라미터로 재개
- HumanLayer 통합 지원

**제한사항:**
- 웹훅 설정은 resume 요청에 명시적 포함 필요

---

### 2.5 Temporal.io (12k GitHub Stars)
> 내구성 있는 워크플로우 오케스트레이션

**링크:** https://temporal.io/

**핵심 기능:**
- **Signal:** 외부에서 워크플로우에 이벤트 주입
- **무한 대기:** 서버 재시작해도 상태 유지
- **MCP 통합:** 장기 실행 도구

**사용 예시:**
```python
@workflow.run
async def approval_workflow(self):
    # 분석 실행
    await self.analyze()

    # 승인 대기 (최대 5일)
    await workflow.wait_condition(
        lambda: self.approved or self.rejected,
        timeout=timedelta(days=5)
    )

    if self.approved:
        await self.execute()
```

**장점:**
- 워커 재시작/배포해도 sleep 유지
- 수 주간 대기 가능
- 리소스 소비 최소화

---

### 2.6 Inngest (12k GitHub Stars)
> 서버리스 워크플로우 오케스트레이션

**GitHub:** https://github.com/inngest/inngest

**핵심 기능:**
- **`waitForEvent()`:** 인간 피드백 대기
- **`step.ai.infer()`:** LLM 추론 오프로드
- **AgentKit:** 멀티에이전트 시스템

**서버리스 이점:**
- Vercel 등에 배포 용이
- 인프라 관리 불필요
- 자동 재시도/동시성 처리

---

## 3. 모니터링/옵저버빌리티

### 3.1 AgentOps
> AI 에이전트 모니터링 플랫폼

**GitHub:** https://github.com/AgentOps-AI/agentops

**핵심 기능:**
- 2줄 코드로 통합
- 세션 리플레이, 메트릭, 실시간 모니터링
- 비용 추적, 실패 감지
- **HITL 승인 워크플로우** 지원

**4가지 핵심 요소:**
1. Configuration-as-Code
2. Deep Observability
3. Governance Controls (RBAC, HITL)
4. Continuous Evaluation

**통합:** CrewAI, OpenAI, LangChain 등 400+ 지원

---

### 3.2 기타 옵저버빌리티 도구

| 도구 | 오버헤드 | 특징 |
|-----|---------|------|
| Langfuse | 15% | 오픈소스, 트레이싱 |
| LangSmith | - | LangChain 네이티브 |
| Arize | - | ML 모니터링 |

---

## 4. 클라우드 플랫폼 내장 기능

### 4.1 Azure Logic Apps - Agent Loop
> Microsoft 공식 AI 에이전트 워크플로우

**특징:**
- 관리자 승인, 명확화 요청 시 일시정지
- Logic Apps의 human workflow 기능 활용
- AI와 인간의 협업 지원

---

### 4.2 AWS - Agents for Amazon Bedrock
> AWS 관리형 에이전트 서비스

**특징:**
- Action groups, Knowledge bases
- Memory, Guardrails
- Claude computer-use 도구 지원

---

### 4.3 Google - Vertex AI Agent Builder
> Google Cloud AI 에이전트 플랫폼

**특징:**
- End-to-end 멀티에이전트
- Gemini Enterprise 통합

---

## 5. 기타 유용한 프로젝트

| 프로젝트 | 설명 | GitHub |
|---------|------|--------|
| **mahilo** | 멀티에이전트 HITL 프레임워크 | [wjayesh/mahilo](https://github.com/wjayesh/mahilo) |
| **GoHumanLoop** | Python HITL 라이브러리, LangGraph/CrewAI 지원 | [ptonlix/gohumanloop](https://github.com/ptonlix/gohumanloop) |
| **Agent Loop** | CLI AI 에이전트, --safe 모드 | [AlessandroAnnini/agent-loop](https://github.com/AlessandroAnnini/agent-loop) |
| **Cloudflare Agents** | Cloudflare 기반 HITL 예제 | [cloudflare/agents](https://github.com/cloudflare/agents) |
| **Dify goto_human** | Dify용 HITL 플러그인 | [Marketplace](https://marketplace.dify.ai/plugins/yevanchen/goto_human) |

---

## 6. 선택 가이드

### 시나리오별 추천

```
Q: 코딩 없이 빠르게 만들고 싶다
→ gotoHuman (무료 플랜) 또는 n8n

Q: 우리 팀은 Python/TypeScript 쓴다
→ HumanLayer (오픈소스, 무료)

Q: 이미 LangChain 쓰고 있다
→ LangGraph interrupt() 함수

Q: 엔터프라이즈 보안/컴플라이언스 필요
→ Approveit 또는 Temporal.io

Q: 서버리스로 배포하고 싶다
→ Inngest

Q: 모니터링도 같이 하고 싶다
→ AgentOps
```

### 구현 난이도별

| 난이도 | 솔루션 | 예상 시간 |
|-------|-------|---------|
| 쉬움 | gotoHuman, n8n | 1일 |
| 보통 | HumanLayer, LangGraph | 1주 |
| 어려움 | Temporal.io, 직접 구현 | 2주+ |

---

## 7. 결론

**당장 쓸 수 있는 솔루션:**
1. **gotoHuman** - 가장 빠른 시작, 슬랙 연동 쉬움
2. **n8n** - 노코드로 워크플로우 구축, 100k stars 검증
3. **HumanLayer** - 오픈소스, 코드로 완전 제어

**Claude Code 통합 추천 경로:**
```
Claude Code Hooks (Notification)
       ↓
HumanLayer SDK (또는 gotoHuman API)
       ↓
Slack/Discord/Email 알림
       ↓
승인/거절 응답
       ↓
Claude Code 재개
```

---

## 참고 링크

- [gotoHuman](https://www.gotohuman.com/)
- [Approveit](https://approveit.today/)
- [HumanLayer GitHub](https://github.com/humanlayer/humanlayer)
- [n8n GitHub](https://github.com/n8n-io/n8n)
- [LangGraph Docs](https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/)
- [Temporal.io](https://temporal.io/)
- [Inngest](https://www.inngest.com/)
- [AgentOps](https://www.agentops.ai/)
- [Permit.io HITL Guide](https://www.permit.io/blog/human-in-the-loop-for-ai-agents-best-practices-frameworks-use-cases-and-demo)

---

*마지막 업데이트: 2025-12-12*
*리서치 Phase 2: 기존 솔루션 조사 완료*
