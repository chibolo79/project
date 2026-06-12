# Project Harness

## 개요
이 프로젝트는 스킬 · 에이전트 · 검증 루브릭으로 구성된 Claude Code 하네스입니다.

## 디렉터리 구조
```
.claude/skills/       — 에이전트 동작 지시 문서 (대화로 호출)
.claude/templates/    — 재사용 HTML 템플릿 (플레이스홀더 방식)
agents/               — 전문화된 서브에이전트 정의
config/               — 항목 설정 파일 (briefing-items.json 등)
reports/              — 생성된 브리핑 리포트 및 수집 캐시
SOUL.md               — 모든 에이전트가 따르는 공통 원칙
```

## 스킬 목록
| 대화 입력 예시 | 역할 |
|---------------|------|
| `morning briefing 실행해줘` | 선택 항목 수집 → 브리핑 리포트 생성 |
| `파이프라인 실행해줘` | 전체 파이프라인 순서대로 실행 |
| `오늘 리포트 검증해줘` | 루브릭 기준 산출물 검증 및 등급 판정 |
| `점검해줘` / `이슈 찾아서 고쳐줘` | 프로젝트 구조 점검 → GitHub 이슈 등록 → 수정 → close |

## 에이전트 목록
| 에이전트 | 역할 |
|----------|------|
| orchestrator | 단계 조율, 서브에이전트 위임 |
| briefing-researcher | WebSearch로 시황 데이터 수집 후 캐시 저장 |
| briefing-writer | 캐시 → 플레이스홀더 치환 → HTML 리포트 저장 |
| validator | 루브릭 평가 및 등급 판정 |
| issue-fixer | 프로젝트 점검 → GitHub 이슈 등록·댓글·수정·close |

## 작업 흐름
```
morning-briefing / run-pipeline
    └─▶ briefing-researcher  (WebSearch → reports/.research-cache.json)
            └─▶ briefing-writer   (캐시 읽기 → 플레이스홀더 치환 → reports/YYYY-MM-DD.html)
                    └─▶ validator  (루브릭 검증 → 등급 반환, 메인 루프 직접 실행)

issue-driven-fix
    └─▶ issue-fixer  (점검 → gh issue create → 댓글 → 수정 → gh issue close)
```

## 하네스 원칙
- SOUL.md의 원칙을 모든 에이전트가 우선 준수한다.
- 각 단계 완료 시 validator를 통해 루브릭 점수를 확인한다.
- 루브릭 기준 미달(C 이하) 시 orchestrator가 재시도를 지시한다.

## 작업 절차 규칙 (이슈 선행 원칙)

**모든 작업은 GitHub 이슈 등록으로 시작한다.**

버그 수정이든 신규 기능이든 개선이든, 코드·파일을 수정하기 전에 반드시 이슈를 먼저 만든다.

```
1. gh issue create  — 왜 필요한지, 무엇을 할 것인지 기록
2. 작업 실행        — 파일 수정, 기능 구현
3. gh issue comment — 무엇을 어떻게 했는지 기록
4. gh issue close   — 완료 처리
5. git commit & push
```

| 작업 유형 | 라벨 |
|-----------|------|
| 오류·버그 수정 | `bug` |
| 신규 기능 추가 | `enhancement` |
| 성능·구조 개선 | `enhancement` |

이슈 없이 커밋하지 않는다.
