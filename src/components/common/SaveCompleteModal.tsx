type Props = {
  onGoHome: () => void
  onContinue: () => void
}

export default function SaveCompleteModal({ onGoHome, onContinue }: Props) {
  const now = new Date()
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="text-3xl mb-2">✅</div>
        <p className="text-base font-bold text-gray-800 mb-1">임시저장 완료</p>
        <p className="text-xs text-gray-400 mb-6">{timeStr} 저장됨</p>
        <div className="flex gap-3">
          <button
            onClick={onGoHome}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            처음으로
          </button>
          <button
            onClick={onContinue}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-sm text-white font-medium hover:bg-indigo-700"
          >
            계속 작업
          </button>
        </div>
      </div>
    </div>
  )
}
