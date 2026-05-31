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

export default function FinalSubmitModal({
  role, evaluatorName, evaluatorId, evalScorePct, onConfirm, onCancel,
}: Props) {
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <p className="text-base font-bold text-gray-800 mb-4 text-center">최종 제출 확인</p>

        <div className="bg-gray-50 rounded-xl p-4 mb-5 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">평가일</span>
            <span className="font-medium text-gray-800">{today}</span>
          </div>
          {evalScorePct !== null && (
            <div className="flex justify-between">
              <span className="text-gray-500">총점</span>
              <span className={`font-bold ${evalScorePct < 70 ? 'text-red-500' : 'text-green-600'}`}>
                {evalScorePct.toFixed(1)}점
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">교육자</span>
            <span className="font-medium text-gray-800">
              {ROLE_LABEL[role]} {evaluatorName}
              {evaluatorId && <span className="text-gray-400 ml-1">({evaluatorId})</span>}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 text-center mb-5">
          위 내용으로 최종 제출하시겠습니까?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            아니요 (임시저장)
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 text-sm text-white font-medium hover:bg-purple-700"
          >
            제출하기
          </button>
        </div>
      </div>
    </div>
  )
}
