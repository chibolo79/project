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

### 1단계 이후 — 브리핑 실행
1. `config/briefing-items.json` 존재 여부 확인
2. **briefing-researcher** 에이전트 호출 → 수집 JSON 반환
3. **briefing-writer** 에이전트 호출 → 리포트 파일 저장
4. **validator** 에이전트 호출 → 루브릭 점수 확인
5. B등급(70점) 이상이면 리포트 경로와 요약을 사용자에게 출력
6. C등급 이하면 수집 실패 항목을 재수집 후 재작성 (최대 1회 재시도)

> **morning-briefing과의 차이**: 기능은 동일하다.
> "오늘 브리핑 실행해줘"나 "파이프라인 돌려줘" 어떻게 말해도 같은 결과를 얻는다.

## 사용법
대화창에 아래와 같이 입력합니다:
```
파이프라인 실행해줘
전체 돌려줘
```
