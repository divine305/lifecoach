export function requiredNumber(value: string, label: string) {
  const parsed = Number(value)
  if (!value.trim() || !Number.isFinite(parsed)) throw new Error(`Enter a valid ${label}.`)
  return parsed
}

export function optionalNumber(value: string, label: string) {
  return value.trim() ? requiredNumber(value, label) : null
}

export function dateTimeToIso(value: string, label: string) {
  if (!value.trim()) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error(`Enter a valid ${label}.`)
  return date.toISOString()
}

export function isoToDateTimeInput(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

export function localDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateTime(value: string | null) {
  if (!value) return 'No date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
