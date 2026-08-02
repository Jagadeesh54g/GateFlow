'use client'
import { useMemo } from 'react'

const QUOTES = [
  "Small steps every day beat big leaps once in a while.",
  "The exam doesn't ask if you're ready — it asks what you did today.",
  "Every solved PYQ is one less surprise on exam day.",
  "Consistency compounds. Show up, even on the slow days.",
  "Rank isn't decided in February. It's decided today.",
  "You don't need to feel motivated to start — starting is what creates it.",
  "Progress hides in boring, repeated effort.",
  "Future you is counting on today's hour of focus.",
]

export default function MotivationBanner() {
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], [])

  return (
    <div className="motivation-banner">
      <svg className="motivation-art" viewBox="0 0 140 90" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="peakA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8a7af0" />
            <stop offset="100%" stopColor="#5b47e0" />
          </linearGradient>
          <linearGradient id="peakB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#efebfd" />
            <stop offset="100%" stopColor="#cfc6f7" />
          </linearGradient>
        </defs>
        <circle cx="112" cy="20" r="10" fill="#fbbf24" opacity="0.9" />
        <path d="M0 78 L38 28 L58 52 L74 30 L100 78 Z" fill="url(#peakB)" />
        <path d="M40 78 L78 20 L100 50 L140 78 Z" fill="url(#peakA)" />
        <path d="M78 20 L86 8 L94 20 Z" fill="#fff" />
        <line x1="86" y1="8" x2="86" y2="-1" stroke="#fff" strokeWidth="0" />
        <rect x="85.3" y="0" width="1.4" height="9" fill="#fff" />
      </svg>
      <p className="motivation-quote">{quote}</p>
    </div>
  )
}