import { AppProvider, useAppContext } from './features/checklist/ChecklistContext'
import RoleSelectScreen from './components/layout/RoleSelectScreen'
import WeekSelectScreen from './components/layout/WeekSelectScreen'
import ChecklistScreen from './components/checklist/ChecklistScreen'

function AppInner() {
  const { role, weekType } = useAppContext()

  if (!role) return <RoleSelectScreen />
  if (!weekType) return <WeekSelectScreen />
  return <ChecklistScreen />
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
