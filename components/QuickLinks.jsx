'use client'

const LINKS = [
  {
    label: 'MadeEasy — Mock Test Series',
    sub: 'GATE 2027 CS online test series',
    href: 'https://www.madeeasy.in/prep/mock-test-details/gate-2027-2026-computer-science-online-test-series',
  },
  {
    label: 'practice paper-PYQ Practice',
    sub: 'GATE CS/IT previous year questions & solutions',
    href: 'https://practicepaper.in/gate-cse/topic-wise-practice-of-gate-cse-previous-year-papers',
    unverified: true,
  },
]

export default function QuickLinks() {
  return (
    <div className="card wide">
      <div className="card-head">
        <h3>Quick links</h3>
      </div>
      <div className="quick-links">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="quick-link">
            <span className="quick-link-label">{l.label}</span>
            <span className="quick-link-sub">{l.sub}</span>
          </a>
        ))}
      </div>
      <p className="hint">
        The PYQ practice link is my best match for "practice paper GATE CS-IT" — if it's not the exact page you
        meant, send me the URL and I'll swap it in.
      </p>
    </div>
  )
}
