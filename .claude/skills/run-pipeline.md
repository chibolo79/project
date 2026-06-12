---
name: run-pipeline
description: 전체 파이프라인을 순서대로 실행한다. "파이프라인 실행", "전체 돌려줘", "run pipeline" 요청에 사용.
---

# run-pipeline 스킬

## 역할
orchestrator 에이전트를 통해 정의된 단계를 순서대로 실행하고, 마지막에 validator로 검증한다.

## 실행 순서
1. `agents/orchestrator.md` 지시에 따라 각 단계를 수행한다.
2. 각 단계 완료 후 중간 결과를 간결히 보고한다.
3. 전체 완료 후 `/validate`를 자동 호출해 루브릭 점수를 확인한다.
4. 점수가 기준(70점 / B등급) 미달이면 원인을 분석하고 재실행 여부를 사용자에게 묻는다.

## 사용법
```
/run-pipeline
/run-pipeline [선택적 단계 이름]
```
