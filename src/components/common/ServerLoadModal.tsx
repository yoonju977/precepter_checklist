import type { SessionMeta } from '../../lib/googleDrive/gasClient'

type Props = {
  sessions: SessionMeta[]
  error: string
  onSelect: (fileId: string) => void
  onClose: () => void
}

export default function ServerLoadModal({ sessions, error, onSelect, onClose }: Props) {
  return (
    <div className="scrim scrim--center">
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 className="modal__title" style={{ margin: 0 }}>서버에서 불러오기</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)', fontSize: 22, lineHeight: 1, padding: '0 4px' }}
          >×</button>
        </div>

        {error && (
          <p style={{ font: '500 13px/1.4 var(--font-sans)', color: 'var(--danger)', marginBottom: 12 }}>{error}</p>
        )}

        {!error && sessions.length === 0 && (
          <p style={{ font: '400 14px/1 var(--font-sans)', color: 'var(--ink-400)', textAlign: 'center', padding: '24px 0' }}>불러오는 중…</p>
        )}

        {sessions.length > 0 && (
          <ul style={{ listStyle: 'none', margin: '0 0 14px', padding: 0, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
            {sessions.map(s => (
              <li key={s.fileId}>
                <button
                  onClick={() => onSelect(s.fileId)}
                  style={{ width: '100%', textAlign: 'left', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 13px', background: '#fff', cursor: 'pointer', transition: 'background .1s' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'var(--ink-50)')}
                  onMouseOut={e => (e.currentTarget.style.background = '#fff')}
                >
                  <p style={{ font: '600 13px/1.3 var(--font-sans)', color: 'var(--ink-900)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                  <p style={{ font: '400 11px/1 var(--font-sans)', color: 'var(--ink-400)', margin: '4px 0 0' }}>{new Date(s.updatedAt).toLocaleString('ko-KR')}</p>
                </button>
              </li>
            ))}
          </ul>
        )}

        <button className="btn btn--secondary btn--block" onClick={onClose}>취소</button>
      </div>
    </div>
  )
}
