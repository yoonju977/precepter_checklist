const SCORE_LABELS: Record<number, string> = {
  0: '0 하',
  1: '1 중',
  2: '2 상',
  3: '3 최상',
}

type Props = {
  value: number | null
  onChange: (score: number) => void
  disabled?: boolean
}

export default function ScoreInput({ value, onChange, disabled }: Props) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {[0, 1, 2, 3].map(score => (
        <button
          key={score}
          type="button"
          disabled={disabled}
          onClick={() => onChange(score)}
          className={[
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
            value === score
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400',
          ].join(' ')}
        >
          {SCORE_LABELS[score]}
        </button>
      ))}
    </div>
  )
}
