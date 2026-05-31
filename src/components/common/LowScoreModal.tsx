import { useState } from 'react'

type Props = {
  score: number
  onConfirm: (reason: string) => void
  onCancel: () => void
}

export default function LowScoreModal({ score, onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState('')

  return (
    <div className="scrim scrim--center">
      <div className="modal">
        <h3 className="modal__title" style={{ color: 'var(--danger)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          70점 미만 경고
        </h3>
        <p className="modal__body" style={{ marginBottom: 12 }}>
          최종 점수가 <b className="t-num" style={{ color: 'var(--danger)' }}>{score.toFixed(1)}점</b>으로 70점 미만입니다.
          그래도 해당 점수로 저장하시겠습니까?
        </p>
        <div className="field" style={{ marginBottom: 4 }}>
          <label>저장 사유 (선택)</label>
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="예) 재교육 예정, 추가 평가 필요 등" />
        </div>
        <div className="modal__actions">
          <button className="btn btn--secondary" onClick={onCancel}>돌아가서 수정</button>
          <button className="btn btn--primary" onClick={() => onConfirm(reason)}>최종 제출</button>
        </div>
      </div>
    </div>
  )
}
