import { useState } from 'react'

type Props = {
  score: number
  onConfirm: (reason: string) => void
  onCancel: () => void
}

export default function LowScoreModal({ score, onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">⚠️</div>
          <h2 className="text-base font-bold text-gray-800">최종 점수가 70점 미만입니다</h2>
          <p className="text-sm text-gray-500 mt-1">현재 평균 점수: <span className="font-semibold text-red-500">{score.toFixed(1)}점</span></p>
        </div>

        <textarea
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400 mb-4"
          rows={3}
          placeholder="저장 사유를 입력하세요 (선택)"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <button
            onClick={onCancel}
            className="w-full border border-gray-200 rounded-xl py-2.5 text-sm text-gray-700 font-medium hover:bg-gray-50"
          >
            돌아가서 수정하기
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className="w-full bg-red-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-600"
          >
            그래도 저장하기
          </button>
        </div>
      </div>
    </div>
  )
}
