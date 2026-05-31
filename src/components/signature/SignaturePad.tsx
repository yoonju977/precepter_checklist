import { useEffect, useRef, useState } from 'react'
import SignaturePadLib from 'signature_pad'

type Props = {
  onSave: (dataUrl: string) => void
  onCancel: () => void
  signerName: string
  onSignerNameChange: (name: string) => void
}

export default function SignaturePad({ onSave, onCancel, signerName, onSignerNameChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePadLib | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const pad = new SignaturePadLib(canvas, { backgroundColor: 'rgb(255,255,255)', penColor: '#1E1B1A', minWidth: 1.5, maxWidth: 2.4 })
    padRef.current = pad
    pad.addEventListener('endStroke', () => setIsEmpty(pad.isEmpty()))

    function resize() {
      if (!canvas) return
      const ratio = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')?.scale(ratio, ratio)
      pad.clear()
      setIsEmpty(true)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => { window.removeEventListener('resize', resize); pad.off() }
  }, [])

  function handleClear() { padRef.current?.clear(); setIsEmpty(true) }
  function handleSave() {
    if (!padRef.current || padRef.current.isEmpty()) return
    onSave(padRef.current.toDataURL('image/png'))
  }

  return (
    <div className="scrim" onClick={e => { if ((e.target as Element).classList.contains('scrim')) onCancel() }}>
      <div className="sheet">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <div>
            <h3 className="sheet__title">전자서명</h3>
            <p className="sheet__sub">손가락·터치펜·마우스로 서명한 뒤 적용하세요.</p>
          </div>
          <button
            onClick={onCancel}
            style={{ marginLeft: 'auto', background: 'var(--ink-100)', border: 'none', color: 'var(--ink-600)', width: 34, height: 34, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="field" style={{ marginBottom: 12 }}>
          <label>서명자 이름</label>
          <input value={signerName} onChange={e => onSignerNameChange(e.target.value)} placeholder="성명 입력" />
        </div>
        <div className="sig-canvas-wrap">
          <canvas ref={canvasRef} style={{ height: 200 }} />
          {isEmpty && <div className="sig-canvas-hint">여기에 서명하세요</div>}
        </div>
        <div className="modal__actions">
          <button className="btn btn--secondary" onClick={handleClear}>다시</button>
          <button className="btn btn--primary grow" disabled={isEmpty || !signerName.trim()} onClick={handleSave}>
            서명 적용 (전체 문항)
          </button>
        </div>
      </div>
    </div>
  )
}
