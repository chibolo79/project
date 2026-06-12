export const meta = {
  name: 'briefing-pipeline',
  description: '브리핑 수집→작성→검증. 병렬 수집 + 당일 캐시 재사용. B+(70점) 이상 나올 때까지 최대 3회 반복.',
  phases: [
    { title: 'CacheCheck', detail: '당일 캐시 유무 확인' },
    { title: 'Collect', detail: '3개 에이전트 병렬 WebFetch 수집' },
    { title: 'Write', detail: '템플릿 플레이스홀더 치환' },
    { title: 'Validate', detail: 'validator 루브릭 A 채점' },
  ],
}

const date = args && args.date ? args.date : '2026-06-12'
const MAX_RETRIES = 3

// ── 헬퍼 ──
function cls(pct) {
  if (pct > 0) return 'up'
  if (pct < 0) return 'down'
  return 'flat'
}
function chg(item) {
  const c = cls(item.change_pct || 0)
  const raw = item.change || ''
  if (c === 'up') return `▲ ${raw || item.change_pct + '%'}`
  if (c === 'down') return `▽ ${raw || item.change_pct + '%'}`
  return `— ${raw || 'N/A'}`
}
function bar(pct) {
  return Math.min(Math.abs(pct || 0) * 3, 60).toFixed(0)
}
function badge(src) {
  const officials = ['KOTRA', 'KITA', '무역협회', 'K-sure', '한국무역보험공사', '관세청']
  return officials.some(o => (src || '').includes(o))
    ? '<span class="official-badge">공식</span>'
    : ''
}
function failNote(item) {
  return item.fail_reason
    ? `<div class="fail-reason">${item.fail_reason}</div>`
    : ''
}
function val(item) {
  return (item.value === 'N/A' || !item.value) ? '⚠ 수집 실패' : item.value
}

// ── 병렬 수집용 스키마 ──
const ITEM_SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id:          { type: 'string' },
          category:    { type: 'string' },
          label:       { type: 'string' },
          value:       { type: 'string' },
          unit:        { type: 'string' },
          change:      { type: 'string' },
          change_pct:  { type: 'number' },
          trend:       { type: 'string' },
          history:     { type: 'array', items: { type: 'number' } },
          headline:    { type: 'string' },
          source_name: { type: 'string' },
          source_url:  { type: 'string' },
          fail_reason: { type: 'string' },
        },
        required: ['id', 'value', 'source_url'],
      },
    },
  },
  required: ['results'],
}

// ══════════════════════════════════════════
// 0단계: 당일 캐시 확인
// ══════════════════════════════════════════
phase('CacheCheck')
const cacheCheck = await agent(
  `reports/.research-cache.json 파일을 Read 툴로 읽어보세요. ` +
  `파일이 존재하고 collected_at 필드가 "${date}"로 시작하면 {"status":"HIT"}를, ` +
  `파일이 없거나 날짜가 다르면 {"status":"MISS"}를 반환하세요.`,
  {
    label: 'cache-check',
    schema: {
      type: 'object',
      properties: { status: { type: 'string', enum: ['HIT', 'MISS'] } },
      required: ['status'],
    },
  }
)

const useCache = cacheCheck && cacheCheck.status === 'HIT'

