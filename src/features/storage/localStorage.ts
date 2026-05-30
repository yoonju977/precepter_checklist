import type { ChecklistSession } from '../../types/evaluation'

const PREFIX = 'checklist_'

export function saveSession(session: ChecklistSession) {
  try {
    localStorage.setItem(PREFIX + session.weekType, JSON.stringify(session))
  } catch {
    // storage quota 초과 시 무시
  }
}

export function loadSession(weekType: string): ChecklistSession | null {
  try {
    const raw = localStorage.getItem(PREFIX + weekType)
    return raw ? (JSON.parse(raw) as ChecklistSession) : null
  } catch {
    return null
  }
}

export function clearSession(weekType: string) {
  localStorage.removeItem(PREFIX + weekType)
}
