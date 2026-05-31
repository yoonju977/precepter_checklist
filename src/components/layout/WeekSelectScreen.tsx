import { useAppContext } from '../../features/checklist/ChecklistContext'
import { ROLE_LABELS } from '../../types/userRole'
import type { WeekType } from '../../types/checklist'
import Header from '../common/Header'

const WEEKS: { weekType: WeekType; label: string; desc: string }[] = [
  { weekType: '4week', label: '4주 체크리스트', desc: '입사 후 4주차 평가 · 158개 문항' },
  { weekType: '8week', label: '8주 체크리스트', desc: '입사 후 8주차 평가 · 82개 문항' },
]

export default function WeekSelectScreen() {
  const { role, setWeekType, reset } = useAppContext()

  return (
    <>
      <Header
        title="체크리스트 선택"
        sub={`역할: ${role ? ROLE_LABELS[role] : ''}`}
        onBack={reset}
      />
      <div className="screen">
        <h1 className="screen__title">주차를 선택하세요</h1>
        <p className="screen__lead">평가할 교육 주차를 고르세요.</p>
        {WEEKS.map(({ weekType, label, desc }) => (
          <button key={weekType} className="choice" onClick={() => setWeekType(weekType)}>
            <span className="choice__icon" style={{ background: 'var(--crimson-50)', color: 'var(--crimson-700)', fontWeight: 800, fontSize: 20 }}>
              {weekType === '4week' ? '4' : '8'}
            </span>
            <span className="choice__body">
              <span className="choice__name">{label}</span>
              <span className="choice__desc">{desc}</span>
            </span>
            <span className="choice__chev">›</span>
          </button>
        ))}
      </div>
    </>
  )
}
