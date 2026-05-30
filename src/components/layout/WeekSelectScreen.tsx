import { useAppContext } from '../../features/checklist/ChecklistContext'
import { ROLE_LABELS } from '../../types/userRole'
import type { WeekType } from '../../types/checklist'

const WEEKS: { weekType: WeekType; label: string; desc: string }[] = [
  { weekType: '4week', label: '4주 체크리스트', desc: '입사 후 4주차 평가 항목 (158개 문항)' },
  { weekType: '8week', label: '8주 체크리스트', desc: '입사 후 8주차 평가 항목 (82개 문항)' },
]

export default function WeekSelectScreen() {
  const { role, setWeekType, reset } = useAppContext()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button onClick={reset} className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1">
          ← 역할 다시 선택
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-1">체크리스트 선택</h1>
        <p className="text-sm text-gray-500 mb-8">
          역할: <span className="font-medium text-gray-700">{role ? ROLE_LABELS[role] : ''}</span>
        </p>

        <div className="flex flex-col gap-4">
          {WEEKS.map(({ weekType, label, desc }) => (
            <button
              key={weekType}
              onClick={() => setWeekType(weekType)}
              className="border-2 border-gray-200 rounded-xl px-5 py-5 text-left hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <p className="font-semibold text-gray-800 text-lg">{label}</p>
              <p className="text-sm text-gray-500 mt-1">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
