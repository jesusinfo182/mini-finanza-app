import { useState } from 'react'
import { X, Trash2, FileText, Download, Upload, ChevronRight, ChevronLeft } from 'lucide-react'
import { CATS } from '../lib/helpers'

function MenuRow({ label, sublabel, onClick, text, subtext, border }) {
  return (
    <button onClick={onClick} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 4px', borderBottom: `1px solid ${border}`, background: 'none', border: 'none', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: border, cursor: 'pointer', textAlign: 'left' }}>
      <div>
        <div style={{ fontSize: 15, color: text, fontWeight: 600 }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: subtext, marginTop: 2 }}>{sublabel}</div>}
      </div>
      <ChevronRight size={18} strokeWidth={2.25} color={subtext} />
    </button>
  )
}

function SubHeader({ title, onBack, text, subtext, cardBg, border }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 9, background: cardBg, border: `1px solid ${border}`, color: text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <ChevronLeft size={18} strokeWidth={2.25} />
      </button>
      <div style={{ fontWeight: 700, fontSize: 16, color: text }}>{title}</div>
    </div>
  )
}

export default function SettingsPanel({ rules, setRules, accounts, addAccount, deleteAccount, obligations, addObligation, deleteObligation, onClose, downloadBackup, restoreBackup, downloadReport, fileInputRef, cardBg, border, text, subtext, accent, bg }) {
  const [view, setView] = useState('menu') // menu | rules | accounts | obligations | data
  const [localRules, setLocalRules] = useState(rules)
  const [newAccountName, setNewAccountName] = useState('')
  const [newObligationName, setNewObligationName] = useState('')
  const total = Number(localRules.necesidades) + Number(localRules.deseos) + Number(localRules.ahorro)

  const btnRow = { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 10, border: `1px solid ${border}`, background: 'transparent', color: text, fontSize: 14, cursor: 'pointer', textAlign: 'left' }

  function sliderRow(catId, label) {
    return (
      <div key={catId} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: text, fontSize: 14 }}>{label}</span>
          <span style={{ color: accent, fontWeight: 700, fontSize: 14 }}>{localRules[catId]}%</span>
        </div>
        <input
          type="range" min="0" max="100" value={localRules[catId]}
          onChange={e => setLocalRules(r => ({ ...r, [catId]: Number(e.target.value) }))}
          style={{ width: '100%', accentColor: accent }}
        />
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: cardBg, width: '100%', maxHeight: '88vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: 20 }} onClick={e => e.stopPropagation()}>

        {view === 'menu' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: text }}>Configuración</div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <MenuRow label="Regla de distribución" sublabel={`Necesidades ${rules.necesidades}% · Deseos ${rules.deseos}% · Ahorro ${rules.ahorro}%`} onClick={() => setView('rules')} text={text} subtext={subtext} border={border} />
            <MenuRow label="Cuentas" sublabel={`${accounts.length} cuenta${accounts.length !== 1 ? 's' : ''}`} onClick={() => setView('accounts')} text={text} subtext={subtext} border={border} />
            <MenuRow label="Obligaciones mensuales" sublabel={`${obligations.length} obligación${obligations.length !== 1 ? 'es' : ''}`} onClick={() => setView('obligations')} text={text} subtext={subtext} border={border} />
            <MenuRow label="Datos" sublabel="Backup, restaurar, descargar resumen" onClick={() => setView('data')} text={text} subtext={subtext} border={border} />
          </>
        )}

        {view === 'rules' && (
          <>
            <SubHeader title="Regla de distribución" onBack={() => setView('menu')} text={text} subtext={subtext} cardBg={cardBg} border={border} />
            {sliderRow('necesidades', 'Necesidades')}
            {sliderRow('deseos', 'Deseos')}
            {sliderRow('ahorro', 'Ahorro')}
            <div style={{ fontSize: 12, color: total === 100 ? subtext : '#ef4444', marginBottom: 14 }}>Total: {total}% {total !== 100 && '(debe sumar 100%)'}</div>
            <button disabled={total !== 100} onClick={() => { setRules({ necesidades: Number(localRules.necesidades), deseos: Number(localRules.deseos), ahorro: Number(localRules.ahorro) }); setView('menu') }}
              style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: total === 100 ? accent : border, color: '#fff', fontWeight: 700, cursor: total === 100 ? 'pointer' : 'not-allowed' }}>
              Guardar reglas
            </button>
          </>
        )}

        {view === 'accounts' && (
          <>
            <SubHeader title="Cuentas" onBack={() => setView('menu')} text={text} subtext={subtext} cardBg={cardBg} border={border} />
            {accounts.map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${border}` }}>
                <span style={{ color: text, fontSize: 14 }}>{a.name}</span>
                <button onClick={() => deleteAccount(a.id)} style={{ background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}><Trash2 size={14} /></button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <input style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: bg, color: text }} placeholder="Nueva cuenta..." value={newAccountName} onChange={e => setNewAccountName(e.target.value)} />
              <button onClick={() => { addAccount(newAccountName); setNewAccountName('') }} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: accent, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>+</button>
            </div>
          </>
        )}

        {view === 'obligations' && (
          <>
            <SubHeader title="Obligaciones mensuales" onBack={() => setView('menu')} text={text} subtext={subtext} cardBg={cardBg} border={border} />
            {obligations.map(ob => (
              <div key={ob.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${border}` }}>
                <span style={{ color: text, fontSize: 14 }}>{ob.name}</span>
                <button onClick={() => deleteObligation(ob.id)} style={{ background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}><Trash2 size={14} /></button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <input style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: bg, color: text }} placeholder="Ej: Alquiler..." value={newObligationName} onChange={e => setNewObligationName(e.target.value)} />
              <button onClick={() => { addObligation(newObligationName); setNewObligationName('') }} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: accent, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>+</button>
            </div>
          </>
        )}

        {view === 'data' && (
          <>
            <SubHeader title="Datos" onBack={() => setView('menu')} text={text} subtext={subtext} cardBg={cardBg} border={border} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={downloadReport} style={btnRow}><FileText size={16} /> Descargar resumen (PDF)</button>
              <button onClick={downloadBackup} style={btnRow}><Download size={16} /> Descargar backup</button>
              <button onClick={() => fileInputRef.current?.click()} style={btnRow}><Upload size={16} /> Restaurar backup</button>
              <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={e => e.target.files[0] && restoreBackup(e.target.files[0])} />
            </div>
          </>
        )}

      </div>
    </div>
  )
}
