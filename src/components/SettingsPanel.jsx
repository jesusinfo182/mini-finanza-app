import { useState } from 'react'
import { X, Trash2, FileText, Download, Upload } from 'lucide-react'
import { CATS } from '../lib/helpers'

export default function SettingsPanel({ rules, setRules, accounts, addAccount, deleteAccount, obligations, addObligation, deleteObligation, onClose, downloadBackup, restoreBackup, downloadReport, fileInputRef, cardBg, border, text, subtext, accent, bg }) {
  const [localRules, setLocalRules] = useState(rules)
  const [newAccountName, setNewAccountName] = useState('')
  const [newObligationName, setNewObligationName] = useState('')
  const total = Number(localRules.necesidades) + Number(localRules.deseos) + Number(localRules.ahorro)

  const inputStyle = { width: 70, padding: '6px 8px', borderRadius: 6, border: `1px solid ${border}`, background: bg, color: text, fontSize: 14, textAlign: 'center' }
  const btnRow = { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 10, border: `1px solid ${border}`, background: 'transparent', color: text, fontSize: 14, cursor: 'pointer', textAlign: 'left' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: cardBg, width: '100%', maxHeight: '88vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: 20 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: text }}>Configuración</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ fontSize: 12, letterSpacing: 1, color: subtext, fontWeight: 700, marginBottom: 10 }}>REGLA DE DISTRIBUCIÓN (%)</div>
        {CATS.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: text, fontSize: 14 }}>{c.label}</span>
            <input type="number" style={inputStyle} value={localRules[c.id]} onChange={e => setLocalRules(r => ({ ...r, [c.id]: e.target.value }))} />
          </div>
        ))}
        <div style={{ fontSize: 12, color: total === 100 ? subtext : '#ef4444', marginBottom: 10 }}>Total: {total}% {total !== 100 && '(debe sumar 100%)'}</div>
        <button disabled={total !== 100} onClick={() => setRules({ necesidades: Number(localRules.necesidades), deseos: Number(localRules.deseos), ahorro: Number(localRules.ahorro) })}
          style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: total === 100 ? accent : border, color: '#fff', fontWeight: 600, cursor: total === 100 ? 'pointer' : 'not-allowed', marginBottom: 20 }}>
          Guardar reglas
        </button>

        <div style={{ fontSize: 12, letterSpacing: 1, color: subtext, fontWeight: 700, marginBottom: 10 }}>CUENTAS</div>
        {accounts.map(a => (
          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
            <span style={{ color: text, fontSize: 14 }}>{a.name}</span>
            <button onClick={() => deleteAccount(a.id)} style={{ background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}><Trash2 size={14} /></button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 24 }}>
          <input style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${border}`, background: bg, color: text }} placeholder="Nueva cuenta..." value={newAccountName} onChange={e => setNewAccountName(e.target.value)} />
          <button onClick={() => { addAccount(newAccountName); setNewAccountName('') }} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: accent, color: '#fff', cursor: 'pointer' }}>+</button>
        </div>

        <div style={{ fontSize: 12, letterSpacing: 1, color: subtext, fontWeight: 700, marginBottom: 10 }}>OBLIGACIONES MENSUALES</div>
        {obligations.map(ob => (
          <div key={ob.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
            <span style={{ color: text, fontSize: 14 }}>{ob.name}</span>
            <button onClick={() => deleteObligation(ob.id)} style={{ background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}><Trash2 size={14} /></button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 24 }}>
          <input style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${border}`, background: bg, color: text }} placeholder="Ej: Alquiler..." value={newObligationName} onChange={e => setNewObligationName(e.target.value)} />
          <button onClick={() => { addObligation(newObligationName); setNewObligationName('') }} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: accent, color: '#fff', cursor: 'pointer' }}>+</button>
        </div>

        <div style={{ fontSize: 12, letterSpacing: 1, color: subtext, fontWeight: 700, marginBottom: 10 }}>DATOS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={downloadReport} style={btnRow}><FileText size={16} /> Descargar resumen (PDF)</button>
          <button onClick={downloadBackup} style={btnRow}><Download size={16} /> Descargar backup</button>
          <button onClick={() => fileInputRef.current?.click()} style={btnRow}><Upload size={16} /> Restaurar backup</button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={e => e.target.files[0] && restoreBackup(e.target.files[0])} />
        </div>
      </div>
    </div>
  )
}
