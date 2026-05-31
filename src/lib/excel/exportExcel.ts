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
  HEAD_NURSE_SCORE: 12, // L: 수간호사평가
}

// 집계 테이블 행 번호 (주차별, 1-based)
const SUMMARY_ROWS: Record<string, { score0: number; score1: number; score2: number; score3: number; total: number; grandTotal: number }> = {
  '4week': { score0: 177, score1: 178, score2: 179, score3: 180, total: 181, grandTotal: 182 },
  '8week': { score0: 101, score1: 102, score2: 103, score3: 104, total: 105, grandTotal: 106 },
}

// 집계 테이블 열 (1-based)
const SUMMARY_COL = {
  SELF_COUNT: 8,        // H: 자가평가 문항수
  SELF_SCORE: 9,        // I: 자가평가 점수
  EVAL_COUNT: 10,       // J: 교육자평가 문항수
  EVAL_SCORE_COL: 11,   // K: 교육자평가 점수
  HEAD_NURSE_SCORE_COL: 12, // L: 수간호사평가 점수
}

// 주차별 총 문항수
const TOTAL_ITEMS: Record<string, number> = { '4week': 158, '8week': 82 }

// 하단 서명란 행 (0-based, ExcelJS image tl.row)
// 4주 row185(1-based)=184(0-based), 8주 row109(1-based)=108(0-based)
const BOTTOM_SIG_ROW: Record<string, number> = { '4week': 184, '8week': 108 }

// 확인자 수간호사 (인) 행 (0-based)
// 4주 row186(1-based)=185(0-based), 8주 row110(1-based)=109(0-based)
const BOTTOM_HEAD_NURSE_SIG_ROW: Record<string, number> = { '4week': 185, '8week': 109 }

// 서명 이미지 열 (0-based): (인) 셀(K=col11,0-based=10) 옆 → L=col12,0-based=11
const SIG_IMAGE_COL = 11

