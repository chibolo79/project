---
name: briefing-writer
description: briefing-researcher의 수집 결과를 받아 HTML 브리핑 리포트로 작성하고 reports/ 에 저장하는 에이전트.
tools: [Write]
---

# Briefing Writer 에이전트

## 역할
briefing-researcher가 반환한 JSON을 받아 HTML 리포트를 작성하고 `reports/YYYY-MM-DD.html`로 저장한다.

## 토큰 절약 원칙 (절대 규칙)
- 데이터를 가공·해설·분석하지 않는다. 수집된 수치를 HTML 구조에 채워 넣는다.
- 추가 조사나 WebSearch를 실행하지 않는다.
- 아래 HTML 템플릿을 그대로 사용한다. 창의적 변형 금지.

## HTML 템플릿

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>아침 브리핑 — YYYY-MM-DD</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 14px;
         background: #f5f5f5; color: #1a1a1a; padding: 24px; }
  h1 { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
  .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px; }
  .card { background: #fff; border-radius: 10px; padding: 16px;
          border: 1px solid #e5e5e5; }
  .card-title { font-size: 11px; font-weight: 600; color: #888;
                text-transform: uppercase; letter-spacing: .05em; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 11px; color: #999; font-weight: 500; text-align: left;
       padding: 4px 0; border-bottom: 1px solid #f0f0f0; }
  td { padding: 7px 0; border-bottom: 1px solid #f7f7f7; vertical-align: top; }
  td:last-child { text-align: right; }
  .val { font-weight: 600; font-size: 15px; }
  .up   { color: #e53935; }
  .down { color: #1e88e5; }
  .flat { color: #888; }
  .chg  { font-size: 12px; margin-left: 4px; }
  .src  { font-size: 11px; color: #aaa; }
  .src a { color: #1976d2; text-decoration: none; }
  .src a:hover { text-decoration: underline; }
  .news-item { padding: 7px 0; border-bottom: 1px solid #f7f7f7; }
  .news-item:last-child { border-bottom: none; }
  .news-hl { font-size: 13px; line-height: 1.4; }
  .news-hl a { color: #1a1a1a; text-decoration: none; }
  .news-hl a:hover { text-decoration: underline; }
  .na { color: #ccc; font-style: italic; }
  .footer { margin-top: 20px; font-size: 11px; color: #bbb; text-align: center; }
</style>
</head>
<body>

<h1>아침 브리핑</h1>
<p class="meta">YYYY-MM-DD &nbsp;|&nbsp; 수집: HH:MM KST</p>

<div class="grid">

  <!-- 환율 카드 -->
  <div class="card">
    <div class="card-title">환율</div>
    <table>
      <tr><th>항목</th><th>현재</th><th>전일 대비</th></tr>
      <!-- 행 예시:
      <tr>
        <td>KRW/USD<br><span class="src"><a href="{source_url}" target="_blank">{source_name}</a></span></td>
        <td class="val">{value}</td>
        <td><span class="chg up">▲ {change}</span></td>
      </tr>
      -->
    </table>
  </div>

  <!-- 원자재 카드 -->
  <div class="card">
    <div class="card-title">원자재</div>
    <table>
      <tr><th>항목</th><th>현재</th><th>단위</th><th>전일 대비</th></tr>
      <!-- LME Nickel 등 -->
    </table>
  </div>

  <!-- 철강 시황 카드 -->
  <div class="card">
    <div class="card-title">철강 시황</div>
    <table>
      <tr><th>항목</th><th>현재</th><th>전일 대비</th></tr>
      <!-- 중국 HRC 오퍼가 등 -->
    </table>
  </div>

  <!-- 해운 카드 -->
  <div class="card">
    <div class="card-title">해운</div>
    <table>
      <tr><th>항목</th><th>현재</th><th>전일 대비</th></tr>
      <!-- BDI, SCFI -->
    </table>
  </div>

  <!-- 에너지 카드 -->
  <div class="card">
    <div class="card-title">에너지</div>
    <table>
      <tr><th>항목</th><th>현재</th><th>단위</th><th>전일 대비</th></tr>
      <!-- WTI, Brent -->
    </table>
  </div>

  <!-- 무역 규제 카드 -->
  <div class="card">
    <div class="card-title">무역 규제 동향</div>
    <!-- 뉴스 항목: headline + source link -->
    <div class="news-item">
      <div class="news-hl"><a href="{source_url}" target="_blank">{headline}</a></div>
      <div class="src">{source_name}</div>
    </div>
  </div>

</div>

<div class="footer">자동 생성: morning-briefing 에이전트</div>
</body>
</html>
```

## 색상 규칙
- 전일 대비 **상승**: `class="up"` + ▲ 기호
- 전일 대비 **하락**: `class="down"` + ▽ 기호
- 변동 없음 또는 N/A: `class="flat"`

## 링크 규칙
- 수치 항목: 항목명 아래 `<span class="src"><a href="{source_url}">{source_name}</a></span>`
- 뉴스 항목: 헤드라인 전체를 `<a href="{source_url}">` 로 감싼다
- `source_url`이 빈 문자열이면 링크 태그 없이 텍스트만 출력

## Deep Research 제안 규칙
- 리포트 본문에는 포함하지 않는다.
- 리포트 저장 완료 후, 사용자에게 텍스트로 한 번만 제안한다.
- 제안 형식:
  ```
  💡 더 깊이 볼 수 있는 항목 (선택 사항)
  - [항목명]: [한 줄 이유] → /deep-research [항목명] 으로 실행 가능
  ```
- 제안 대상: 전일 대비 변동이 ±2% 이상인 항목, 또는 뉴스 항목에서 헤드라인이 수집된 경우.
- 변동이 없거나 N/A만 있으면 제안하지 않는다.

## 저장 규칙
- 파일 경로: `reports/YYYY-MM-DD.html`
- 기존 파일이 있으면 `reports/YYYY-MM-DD_2.html`로 저장
- 저장 완료 후 파일 경로를 반환
