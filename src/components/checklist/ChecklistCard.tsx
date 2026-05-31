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
  하: 'text-green-600',
  중: 'text-yellow-600',
  상: 'text-red-600',
}

export default function ChecklistCard({ item, result, role, isLocked, onScoreChange, onEvaluationPatch }: Props) {
  const roleField = role === 'preceptee' ? 'preceptee'
    : role === 'preceptor' ? 'preceptor'
    : role === 'educator' ? 'educator'
    : 'headNurse'
  const myEval = result[roleField]
  const educatorEval = item.evaluatorType === 'preceptor' ? result.preceptor : result.educator
  const educatorDateHint = result.preceptee.educationDate

  return (
    <div className={[
      'bg-white rounded-lg border px-3 py-2 shadow-sm',
      item.evaluatorType === 'educator' ? 'border-l-4 border-l-yellow-400 border-t-0 border-r-0 border-b-0 border border-gray-200' : 'border-gray-200',
    ].join(' ')}>
      {/* 헤더: 번호·분류·난이도 한 줄 */}
      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
        <span className="text-xs text-gray-400 shrink-0">#{item.id}</span>
        {item.difficulty && (
          <span className={`text-xs font-semibold shrink-0 ${DIFFICULTY_COLOR[item.difficulty] ?? 'text-gray-400'}`}>
            [{item.difficulty}]
          </span>
        )}
        {item.evaluatorType === 'educator' && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded shrink-0">교육전담</span>
        )}
        <span className="text-xs text-gray-400 truncate">{item.category}{item.subCategory ? ` · ${item.subCategory}` : ''}</span>
        {isLocked && <span className="ml-auto text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded shrink-0">완료</span>}
      </div>

      {/* 교육 내용 */}
      <p className="text-sm text-gray-800 leading-snug mb-2 line-clamp-3">{item.content}</p>

      {/* 자가평가 열람 (교육자·수간호사) */}
      {role !== 'preceptee' && result.preceptee.score !== null && (
        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded px-2 py-1 mb-2">
          <span className="font-medium">자가</span>
          <span className="font-bold">{result.preceptee.score}점</span>
          {result.preceptee.educationDate && (
            <span className="text-gray-400 ml-auto">{result.preceptee.educationDate}</span>
          )}
        </div>
      )}

      {/* 교육자 평가 열람 (수간호사) */}
      {role === 'headNurse' && educatorEval.score !== null && (
        <div className={`flex items-center gap-2 text-xs rounded px-2 py-1 mb-2 ${
          item.evaluatorType === 'preceptor' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
        }`}>
          <span className="font-medium">{item.evaluatorType === 'preceptor' ? '프리셉터' : '교육전담'}</span>
          {educatorEval.signerName && <span className="text-gray-500">{educatorEval.signerName}</span>}
          <span className="font-bold">{educatorEval.score}점</span>
          {educatorEval.educationDate && (
            <span className="text-gray-400 ml-auto">{educatorEval.educationDate}</span>
          )}
        </div>
      )}

      {/* 점수 입력 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400 shrink-0">{ROLE_LABEL[role]}</span>
        <ScoreInput value={myEval.score} onChange={onScoreChange} disabled={isLocked} />
      </div>

      {/* 교육실행일 입력 (프리셉티·프리셉터·교육전담) */}
      {(role === 'preceptee' || role === 'preceptor' || role === 'educator') && (
        <div className="mt-1.5 flex items-center gap-2">
          <label className="text-xs text-gray-400 shrink-0">교육일</label>
          <input
            type="date"
            value={myEval.educationDate}
            disabled={isLocked}
            onChange={e => onEvaluationPatch({ educationDate: e.target.value })}
            className="flex-1 border border-gray-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-blue-400 disabled:opacity-40"
          />
          {role !== 'preceptee' && !myEval.educationDate && educatorDateHint && (
            <span className="text-xs text-blue-400 shrink-0">대상자: {educatorDateHint}</span>
          )}
        </div>
      )}
    </div>
  )
}
