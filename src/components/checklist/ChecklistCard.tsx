import { useState } from 'react'
import ScoreInput from './ScoreInput'
import SignaturePad from '../signature/SignaturePad'
import type { ChecklistItem } from '../../types/checklist'
import type { ChecklistItemResult, Evaluation } from '../../types/evaluation'
import type { Role } from '../../types/userRole'

type Props = {
  item: ChecklistItem
  result: ChecklistItemResult
  role: Role
  onScoreChange: (score: number) => void
  onMemoChange: (memo: string) => void
  onEvaluationPatch: (patch: Partial<Evaluation>) => void
}

const ROLE_LABEL: Record<Role, string> = {
  preceptee: '자가평가',
  preceptor: '프리셉터 평가',
  educator: '교육전담 평가',
  headNurse: '수간호사 최종평가',
}

const DIFFICULTY_COLOR: Record<string, string> = {
  하: 'bg-green-100 text-green-700',
  중: 'bg-yellow-100 text-yellow-700',
  상: 'bg-red-100 text-red-700',
}

export default function ChecklistCard({ item, result, role, onScoreChange, onMemoChange, onEvaluationPatch }: Props) {
  const [showSignPad, setShowSignPad] = useState(false)
  const [pendingSignerName, setPendingSignerName] = useState('')

  const myEval = result[role === 'preceptee' ? 'preceptee'
    : role === 'preceptor' ? 'preceptor'
    : role === 'educator' ? 'educator'
    : 'headNurse']

  const precepteeEval = result.preceptee
  const preceptorEval = result.preceptor
  const educatorEval = result.educator

  const isLocked = role === 'preceptor'
    && result.preceptor.signedAt !== null
    && result.preceptor.signerName !== ''

  function handleSignSave(dataUrl: string) {
    onEvaluationPatch({
      signatureImage: dataUrl,
      signerName: pendingSignerName.trim(),
      signedAt: new Date().toISOString(),
    })
    setShowSignPad(false)
  }

  function handleSignOpen() {
    setPendingSignerName(myEval.signerName)
    setShowSignPad(true)
  }

  function handleSignClear() {
    onEvaluationPatch({ signatureImage: null, signerName: '', signedAt: null })
  }

  return (
    <>
      <div className={[
        'bg-white rounded-xl border p-4 shadow-sm',
        item.evaluatorType === 'educator' ? 'border-l-4 border-l-yellow-400' : 'border-gray-200',
      ].join(' ')}>
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs text-gray-400">#{item.id}</span>
              <span className="text-xs text-gray-500">{item.category}</span>
              {item.subCategory && <span className="text-xs text-gray-400">· {item.subCategory}</span>}
              {item.difficulty && (
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${DIFFICULTY_COLOR[item.difficulty] ?? 'bg-gray-100 text-gray-500'}`}>
                  {item.difficulty}
                </span>
              )}
              {item.evaluatorType === 'educator' && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">교육전담</span>
              )}
            </div>
            <p className="text-sm text-gray-800 leading-snug">{item.content}</p>
          </div>
          {isLocked && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded shrink-0">평가완료</span>}
        </div>

        {/* 자가평가 열람 (프리셉터·교육전담·수간호사) */}
        {role !== 'preceptee' && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs">
            <p className="text-gray-400 mb-1">자가평가</p>
            <div className="flex items-center gap-3">
              <span className={`font-semibold ${precepteeEval.score !== null ? 'text-gray-800' : 'text-gray-300'}`}>
                {precepteeEval.score !== null ? `${precepteeEval.score}점` : '미입력'}
              </span>
              {precepteeEval.memo && <span className="text-gray-500">{precepteeEval.memo}</span>}
            </div>
          </div>
        )}

        {/* 프리셉터 평가 열람 (수간호사) */}
        {role === 'headNurse' && item.evaluatorType === 'preceptor' && (
          <div className="bg-green-50 rounded-lg p-3 mb-3 text-xs">
            <p className="text-green-600 mb-1">프리셉터 평가{preceptorEval.signerName && ` — ${preceptorEval.signerName}`}</p>
            <div className="flex items-center gap-3">
              <span className={`font-semibold ${preceptorEval.score !== null ? 'text-gray-800' : 'text-gray-300'}`}>
                {preceptorEval.score !== null ? `${preceptorEval.score}점` : '미입력'}
              </span>
              {preceptorEval.memo && <span className="text-gray-500">{preceptorEval.memo}</span>}
            </div>
          </div>
        )}

        {/* 교육전담 평가 열람 (수간호사) */}
        {role === 'headNurse' && item.evaluatorType === 'educator' && (
          <div className="bg-yellow-50 rounded-lg p-3 mb-3 text-xs">
            <p className="text-yellow-600 mb-1">교육전담 평가{educatorEval.signerName && ` — ${educatorEval.signerName}`}</p>
            <div className="flex items-center gap-3">
              <span className={`font-semibold ${educatorEval.score !== null ? 'text-gray-800' : 'text-gray-300'}`}>
                {educatorEval.score !== null ? `${educatorEval.score}점` : '미입력'}
              </span>
              {educatorEval.memo && <span className="text-gray-500">{educatorEval.memo}</span>}
            </div>
          </div>
        )}

        {/* 내 평가 입력 */}
        <div>
          <p className="text-xs text-gray-400 mb-2">{ROLE_LABEL[role]}</p>
          <ScoreInput value={myEval.score} onChange={onScoreChange} disabled={isLocked} />
          <textarea
            className="mt-2 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-blue-400 disabled:opacity-40"
            rows={2}
            placeholder="메모 (선택)"
            value={myEval.memo}
            disabled={isLocked}
            onChange={e => onMemoChange(e.target.value)}
          />
        </div>

        {/* 서명 영역 */}
        {!isLocked && (
          <div className="mt-3 flex items-center gap-3">
            {myEval.signatureImage ? (
              <>
                <img src={myEval.signatureImage} alt="서명" className="h-10 border border-gray-200 rounded" />
                <span className="text-xs text-gray-500">{myEval.signerName}</span>
                <button onClick={handleSignClear} className="text-xs text-red-400 hover:text-red-600 ml-auto">삭제</button>
              </>
            ) : (
              <button
                onClick={handleSignOpen}
                className="text-xs border border-dashed border-gray-300 rounded-lg px-3 py-1.5 text-gray-400 hover:border-blue-400 hover:text-blue-500"
              >
                + 서명
              </button>
            )}
          </div>
        )}
      </div>

      {showSignPad && (
        <SignaturePad
          onSave={handleSignSave}
          onCancel={() => setShowSignPad(false)}
          signerName={pendingSignerName}
          onSignerNameChange={setPendingSignerName}
        />
      )}
    </>
  )
}
