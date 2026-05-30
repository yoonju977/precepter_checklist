import type { ChecklistSession } from '../../types/evaluation'

export function downloadSession(session: ChecklistSession) {
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `checklist_${session.weekType}_${session.savedAt.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function readSessionFile(file: File): Promise<ChecklistSession> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        resolve(JSON.parse(e.target?.result as string) as ChecklistSession)
      } catch {
        reject(new Error('올바른 체크리스트 파일이 아닙니다.'))
      }
    }
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'))
    reader.readAsText(file)
  })
}
