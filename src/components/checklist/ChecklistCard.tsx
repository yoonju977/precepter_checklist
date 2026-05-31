import ScoreInput from './ScoreInput'
import type { ChecklistItem } from '../../types/checklist'
import type { ChecklistItemResult, Evaluation } from '../../types/evaluation'
import type { Role } from '../../types/userRole'

type Props = {
  item: ChecklistItem
  result: ChecklistItemResult
  role: Role
  isLocked: boolean
  onScoreChange: (score: number) => void
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

export default function ChecklistCard({ item, result, role, isLocked, onScoreChange, onEvaluationPatch }: Props) {
  const roleField = role === 'preceptee' ? 'preceptee'
    : role === 'preceptor' ? 'preceptor'
    : role === 'educator' ? 'educator'
    : 'headNurse'
  const myEval = result[roleField]

  const educatorEval = item.evaluatorType === 'preceptor' ? result.preceptor : result.educator

  // 교육자 날짜: 프리셉티 입력 우선, 없으면 해당 교육자 입력값
  const educatorDatePlaceholder = result.preceptee.educationDate

  return (
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

      {/* 자가평가 점수 열람 (교육자·수간호사 — 프리셉티가 입력한 경우) */}
      {role !== 'preceptee' && result.preceptee.score !== null && (
        <div className="bg-blue-50 rounded-lg p-2.5 mb-3 text-xs">
          <p className="text-blue-500 font-medium mb-1">자가평가</p>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-800">{result.preceptee.score}점</span>
            {result.preceptee.educationDate && (
              <span className="text-gray-500">교육일: {result.preceptee.educationDate}</span>
            )}
          </div>
        </div>
      )}

      {/* 교육자 평가 열람 (수간호사) */}
      {role === 'headNurse' && educatorEval.score !== null && (
        <div className={`rounded-lg p-2.5 mb-3 text-xs ${item.evaluatorType === 'preceptor' ? 'bg-green-50' : 'bg-yellow-50'}`}>
          <p className={`font-medium mb-1 ${item.evaluatorType === 'preceptor' ? 'text-green-600' : 'text-yellow-600'}`}>
            {item.evaluatorType === 'preceptor' ? '프리셉터' : '교육전담'} 평가
            {educatorEval.signerName && ` — ${educatorEval.signerName}`}
          </p>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-800">{educatorEval.score}점</span>
            {educatorEval.educationDate && (
              <span className="text-gray-500">교육일: {educatorEval.educationDate}</span>
            )}
          </div>
        </div>
      )}

      {/* 내 평가 입력 */}
      <div>
        <p className="text-xs text-gray-400 mb-2">{ROLE_LABEL[role]}</p>
        <ScoreInput value={myEval.score} onChange={onScoreChange} disabled={isLocked} />

        {/* 교육실행일 입력 (프리셉티·프리셉터·교육전담) */}
        {(role === 'preceptee' || role === 'preceptor' || role === 'educator') && (
          <div className="mt-2">
            <label className="block text-xs text-gray-400 mb-1">교육 실행일</label>
            <input
              type="date"
              value={myEval.educationDate}
              placeholder={role !== 'preceptee' ? educatorDatePlaceholder : undefined}
              disabled={isLocked}
              onChange={e => onEvaluationPatch({ educationDate: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 disabled:opacity-40"
            />
            {/* 교육자 화면: 프리셉티 입력 날짜 힌트 */}
            {role !== 'preceptee' && !myEval.educationDate && educatorDatePlaceholder && (
              <p className="text-xs text-blue-400 mt-0.5">대상자 입력: {educatorDatePlaceholder}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
