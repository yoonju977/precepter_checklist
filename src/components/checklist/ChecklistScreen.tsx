import { useMemo, useState, useRef } from 'react'
import { useAppContext } from '../../features/checklist/ChecklistContext'
import { useEvaluations } from '../../features/evaluations/useEvaluations'
import { getChecklist } from '../../data/checklistData'
import { ROLE_LABELS } from '../../types/userRole'
import type { ChecklistSession } from '../../types/evaluation'
import { gasSaveWithExcel, gasSaveSession, gasListSessions, gasLoadSession, gasDeleteTempFiles, gasSaveSignatureImage } from '../../lib/googleDrive/gasClient'
import type { SessionMeta } from '../../lib/googleDrive/gasClient'
import ChecklistCard from './ChecklistCard'
import LowScoreModal from '../common/LowScoreModal'
import SignaturePad from '../signature/SignaturePad'
import ServerLoadModal from '../common/ServerLoadModal'
import SaveCompleteModal from '../common/SaveCompleteModal'
import SavingModal from '../common/SavingModal'
import FinalSubmitModal from '../common/FinalSubmitModal'
import UnansweredModal from '../common/UnansweredModal'
import Header from '../common/Header'
import { buildUnifiedFileName } from '../../lib/excel/fileNames'

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

  // Group visible items by category
  const groups = useMemo(() => {
    const out: { cat: string; items: typeof visibleItems }[] = []
    const idx: Record<string, number> = {}
    visibleItems.forEach(item => {
      if (idx[item.category] == null) { idx[item.category] = out.length; out.push({ cat: item.category, items: [] }) }
      out[idx[item.category]].items.push(item)
    })
    return out
  }, [visibleItems])

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

  const [bulkDate, setBulkDate] = useState('')
  const bulkScoreApplied = useRef(false)

  const [showLowScore, setShowLowScore] = useState(false)
  const [pendingScore, setPendingScore] = useState(0)
  const [lowScoreReason, setLowScoreReason] = useState('')

  const [signMode, setSignMode] = useState<'submit' | 'batch' | null>(null)
  const [signerName, setSignerName] = useState('')

  const [serverStatus, setServerStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [showSaving, setShowSaving] = useState(false)
  const [showSaveComplete, setShowSaveComplete] = useState(false)
  const [showServerLoad, setShowServerLoad] = useState(false)
  const [serverSessions, setServerSessions] = useState<SessionMeta[]>([])
  const [serverLoadError, setServerLoadError] = useState('')

  const [showFinalSubmit, setShowFinalSubmit] = useState(false)
  const [showUnanswered, setShowUnanswered] = useState(false)
  const [unansweredNums, setUnansweredNums] = useState<number[]>([])

  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const evalScorePct = useMemo(() => {
    if (role === 'preceptee') return null
    const maxScore = visibleItems.length * 3
    if (maxScore === 0) return null
    return Math.round((totalScore / maxScore) * 100 * 10) / 10
  }, [totalScore, visibleItems, role])

  const hasSigned = useMemo(() => {
    return visibleItems.some(item => {
      const r = getResult(item.id)
      return r && r[roleField].signatureImage !== null
    })
  }, [results, visibleItems, roleField, getResult])

  const existingSignature = useMemo(() => {
    for (const r of results) {
      const ev = r[roleField as keyof typeof r] as { signatureImage?: string | null }
      if (ev.signatureImage) return ev.signatureImage as string
    }
    return null
  }, [results, roleField])

  const isSubmitted = submittedRoles[role] != null

  const currentEvaluatorId = role === 'preceptee' ? (subject.employeeId || '')
    : (evaluatorInfo?.employeeId || '')
  const currentEvaluatorName = role === 'preceptee' ? (subject.name || '')
    : (evaluatorInfo?.name || '')

  function flashToast(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }

  function buildFileNames() {
    const base = {
      subjectEmployeeId: subject.employeeId || '',
      subjectName: subject.name || '',
      role,
      evaluatorName: currentEvaluatorName,
      evaluatorId: currentEvaluatorId,
    }
    return {
      tempJson: buildUnifiedFileName({ ...base, status: '임시저장', ext: 'json' }),
      tempXlsx: buildUnifiedFileName({ ...base, status: '임시저장', ext: 'xlsx' }),
      finalXlsx: buildUnifiedFileName({ ...base, status: '최종제출', ext: 'xlsx' }),
      finalJson: buildUnifiedFileName({ ...base, status: '최종제출', ext: 'json' }),
    }
  }

  function buildSubjectFolderName(): string {
    return `${(subject.employeeId || '').trim()}_${(subject.name || '').trim()}`
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

  function handleBulkDateChange(date: string) {
    setBulkDate(date)
    if (!date) return
    allItems.forEach(item => updateEvaluation(item.id, 'preceptee', { educationDate: date }))
  }

  function handleScoreChange(itemId: string, score: number) {
    const hasAnyScore = visibleItems.some(item => {
      const r = getResult(item.id)
      return r && r[roleField].score !== null
    })
    if (!hasAnyScore && !bulkScoreApplied.current) {
      bulkScoreApplied.current = true
      visibleItems.forEach(item => updateEvaluation(item.id, role, { score }))
      flashToast(`전체 ${visibleItems.length}개 문항에 ${score}점을 적용했어요 · 개별 수정 가능`)
    } else {
      updateEvaluation(itemId, role, { score })
    }
  }

  async function handleServerSave() {
    if (doneCount > 0 && !hasSigned) {
      alert('전자서명을 먼저 완료해주세요.')
      return
    }
    setServerStatus('saving')
    setShowSaving(true)
    try {
      const session = buildSession()
      const { tempJson, tempXlsx } = buildFileNames()
      const subjectFolderName = buildSubjectFolderName()
      try {
        const { buildExcelBuffer } = await import('../../lib/excel/exportExcel')
        const { buffer } = await buildExcelBuffer(session, false)
        await gasSaveWithExcel(session, buffer, tempXlsx, subjectFolderName, tempJson)
      } catch {
        await gasSaveSession(session, tempJson)
      }
      setShowSaving(false)
      setServerStatus('saved')
      setShowSaveComplete(true)
    } catch {
      setShowSaving(false)
      setServerStatus('error')
      setTimeout(() => setServerStatus('idle'), 3000)
    }
  }

  async function handleServerSaveWithExcel(sessionWithFinal: ChecklistSession) {
    const subjectFolderName = buildSubjectFolderName()
    const { tempJson, tempXlsx, finalXlsx } = buildFileNames()
    try {
      const { buildExcelBuffer } = await import('../../lib/excel/exportExcel')
      const { buffer } = await buildExcelBuffer(sessionWithFinal, true)
      await gasSaveWithExcel(sessionWithFinal, buffer, finalXlsx, subjectFolderName, tempJson)
      await gasDeleteTempFiles(tempJson, subjectFolderName, tempXlsx)
    } catch {
      await gasSaveSession(sessionWithFinal, tempJson)
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
    const unanswered = visibleItems
      .filter(item => { const r = getResult(item.id); return !r || r[roleField].score === null })
      .map(item => parseInt(item.id.replace(`${weekType}_`, ''), 10))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b)

    if (unanswered.length > 0) {
      setUnansweredNums(unanswered)
      setShowUnanswered(true)
      return
    }
    if (role === 'headNurse') {
      const score = headNurseAvgScore ?? 0
      if (score < 70) { setPendingScore(score); setShowLowScore(true); return }
    }
    setShowFinalSubmit(true)
  }

  function handleLowScoreConfirm(reason: string) {
    setLowScoreReason(reason)
    setShowLowScore(false)
    setShowFinalSubmit(true)
  }

  async function doFinalSubmit() {
    setShowFinalSubmit(false)
    const now = new Date().toISOString()
    const name = signerName.trim() || currentEvaluatorName
    if (existingSignature) {
      await applySignatureAndSubmit(existingSignature, now, name)
    } else {
      setSignMode('submit')
    }
  }

  async function applySignatureAndSubmit(dataUrl: string, now: string, name: string) {
    const updatedResults = results.map(r => {
      const ev = r[roleField]
      if (ev.score !== null) {
        return { ...r, [roleField]: { ...ev, signatureImage: dataUrl, signerName: name, signedAt: now } }
      }
      return r
    })
    visibleItems.forEach(item => {
      const r = getResult(item.id)
      if (r && r[roleField].score !== null) {
        updateEvaluation(item.id, role, { signatureImage: dataUrl, signerName: name, signedAt: now })
      }
    })
    submitRole(role)
    const finalSession = buildSession({
      results: updatedResults,
      submittedRoles: { ...submittedRoles, [role]: now },
      lowScoreReason: lowScoreReason || undefined,
    })
    await handleServerSaveWithExcel(finalSession)
    reset()
  }

  async function handleSignSave(dataUrl: string) {
    const now = new Date().toISOString()
    const name = signerName.trim() || currentEvaluatorName
    const sigBase64 = dataUrl.split(',')[1]
    gasSaveSignatureImage(sigBase64, name, currentEvaluatorId).catch(() => {})
    if (signMode === 'submit') {
      await applySignatureAndSubmit(dataUrl, now, name)
      setSignMode(null)
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

  function handleSignatureButtonClick() {
    setSignerName(evaluatorInfo?.name ?? currentEvaluatorName)
    if (existingSignature && hasSigned) {
      const now = new Date().toISOString()
      const name = evaluatorInfo?.name ?? currentEvaluatorName
      visibleItems.forEach(item => {
        const r = getResult(item.id)
        if (r && r[roleField].score !== null) {
          updateEvaluation(item.id, role, { signatureImage: existingSignature, signerName: name, signedAt: now })
        }
      })
      alert('기존 서명이 적용되었습니다.')
    } else {
      setSignMode('batch')
    }
  }

  const pct = visibleItems.length ? Math.round((doneCount / visibleItems.length) * 100) : 0
  const roleLabel = ROLE_LABELS[role]

  // Build running item index across groups
  let itemCounter = 0

  return (
    <div className="cl">
      <Header
        title={`${weekType === '4week' ? '4주' : '8주'} 체크리스트`}
        sub={`${subject.name} · ${roleLabel}${evaluatorInfo?.name ? ' · ' + evaluatorInfo.name : ''}`}
        onBack={reset}
        chip={isSubmitted ? '제출완료' : `${roleLabel} 평가`}
      />

      {/* Progress strip */}
      <div className="prog">
        <div className="prog__row">
          <span className="prog__meta">입력 <b className="t-num">{doneCount}</b> / {visibleItems.length}</span>
          <span className="prog__spacer" />
          {role !== 'preceptee' && evalScorePct !== null && (
            <span className="prog__total">
              총점 <span className="t-num" style={{ color: evalScorePct < 70 ? 'var(--danger)' : 'var(--crimson-700)', fontSize: 14 }}>
                {evalScorePct.toFixed(1)}점
              </span>
            </span>
          )}
        </div>
        <div className="prog__bar"><div className="prog__fill" style={{ width: `${pct}%` }} /></div>
      </div>

      {/* Survey meta (preceptee / preceptor) */}
      {(role === 'preceptee' || role === 'preceptor') && (
        <div className="meta-panel">
          <div className="meta-panel__title">설문 정보</div>
          <div className="meta-grid">
            <div className="meta-field">
              <label>부서</label>
              <input type="text" value={surveyMeta.department}
                onChange={e => updateSurveyMeta({ department: e.target.value })}
                placeholder="예) 내과병동" />
            </div>
            {role === 'preceptee' && (
              <>
                <div className="meta-field">
                  <label>배치일</label>
                  <input type="date" value={surveyMeta.deploymentDate}
                    onChange={e => updateSurveyMeta({ deploymentDate: e.target.value })} />
                </div>
                <div className="meta-field">
                  <label>교육기간 시작일</label>
                  <input type="date" value={surveyMeta.educationPeriodStart}
                    onChange={e => updateSurveyMeta({ educationPeriodStart: e.target.value })} />
                </div>
                <div className="meta-field">
                  <label>교육기간 종료일</label>
                  <input type="date" value={surveyMeta.educationPeriodEnd}
                    onChange={e => updateSurveyMeta({ educationPeriodEnd: e.target.value })} />
                </div>
                <div className="meta-field" style={{ gridColumn: '1 / -1' }}>
                  <label>교육 실행일 (전체 일괄 적용)</label>
                  <input type="date" value={bulkDate} onChange={e => handleBulkDateChange(e.target.value)} />
                  <p className="meta-hint">선택 시 전 문항 일괄 적용 · 각 문항에서 개별 수정 가능</p>
                </div>
              </>
            )}
            {role === 'preceptor' && (
              <>
                <div className="meta-field">
                  <label>교육기간 시작일</label>
                  <input type="date" value={surveyMeta.educationPeriodStart}
                    onChange={e => updateSurveyMeta({ educationPeriodStart: e.target.value })} />
                </div>
                <div className="meta-field">
                  <label>교육기간 종료일</label>
                  <input type="date" value={surveyMeta.educationPeriodEnd}
                    onChange={e => updateSurveyMeta({ educationPeriodEnd: e.target.value })} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bulk-score hint */}
      {doneCount === 0 && !bulkScoreApplied.current && visibleItems.length > 1 && (
        <div className="bulk-hint">
          첫 번째 점수 입력 시 전체 {visibleItems.length}개 문항에 자동 적용됩니다. 이후 개별 수정하세요.
        </div>
      )}

      {/* Checklist rows grouped by category */}
      <div style={{ flex: 1 }}>
        {groups.map(g => {
          const gAns = g.items.filter(i => { const r = getResult(i.id); return r && r[roleField].score !== null }).length
          return (
            <section key={g.cat}>
              <div className="grp__head">
                <span className="grp__name">{g.cat}</span>
                <span className="grp__count">{g.items.length}문항</span>
                <span className="grp__done t-num">{gAns}/{g.items.length}</span>
              </div>
              {g.items.map(item => {
                itemCounter++
                const result = getResult(item.id)
                if (!result) return null
                return (
                  <ChecklistCard
                    key={item.id}
                    item={item}
                    itemIndex={itemCounter}
                    result={result}
                    role={role}
                    isLocked={isSubmitted}
                    onScoreChange={score => handleScoreChange(item.id, score)}
                    onEvaluationPatch={patch => updateEvaluation(item.id, role, patch)}
                  />
                )
              })}
            </section>
          )
        })}
        <div style={{ height: 8 }} />
      </div>

      {/* Sticky action bar */}
      <div className="actionbar">
        <button
          className={`btn btn--secondary btn--sm ${hasSigned ? 'sig-pill--done' : ''}`}
          style={hasSigned ? { borderColor: 'var(--crimson-300)', color: 'var(--crimson-700)', background: 'var(--crimson-50)' } : {}}
          onClick={handleSignatureButtonClick}
        >
          {hasSigned ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          )}
          {hasSigned ? '서명됨' : '전자서명'}
        </button>

        <button className="btn btn--secondary btn--sm" onClick={handleServerLoadOpen}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="8 17 12 21 16 17" /><line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
          </svg>
          불러오기
        </button>

        <button
          className={`btn btn--sm ${serverStatus === 'error' ? 'btn--danger-outline' : 'btn--secondary'}`}
          onClick={handleServerSave}
          disabled={serverStatus === 'saving'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
          </svg>
          {serverStatus === 'saving' ? '저장중…' : serverStatus === 'error' ? '오류' : '임시저장'}
        </button>

        <button
          className="btn btn--primary btn--sm grow"
          onClick={handleFinalSubmitStart}
          disabled={isSubmitted}
        >
          {isSubmitted ? '제출완료' : '최종 제출'}
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}

      {showLowScore && (
        <LowScoreModal score={pendingScore} onConfirm={handleLowScoreConfirm} onCancel={() => setShowLowScore(false)} />
      )}

      {showFinalSubmit && (
        <FinalSubmitModal
          role={role}
          evaluatorName={currentEvaluatorName}
          evaluatorId={currentEvaluatorId}
          evalScorePct={evalScorePct}
          onConfirm={doFinalSubmit}
          onCancel={async () => { setShowFinalSubmit(false); await handleServerSave() }}
        />
      )}

      {showUnanswered && (
        <UnansweredModal itemNums={unansweredNums} onClose={() => setShowUnanswered(false)} />
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

      {showSaving && <SavingModal />}

      {showSaveComplete && (
        <SaveCompleteModal
          onGoHome={() => { setShowSaveComplete(false); setServerStatus('idle'); reset() }}
          onContinue={() => { setShowSaveComplete(false); setServerStatus('idle') }}
        />
      )}
    </div>
  )
}
