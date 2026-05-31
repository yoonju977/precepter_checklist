import type { Role } from '../../types/userRole'

type Props = {
  role: Role
  evaluatorName: string
  evaluatorId: string
  evalScorePct: number | null
  onConfirm: () => void
  onCancel: () => void
}

const ROLE_LABEL: Record<Role, string> = {
  preceptee: '신규간호사',
  preceptor: '프리셉터',
  educator: '교육전담',
  headNurse: '수간호사',
}

export default function FinalSubmitModal({ role, evaluatorName, evaluatorId, evalScorePct, onConfirm, onCancel }: Props) {
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="scrim scrim--center">
      <div className="modal">
        <h3 className="modal__title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--crimson-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          최종 제출 확인
        </h3>
        <p className="modal__body" style={{ marginBottom: 12 }}>아래 내용으로 제출합니다. 제출 후에는 원본 엑셀 양식으로 저장됩니다.</p>
        <div>
          <div className="modal__row"><span>평가자</span><b>{ROLE_LABEL[role]} {evaluatorName}{evaluatorId && ` (${evaluatorId})`}</b></div>
          <div className="modal__row"><span>평가일</span><b className="t-num">{today}</b></div>
          {evalScorePct !== null && (
            <div className="modal__row">
              <span>총점</span>
              <b className="t-num" style={{ color: evalScorePct < 70 ? 'var(--danger)' : 'var(--crimson-700)' }}>
                {evalScorePct.toFixed(1)}점
              </b>
            </div>
          )}
        </div>
        <div className="modal__actions">
          <button className="btn btn--secondary" onClick={onCancel}>아니요 (임시저장)</button>
          <button className="btn btn--primary" onClick={onConfirm}>제출하기</button>
        </div>
      </div>
    </div>
  )
}
