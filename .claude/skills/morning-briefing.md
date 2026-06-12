---
name: morning-briefing
description: 선택된 항목을 WebSearch로 수집해 오늘 날짜의 아침 브리핑 리포트를 생성한다. "브리핑", "아침 리포트", "morning briefing", "오늘 시황" 요청에 사용.
---

# morning-briefing 스킬

## 역할
briefing-researcher → briefing-writer 순서로 에이전트를 호출해 `reports/YYYY-MM-DD.html`를 생성한다.

## 실행 방법

Workflow 엔진을 통해 **진짜 루프 구조**로 실행한다.
스크립트 위치: `.claude/workflows/briefing-pipeline.js`

### 루프 구조
```
Pre-flight (구조 점검)
    └─▶ [루프 시작 — 최대 3회]
            briefing-researcher  (WebSearch → 캐시 저장)
                └─▶ briefing-writer  (플레이스홀더 치환 → HTML 저장)
                        └─▶ validator  (루브릭 A 채점)
                                ├─▶ B+(70점↑) → 루프 종료, 결과 출력
                                └─▶ C 이하    → 재시도 (최대 3회)
```

### 실행 지시
사용자가 브리핑을 요청하면 아래 Workflow를 실행한다:
- 스크립트: `.claude/workflows/briefing-pipeline.js`
- args: `{ "date": "YYYY-MM-DD" }` (오늘 날짜)
- 최대 3회 반복, B+(70점) 이상 달성 시 즉시 종료

## 사용법
대화창에 아래와 같이 입력합니다:
```
morning briefing 실행해줘
오늘 시황 브리핑 해줘
```

## 출력
- 저장 경로: `reports/YYYY-MM-DD.html`
- 콘솔 출력: 각 항목 핵심 수치 요약 (5줄 이내)
- 검증 점수 및 등급

## 설정 변경
체크 항목 추가·제거: `config/briefing-items.json`의 `items` 배열 편집