// ══════════════════════════════════════════
// 1단계: Collect (캐시 미스 시에만, 1회만 실행)
// ══════════════════════════════════════════
if (!useCache) {
  phase('Collect')
  log('3개 에이전트 병렬 수집 시작')

  const [groupA, groupB, groupC] = await parallel([
    // A: 환율 3종
    () => agent(
      `아래 3개 항목을 WebFetch로 각각 직접 수집해 results 배열로 반환하세요.\n\n` +
      `1. id="fx_krw_usd", label="KRW / USD", category="환율", unit="KRW per 1 USD"\n` +
      `   URL: https://www.investing.com/currencies/usd-krw\n` +
      `2. id="fx_eur_usd", label="EUR / USD", category="환율", unit="USD per 1 EUR"\n` +
      `   URL: https://www.investing.com/currencies/eur-usd\n` +
      `3. id="fx_cny_usd", label="CNY / USD", category="환율", unit="CNY per 1 USD"\n` +
      `   URL: https://www.investing.com/currencies/usd-cny\n\n` +
      `각 페이지에서 현재가(value), 전일대비(change, change_pct 숫자만), trend 1줄을 추출.\n` +
      `source_name="Investing.com", source_url=해당 URL. headline="".\n` +
      `수집 실패 시 value="N/A", fail_reason에 이유 기재.`,
      { label: 'collect-A-fx', phase: 'Collect', schema: ITEM_SCHEMA }
    ),

    // B: 원자재 + 철강
    () => agent(
      `아래 2개 항목을 WebFetch로 각각 직접 수집해 results 배열로 반환하세요.\n\n` +
      `1. id="lme_nickel", label="LME Nickel", category="원자재", unit="USD/tonne"\n` +
      `   URL: https://www.investing.com/commodities/nickel\n` +
      `2. id="china_hrc_offer", label="중국 HRC 수출 오퍼", category="철강시황", unit="USD/tonne FOB"\n` +
      `   URL: https://www.steelhome.cn/en/ (실패 시 https://www.mysteel.net/en/ 재시도)\n\n` +
      `각 페이지에서 현재가(value), 전일대비(change, change_pct 숫자만), trend 1줄을 추출.\n` +
      `lme_nickel source_name="Investing.com", china_hrc_offer source_name="SteelHome". headline="".\n` +
      `수집 실패 시 value="N/A", fail_reason에 이유 기재.`,
      { label: 'collect-B-steel', phase: 'Collect', schema: ITEM_SCHEMA }
    ),

    // C: 해운 + 에너지 + 무역규제
    () => agent(
      `아래 5개 항목을 수집해 results 배열로 반환하세요.\n\n` +
      `[WebFetch 직접 수집]\n` +
      `1. id="bdi", label="BDI", category="해운", unit="index points"\n` +
      `   URL: https://tradingeconomics.com/commodity/baltic\n` +
      `2. id="scfi", label="SCFI", category="해운", unit="index points"\n` +
      `   URL: https://en.sse.net.cn/indices/scfinew.jsp\n` +
      `3. id="crude_oil", label="WTI / Brent", category="에너지", unit="USD/barrel"\n` +
      `   URL: https://www.investing.com/commodities/crude-oil\n\n` +
      `[WebSearch 수집]\n` +
      `4. id="ad_safeguard", label="반덤핑/세이프가드 동향", category="무역규제"\n` +
      `   검색어: site:kotra.or.kr OR site:kita.net 철강 반덤핑 수출규제 2026\n` +
      `   value="", headline=헤드라인 1줄, trend=맥락 1줄\n` +
      `5. id="china_export_tax", label="중국 수출세/환급세율", category="무역규제"\n` +
      `   검색어: China steel export tax rebate 2026\n` +
      `   value="", headline=헤드라인 1줄, trend=맥락 1줄\n\n` +
      `WebFetch 항목: source_url=해당 URL, trend 1줄, headline=""\n` +
      `수집 실패 시 value="N/A", fail_reason에 이유 기재.`,
      { label: 'collect-C-shipping-trade', phase: 'Collect', schema: ITEM_SCHEMA }
    ),
  ])

  // 결과 병합
  const allResults = [
    ...((groupA && groupA.results) || []),
    ...((groupB && groupB.results) || []),
    ...((groupC && groupC.results) || []),
  ]

  const cacheData = {
    collected_at: `${date} 수집완료 KST`,
    search_count: 9,
    results: allResults,
  }

  await agent(
    `아래 JSON을 reports/.research-cache.json에 Write 툴로 저장하고 "저장 완료"만 반환하세요.\n\n${JSON.stringify(cacheData, null, 2)}`,
    { label: 'save-cache', phase: 'Collect' }
  )

  log(`병렬 수집 완료 — ${allResults.length}개 항목`)
} else {
  log(`당일 캐시 HIT — Collect 생략`)
}

// ══════════════════════════════════════════
// 2~3단계: Write → Validate 루프 (최대 3회)
// ══════════════════════════════════════════
let attempt = 0
let grade = 0
let reportPath = ''
let validationResult = ''

