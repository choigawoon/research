# Research Repository

이 레포지토리는 기술 리서치 및 분석을 위한 공간입니다.

## 디렉토리 구조

```
research/
├── ai-tools/           # AI 도구 분석 및 비교 (Claude, Copilot, Gemini 등)
├── systems/            # 시스템 아키텍처 분석
├── poc/                # POC(Proof of Concept) 분석 및 설계
├── templates/          # 리서치 리포트 템플릿
├── archives/           # 완료된/아카이브된 리서치
└── CLAUDE.md           # 이 파일
```

## 리서치 유형별 가이드

### AI Tools 분석 (`ai-tools/`)
- AI 코딩 도구 비교 분석
- LLM 기반 서비스 분석
- Agent 아키텍처 분석
- 파일 네이밍: `{tool-name}_ANALYSIS.md` 또는 `{tool1}_vs_{tool2}_COMPARISON.md`

### Systems 분석 (`systems/`)
- 오픈소스 프로젝트 아키텍처 분석
- 기술 스택 분석
- 인프라/DevOps 분석
- 파일 네이밍: `{system-name}_ARCHITECTURE.md`

### POC 분석 (`poc/`)
- 개념 증명 시스템 설계
- 프로토타입 분석
- 기술 조합 검증
- 파일 네이밍: `{project-name}_POC.md`

## 리서치 진행 규칙

1. **리서치 시작 시**
   - 적절한 디렉토리에 새 파일 생성
   - 템플릿 활용 권장 (`templates/` 참조)

2. **리서치 내용 포함 사항**
   - 분석 일자 및 대상 버전/커밋
   - 명확한 목차 구성
   - 코드 예시 및 다이어그램(Mermaid 등)
   - 결론 및 권장사항

3. **파일 관리**
   - 완료된 리서치는 필요시 `archives/`로 이동
   - 관련 리서치는 같은 디렉토리에 배치

## 현재 진행 중인 리서치

### AI Tools
- [AI 에이전트 비교 분석](ai-tools/AI_AGENTS_COMPARISON_REPORT.md) - VSCode Copilot vs Gemini CLI

### POC
- [인터랙티브 콘텐츠 제작 서비스](poc/POC_SYSTEM_ANALYSIS_REPORT.md) - Claudable, claudecodeui, coolify 분석

## 명령어 참고

### Git 작업
```bash
# 새 리서치 브랜치 생성
git checkout -b research/{topic-name}

# 변경사항 커밋
git add .
git commit -m "Add {topic} research report"
```

### 리서치 진행 시 유용한 도구
- `tree` - 디렉토리 구조 확인
- `wc -l` - 파일 라인 수 확인
- `grep -r` - 키워드 검색

## 연락처

- Repository: choigawoon/research
- 관리자: 최가운
