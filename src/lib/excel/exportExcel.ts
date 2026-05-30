import ExcelJS from 'exceljs'
import type { ChecklistItemResult } from '../../types/evaluation'
import type { WeekType } from '../../types/checklist'

const SHEET_NAME: Record<WeekType, string> = {
  '4week': '체크리스트(4주)0~3점평가)',
  '8week': '체크리스트(8주)(0~3점평가) (2)',
}

// 원본 엑셀의 열 인덱스 (1-based for ExcelJS)
const COL = {
  NUM: 1,       // A: 연번
  CONTENT: 6,   // F: 교육 내용
  SIGN_DATE: 8, // H: 교육 실행일
  SIGNER: 9,    // I: 교육자 서명
  SELF_SCORE: 10, // J: 자가평가
  EVAL_SCORE: 11, // K: 교육자 평가
}

export async function exportToExcel(
  results: ChecklistItemResult[],
  weekType: WeekType,
  targetName: string,
) {
  // 템플릿 로드
  const templateUrl = import.meta.env.BASE_URL + 'templates/checklist-template.xlsx'
  const response = await fetch(templateUrl)
  if (!response.ok) throw new Error('템플릿 파일을 불러올 수 없습니다.')
  const arrayBuffer = await response.arrayBuffer()

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(arrayBuffer)

  const sheet = workbook.getWorksheet(SHEET_NAME[weekType])
  if (!sheet) throw new Error('시트를 찾을 수 없습니다.')

  // 결과 Map
  const resultMap = new Map(results.map(r => {
    const numStr = r.itemId.replace(`${weekType}_`, '')
    return [parseInt(numStr, 10), r]
  }))

  // 데이터 행 순회 (17행부터)
  sheet.eachRow((row, rowNum) => {
    if (rowNum < 17) return
    const rawNum = row.getCell(COL.NUM).value
    if (rawNum === null || rawNum === undefined) return
    const num = parseInt(String(rawNum).replace('*', ''), 10)
    if (isNaN(num)) return

    const result = resultMap.get(num)
    if (!result) return

    // 자가평가 점수
    if (result.preceptee.score !== null) {
      row.getCell(COL.SELF_SCORE).value = result.preceptee.score
    }

    // 프리셉터 또는 교육전담 평가 점수
    const evalResult = result.preceptor.score !== null ? result.preceptor : result.educator
    if (evalResult.score !== null) {
      row.getCell(COL.EVAL_SCORE).value = evalResult.score
      row.getCell(COL.SIGNER).value = evalResult.signerName || ''
      if (evalResult.signedAt) {
        row.getCell(COL.SIGN_DATE).value = evalResult.signedAt.slice(0, 10)
      }
    }
  })

  // 서명 이미지 삽입 (프리셉터/교육전담 대표 서명)
  const repSign = results.find(r => r.preceptor.signatureImage)?.preceptor
    ?? results.find(r => r.educator.signatureImage)?.educator
  if (repSign?.signatureImage) {
    const base64 = repSign.signatureImage.split(',')[1]
    const imageId = workbook.addImage({ base64, extension: 'png' })
    sheet.addImage(imageId, {
      tl: { col: COL.SIGNER - 1, row: 7 },
      ext: { width: 80, height: 30 },
    })
  }

  // 수간호사 서명 이미지
  const hnSign = results.find(r => r.headNurse.signatureImage)?.headNurse
  if (hnSign?.signatureImage) {
    const base64 = hnSign.signatureImage.split(',')[1]
    const imageId = workbook.addImage({ base64, extension: 'png' })
    sheet.addImage(imageId, {
      tl: { col: COL.SIGNER - 1, row: 10 },
      ext: { width: 80, height: 30 },
    })
  }

  // 다운로드
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `신규간호사_체크리스트_${weekType === '4week' ? '4주' : '8주'}_${targetName || ''}_${new Date().toISOString().slice(0, 10)}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

/** XLSX 파일명만 반환하는 헬퍼 */
export function buildExcelFileName(weekType: WeekType, targetName: string) {
  return `신규간호사_체크리스트_${weekType === '4week' ? '4주' : '8주'}_${targetName || ''}_${new Date().toISOString().slice(0, 10)}.xlsx`
}

/** 브라우저 다운로드 없이 ArrayBuffer + 파일명만 반환 (서버 업로드용) */
export async function buildExcelBuffer(
  results: ChecklistItemResult[],
  weekType: WeekType,
  targetName: string,
): Promise<{ buffer: ArrayBuffer; fileName: string }> {
  const templateUrl = import.meta.env.BASE_URL + 'templates/checklist-template.xlsx'
  const response = await fetch(templateUrl)
  if (!response.ok) throw new Error('템플릿 파일을 불러올 수 없습니다.')
  const arrayBuffer = await response.arrayBuffer()

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(arrayBuffer)

  const sheet = workbook.getWorksheet(SHEET_NAME[weekType])
  if (!sheet) throw new Error('시트를 찾을 수 없습니다.')

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
    if (result.preceptee.score !== null) row.getCell(COL.SELF_SCORE).value = result.preceptee.score
    const evalResult = result.preceptor.score !== null ? result.preceptor : result.educator
    if (evalResult.score !== null) {
      row.getCell(COL.EVAL_SCORE).value = evalResult.score
      row.getCell(COL.SIGNER).value = evalResult.signerName || ''
      if (evalResult.signedAt) row.getCell(COL.SIGN_DATE).value = evalResult.signedAt.slice(0, 10)
    }
  })

  const repSign = results.find(r => r.preceptor.signatureImage)?.preceptor
    ?? results.find(r => r.educator.signatureImage)?.educator
  if (repSign?.signatureImage) {
    const base64 = repSign.signatureImage.split(',')[1]
    sheet.addImage(workbook.addImage({ base64, extension: 'png' }), { tl: { col: COL.SIGNER - 1, row: 7 }, ext: { width: 80, height: 30 } })
  }
  const hnSign = results.find(r => r.headNurse.signatureImage)?.headNurse
  if (hnSign?.signatureImage) {
    const base64 = hnSign.signatureImage.split(',')[1]
    sheet.addImage(workbook.addImage({ base64, extension: 'png' }), { tl: { col: COL.SIGNER - 1, row: 10 }, ext: { width: 80, height: 30 } })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return { buffer, fileName: buildExcelFileName(weekType, targetName) }
}
