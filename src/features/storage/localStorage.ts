import type { ChecklistSession } from '../../types/evaluation'

const PREFIX = 'checklist_'

function makeKey(weekType: string, employeeId?: string) {
  return PREFIX + weekType + (employeeId ? '_' + employeeId : '')
}

export function saveSession(session: ChecklistSession) {
  try {
    localStorage.setItem(makeKey(session.weekType, session.employeeId), JSON.stringify(session))
  } catch {}
}

export function loadSession(weekType: string, employeeId?: string): ChecklistSession | null {
  try {
    const raw = localStorage.getItem(makeKey(weekType, employeeId))
    return raw ? (JSON.parse(raw) as ChecklistSession) : null
  } catch {
    return null
  }
}

export function clearSession(weekType: string, employeeId?: string) {
  localStorage.removeItem(makeKey(weekType, employeeId))
}
