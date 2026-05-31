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
    const pad = new SignaturePadLib(canvas, { backgroundColor: 'rgb(255,255,255)' })
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

  function handleClear() {
    padRef.current?.clear()
    setIsEmpty(true)
  }

  function handleSave() {
    if (!padRef.current || padRef.current.isEmpty()) return
    onSave(padRef.current.toDataURL('image/png'))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-base font-semibold text-gray-800 mb-3">전자서명</h2>
          <input
            type="text"
            placeholder="서명자 이름 입력"
            value={signerName}
            onChange={e => onSignerNameChange(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-blue-400"
          />
          <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden" style={{ height: 180 }}>
            <canvas ref={canvasRef} className="w-full h-full touch-none" />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-center">손가락 또는 마우스로 서명하세요</p>
        </div>
        <div className="flex gap-2 px-4 pb-4 pt-2">
          <button onClick={handleClear} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">
            지우기
          </button>
          <button onClick={onCancel} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isEmpty || !signerName.trim()}
            className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium disabled:opacity-40"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
