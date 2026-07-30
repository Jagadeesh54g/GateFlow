export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

export function formatNice(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}
