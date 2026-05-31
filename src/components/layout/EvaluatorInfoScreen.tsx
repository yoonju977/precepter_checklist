import { useState } from 'react'
import { useAppContext } from '../../features/checklist/ChecklistContext'
import { ROLE_LABELS } from '../../types/userRole'
import Header from '../common/Header'

export default function EvaluatorInfoScreen() {
  const { role, subject, setEvaluatorInfo, reset } = useAppContext()

  const [employeeId, setEmployeeId] = useState('')
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<{ employeeId?: string; name?: string }>({})

  if (!role || role === 'preceptee') return null

  const needsEmployeeId = role === 'preceptor' || role === 'educator'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!name.trim()) errs.name = '성명을 입력하세요'
    if (needsEmployeeId && !employeeId.trim()) errs.employeeId = '사번을 입력하세요'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setEvaluatorInfo({ employeeId: employeeId.trim(), name: name.trim() })
  }

  return (
    <>
      <Header
        title="교육자 정보"
        sub={`대상: ${subject.name} · ${ROLE_LABELS[role]}`}
        onBack={reset}
      />
      <div className="screen">
        <h1 className="screen__title">{ROLE_LABELS[role]} 정보</h1>
        <p className="screen__lead">실제 평가하고 서명할 <b>{ROLE_LABELS[role]}</b> 본인 정보를 입력하세요.</p>
        <form className="panel" onSubmit={handleSubmit}>
          {needsEmployeeId && (
            <div className="field">
              <label>사번<span className="req">*</span></label>
              <input
                className={errors.employeeId ? 'err' : ''}
                value={employeeId}
                onChange={e => { setEmployeeId(e.target.value); setErrors(er => ({ ...er, employeeId: undefined })) }}
                placeholder="예) 12345"
                inputMode="numeric"
              />
              {errors.employeeId && <div className="errmsg">{errors.employeeId}</div>}
            </div>
          )}
          <div className="field">
            <label>성명<span className="req">*</span></label>
            <input
              className={errors.name ? 'err' : ''}
              value={name}
              onChange={e => { setName(e.target.value); setErrors(er => ({ ...er, name: undefined })) }}
              placeholder="홍길동"
            />
            {errors.name && <div className="errmsg">{errors.name}</div>}
          </div>
          <button type="submit" className="btn btn--primary btn--block" style={{ marginTop: 6 }}>
            체크리스트 시작
          </button>
        </form>
      </div>
    </>
  )
}
