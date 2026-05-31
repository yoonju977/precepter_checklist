type Props = {
  itemNums: number[]
  onClose: () => void
}

export default function UnansweredModal({ itemNums, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <p className="text-base font-bold text-red-600 mb-2 text-center">미답변 문항이 있습니다</p>
        <p className="text-xs text-gray-500 text-center mb-4">
          모든 문항에 점수를 입력해야 최종 제출이 가능합니다.
        </p>
        <div className="bg-red-50 rounded-xl p-3 mb-5 max-h-40 overflow-y-auto">
          <p className="text-xs text-red-700 font-medium mb-1">미답변 문항 번호</p>
          <p className="text-sm text-red-800 leading-relaxed">
            {itemNums.join(', ')}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gray-800 text-sm text-white font-medium hover:bg-gray-900"
        >
          확인 (수정하러 가기)
        </button>
      </div>
    </div>
  )
}
