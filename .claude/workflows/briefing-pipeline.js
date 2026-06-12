export const meta = {
  name: 'briefing-pipeline',
  description: '브리핑 수집→작성→검증을 루프로 실행. B+(70점) 이상 나올 때까지 최대 3회 반복.',
  phases: [
    { title: 'Collect', detail: 'briefing-researcher WebSearch 실행' },
    { title: 'Write', detail: 'briefing-writer 플레이스홀더 치환' },
    { title: 'Validate', detail: 'validator 루브릭 A 채점' },
  ],
}

const date = args && args.date ? args.date : '2026-06-12'
const MAX_RETRIES = 3

// ── 루프: Collect → Write → Validate ──
let attempt = 0
let grade = 0
let reportPath = ''
let validationResult = ''

while (attempt < MAX_RETRIES && grade < 70) {
  attempt++
  log(`시도 ${attempt}/${MAX_RETRIES} 시작`)

  // 1단계: Collect
  phase('Collect')
  const collectResult = await agent(
    `agents/briefing-researcher.md를 읽고 지시에 따라 실행하세요. 오늘 날짜: ${date}`,
    { label: `researcher-attempt-${attempt}` }
  )
  log(`수집 완료: ${collectResult}`)

  // 2단계: Write
  phase('Write')
  const suffix = attempt > 1 ? `_${attempt}` : ''
  const writeResult = await agent(
    `agents/briefing-writer.md를 읽고 지시에 따라 실행하세요. 오늘 날짜: ${date}. 저장 파일명: reports/${date}${suffix}.html`,
    { label: `writer-attempt-${attempt}` }
  )
  reportPath = writeResult ? writeResult.trim() : `reports/${date}${suffix}.html`
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
    log(`검증 실패 — 재시도`)
    grade = 0
  }
}

return {
  attempts: attempt,
  reportPath,
  validationResult,
  success: grade >= 70,
}
