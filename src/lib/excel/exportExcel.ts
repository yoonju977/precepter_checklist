import ExcelJS from 'exceljs'
import type { ChecklistSession } from '../../types/evaluation'

const SHEET_NAME: Record<string, string> = {
  '4week': '체크리스트(4주)0~3점평가)',
  '8week': '체크리스트(8주)(0~3점평가) (2)',
}

const COVER_SHEET = '표지(제출시 사용)'

const COL = {
  NUM: 1,
  CONTENT: 6,
  SIGN_DATE: 8,
  SIGNER: 9,
  SELF_SCORE: 10,
  EVAL_SCORE: 11,
}

// 집계 테이블 행 번호 (주차별)
const SUMMARY_ROWS: Record<string, { score0: number; score1: number; score2: number; score3: number; total: number; grandTotal: number }> = {
  '4week': { score0: 177, score1: 178, score2: 179, score3: 180, total: 181, grandTotal: 182 },
  '8week': { score0: 101, score1: 102, score2: 103, score3: 104, total: 105, grandTotal: 106 },
}

// 집계 테이블 열 (1-based)
const SUMMARY_COL = {
  SELF_COUNT: 8,   // H: 자가평가 문항수
  SELF_SCORE: 9,   // I: 자가평가 점수
  EVAL_COUNT: 10,  // J: 교육자평가 문항수
  EVAL_SCORE_COL: 11, // K: 교육자평가 점수
}

// 주차별 총 문항수
const TOTAL_ITEMS: Record<string, number> = { '4week': 158, '8week': 82 }

// 하단 서명란 행 (0-based, ExcelJS image tl.row)
// 4주 row185(1-based) = 184(0-based), 8주 row109(1-based) = 108(0-based)
const BOTTOM_SIG_ROW: Record<string, number> = { '4week': 184, '8week': 108 }

async function loadWorkbook(weekType: string): Promise<{ workbook: ExcelJS.Workbook; sheet: ExcelJS.Worksheet }> {
  const templateUrl = import.meta.env.BASE_URL + 'templates/checklist-template.xlsx'
  const response = await fetch(templateUrl)
  if (!response.ok) throw new Error('템플릿 파일을 불러올 수 없습니다.')
  const arrayBuffer = await response.arrayBuffer()

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(arrayBuffer)

  const sheet = workbook.getWorksheet(SHEET_NAME[weekType])
  if (!sheet) throw new Error('시트를 찾을 수 없습니다.')

  return { workbook, sheet }
}

function fillSheet(sheet: ExcelJS.Worksheet, session: ChecklistSession) {
  const { results, weekType } = session

  const resultMap = new Map(results.map(r => {
    const numStr = r.itemId.replace(`${weekType}_`, '')
    return [parseInt(numStr, 10), r]
  }))

  sheet.eachRow((row, rowNum) => {
    if (rowNum < 17) return
    const rawNum = row.getCell(COL.NUM).value
    if (rawNum === null || rawNum === undefined) return
    const num = parseInt(String(rawNum).replace('*', ''), 10)
    if (isNaN(num)) return

    const result = resultMap.get(num)
    if (!result) return

    if (result.preceptee.score !== null) {
      row.getCell(COL.SELF_SCORE).value = result.preceptee.score
    }

    const evalResult = result.preceptor.score !== null ? result.preceptor : result.educator
    if (evalResult.score !== null) {
      row.getCell(COL.EVAL_SCORE).value = evalResult.score
      row.getCell(COL.SIGNER).value = session.preceptorName || evalResult.signerName || ''
      const educationDate = result.preceptor.educationDate || result.educator.educationDate
      if (educationDate) {
        row.getCell(COL.SIGN_DATE).value = educationDate
      } else if (evalResult.signedAt) {
        row.getCell(COL.SIGN_DATE).value = evalResult.signedAt.slice(0, 10)
      }
    }
  })
}

