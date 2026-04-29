export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0:00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatHours(seconds) {
  if (!seconds || seconds < 0) return '0,00 h'
  const h = seconds / 3600
  return `${h.toFixed(2).replace('.', ',')} h`
}

export function formatMoney(amount) {
  return new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(amount || 0)
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('de-AT')
}

export function formatDatetime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' })
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function nowLocalISO() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}
