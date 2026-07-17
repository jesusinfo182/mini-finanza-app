export const CATS = [
  { id: 'necesidades', label: 'Necesidades' },
  { id: 'deseos', label: 'Deseos' },
  { id: 'ahorro', label: 'Ahorro' },
]

export function fmt(n) {
  const v = Number(n) || 0
  const hasFraction = Math.round(Math.abs(v) * 100) % 100 !== 0
  return v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: hasFraction ? 2 : 0, maximumFractionDigits: 2 })
}

export function fitFontSize(str, base) {
  const len = (str || '').length
  if (len <= 9) return base
  if (len <= 12) return base - 2
  if (len <= 15) return base - 3
  return base - 5
}

export function monthLabel(d) {
  return d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase())
}

export function barColor(pct) {
  if (pct >= 90) return '#ef4444'
  if (pct >= 80) return '#f97316'
  if (pct >= 70) return '#eab308'
  return '#22c55e'
}

export function formatAmountTyping(raw) {
  let v = raw.replace(/[^0-9,]/g, '')
  const firstComma = v.indexOf(',')
  if (firstComma !== -1) {
    v = v.slice(0, firstComma + 1) + v.slice(firstComma + 1).replace(/,/g, '')
  }
  let [intPart, decPart] = v.split(',')
  intPart = intPart.replace(/^0+(?=\d)/, '')
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  if (decPart !== undefined) decPart = decPart.slice(0, 2)
  return decPart !== undefined ? `${intPart},${decPart}` : intPart
}

export function parseAmount(formatted) {
  if (!formatted) return 0
  const num = formatted.replace(/\./g, '').replace(',', '.')
  return Number(num) || 0
}

export function monthsBetween(d1, d2) {
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth())
}

export function cuotaForMonth(plan, monthDate) {
  const diff = monthsBetween(new Date(plan.purchaseDate), monthDate)
  if (diff < 0 || diff >= plan.count) return null
  return diff + 1
}

export function cuotaStatus(plan, cuotaIndex) {
  const dueMonth = new Date(plan.purchaseDate)
  dueMonth.setMonth(dueMonth.getMonth() + (cuotaIndex - 1))
  const diff = monthsBetween(dueMonth, new Date())
  if (diff > 0) return 'paid'
  if (diff === 0) return 'actual'
  return 'pending'
}

export function monthKey(d) {
  return `${d.getFullYear()}-${d.getMonth() + 1}`
}
