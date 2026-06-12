---
name: morning-briefing
description: 선택된 항목을 WebSearch로 수집해 오늘 날짜의 아침 브리핑 리포트를 생성한다. "브리핑", "아침 리포트", "morning briefing", "오늘 시황" 요청에 사용.
---

# morning-briefing 스킬

## 역할
briefing-researcher → briefing-writer 순서로 에이전트를 호출해 `reports/YYYY-MM-DD.html`를 생성한다.

## 실행 순서
1. `config/briefing-items.json` 존재 여부 확인
2. **briefing-researcher** 에이전트 호출 → 수집 JSON 반환
3. **briefing-writer** 에이전트 호출 → 리포트 파일 저장
4. **validator** 에이전트 호출 → 루브릭 점수 확인
5. B등급(70점) 이상이면 리포트 경로와 요약을 사용자에게 출력
6. C등급 이하면 수집 실패 항목을 재수집 후 재작성 (최대 1회 재시도)

## 사용법
```
/morning-briefing
```

## 출력
- 저장 경로: `reports/YYYY-MM-DD.html`
- 콘솔 출력: 각 항목 핵심 수치 요약 (5줄 이내)
- 검증 점수 및 등급

## 설정 변경
체크 항목 추가·제거: `config/briefing-items.json`의 `items` 배열 편집
