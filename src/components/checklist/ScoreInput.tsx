type Props = {
  value: number | null
  onChange: (score: number) => void
  disabled?: boolean
}

export default function ScoreInput({ value, onChange, disabled }: Props) {
  return (
    <div className="score" data-disabled={disabled ? 'true' : 'false'} role="group" aria-label="점수">
      {[0, 1, 2, 3].map(s => (
        <button
          key={s}
          type="button"
          className={value === s ? 'on' : ''}
          aria-pressed={value === s}
          onClick={() => !disabled && onChange(s)}
        >
          {s}
        </button>
      ))}
    </div>
  )
}
