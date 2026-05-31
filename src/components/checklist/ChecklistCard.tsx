import ScoreInput from './ScoreInput'
import type { ChecklistItem } from '../../types/checklist'
import type { ChecklistItemResult, Evaluation } from '../../types/evaluation'
import type { Role } from '../../types/userRole'

type Props = {
  item: ChecklistItem
  itemIndex: number
  result: ChecklistItemResult
  role: Role
  isLocked: boolean
  onScoreChange: (score: number) => void
  onEvaluationPatch: (patch: Partial<Evaluation>) => void
}

export default function ChecklistCard({ item, itemIndex, result, role, isLocked, onScoreChange }: Props) {
  const roleField = role === 'preceptee' ? 'preceptee'
    : role === 'preceptor' ? 'preceptor'
    : role === 'educator' ? 'educator'
    : 'headNurse'
  const myEval = result[roleField]
  const answered = myEval.score !== null
  const isEdu = item.evaluatorType === 'educator'

  const precepteeScore = result.preceptee.score
  const preceptorScore = result.preceptor.score
  const educatorScore = result.educator.score

  return (
    <div className={[
      'item',
      isEdu ? 'item--edu' : '',
      answered ? 'item--answered' : '',
      isLocked ? 'item--locked' : '',
    ].filter(Boolean).join(' ')}>
      <span className="item__num t-num">{itemIndex}</span>
      <div className="item__main">
        <div className="item__text">
          {item.content}
          {item.difficulty && (
            <span className={`diff diff--${item.difficulty}`}>{item.difficulty}</span>
          )}
        </div>
        {/* Scores from other roles */}
        {(role !== 'preceptee') && (precepteeScore !== null || preceptorScore !== null || educatorScore !== null) && (
          <div className="item__meta">
            {precepteeScore !== null && (
              <span className="well well--self">자가 <b className="t-num">{precepteeScore}</b></span>
            )}
            {role === 'headNurse' && isEdu && educatorScore !== null && (
              <span className="well well--educator">교육전담 <b className="t-num">{educatorScore}</b></span>
            )}
            {role === 'headNurse' && !isEdu && preceptorScore !== null && (
              <span className="well well--preceptor">프리셉터 <b className="t-num">{preceptorScore}</b></span>
            )}
          </div>
        )}
      </div>
      <div className="item__input">
        <ScoreInput value={myEval.score} onChange={onScoreChange} disabled={isLocked} />
      </div>
    </div>
  )
}
