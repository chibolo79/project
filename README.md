# Steel Export Morning Briefing Harness

철강 수출 영업 매니저를 위한 Claude Code 하네스입니다.
매일 아침 10개 시황 항목을 자동 수집해 HTML 브리핑 리포트를 생성합니다.

## 구조

```
.claude/
├── settings.json          # 권한·훅 설정
├── launch.json            # 리포트 프리뷰 서버
└── skills/
    ├── morning-briefing.md  # /morning-briefing 스킬
    ├── run-pipeline.md      # /run-pipeline 스킬
    └── validate.md          # /validate 스킬 (루브릭 포함)

agents/
├── orchestrator.md         # 파이프라인 조율
├── briefing-researcher.md  # WebSearch 수집 (5회 제한)
├── briefing-writer.md      # HTML 리포트 작성
└── validator.md            # 루브릭 검증 (S~D 등급)

config/
└── briefing-items.json     # 수집 항목 설정 (편집 가능)

reports/
└── YYYY-MM-DD.html         # 생성된 브리핑 리포트

CLAUDE.md                   # 하네스 진입점
SOUL.md                     # 에이전트 공통 원칙
```

## 수집 항목 (10개)

| 카테고리 | 항목 |
|----------|------|
| 환율 | KRW/USD · EUR/USD · CNY/USD |
| 원자재 | LME Nickel |
| 철강 시황 | 중국 HRC 수출 오퍼 |
| 해운 | BDI · SCFI |
| 에너지 | WTI · Brent |
| 무역 규제 | 반덤핑(AD)/세이프가드 · 중국 수출세/환급세율 |

## 사용법

Claude Code에서 대화로 실행:
```
morning briefing 실행해줘
```

항목 추가·제거:
```
config/briefing-items.json
```

## 리포트 규칙

- WebSearch **5회 이내**로 10개 항목 수집 (토큰 절약)
- 출력: `reports/YYYY-MM-DD.html` (카드 그리드, 출처 링크 포함)
- 상승 ▲ 빨강 / 하락 ▽ 파랑 색상 표시
- 심층 분석(deep research)은 리포트 생성 후 별도 제안만

## 검증

모든 산출물은 `validator` 에이전트가 루브릭(100점)으로 검증합니다.
B등급(70점) 이상이면 완료, C등급 이하면 재시도합니다.
