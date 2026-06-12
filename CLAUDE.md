# Project Harness

## 개요
이 프로젝트는 스킬 · 에이전트 · 검증 루브릭으로 구성된 Claude Code 하네스입니다.

## 디렉터리 구조
```
.claude/skills/     — 에이전트 동작 지시 문서 (대화로 호출)
agents/             — 전문화된 서브에이전트 정의
config/             — 항목 설정 파일 (briefing-items.json 등)
reports/            — 생성된 브리핑 리포트 저장
SOUL.md             — 모든 에이전트가 따르는 공통 원칙
```

## 스킬 목록
| 대화 입력 예시 | 역할 |
|---------------|------|
| `morning briefing 실행해줘` | 선택 항목 수집 → 브리핑 리포트 생성 |
| `파이프라인 실행해줘` | 전체 파이프라인 순서대로 실행 |
| `오늘 리포트 검증해줘` | 루브릭 기준 산출물 검증 및 등급 판정 |

## 에이전트 목록
| 에이전트 | 역할 |
|----------|------|
| orchestrator | 단계 조율, 서브에이전트 위임 |
| briefing-researcher | WebSearch로 시황 데이터 수집 |
| briefing-writer | 수집 데이터 → HTML 리포트 작성 |
| validator | 루브릭 평가 및 등급 판정 |

## 작업 흐름
```
/morning-briefing
    └─▶ briefing-researcher  (WebSearch 수집)
            └─▶ briefing-writer   (reports/YYYY-MM-DD.html 저장)
                    └─▶ validator  (루브릭 검증 → 등급 반환)
```

## 하네스 원칙
- SOUL.md의 원칙을 모든 에이전트가 우선 준수한다.
- 각 단계 완료 시 validator를 통해 루브릭 점수를 확인한다.
- 루브릭 기준 미달(C 이하) 시 orchestrator가 재시도를 지시한다.
