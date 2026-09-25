export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
}

export function daysLabel(days) {
  if (days === null || days === undefined) return ''
  if (days < 0) return 'Past'
  if (days === 0) return 'Today'
  if (days === 1) return '1 Day Remaining'
  return `${days} Days Remaining`
}
