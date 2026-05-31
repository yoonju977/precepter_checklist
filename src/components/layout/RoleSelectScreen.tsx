import { useAppContext } from '../../features/checklist/ChecklistContext'
import type { Role } from '../../types/userRole'
import { ROLE_LABELS } from '../../types/userRole'
import Header from '../common/Header'

const ROLES: {
  role: Role
  desc: string
  tone: string
  iconColor: string
  icon: string
}[] = [
  { role: 'preceptee', desc: '자가평가 점수 입력', tone: 'self', iconColor: 'var(--role-self-bg)', icon: '👤' },
  { role: 'preceptor', desc: '프리셉티 자가평가 확인 + 평가 입력', tone: 'preceptor', iconColor: 'var(--role-preceptor-bg)', icon: '👥' },
  { role: 'educator',  desc: '교육전담 담당 문항 평가 입력', tone: 'educator', iconColor: 'var(--role-educator-bg)', icon: '🎓' },
  { role: 'headNurse', desc: '전체 평가 확인 + 최종 평가 입력', tone: 'head', iconColor: 'var(--role-head-bg)', icon: '🏥' },
]

const ICON_FG: Record<string, string> = {
  self: 'var(--role-self-fg)',
  preceptor: 'var(--role-preceptor-fg)',
  educator: 'var(--role-educator-fg)',
  head: 'var(--role-head-fg)',
}

export default function RoleSelectScreen() {
  const { setRole, subject, reset } = useAppContext()

  return (
    <>
      <Header
        title="역할 선택"
        sub={`대상: ${subject.name} (${subject.employeeId})`}
        onBack={reset}
      />
      <div className="screen">
        <h1 className="screen__title">역할을 선택하세요</h1>
        <p className="screen__lead">선택한 역할에 따라 보이는 문항과 입력 항목이 달라집니다.</p>
        {ROLES.map(({ role, desc, tone, iconColor, icon }) => (
          <button key={role} className="choice" onClick={() => setRole(role)}>
            <span className="choice__icon" style={{ background: iconColor, color: ICON_FG[tone] }}>
              {icon}
            </span>
            <span className="choice__body">
              <span className="choice__name">{ROLE_LABELS[role]}</span>
              <span className="choice__desc">{desc}</span>
            </span>
            <span className="choice__chev">›</span>
          </button>
        ))}
      </div>
    </>
  )
}
