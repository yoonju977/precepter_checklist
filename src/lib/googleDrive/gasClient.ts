import type { ChecklistSession } from '../../types/evaluation'

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzQJCAp1L36NkqFKDj0P79vbVrp3xvxb0SCuTOv484G39gKVPl_UfDlux3ugLOuOhZOnQ/exec'

export type SessionMeta = {
  fileId: string
  name: string
  updatedAt: string
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/** 임시저장: JSON(임시저장/) + XLSX(대상자 폴더) 동시 저장 */
export async function gasSaveWithExcel(
  session: ChecklistSession,
  xlsxBuffer: ArrayBuffer,
  xlsxFileName: string,
  subjectFolderName: string,
  tempJsonFileName: string,
): Promise<void> {
  const xlsxBase64 = arrayBufferToBase64(xlsxBuffer)
  await fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ session, xlsxBase64, xlsxFileName, subjectFolderName, tempJsonFileName }),
  })
}

/** JSON만 임시저장 폴더에 저장 (Excel 생성 실패 시 fallback) */
export async function gasSaveSession(session: ChecklistSession, tempJsonFileName?: string): Promise<void> {
  await fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ session, folderType: 'temp', tempJsonFileName }),
  })
}

/** 임시저장 파일 삭제 (최종제출 시 기존 임시저장 파기) */
export async function gasDeleteTempFiles(
  tempJsonFileName: string,
  subjectFolderName: string,
  tempXlsxFileName: string,
): Promise<void> {
  await fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'deleteTemp', tempJsonFileName, subjectFolderName, tempXlsxFileName }),
  })
}

/** 대상자 사번+주차로 필터링하여 임시저장 세션 목록 조회 */
export async function gasListSessions(subjectEmployeeId: string, weekType: string): Promise<SessionMeta[]> {
  const params = new URLSearchParams({ action: 'list', subjectId: subjectEmployeeId, weekType })
  const res = await fetch(`${GAS_URL}?${params}`, { mode: 'cors' })
  if (!res.ok) throw new Error(`서버 오류: ${res.status}`)
  const json = await res.json() as { sessions?: SessionMeta[]; error?: string }
  if (json.error) throw new Error(json.error)
  return json.sessions ?? []
}

export async function gasLoadSession(fileId: string): Promise<ChecklistSession> {
  const res = await fetch(`${GAS_URL}?action=load&fileId=${encodeURIComponent(fileId)}`, { mode: 'cors' })
  if (!res.ok) throw new Error(`서버 오류: ${res.status}`)
  const json = await res.json() as ChecklistSession & { error?: string }
  if ('error' in json && json.error) throw new Error(json.error)
  return json
}

/** 서명 이미지 PNG를 Drive 전자서명 폴더에 저장 (fire-and-forget) */
export async function gasSaveSignatureImage(
  base64: string,
  name: string,
  employeeId: string,
): Promise<void> {
  await fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'saveSignature', base64, name, employeeId }),
  })
}
