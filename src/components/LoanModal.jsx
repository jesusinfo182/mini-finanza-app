import { useState } from 'react'
import { X } from 'lucide-react'
import { fmt, formatAmountTyping, parseAmount } from '../lib/helpers'

function makeCuotas(count) {
  return Array.from({ length: count }, (_, i) => ({ n: i + 1, paid: false, paid_date: null }))
}

export default function LoanModal({ kind, initial, onClose, onSave, onUpdate, cardBg, border, text, subtext, accent, bg }) {
  const isEditing = !!initial
  const [name, setName] = useState(initial?.name || '')
  const [note, setNote] = useState(initial?.notes || '')
  const [totalAmount, setTotalAmount] = useState(initial ? formatAmountTyping(String(initial.total_amount).replace('.', ',')) : '')
  const [count, setCount] = useState(initial?.count || 1)
  const [error, setError] = useState('')

  const total = parseAmount(totalAmount)
  const cuotaAmount = count > 0 ? total / Number(count) : 0
  const totalOrCountChanged = isEditing && (total !== Number(initial.total_amount) || Number(count) !== initial.count)

  function handleSave() {
    setError('')
    if (!name.trim()) { setError('Ingresá un nombre.'); return }
    if (!total || total <= 0) { setError('Ingresá un monto total válido, mayor a $0.'); return }
    if (!Number(count) || Number(count) < 1) { setError('La cantidad de cuotas debe ser al menos 1.'); return }
    if (isEditing) {
      let cuotas = initial.cuotas
      if (Number(count) !== initial.count) {
        cuotas = Array.from({ length: Number(count) }, (_, i) => initial.cuotas[i] || { n: i + 1, paid: false, paid_date: null })
      }
      onUpdate(initial.id, { name: name.trim(), notes: note.trim(), totalAmount: total, count: Number(count), cuotaAmount, cuotas })
    } else {
      onSave({ kind, name: name.trim(), notes: note.trim(), totalAmount: total, count: Number(count), cuotaAmount, cuotas: makeCuotas(Number(count)) })
    }
  }

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: bg, color: text, fontSize: 14, marginTop: 4, boxSizing: 'border-box' }
  const labelStyle = { fontSize: 12, color: subtext, fontWeight: 600 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: cardBg, width: '100%', maxHeight: '88vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: 20 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: text }}>{isEditing ? `Editar · ${name}` : kind === 'lend' ? 'Nuevo · Me deben' : 'Nuevo · Debo'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Nombre</label>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder={kind === 'lend' ? 'Ej: Luis' : 'Ej: Banco Galicia'} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Nota</label>
          <input style={inputStyle} value={note} onChange={e => setNote(e.target.value)} placeholder="Ej: Préstamo de dinero" />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Monto total</label>
            <input style={inputStyle} type="text" inputMode="decimal" value={totalAmount} onChange={e => setTotalAmount(formatAmountTyping(e.target.value))} placeholder="0,00" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Cuotas (si aplica)</label>
            <input style={inputStyle} type="number" min="1" value={count} onChange={e => setCount(e.target.value)} />
          </div>
        </div>
        {total > 0 && count > 0 && (
          <div style={{ fontSize: 13, color: subtext, marginBottom: 12 }}>Cada cuota: <b style={{ color: text }}>{fmt(cuotaAmount)}</b></div>
        )}
        {totalOrCountChanged && (
          <div style={{ fontSize: 12, color: '#f97316', marginBottom: 12, background: '#f9731622', padding: '8px 12px', borderRadius: 8 }}>
            Cambiar el monto total o la cantidad de cuotas puede afectar el cálculo de cuotas ya marcadas como pagadas.
          </div>
        )}
        {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, background: '#ef444422', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}

        <button onClick={handleSave} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: accent, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          {isEditing ? 'Guardar cambios' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
