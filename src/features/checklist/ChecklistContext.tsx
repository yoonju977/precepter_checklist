import { createContext, useContext, useState } from 'react'
import type { Role } from '../../types/userRole'
import type { WeekType } from '../../types/checklist'

type AppState = {
  role: Role | null
  weekType: WeekType | null
  sessionId: string | null
}

type AppContextValue = AppState & {
  setRole: (role: Role) => void
  setWeekType: (weekType: WeekType) => void
  setSessionId: (id: string) => void
  reset: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    role: null,
    weekType: null,
    sessionId: null,
  })

  const setRole = (role: Role) => setState(s => ({ ...s, role }))
  const setWeekType = (weekType: WeekType) => setState(s => ({ ...s, weekType }))
  const setSessionId = (sessionId: string) => setState(s => ({ ...s, sessionId }))
  const reset = () => setState({ role: null, weekType: null, sessionId: null })

  return (
    <AppContext.Provider value={{ ...state, setRole, setWeekType, setSessionId, reset }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