while (attempt < MAX_RETRIES && grade < 70) {
  attempt++
  log(`작성 시도 ${attempt}/${MAX_RETRIES}`)

  // Write
  phase('Write')
  const readCacheAndTemplate = await agent(
    `두 파일을 읽고 내용을 JSON으로 반환하세요.\n1. reports/.research-cache.json\n2. .claude/templates/briefing.html\n반환 형식: {"cache": <파일 내용 문자열>, "template": <파일 내용 문자열>}`,
    {
      label: `read-files-${attempt}`,
      schema: {
        type: 'object',
        properties: {
          cache:    { type: 'string' },
          template: { type: 'string' },
        },
        required: ['cache', 'template'],
      },
    }
  )

  if (!readCacheAndTemplate) {
    log('파일 읽기 실패 — 재시도')
    grade = 0
    continue
  }

  const cache = JSON.parse(readCacheAndTemplate.cache)
  let html = readCacheAndTemplate.template

  const r = {}
  for (const item of cache.results) {
    r[item.id] = item
  }

  // 공통 치환
  const timePart = (cache.collected_at || `${date} 00:00 KST`).replace(`${date} `, '')
  html = html
    .replace(/\{\{DATE\}\}/g, date)
    .replace(/\{\{COLLECTED_AT\}\}/g, timePart)
    .replace(/\{\{SEARCH_COUNT\}\}/g, String(cache.search_count || 9))

  // 항목별 치환
  const map = [
    ['KRW', 'fx_krw_usd'],
    ['EUR', 'fx_eur_usd'],
    ['CNY', 'fx_cny_usd'],
    ['NI',  'lme_nickel'],
    ['HRC', 'china_hrc_offer'],
    ['BDI', 'bdi'],
    ['SCFI','scfi'],
  ]
  for (const [prefix, id] of map) {
    const item = r[id] || {}
    html = html
      .replace(new RegExp(`\\{\\{${prefix}_VAL\\}\\}`, 'g'), val(item))
      .replace(new RegExp(`\\{\\{${prefix}_CLS\\}\\}`, 'g'), cls(item.change_pct))
      .replace(new RegExp(`\\{\\{${prefix}_CHG\\}\\}`, 'g'), chg(item))
      .replace(new RegExp(`\\{\\{${prefix}_BAR\\}\\}`, 'g'), bar(item.change_pct))
      .replace(new RegExp(`\\{\\{${prefix}_URL\\}\\}`, 'g'), item.source_url || '#')
      .replace(new RegExp(`\\{\\{${prefix}_SRC\\}\\}`, 'g'), item.source_name || '')
      .replace(new RegExp(`\\{\\{${prefix}_TREND\\}\\}`, 'g'), item.trend || '동향 정보 없음')
  }

  html = html.replace(/\{\{HRC_FAIL\}\}/g, failNote(r['china_hrc_offer'] || {}))

  const oil = r['crude_oil'] || {}
  html = html
    .replace(/\{\{WTI_VAL\}\}/g, val(oil))
    .replace(/\{\{WTI_CLS\}\}/g, cls(oil.change_pct))
    .replace(/\{\{WTI_CHG\}\}/g, chg(oil))
    .replace(/\{\{OIL_VAL\}\}/g, val(oil))
    .replace(/\{\{OIL_CHG\}\}/g, chg(oil))
    .replace(/\{\{OIL_BAR\}\}/g, bar(oil.change_pct))
    .replace(/\{\{OIL_URL\}\}/g, oil.source_url || '#')
    .replace(/\{\{OIL_SRC\}\}/g, oil.source_name || '')
    .replace(/\{\{OIL_TREND\}\}/g, oil.trend || '동향 정보 없음')

  const ad = r['ad_safeguard'] || {}
  html = html
    .replace(/\{\{AD_HL\}\}/g, ad.headline || '정보 없음')
    .replace(/\{\{AD_TREND\}\}/g, ad.trend || '')
    .replace(/\{\{AD_URL\}\}/g, ad.source_url || '#')
    .replace(/\{\{AD_SRC\}\}/g, ad.source_name || '')
    .replace(/\{\{AD_BADGE\}\}/g, badge(ad.source_name))

  const tax = r['china_export_tax'] || {}
  html = html
    .replace(/\{\{TAX_HL\}\}/g, tax.headline || '정보 없음')
    .replace(/\{\{TAX_TREND\}\}/g, tax.trend || '')
    .replace(/\{\{TAX_URL\}\}/g, tax.source_url || '#')
    .replace(/\{\{TAX_SRC\}\}/g, tax.source_name || '')
    .replace(/\{\{TAX_BADGE\}\}/g, badge(tax.source_name))

  // 저장
  const suffix = attempt > 1 ? `_${attempt}` : ''
  reportPath = `reports/${date}${suffix}.html`
  await agent(
    `아래 내용을 정확히 ${reportPath} 경로에 Write 툴로 저장하고 "저장 완료"만 반환하세요.\n\n${html}`,
    { label: `save-report-${attempt}`, phase: 'Write' }
  )
  log(`리포트 저장: ${reportPath}`)

  // Validate
  phase('Validate')
  const validation = await agent(
    `.claude/skills/validate.md의 루브릭 A를 적용해 ${reportPath} 파일을 채점하세요. score(숫자), grade(S/A/B/C/D 한 글자), summary(개선 필요 항목 한 줄, 없으면 빈 문자열)를 반환하세요.`,
    {
      label: `validator-${attempt}`,
      phase: 'Validate',
      schema: {
        type: 'object',
        properties: {
          score:   { type: 'number' },
          grade:   { type: 'string' },
          summary: { type: 'string' },
        },
        required: ['score', 'grade', 'summary'],
      },
    }
  )

  if (validation) {
    grade = validation.score
    validationResult = `${validation.grade}등급 (${validation.score}점)${validation.summary ? ' — ' + validation.summary : ''}`
    log(`검증 결과: ${validationResult}`)
    if (grade >= 70) {
      log(`✅ B+ 달성 — 루프 종료`)
    } else {
      log(`⚠ ${validation.grade}등급 미달 — ${attempt < MAX_RETRIES ? '재시도' : '최대 횟수 도달, 종료'}`)
    }
  } else {
    log('검증 실패 — 재시도')
    grade = 0
  }
}

return {
  attempts: attempt,
  reportPath,
  validationResult,
  success: grade >= 70,
  cacheUsed: useCache,
}
