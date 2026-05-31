import { useState } from 'react'
import { useAppContext } from '../../features/checklist/ChecklistContext'
import type { SubjectInfo } from '../../features/checklist/ChecklistContext'
import Header from '../common/Header'

export default function SubjectInfoScreen() {
  const { setSubject } = useAppContext()

  const [form, setForm] = useState<SubjectInfo>({ employeeId: '', name: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof SubjectInfo, string>>>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = { employeeId: form.employeeId.trim(), name: form.name.trim() }
    const errs: typeof errors = {}
    if (!trimmed.name) errs.name = '성명을 입력하세요'
    if (!trimmed.employeeId) errs.employeeId = '사번을 입력하세요'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubject(trimmed)
  }

  const set = (k: keyof SubjectInfo) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErrors(er => ({ ...er, [k]: undefined }))
  }

  return (
    <>
      <Header title="신규간호사 체크리스트" sub="고려대학교 구로병원" />
      <div className="screen">
        <h1 className="screen__title">신규간호사 정보</h1>
        <p className="screen__lead">평가 대상 신규간호사의 <b>사번</b>과 <b>성명</b>을 입력하세요.</p>
        <form className="panel" onSubmit={handleSubmit}>
          <div className="field">
            <label>사번<span className="req">*</span></label>
            <input className={errors.employeeId ? 'err' : ''} value={form.employeeId}
              onChange={set('employeeId')} placeholder="예) 12345" inputMode="numeric" />
            {errors.employeeId && <div className="errmsg">{errors.employeeId}</div>}
          </div>
          <div className="field">
            <label>성명 (신규간호사)<span className="req">*</span></label>
            <input className={errors.name ? 'err' : ''} value={form.name}
              onChange={set('name')} placeholder="홍길동" />
            {errors.name && <div className="errmsg">{errors.name}</div>}
          </div>
          <button type="submit" className="btn btn--primary btn--block" style={{ marginTop: 6 }}>다음</button>
        </form>
      </div>
    </>
  )
}
