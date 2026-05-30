import { AppProvider, useAppContext } from './features/checklist/ChecklistContext'
import RoleSelectScreen from './components/layout/RoleSelectScreen'
import WeekSelectScreen from './components/layout/WeekSelectScreen'
import SubjectInfoScreen from './components/layout/SubjectInfoScreen'
import ChecklistScreen from './components/checklist/ChecklistScreen'

function AppInner() {
  const { role, weekType, subject } = useAppContext()

  if (!role) return <RoleSelectScreen />
  if (!weekType) return <WeekSelectScreen />
  if (!subject.name) return <SubjectInfoScreen />
  return <ChecklistScreen />
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
