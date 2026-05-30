import { useMemo, useRef, useState } from 'react'
import { useAppContext } from '../../features/checklist/ChecklistContext'
import { useEvaluations } from '../../features/evaluations/useEvaluations'
import { getChecklist } from '../../data/checklistData'
import { ROLE_LABELS } from '../../types/userRole'
import { downloadSession, readSessionFile } from '../../features/storage/jsonIO'
import type { ChecklistSession } from '../../types/evaluation'
import ChecklistCard from './ChecklistCard'
import LowScoreModal from '../common/LowScoreModal'
import SignaturePad from '../signature/SignaturePad'

export default function ChecklistScreen() {
  const { role, weekType: rawWeekType, reset } = useAppContext()
  const weekType = rawWeekType!
  if (!role || !rawWeekType) return null

  const allItems = useMemo(() => getChecklist(weekType), [weekType])

  const visibleItems = useMemo(() => {
    if (role === 'educator') return allItems.filter(i => i.evaluatorType === 'educator')
    if (role === 'preceptor') return allItems.filter(i => i.evaluatorType === 'preceptor')
    return allItems
  }, [allItems, role])

  const { results, updateEvaluation, getResult, loadFromSession } = useEvaluations(allItems, { weekType })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showLowScore, setShowLowScore] = useState(false)
  const [pendingScore, setPendingScore] = useState(0)
  const [showFinalSign, setShowFinalSign] = useState(false)
  const [finalSignerName, setFinalSignerName] = useState('')

  const doneCount = useMemo(() => {
    const field = role === 'preceptee' ? 'preceptee'
      : role === 'preceptor' ? 'preceptor'
      : role === 'educator' ? 'educator'
      : 'headNurse'
    return visibleItems.filter(item => {
      const r = getResult(item.id)
      return r && r[field].score !== null
    }).length
  }, [results, visibleItems, role, getResult])

  // 수간호사: 최종 평균 점수 (0~3점 → 100점 환산)
  const headNurseAvgScore = useMemo(() => {
    if (role !== 'headNurse') return null
    const scored = results.filter(r => r.headNurse.score !== null)
    if (!scored.length) return null
    const avg = scored.reduce((s, r) => s + (r.headNurse.score ?? 0), 0) / scored.length
    return (avg / 3) * 100
  }, [results, role])

  function handleDownload() {
    const session: ChecklistSession = {
      id: `${weekType}_${Date.now()}`,
      targetName: '',
      weekType,
      department: '',
      startDate: '',
      results,
      savedAt: new Date().toISOString(),
    }
    downloadSession(session)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const session = await readSessionFile(file)
      loadFromSession(session)
    } catch (err) {
      alert(err instanceof Error ? err.message : '파일 오류')
    } finally {
      e.target.value = ''
    }
  }

  // 수간호사 최종 서명 시작
  function handleFinalSignStart() {
    const score = headNurseAvgScore ?? 0
    if (score < 70) {
      setPendingScore(score)
      setShowLowScore(true)
    } else {
      setShowFinalSign(true)
    }
  }

  function handleLowScoreConfirm(reason: string) {
    setShowLowScore(false)
    // reason은 추후 session에 저장 가능
    void reason
    setShowFinalSign(true)
  }

  function handleFinalSignSave(dataUrl: string) {
    // 수간호사 서명을 모든 headNurse 평가에 일괄 적용
    const now = new Date().toISOString()
    results.forEach(r => {
      updateEvaluation(r.itemId, 'headNurse', {
        signatureImage: dataUrl,
        signerName: finalSignerName,
        signedAt: now,
      })
    })
    setShowFinalSign(false)
    handleDownload()
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">{weekType === '4week' ? '4주' : '8주'} 체크리스트</p>
              <p className="text-sm font-semibold text-gray-800">{ROLE_LABELS[role]}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 mr-1">{doneCount} / {visibleItems.length}</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-2 py-1"
              >
                불러오기
              </button>
              <button
                onClick={handleDownload}
                className="text-xs text-white bg-blue-500 hover:bg-blue-600 rounded-lg px-2 py-1"
              >
                저장
              </button>
              <button
                onClick={() =>
                  import('../../lib/excel/exportExcel')
                    .then(m => m.exportToExcel(results, weekType, ''))
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
        </header>

        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-blue-500 transition-all"
            style={{ width: `${visibleItems.length ? (doneCount / visibleItems.length) * 100 : 0}%` }}
          />
        </div>

        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />

        <main className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-3 pb-32">
          {visibleItems.map(item => {
            const result = getResult(item.id)
            if (!result) return null
            return (
              <ChecklistCard
                key={item.id}
                item={item}
                result={result}
                role={role}
                onScoreChange={score => updateEvaluation(item.id, role, { score })}
                onMemoChange={memo => updateEvaluation(item.id, role, { memo })}
                onEvaluationPatch={patch => updateEvaluation(item.id, role, patch)}
              />
            )
          })}
        </main>

        {/* 수간호사 최종 서명 버튼 */}
        {role === 'headNurse' && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
            <div className="max-w-2xl mx-auto flex items-center justify-between">
              {headNurseAvgScore !== null && (
                <span className={`text-sm font-semibold ${headNurseAvgScore < 70 ? 'text-red-500' : 'text-green-600'}`}>
                  평균 {headNurseAvgScore.toFixed(1)}점
                </span>
              )}
              <button
                onClick={handleFinalSignStart}
                className="ml-auto bg-purple-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-purple-700"
              >
                최종 서명 및 저장
              </button>
            </div>
          </div>
        )}
      </div>

      {showLowScore && (
        <LowScoreModal
          score={pendingScore}
          onConfirm={handleLowScoreConfirm}
          onCancel={() => setShowLowScore(false)}
        />
      )}

      {showFinalSign && (
        <SignaturePad
          onSave={handleFinalSignSave}
          onCancel={() => setShowFinalSign(false)}
          signerName={finalSignerName}
          onSignerNameChange={setFinalSignerName}
        />
      )}
    </>
  )
}
