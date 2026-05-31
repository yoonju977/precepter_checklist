type Props = {
  onGoHome: () => void
  onContinue: () => void
}

export default function SaveCompleteModal({ onGoHome, onContinue }: Props) {
  return (
    <div className="scrim scrim--center">
      <div className="modal">
        <h3 className="modal__title" style={{ color: 'var(--success)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          저장 완료
        </h3>
        <p className="modal__body">임시저장이 완료되었습니다. Google Drive에 작업 내용이 안전하게 저장되었어요.</p>
        <div className="modal__actions">
          <button className="btn btn--secondary" onClick={onGoHome}>처음으로</button>
          <button className="btn btn--primary" onClick={onContinue}>계속 작업</button>
        </div>
      </div>
    </div>
  )
}
