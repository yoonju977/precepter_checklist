import { useState } from 'react'
import { useAppContext } from '../../features/checklist/ChecklistContext'
import type { SubjectInfo } from '../../features/checklist/ChecklistContext'
import { ROLE_LABELS } from '../../types/userRole'

export default function SubjectInfoScreen() {
  const { role, weekType, setSubject, reset } = useAppContext()

  const [form, setForm] = useState<SubjectInfo>({
    employeeId: '',
    name: '',
    department: '',
    startDate: '',
    preceptorName: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof SubjectInfo, string>>>({})

  function validate() {
    const e: typeof errors = {}
    if (!form.name.trim()) e.name = '성명을 입력하세요'
    if (!form.employeeId.trim()) e.employeeId = '사번을 입력하세요'
    if (!form.department.trim()) e.department = '부서를 입력하세요'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubject(form)
  }

  const field = (
    key: keyof SubjectInfo,
    label: string,
    placeholder: string,
    required = false,
    type = 'text'
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={e => {
          setForm(f => ({ ...f, [key]: e.target.value }))
          setErrors(er => ({ ...er, [key]: undefined }))
        }}
        placeholder={placeholder}
        className={[
          'w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400',
          errors[key] ? 'border-red-400' : 'border-gray-200',
        ].join(' ')}
      />
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button onClick={reset} className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1">
          ← 처음으로
        </button>

        <h1 className="text-xl font-bold text-gray-800 mb-1">대상자 정보 입력</h1>
        <p className="text-sm text-gray-500 mb-6">
          역할: <span className="font-medium text-gray-700">{role ? ROLE_LABELS[role] : ''}</span>
          {' · '}
          <span className="font-medium text-gray-700">{weekType === '4week' ? '4주' : '8주'} 체크리스트</span>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          {field('employeeId', '사번', '예) 12345', true)}
          {field('name', '성명 (신규간호사)', '홍길동', true)}
          {field('department', '부서', '예) 내과병동', true)}
          {field('startDate', '입사일', '', false, 'date')}
          {field('preceptorName', '담당 프리셉터 성명', '예) 김OO', false)}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 mt-2"
          >
            체크리스트 시작
          </button>
        </form>
      </div>
    </div>
  )
}
