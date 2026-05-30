import { useState, useCallback, useEffect, useRef } from 'react'
import type { ChecklistItemResult, Evaluation, ChecklistSession } from '../../types/evaluation'
import type { ChecklistItem, WeekType } from '../../types/checklist'
import type { Role } from '../../types/userRole'
import { createEmptyEvaluation } from '../../types/evaluation'
import { saveSession, loadSession } from '../storage/localStorage'

function initResults(items: ChecklistItem[], saved: ChecklistSession | null): ChecklistItemResult[] {
  return items.map(item => {
    const existing = saved?.results.find(r => r.itemId === item.id)
    return existing ?? {
      itemId: item.id,
      preceptee: createEmptyEvaluation(),
      preceptor: createEmptyEvaluation(),
      educator: createEmptyEvaluation(),
      headNurse: createEmptyEvaluation(),
    }
  })
}

const ROLE_FIELD: Record<Role, keyof Omit<ChecklistItemResult, 'itemId'>> = {
  preceptee: 'preceptee',
  preceptor: 'preceptor',
  educator: 'educator',
  headNurse: 'headNurse',
}

type Options = {
  weekType: WeekType
  targetName?: string
  department?: string
  startDate?: string
}

export function useEvaluations(items: ChecklistItem[], options: Options) {
  const { weekType, targetName = '', department = '', startDate = '' } = options

  const [results, setResults] = useState<ChecklistItemResult[]>(() => {
    const saved = loadSession(weekType)
    return initResults(items, saved)
  })

  // debounce 자동저장: 마지막 변경 후 800ms 뒤 저장
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const session: ChecklistSession = {
        id: `${weekType}_${Date.now()}`,
        targetName,
        weekType,
        department,
        startDate,
        results,
        savedAt: new Date().toISOString(),
      }
      saveSession(session)
    }, 800)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [results, weekType, targetName, department, startDate])

  const updateEvaluation = useCallback(
    (itemId: string, role: Role, patch: Partial<Evaluation>) => {
      setResults(prev =>
        prev.map(r => {
          if (r.itemId !== itemId) return r
          const field = ROLE_FIELD[role]
          return { ...r, [field]: { ...r[field], ...patch } }
        })
      )
    },
    []
  )

  const loadFromSession = useCallback((session: ChecklistSession) => {
    setResults(initResults(items, session))
  }, [items])

  const getResult = useCallback(
    (itemId: string) => results.find(r => r.itemId === itemId),
    [results]
  )

  return { results, updateEvaluation, getResult, loadFromSession }
}
