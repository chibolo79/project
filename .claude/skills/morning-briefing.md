---
name: morning-briefing
description: 선택된 항목을 WebSearch로 수집해 오늘 날짜의 아침 브리핑 리포트를 생성한다. "브리핑", "아침 리포트", "morning briefing", "오늘 시황" 요청에 사용.
---

# morning-briefing 스킬

## 역할
briefing-researcher → briefing-writer 순서로 에이전트를 호출해 `reports/YYYY-MM-DD.html`를 생성한다.

## 실행 순서

### 0단계 — 사전 구조 점검 (Pre-flight Check)
실행 전에 아래 항목을 순서대로 확인한다. 문제가 발견되면 **즉시 수정 후** 다음 단계로 진행한다.

| 점검 항목 | 확인 방법 | 자동 수정 가능 여부 |
|-----------|-----------|---------------------|
| 필수 파일 존재 | Glob으로 SOUL.md, CLAUDE.md, config/briefing-items.json, agents/4개, .claude/skills/3개 확인 | 없으면 사용자에게 알림 |
| briefing-items.json 항목 수 | 파일 읽어 `items` 배열 길이 = 10 확인 | 가능하면 수정 |
| 슬래시 커맨드 잔재 | skills/*.md, agents/*.md에서 `` `/커맨드` `` 패턴 검색 | 발견 시 대화체로 수정 |
| researcher 검색 횟수 규칙 | briefing-researcher.md에 "최대 6회" 언급 확인 | 누락 시 추가 |
| validator 루브릭 A/B 분기 | validator.md에 reports/*.html 분기 존재 확인 | 없으면 추가 |

#### 이슈 관리 절차 (문제 발견 시 반드시 수행)

1. **문제 발견** → `gh issue create`로 이슈 등록
   - 제목: 발견된 문제를 비개발자도 이해할 수 있는 말로 작성
   - 본문: 어떤 파일의 어떤 내용이 문제인지, 왜 문제인지 설명
   - 라벨: `bug` (구조 오류) 또는 `enhancement` (개선 필요)

2. **수정 완료** → `gh issue comment`로 댓글 추가
   - 무엇을 어떻게 고쳤는지 간단히 기록

3. **이슈 닫기** → `gh issue close`로 상태를 closed로 변경

문제가 없으면 이슈를 만들지 않는다.

점검 결과를 한 줄로 요약해 사용자에게 보고한다:
- 이상 없음: `✓ 구조 점검 통과 — 브리핑을 시작합니다`
- 수정 완료: `⚠ X건 수정 후 시작합니다: [수정 내용 요약]`
- 수정 불가: `✗ 수동 확인 필요: [문제 내용]` → 사용자 승인 후 진행

### 1단계 이후 — 브리핑 실행
1. `config/briefing-items.json` 존재 여부 확인
2. **briefing-researcher** 에이전트 호출 → 수집 JSON 반환
3. **briefing-writer** 에이전트 호출 → 리포트 파일 저장
4. **validator** 에이전트 호출 → 루브릭 점수 확인
5. B등급(70점) 이상이면 리포트 경로와 요약을 사용자에게 출력
6. C등급 이하면 수집 실패 항목을 재수집 후 재작성 (최대 1회 재시도)

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
