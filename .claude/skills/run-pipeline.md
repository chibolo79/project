---
name: run-pipeline
description: morning-briefing 파이프라인을 처음부터 강제 실행한다. "파이프라인 실행", "전체 돌려줘", "run pipeline" 요청에 사용.
---

# run-pipeline 스킬

## 역할
`morning-briefing` 스킬과 동일한 파이프라인을 실행한다.
기존 리포트 유무와 상관없이 항상 새로 수집·작성·검증한다.

## 실행 순서

### 0단계 — 사전 구조 점검
`morning-briefing` 스킬의 **0단계 Pre-flight Check**와 동일한 점검을 수행한다.
점검 통과 또는 수정 완료 후 아래 단계를 진행한다.

### 실행 방법
`morning-briefing` 스킬과 동일한 Workflow를 실행한다.
- 스크립트: `.claude/workflows/briefing-pipeline.js`
- args: `{ "date": "YYYY-MM-DD" }` (오늘 날짜)
- 최대 3회 루프, B+(70점) 이상 달성 시 종료

> **morning-briefing과의 차이**: 기능은 동일하다.
> "오늘 브리핑 실행해줘"나 "파이프라인 돌려줘" 어떻게 말해도 같은 결과를 얻는다.

## 사용법
대화창에 아래와 같이 입력합니다:
```
파이프라인 실행해줘
전체 돌려줘
```
