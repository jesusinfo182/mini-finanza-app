import { useState } from 'react'
import { X } from 'lucide-react'
import { CATS, fmt, formatAmountTyping, parseAmount } from '../lib/helpers'

export default function EditInstallmentModal({ plan, accounts, onClose, onSave, cardBg, border, text, subtext, accent, bg }) {
  const [name, setName] = useState(plan.name)
  const [category, setCategory] = useState(plan.category)
  const [accountId, setAccountId] = useState(plan.accountId)
  const [notes, setNotes] = useState(plan.notes || '')
  const [shared, setShared] = useState(plan.shared || false)
  const [totalAmount, setTotalAmount] = useState(formatAmountTyping(String(plan.totalAmount).replace('.', ',')))
  const [count, setCount] = useState(plan.count)
  const [error, setError] = useState('')

  const total = parseAmount(totalAmount)
  const cuotaAmount = count > 0 ? total / Number(count) : 0
  const totalOrCountChanged = total !== plan.totalAmount || Number(count) !== plan.count

  function handleSave() {
    setError('')
    if (!name.trim()) { setError('Ingresá un nombre.'); return }
    if (!total || total <= 0) { setError('Ingresá un monto total válido, mayor a $0.'); return }
    if (!Number(count) || Number(count) < 2) { setError('Ingresá una cantidad válida de cuotas (2 o más).'); return }
    if (!accountId) { setError('Seleccioná una cuenta.'); return }
    onSave(plan.id, { name: name.trim(), category, accountId, notes, shared, totalAmount: total, count: Number(count), cuotaAmount })
  }

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: bg, color: text, fontSize: 14, marginTop: 4, boxSizing: 'border-box' }
  const labelStyle = { fontSize: 12, color: subtext, fontWeight: 600 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: cardBg, width: '100%', maxHeight: '88vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: 20 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: text }}>Editar compra en cuotas</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Nombre</label>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Monto total</label>
            <input style={inputStyle} type="text" inputMode="decimal" value={totalAmount} onChange={e => setTotalAmount(formatAmountTyping(e.target.value))} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}># Cuotas</label>
            <input style={inputStyle} type="number" min="2" value={count} onChange={e => setCount(e.target.value)} />
          </div>
        </div>
        {total > 0 && count > 0 && (
          <div style={{ fontSize: 13, color: subtext, marginBottom: 12 }}>Cada cuota: <b style={{ color: text }}>{fmt(cuotaAmount)}</b></div>
        )}
        {totalOrCountChanged && (
          <div style={{ fontSize: 12, color: '#f97316', marginBottom: 12, background: '#f9731622', padding: '8px 12px', borderRadius: 8 }}>
            Cambiar el monto total o la cantidad de cuotas recalcula el estado (pagada/actual/pendiente) de todas las cuotas.
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Categoría</label>
          <select style={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>
            {CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Cuenta</label>
          <select style={inputStyle} value={accountId} onChange={e => setAccountId(e.target.value)}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Notas</label>
          <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={shared} onChange={e => setShared(e.target.checked)} />
            Gasto compartido
          </label>
        </div>

        {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, background: '#ef444422', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}

        <button onClick={handleSave} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: accent, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          Guardar cambios
        </button>
      </div>
    </div>
  )
}
