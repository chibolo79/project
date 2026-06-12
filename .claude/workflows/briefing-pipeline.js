export const meta = {
  name: 'briefing-pipeline',
  description: '브리핑 수집→작성→검증을 루프로 실행. B+(70점) 이상 나올 때까지 최대 3회 반복.',
  phases: [
    { title: 'Collect', detail: 'briefing-researcher WebSearch 실행' },
    { title: 'Write', detail: '템플릿 플레이스홀더 치환 (에이전트 없음)' },
    { title: 'Validate', detail: 'validator 루브릭 A 채점' },
  ],
}

const date = args && args.date ? args.date : '2026-06-12'
const MAX_RETRIES = 3

// ── 헬퍼: 치환 함수 ──
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

// ── 루프: Collect → Write → Validate ──
let attempt = 0
let grade = 0
let reportPath = ''
let validationResult = ''

while (attempt < MAX_RETRIES && grade < 70) {
  attempt++
  log(`시도 ${attempt}/${MAX_RETRIES} 시작`)

  // 1단계: Collect — researcher만 에이전트로 실행
  phase('Collect')
  const collectResult = await agent(
    `agents/briefing-researcher.md를 읽고 지시에 따라 실행하세요. 오늘 날짜: ${date}`,
    { label: `researcher-attempt-${attempt}` }
  )
  log(`수집 완료: ${collectResult}`)

  // 2단계: Write — 에이전트 없이 스크립트에서 직접 치환
  phase('Write')

  const readCacheAndTemplate = await agent(
    `두 파일을 읽고 내용을 JSON으로 반환하세요.\n1. reports/.research-cache.json\n2. .claude/templates/briefing.html\n반환 형식: {"cache": <파일 내용 문자열>, "template": <파일 내용 문자열>}`,
    {
      label: `read-files-attempt-${attempt}`,
      schema: {
        type: 'object',
        properties: {
          cache: { type: 'string' },
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

  // 결과 맵 구성
  const r = {}
  for (const item of cache.results) {
    r[item.id] = item
  }

  // 공통 치환
  const [dateStr, timeStr] = (cache.collected_at || `${date} 00:00 KST`).split(' ')
  html = html
    .replace(/\{\{DATE\}\}/g, date)
    .replace(/\{\{COLLECTED_AT\}\}/g, `${timeStr || '00:00'} KST`)
    .replace(/\{\{SEARCH_COUNT\}\}/g, String(cache.search_count || 5))

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

  // HRC 실패 주석
  html = html.replace(/\{\{HRC_FAIL\}\}/g, failNote(r['china_hrc_offer'] || {}))

  // 에너지 (WTI/Brent 합산 항목)
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

  // 무역규제 뉴스 항목
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

  // 파일 저장
  const suffix = attempt > 1 ? `_${attempt}` : ''
  reportPath = `reports/${date}${suffix}.html`
  const saveResult = await agent(
    `아래 내용을 정확히 ${reportPath} 경로에 Write 툴로 저장하고 "저장 완료"만 반환하세요.\n\n${html}`,
    { label: `save-report-attempt-${attempt}` }
  )
  log(`리포트 저장: ${reportPath}`)

  // 3단계: Validate
  phase('Validate')
  const schema = {
    type: 'object',
    properties: {
      score: { type: 'number' },
      grade: { type: 'string' },
      summary: { type: 'string' },
    },
    required: ['score', 'grade', 'summary'],
  }
  const validation = await agent(
    `.claude/skills/validate.md의 루브릭 A를 적용해 ${reportPath} 파일을 채점하세요. score(숫자), grade(S/A/B/C/D 한 글자), summary(개선 필요 항목 한 줄, 없으면 빈 문자열)를 반환하세요.`,
    { label: `validator-attempt-${attempt}`, schema }
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
}
