import { useMemo, useState } from 'react'
import { useAppContext } from '../../features/checklist/ChecklistContext'
import { useEvaluations } from '../../features/evaluations/useEvaluations'
import { getChecklist } from '../../data/checklistData'
import { ROLE_LABELS } from '../../types/userRole'
import type { ChecklistSession } from '../../types/evaluation'
import { gasSaveWithExcel, gasSaveSession, gasListSessions, gasLoadSession, gasDeleteTempFiles } from '../../lib/googleDrive/gasClient'
import type { SessionMeta } from '../../lib/googleDrive/gasClient'
import ChecklistCard from './ChecklistCard'
import LowScoreModal from '../common/LowScoreModal'
import SignaturePad from '../signature/SignaturePad'
import ServerLoadModal from '../common/ServerLoadModal'

export default function ChecklistScreen() {
  const { role: roleNullable, weekType: rawWeekType, subject, evaluatorInfo, reset } = useAppContext()
  const weekType = rawWeekType!
  if (!roleNullable || !rawWeekType) return null
  const role = roleNullable

  const allItems = useMemo(() => getChecklist(weekType), [weekType])

  const visibleItems = useMemo(() => {
    if (role === 'educator') return allItems.filter(i => i.evaluatorType === 'educator')
    if (role === 'preceptor') return allItems.filter(i => i.evaluatorType === 'preceptor')
    return allItems
  }, [allItems, role])

  const {
    results,
    updateEvaluation,
    getResult,
    loadFromSession,
    surveyMeta,
    updateSurveyMeta,
    submittedRoles,
    submitRole,
    evaluatorMeta,
    updateEvaluatorMeta,
  } = useEvaluations(allItems, { weekType, targetName: subject.name, subjectEmployeeId: subject.employeeId })

  const [showLowScore, setShowLowScore] = useState(false)
  const [pendingScore, setPendingScore] = useState(0)
  const [lowScoreReason, setLowScoreReason] = useState('')

  const [signMode, setSignMode] = useState<'submit' | 'batch' | null>(null)
  const [signerName, setSignerName] = useState('')

  const [serverStatus, setServerStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [showServerLoad, setShowServerLoad] = useState(false)
  const [serverSessions, setServerSessions] = useState<SessionMeta[]>([])
  const [serverLoadError, setServerLoadError] = useState('')

  const roleField = role === 'preceptee' ? 'preceptee'
    : role === 'preceptor' ? 'preceptor'
    : role === 'educator' ? 'educator'
    : 'headNurse'

  const doneCount = useMemo(() => {
    return visibleItems.filter(item => {
      const r = getResult(item.id)
      return r && r[roleField].score !== null
    }).length
  }, [results, visibleItems, roleField, getResult])

  const totalScore = useMemo(() => {
    return visibleItems.reduce((sum, item) => {
      const r = getResult(item.id)
      return sum + (r ? (r[roleField].score ?? 0) : 0)
    }, 0)
  }, [results, visibleItems, roleField, getResult])

  const headNurseAvgScore = useMemo(() => {
    if (role !== 'headNurse') return null
    const scored = results.filter(r => r.headNurse.score !== null)
    if (!scored.length) return null
    const avg = scored.reduce((s, r) => s + (r.headNurse.score ?? 0), 0) / scored.length
    return (avg / 3) * 100
  }, [results, role])

  const hasSigned = useMemo(() => {
    return visibleItems.some(item => {
      const r = getResult(item.id)
      return r && r[roleField].signatureImage !== null
    })
  }, [results, visibleItems, roleField, getResult])

  const isSubmitted = submittedRoles[role] != null

  // 현재 교육자 ID (역할별)
  const currentEvaluatorId = role === 'preceptee' ? (subject.employeeId || '')
    : role === 'preceptor' ? (evaluatorInfo?.employeeId || '')
    : role === 'educator' ? (evaluatorInfo?.employeeId || '')
    : (evaluatorInfo?.name || '')

  const roleLabel = role === 'preceptee' ? '프리셉티' : role === 'preceptor' ? '프리셉터' : role === 'educator' ? '교육전담' : '수간호사'

  function buildTempJsonFileName(): string {
    return `체크리스트_${weekType === '4week' ? '4주' : '8주'}_${subject.employeeId || ''}_${subject.name}_${roleLabel}_${currentEvaluatorId}.json`
  }

  function buildTempXlsxFileName(): string {
    return `체크리스트_${weekType === '4week' ? '4주' : '8주'}_${subject.employeeId || ''}_${subject.name}_${roleLabel}_${currentEvaluatorId}_임시저장.xlsx`
  }

  function buildSubjectFolderName(): string {
    return `${subject.employeeId}_${subject.name}_${surveyMeta.department || '미입력'}`
  }

  function buildSession(extra?: Partial<ChecklistSession>): ChecklistSession {
    return {
      id: `${subject.employeeId || 'no-id'}_${weekType}_${Date.now()}`,
      targetName: subject.name,
      employeeId: subject.employeeId || undefined,
      preceptorId: evaluatorInfo && role === 'preceptor' ? evaluatorInfo.employeeId : evaluatorMeta.preceptorId,
      preceptorName: evaluatorInfo && role === 'preceptor' ? evaluatorInfo.name : evaluatorMeta.preceptorName,
      educatorId: evaluatorInfo && role === 'educator' ? evaluatorInfo.employeeId : evaluatorMeta.educatorId,
      educatorPersonName: evaluatorInfo && role === 'educator' ? evaluatorInfo.name : evaluatorMeta.educatorPersonName,
      headNurseName: evaluatorInfo && role === 'headNurse' ? evaluatorInfo.name : evaluatorMeta.headNurseName,
      weekType,
      department: surveyMeta.department,
      startDate: surveyMeta.deploymentDate,
      surveyMeta: (surveyMeta.department || surveyMeta.deploymentDate || surveyMeta.educationPeriodStart)
        ? surveyMeta : undefined,
      results,
      savedAt: new Date().toISOString(),
      submittedRoles: Object.keys(submittedRoles).length > 0 ? submittedRoles : undefined,
      ...extra,
    }
  }

  /** 임시저장(서버) — JSON + XLSX 동시 저장, 전자서명 필수 */
  async function handleServerSave() {
    if (doneCount > 0 && !hasSigned) {
      alert('전자서명을 먼저 완료해주세요.')
      return
    }
    setServerStatus('saving')
    try {
      const session = buildSession()
      const tempJsonFileName = buildTempJsonFileName()
      const tempXlsxFileName = buildTempXlsxFileName()
      const subjectFolderName = buildSubjectFolderName()
      try {
        const { buildExcelBuffer } = await import('../../lib/excel/exportExcel')
        const { buffer } = await buildExcelBuffer(session, false)
        await gasSaveWithExcel(session, buffer, tempXlsxFileName, subjectFolderName, tempJsonFileName)
      } catch {
        await gasSaveSession(session, tempJsonFileName)
      }
      setServerStatus('saved')
      setTimeout(() => setServerStatus('idle'), 2000)
    } catch {
      setServerStatus('error')
      setTimeout(() => setServerStatus('idle'), 3000)
    }
  }

  /** 최종제출 시 XLSX(최종) + JSON을 subject 폴더에 저장 후 임시저장 파일 파기 */
  async function handleServerSaveWithExcel(sessionWithFinal: ChecklistSession) {
    const subjectFolderName = buildSubjectFolderName()
    const tempJsonFileName = buildTempJsonFileName()
    const tempXlsxFileName = buildTempXlsxFileName()
    try {
      const { buildExcelBuffer, buildExcelFileName } = await import('../../lib/excel/exportExcel')
      const { buffer } = await buildExcelBuffer(sessionWithFinal, true)
      const finalFileName = buildExcelFileName(sessionWithFinal)
      await gasSaveWithExcel(sessionWithFinal, buffer, finalFileName, subjectFolderName, tempJsonFileName)
      // 임시저장 파일 파기
      await gasDeleteTempFiles(tempJsonFileName, subjectFolderName, tempXlsxFileName)
    } catch {
      await gasSaveSession(sessionWithFinal, tempJsonFileName)
    }
  }

  async function handleServerLoadOpen() {
    setServerLoadError('')
    setShowServerLoad(true)
    try {
      const list = await gasListSessions(subject.employeeId || '', weekType)
      setServerSessions(list)
    } catch (err) {
      setServerLoadError(err instanceof Error ? err.message : '서버 오류')
    }
  }

  async function handleServerLoadSelect(fileId: string) {
    try {
      const session = await gasLoadSession(fileId)
      loadFromSession(session)
      updateEvaluatorMeta({
        preceptorId: session.preceptorId,
        preceptorName: session.preceptorName,
        educatorId: session.educatorId,
        educatorPersonName: session.educatorPersonName,
        headNurseName: session.headNurseName,
      })
      setShowServerLoad(false)
    } catch (err) {
      setServerLoadError(err instanceof Error ? err.message : '불러오기 실패')
    }
  }

  function handleFinalSubmitStart() {
    if (doneCount > 0 && !hasSigned) {
      alert('전자서명을 먼저 완료해주세요.')
      return
    }
    if (role === 'headNurse') {
      const score = headNurseAvgScore ?? 0
      if (score < 70) {
        setPendingScore(score)
        setShowLowScore(true)
        return
      }
    }
    setSignerName(evaluatorInfo?.name ?? '')
    setSignMode('submit')
  }

  function handleLowScoreConfirm(reason: string) {
    setLowScoreReason(reason)
    setShowLowScore(false)
    setSignerName(evaluatorInfo?.name ?? '')
    setSignMode('submit')
  }

  async function handleSignSave(dataUrl: string) {
    const now = new Date().toISOString()
    const name = signerName.trim()

    if (signMode === 'submit') {
      visibleItems.forEach(item => {
        const r = getResult(item.id)
        if (r && r[roleField].score !== null) {
          updateEvaluation(item.id, role, { signatureImage: dataUrl, signerName: name, signedAt: now })
        }
      })
      submitRole(role)
      setSignMode(null)

      const finalSession = buildSession({
        submittedRoles: { ...submittedRoles, [role]: now },
        lowScoreReason: lowScoreReason || undefined,
      })
      await handleServerSaveWithExcel(finalSession)
    } else if (signMode === 'batch') {
      visibleItems.forEach(item => {
        const r = getResult(item.id)
        if (r && r[roleField].score !== null) {
          updateEvaluation(item.id, role, { signatureImage: dataUrl, signerName: name, signedAt: now })
        }
      })
      setSignMode(null)
    }
  }

  const headerInfo = `${subject.name}${subject.employeeId ? ' · ' + subject.employeeId : ''}`

  const serverBtnLabel =
    serverStatus === 'saving' ? '저장중...' :
    serverStatus === 'saved' ? '저장완료!' :
    serverStatus === 'error' ? '오류' : '임시저장'

  const serverBtnClass =
    serverStatus === 'saved' ? 'text-xs text-white bg-emerald-500 rounded-lg px-2 py-1' :
    serverStatus === 'error' ? 'text-xs text-white bg-red-500 rounded-lg px-2 py-1' :
    'text-xs text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg px-2 py-1'

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-gray-400 truncate">{weekType === '4week' ? '4주' : '8주'} · {ROLE_LABELS[role]}</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{headerInfo}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  완료 {doneCount}/{visibleItems.length} · 합계 {totalScore}점
                  {isSubmitted && <span className="ml-2 text-green-600 font-medium">제출완료</span>}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                <button
                  onClick={() => { setSignerName(evaluatorInfo?.name ?? ''); setSignMode('batch') }}
                  className="text-xs text-gray-600 border border-gray-200 rounded-lg px-2 py-1 hover:bg-gray-50"
                >
                  전자서명
                </button>
                <button
                  onClick={handleServerLoadOpen}
                  className="text-xs text-indigo-600 border border-indigo-200 rounded-lg px-2 py-1 hover:bg-indigo-50"
                >
                  임시저장 불러오기
                </button>
                <button
                  onClick={handleServerSave}
                  disabled={serverStatus === 'saving'}
                  className={serverBtnClass}
                >
                  {serverBtnLabel}
                </button>
                <button
                  onClick={() =>
                    import('../../lib/excel/exportExcel')
                      .then(m => m.exportToExcel(buildSession(), isSubmitted))
                      .catch(e => alert((e as Error).message))
                  }
                  className="text-xs text-white bg-green-600 hover:bg-green-700 rounded-lg px-2 py-1"
                >
                  엑셀출력
                </button>
                <button
                  onClick={reset}
                  className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2 py-1"
                >
                  처음으로
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-blue-500 transition-all"
            style={{ width: `${visibleItems.length ? (doneCount / visibleItems.length) * 100 : 0}%` }}
          />
        </div>

        <main className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-3 pb-32">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 mb-3">설문 정보</p>
            {role === 'preceptee' && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">부서</label>
                  <input
                    type="text"
                    value={surveyMeta.department}
                    onChange={e => updateSurveyMeta({ department: e.target.value })}
                    placeholder="예) 내과병동"
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">배치일</label>
                  <input
                    type="date"
                    value={surveyMeta.deploymentDate}
                    onChange={e => updateSurveyMeta({ deploymentDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            )}
            {role === 'preceptor' && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">교육기간 시작일</label>
                  <input
                    type="date"
                    value={surveyMeta.educationPeriodStart}
                    onChange={e => updateSurveyMeta({ educationPeriodStart: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">교육기간 종료일</label>
                  <input
                    type="date"
                    value={surveyMeta.educationPeriodEnd}
                    onChange={e => updateSurveyMeta({ educationPeriodEnd: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            )}
            {(role === 'educator' || role === 'headNurse') && (
              <div className="text-xs text-gray-400">
                {surveyMeta.department && <p>부서: {surveyMeta.department}</p>}
                {surveyMeta.deploymentDate && <p>배치일: {surveyMeta.deploymentDate}</p>}
                {surveyMeta.educationPeriodStart && (
                  <p>교육기간: {surveyMeta.educationPeriodStart} ~ {surveyMeta.educationPeriodEnd}</p>
                )}
                {!surveyMeta.department && !surveyMeta.deploymentDate && !surveyMeta.educationPeriodStart && (
                  <p>프리셉티/프리셉터가 먼저 입력합니다</p>
                )}
              </div>
            )}
          </div>

          {visibleItems.map(item => {
            const result = getResult(item.id)
            if (!result) return null
            return (
              <ChecklistCard
                key={item.id}
                item={item}
                result={result}
                role={role}
                isLocked={isSubmitted}
                onScoreChange={score => updateEvaluation(item.id, role, { score })}
                onEvaluationPatch={patch => updateEvaluation(item.id, role, patch)}
              />
            )
          })}
        </main>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            {role === 'headNurse' && headNurseAvgScore !== null && (
              <span className={`text-sm font-semibold ${headNurseAvgScore < 70 ? 'text-red-500' : 'text-green-600'}`}>
                평균 {headNurseAvgScore.toFixed(1)}점
              </span>
            )}
            <button
              onClick={handleFinalSubmitStart}
              disabled={isSubmitted}
              className="ml-auto bg-purple-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitted ? '제출완료' : '최종 제출'}
            </button>
          </div>
        </div>
      </div>

      {showLowScore && (
        <LowScoreModal
          score={pendingScore}
          onConfirm={handleLowScoreConfirm}
          onCancel={() => setShowLowScore(false)}
        />
      )}

      {signMode !== null && (
        <SignaturePad
          onSave={handleSignSave}
          onCancel={() => setSignMode(null)}
          signerName={signerName}
          onSignerNameChange={setSignerName}
        />
      )}

      {showServerLoad && (
        <ServerLoadModal
          sessions={serverSessions}
          error={serverLoadError}
          onSelect={handleServerLoadSelect}
          onClose={() => setShowServerLoad(false)}
        />
      )}
    </>
  )
}