// 평가일 행 (1-based)
// 4주 row184, 8주 row108
const EVAL_DATE_ROW: Record<string, number> = { '4week': 184, '8week': 108 }

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

    // 자가평가
    if (result.preceptee.score !== null) {
      row.getCell(COL.SELF_SCORE).value = result.preceptee.score
    }

    // 교육자 평가 (프리셉터 우선, 없으면 교육전담)
    const evalResult = result.preceptor.score !== null ? result.preceptor : result.educator
    if (evalResult.score !== null) {
      row.getCell(COL.EVAL_SCORE).value = evalResult.score
      // 교육자 성명: 프리셉터 평가 문항은 프리셉터명, 교육전담 평가 문항은 교육전담명
      const signerName = result.preceptor.score !== null
        ? (session.preceptorName || result.preceptor.signerName || '')
        : (session.educatorPersonName || result.educator.signerName || '')
      row.getCell(COL.SIGNER).value = signerName
    }

    // 교육실행일: 프리셉티 입력 우선, 없으면 교육자 입력
    const educationDate = result.preceptee.educationDate
      || result.preceptor.educationDate
      || result.educator.educationDate
    if (educationDate) {
      row.getCell(COL.SIGN_DATE).value = educationDate
    } else if (evalResult.signedAt) {
      row.getCell(COL.SIGN_DATE).value = evalResult.signedAt.slice(0, 10)
    }

    // 수간호사 평가
    if (result.headNurse.score !== null) {
      row.getCell(COL.HEAD_NURSE_SCORE).value = result.headNurse.score
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

  // 신입간호사 사번·성명: row9 (4주)/row9 (8주), col3·col4
  sheet.getRow(9).getCell(3).value = employeeId || ''
  sheet.getRow(9).getCell(4).value = targetName || ''

  // 프리셉터 사번·성명: row12 (4주)/row12 (8주), col3·col4
  if (preceptorId || preceptorName) {
    sheet.getRow(12).getCell(3).value = preceptorId || ''
    sheet.getRow(12).getCell(4).value = preceptorName || ''
  }

  // 평가일: 프리셉터 최종제출일, row184(4주)/row108(8주)
  const preceptorSubmitDate = session.submittedRoles?.preceptor?.slice(0, 10)
  if (preceptorSubmitDate) {
    const d = new Date(preceptorSubmitDate + 'T00:00:00')
    const evalRow = sheet.getRow(EVAL_DATE_ROW[session.weekType])
    evalRow.getCell(COL.SIGN_DATE).value = d.getFullYear()   // H: 년
    evalRow.getCell(COL.SELF_SCORE).value = d.getMonth() + 1 // J: 월
    evalRow.getCell(COL.EVAL_SCORE).value = d.getDate()      // K: 일
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
  const headCount: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 }

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
    if (r.headNurse.score !== null) {
      headCount[r.headNurse.score] = (headCount[r.headNurse.score] ?? 0) + 1
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
    row.getCell(SUMMARY_COL.HEAD_NURSE_SCORE_COL).value = (headCount[s] || 0) * s
  }

  // 합계 행
  const totalSelfCount = Object.values(selfCount).reduce((a, b) => a + b, 0)
  const totalSelfScore = Object.entries(selfCount).reduce((sum, [sc, cnt]) => sum + parseInt(sc) * cnt, 0)
  const totalEvalCount = Object.values(evalCount).reduce((a, b) => a + b, 0)
  const totalEvalScore = Object.entries(evalCount).reduce((sum, [sc, cnt]) => sum + parseInt(sc) * cnt, 0)
  const totalHeadNurseScore = Object.entries(headCount).reduce((sum, [sc, cnt]) => sum + parseInt(sc) * cnt, 0)

  const totalRow = sheet.getRow(rows.total)
  totalRow.getCell(SUMMARY_COL.SELF_COUNT).value = totalSelfCount
  totalRow.getCell(SUMMARY_COL.SELF_SCORE).value = totalSelfScore
  totalRow.getCell(SUMMARY_COL.EVAL_COUNT).value = totalEvalCount
  totalRow.getCell(SUMMARY_COL.EVAL_SCORE_COL).value = totalEvalScore
  totalRow.getCell(SUMMARY_COL.HEAD_NURSE_SCORE_COL).value = totalHeadNurseScore

  // 총점 (최종제출 시만)
  if (isFinal) {
    const maxScore = TOTAL_ITEMS[weekType] * 3
    const grandRow = sheet.getRow(rows.grandTotal)
    const selfGrand = maxScore > 0 ? Math.round((totalSelfScore / maxScore) * 100 * 10) / 10 : 0
    const evalGrand = maxScore > 0 ? Math.round((totalEvalScore / maxScore) * 100 * 10) / 10 : 0
    const headGrand = maxScore > 0 ? Math.round((totalHeadNurseScore / maxScore) * 100 * 10) / 10 : 0
    grandRow.getCell(SUMMARY_COL.SELF_SCORE).value = selfGrand
    grandRow.getCell(SUMMARY_COL.EVAL_SCORE_COL).value = evalGrand
    grandRow.getCell(SUMMARY_COL.HEAD_NURSE_SCORE_COL).value = headGrand
  }
}

function addSignatureImage(workbook: ExcelJS.Workbook, sheet: ExcelJS.Worksheet, session: ChecklistSession) {
  // 평가자 프리셉터 서명 → (인) 옆 셀(col L)
  const preceptorSign = session.results.find(r => r.preceptor.signatureImage)?.preceptor.signatureImage
  if (preceptorSign) {
    const base64 = preceptorSign.split(',')[1]
    const imageId = workbook.addImage({ base64, extension: 'png' })
    sheet.addImage(imageId, {
      tl: { col: SIG_IMAGE_COL, row: BOTTOM_SIG_ROW[session.weekType] },
      ext: { width: 60, height: 25 },
    })
  }

  // 확인자 수간호사 서명 → 수간호사 (인) 옆 셀(col L)
  const headNurseSign = session.results.find(r => r.headNurse.signatureImage)?.headNurse.signatureImage
  if (headNurseSign) {
    const base64 = headNurseSign.split(',')[1]
    const imageId = workbook.addImage({ base64, extension: 'png' })
    sheet.addImage(imageId, {
      tl: { col: SIG_IMAGE_COL, row: BOTTOM_HEAD_NURSE_SIG_ROW[session.weekType] },
      ext: { width: 60, height: 25 },
    })
  }
}

export { buildUnifiedFileName } from './fileNames'

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
