const BASE = import.meta.env.BASE_URL

type Props = {
  title: string
  sub?: string
  onBack?: () => void
  chip?: string
}

export default function Header({ title, sub, onBack, chip }: Props) {
  return (
    <header className="hdr">
      {onBack && (
        <button className="hdr__back" onClick={onBack} aria-label="뒤로">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
      <div className="hdr__lockup">
        <img className="hdr__emblem" src={`${BASE}assets/emblem-crimson.gif`} alt="고려대학교" />
        <div className="hdr__titles">
          <div className="hdr__title">{title}</div>
          {sub && <div className="hdr__sub">{sub}</div>}
        </div>
      </div>
      {chip && <span className="hdr__chip">{chip}</span>}
    </header>
  )
}
