type Props = {
  itemNums: number[]
  onClose: () => void
}

export default function UnansweredModal({ itemNums, onClose }: Props) {
  return (
    <div className="scrim scrim--center">
      <div className="modal">
        <h3 className="modal__title" style={{ color: 'var(--danger)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          미답변 문항이 있습니다
        </h3>
        <p className="modal__body">
          아래 문항에 점수를 입력해야 최종 제출할 수 있습니다.<br />
          <span className="t-num" style={{ fontWeight: 700, color: 'var(--ink-900)' }}>
            #{itemNums.slice(0, 12).join(', #')}{itemNums.length > 12 ? ' …' : ''}
          </span>
          <span style={{ display: 'block', marginTop: 6, color: 'var(--ink-500)' }}>총 {itemNums.length}개 문항 미입력</span>
        </p>
        <div className="modal__actions">
          <button className="btn btn--primary btn--block" onClick={onClose}>확인</button>
        </div>
      </div>
    </div>
  )
}