function fillChecklistSheetHeader(sheet: ExcelJS.Worksheet, session: ChecklistSession) {
  const { surveyMeta, employeeId, targetName, preceptorId, preceptorName } = session

  // 교육기간: row3 (merged) — col1에 기입
  if (surveyMeta?.educationPeriodStart) {
    const period = surveyMeta.educationPeriodEnd
      ? `${surveyMeta.educationPeriodStart} ~ ${surveyMeta.educationPeriodEnd}`
      : surveyMeta.educationPeriodStart
    sheet.getRow(3).getCell(1).value = period
  }

  // 교육부서: row4, col3
  if (surveyMeta?.department) {
    sheet.getRow(4).getCell(3).value = surveyMeta.department
  }

  // 신입간호사 사번·성명: row9, col3·col4
  sheet.getRow(9).getCell(3).value = employeeId || ''
  sheet.getRow(9).getCell(4).value = targetName || ''

  // 프리셉터 사번·성명: row12, col3·col4
  if (preceptorId || preceptorName) {
    sheet.getRow(12).getCell(3).value = preceptorId || ''
    sheet.getRow(12).getCell(4).value = preceptorName || ''
  }
}

function fillCoverSheet(workbook: ExcelJS.Workbook, session: ChecklistSession, isFinal = false) {
  const cover = workbook.getWorksheet(COVER_SHEET)
  if (!cover) return

  // 신입간호사: row7, col3=사번, col4=성명
  cover.getRow(7).getCell(3).value = session.employeeId || ''
  cover.getRow(7).getCell(4).value = session.targetName || ''

  // 프리셉터: row8, col3=사번, col4=성명
  if (session.preceptorId || session.preceptorName) {
    cover.getRow(8).getCell(3).value = session.preceptorId || ''
    cover.getRow(8).getCell(4).value = session.preceptorName || ''
  }

  // 수간호사: row9, col4=성명
  if (session.headNurseName) {
    cover.getRow(9).getCell(4).value = session.headNurseName
  }

  // 부서: row11, col3
  if (session.surveyMeta?.department) {
    cover.getRow(11).getCell(3).value = session.surveyMeta.department
  }

  // 배치일: row12, col3
  if (session.surveyMeta?.deploymentDate) {
    cover.getRow(12).getCell(3).value = session.surveyMeta.deploymentDate
  }

  // 제출일·점수: row15·row16 (최종제출 시만)
  if (isFinal) {
    const weekCol = session.weekType === '4week' ? 3 : 4
    cover.getRow(15).getCell(weekCol).value = new Date().toISOString().slice(0, 10)

    const maxScore = TOTAL_ITEMS[session.weekType] * 3
    if (maxScore > 0) {
      let totalEvalScore = 0
      for (const r of session.results) {
        const sc = r.preceptor.score !== null ? r.preceptor.score
          : r.educator.score !== null ? r.educator.score
          : null
        if (sc !== null) totalEvalScore += sc
      }
      cover.getRow(16).getCell(weekCol).value = Math.round((totalEvalScore / maxScore) * 100 * 10) / 10
    }
  }
}

function fillSummaryTable(sheet: ExcelJS.Worksheet, session: ChecklistSession, isFinal: boolean) {
  const { results, weekType } = session
  const rows = SUMMARY_ROWS[weekType]
  if (!rows) return

  // 점수별 집계
  const selfCount: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 }
  const evalCount: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 }

  for (const r of results) {
    if (r.preceptee.score !== null) {
      selfCount[r.preceptee.score] = (selfCount[r.preceptee.score] ?? 0) + 1
    }
    const evalScore = r.preceptor.score !== null ? r.preceptor.score
      : r.educator.score !== null ? r.educator.score
      : null
    if (evalScore !== null) {
      evalCount[evalScore] = (evalCount[evalScore] ?? 0) + 1
    }
  }

  const scoreRowMap: Record<number, number> = {
    0: rows.score0, 1: rows.score1, 2: rows.score2, 3: rows.score3,
  }

  // 0~3점 행 기입
  for (let s = 0; s <= 3; s++) {
    const rowNum = scoreRowMap[s]
    const row = sheet.getRow(rowNum)
    row.getCell(SUMMARY_COL.SELF_COUNT).value = selfCount[s] || 0
    row.getCell(SUMMARY_COL.SELF_SCORE).value = (selfCount[s] || 0) * s
    row.getCell(SUMMARY_COL.EVAL_COUNT).value = evalCount[s] || 0
    row.getCell(SUMMARY_COL.EVAL_SCORE_COL).value = (evalCount[s] || 0) * s
  }

  // 합계 행
  const totalSelfCount = Object.values(selfCount).reduce((a, b) => a + b, 0)
  const totalSelfScore = Object.entries(selfCount).reduce((sum, [sc, cnt]) => sum + parseInt(sc) * cnt, 0)
  const totalEvalCount = Object.values(evalCount).reduce((a, b) => a + b, 0)
  const totalEvalScore = Object.entries(evalCount).reduce((sum, [sc, cnt]) => sum + parseInt(sc) * cnt, 0)

  const totalRow = sheet.getRow(rows.total)
  totalRow.getCell(SUMMARY_COL.SELF_COUNT).value = totalSelfCount
  totalRow.getCell(SUMMARY_COL.SELF_SCORE).value = totalSelfScore
  totalRow.getCell(SUMMARY_COL.EVAL_COUNT).value = totalEvalCount
  totalRow.getCell(SUMMARY_COL.EVAL_SCORE_COL).value = totalEvalScore

  // 총점 (최종제출 시만)
  if (isFinal) {
    const maxScore = TOTAL_ITEMS[weekType] * 3
    const grandRow = sheet.getRow(rows.grandTotal)
    const selfGrand = maxScore > 0 ? Math.round((totalSelfScore / maxScore) * 100 * 10) / 10 : 0
    const evalGrand = maxScore > 0 ? Math.round((totalEvalScore / maxScore) * 100 * 10) / 10 : 0
    grandRow.getCell(SUMMARY_COL.SELF_SCORE).value = selfGrand
    grandRow.getCell(SUMMARY_COL.EVAL_SCORE_COL).value = evalGrand
  }
}

function addSignatureImage(workbook: ExcelJS.Workbook, sheet: ExcelJS.Worksheet, session: ChecklistSession) {
  const repSignImage = session.results.find(r => r.preceptor.signatureImage)?.preceptor.signatureImage
    ?? session.results.find(r => r.educator.signatureImage)?.educator.signatureImage
  if (repSignImage) {
    const base64 = repSignImage.split(',')[1]
    const imageId = workbook.addImage({ base64, extension: 'png' })
    sheet.addImage(imageId, {
      tl: { col: COL.SIGNER - 1, row: BOTTOM_SIG_ROW[session.weekType] },
      ext: { width: 80, height: 30 },
    })
  }
}

export function buildExcelFileName(session: ChecklistSession): string {
  const weekLabel = session.weekType === '4week' ? '4주' : '8주'
  const dateStr = new Date().toISOString().slice(0, 10)
  return `신규간호사_체크리스트_${weekLabel}_${session.targetName || ''}_${dateStr}.xlsx`
}

export function buildTempExcelFileName(session: ChecklistSession, role: string, evaluatorId: string): string {
  const weekLabel = session.weekType === '4week' ? '4주' : '8주'
  const roleLabel = role === 'preceptee' ? '프리셉티' : role === 'preceptor' ? '프리셉터' : role === 'educator' ? '교육전담' : '수간호사'
  return `체크리스트_${weekLabel}_${session.employeeId || ''}_${session.targetName || ''}_${roleLabel}_${evaluatorId}_임시저장.xlsx`
}

export async function exportToExcel(session: ChecklistSession, isFinal = false): Promise<void> {
  const { workbook, sheet } = await loadWorkbook(session.weekType)
  fillCoverSheet(workbook, session, isFinal)
  fillChecklistSheetHeader(sheet, session)
  fillSheet(sheet, session)
  fillSummaryTable(sheet, session, isFinal)
  addSignatureImage(workbook, sheet, session)

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = buildExcelFileName(session)
  a.click()
  URL.revokeObjectURL(url)
}

export async function buildExcelBuffer(session: ChecklistSession, isFinal = false): Promise<{ buffer: ArrayBuffer; fileName: string }> {
  const { workbook, sheet } = await loadWorkbook(session.weekType)
  fillCoverSheet(workbook, session, isFinal)
  fillChecklistSheetHeader(sheet, session)
  fillSheet(sheet, session)
  fillSummaryTable(sheet, session, isFinal)
  addSignatureImage(workbook, sheet, session)

  const buffer = await workbook.xlsx.writeBuffer()
  return { buffer, fileName: buildExcelFileName(session) }
}
