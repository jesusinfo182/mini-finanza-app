import { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, Moon, Sun, Settings as SettingsIcon, ChevronLeft, ChevronRight, Trash2, Pencil, Wallet, LogOut } from 'lucide-react'
import { supabase } from './lib/supabaseClient'
import * as api from './lib/api'
import { CATS, fmt, fitFontSize, monthLabel, barColor, cuotaForMonth, cuotaStatus, monthKey, parseLocalDate, todayLocalISODate, truncateNotes, formatLocalDate } from './lib/helpers'
import { SummaryCard, ConfirmDialog, ObligationsSection, CuotasSection, InstallmentsOverview, ArchivedSection, MovementCard, AllMovementsView, AlertsSection } from './components/Sections'
import MovementModal from './components/MovementModal'
import LoanModal from './components/LoanModal'
import EditInstallmentModal from './components/EditInstallmentModal'
import SettingsPanel from './components/SettingsPanel'
import Login from './components/Login'

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [session, setSession] = useState(undefined) // undefined = checking, null = logged out, object = logged in
  const [theme, setTheme] = useState('dark')
  const [movements, setMovements] = useState([])
  const [accounts, setAccounts] = useState([])
  const [rules, setRules] = useState({ necesidades: 50, deseos: 30, ahorro: 20 })
  const [obligations, setObligations] = useState([])
  const [obligationChecks, setObligationChecks] = useState({}) // { "2026-7": { obligationId: true } }
  const [installments, setInstallments] = useState([])
  const [loans, setLoans] = useState([])
  const [lastBackupAt, setLastBackupAt] = useState(null)
  const [firstUsedAt] = useState(new Date().toISOString())

  const [monthCursor, setMonthCursor] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [editingMovement, setEditingMovement] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showLoanModal, setShowLoanModal] = useState(false)
  const [editingLoan, setEditingLoan] = useState(null)
  const [editingInstallment, setEditingInstallment] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [showAllMovements, setShowAllMovements] = useState(false)
  const fileInputRef = useRef(null)

  function requestConfirm(message, onConfirm) {
    setConfirmDialog({ message, onConfirm })
  }

  // ---- auth session ----
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // ---- initial load from Supabase (only once logged in) ----
  useEffect(() => {
    if (!session) return
    (async () => {
      const data = await api.fetchAllData()
      setAccounts(data.accounts)
      setMovements(data.movements)
      setObligations(data.obligations)
      const checksByMonth = {}
      data.obligationChecks.forEach(c => {
        if (!checksByMonth[c.month_key]) checksByMonth[c.month_key] = {}
        checksByMonth[c.month_key][c.obligation_id] = c.checked
      })
      setObligationChecks(checksByMonth)
      setInstallments(data.installments)
      setLoans(data.loans)
      if (data.settings) {
        setTheme(data.settings.theme || 'dark')
        setRules({ necesidades: data.settings.necesidades_pct, deseos: data.settings.deseos_pct, ahorro: data.settings.ahorro_pct })
        setLastBackupAt(data.settings.last_backup_at)
      }
      setLoaded(true)
    })()
  }, [session])

  // ---- persist theme/rules changes to settings row ----
  useEffect(() => {
    if (!loaded) return
    api.updateSettings({ theme, rules })
  }, [theme, rules, loaded])

  const monthMovements = useMemo(() => {
    return movements.filter(m => {
      const d = parseLocalDate(m.date)
      return d.getMonth() === monthCursor.getMonth() && d.getFullYear() === monthCursor.getFullYear()
    }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  }, [movements, monthCursor])

  const monthInstallmentEntries = useMemo(() => {
    const out = []
    installments.forEach(plan => {
      const n = cuotaForMonth(plan, monthCursor)
      if (n !== null) {
        out.push({ id: `${plan.id}-cuota-${n}`, isInstallment: true, plan, cuotaIndex: n, amount: plan.cuotaAmount, category: plan.category, accountId: plan.accountId, description: plan.name, notes: plan.notes, shared: plan.shared, createdAt: plan.createdAt, date: plan.purchaseDate })
      }
    })
    return out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  }, [installments, monthCursor])

  const combinedMonthList = useMemo(() => {
    return [...monthMovements, ...monthInstallmentEntries].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  }, [monthMovements, monthInstallmentEntries])

  const ingresos = monthMovements.filter(m => m.type === 'income').reduce((s, m) => s + Number(m.amount), 0)
  const gastado = monthMovements.filter(m => m.type === 'expense').reduce((s, m) => s + Number(m.amount), 0) + monthInstallmentEntries.reduce((s, c) => s + Number(c.amount), 0)
  const disponible = ingresos - gastado

  const catTotals = useMemo(() => {
    const out = {}
    CATS.forEach(c => { out[c.id] = 0 })
    monthMovements.filter(m => m.type === 'expense').forEach(m => { if (out[m.category] !== undefined) out[m.category] += Number(m.amount) })
    monthInstallmentEntries.forEach(c => { if (out[c.category] !== undefined) out[c.category] += Number(c.amount) })
    return out
  }, [monthMovements, monthInstallmentEntries])

  const accountBalances = useMemo(() => {
    const bal = {}
    accounts.forEach(a => { bal[a.id] = 0 })
    movements.forEach(m => { if (bal[m.accountId] !== undefined) bal[m.accountId] += m.type === 'income' ? Number(m.amount) : -Number(m.amount) })
    const now = new Date()
    installments.forEach(plan => {
      const diff = (now.getFullYear() - parseLocalDate(plan.purchaseDate).getFullYear()) * 12 + (now.getMonth() - parseLocalDate(plan.purchaseDate).getMonth())
      const elapsed = Math.min(plan.count, Math.max(0, diff + 1))
      if (bal[plan.accountId] !== undefined) bal[plan.accountId] -= Number(plan.cuotaAmount) * elapsed
    })
    return bal
  }, [movements, accounts, installments])

  const alerts = useMemo(() => {
    const list = []
    const today = new Date()

    // Overspent categories (this viewed month)
    CATS.forEach(c => {
      const limit = ingresos * (rules[c.id] / 100)
      const spent = catTotals[c.id]
      if (limit > 0 && spent > limit) {
        list.push({ level: 'danger', message: `Te excediste en ${c.label} por ${fmt(spent - limit)}.` })
      }
    })

    // Obligations still unmarked, past day 25 of the current real month
    if (today.getDate() >= 25) {
      const key = monthKey(today)
      const checks = obligationChecks[key] || {}
      obligations.forEach(ob => {
        if (!checks[ob.id]) list.push({ level: 'warning', message: `"${ob.name}" todavía no está marcada como pagada este mes.` })
      })
    }

    // Loan cuotas whose approximate due month has arrived/passed, still unpaid
    loans.filter(l => !l.archived).forEach(loan => {
      loan.cuotas.forEach(c => {
        if (c.paid) return
        const st = cuotaStatus({ purchaseDate: loan.created_at, count: loan.count }, c.n)
        if (st !== 'pending') {
          list.push({ level: 'warning', message: `Cuota ${c.n}/${loan.count} de "${loan.name}" (${loan.kind === 'lend' ? 'me deben' : 'debo'}) podría estar vencida.` })
        }
      })
    })

    // Backup reminder
    const hasData = movements.length > 0 || installments.length > 0 || loans.length > 0 || obligations.length > 0
    const referenceDate = lastBackupAt || firstUsedAt
    const daysSince = referenceDate ? Math.floor((Date.now() - new Date(referenceDate).getTime()) / 86400000) : 0
    if (hasData && daysSince >= 7) {
      list.push({ level: 'warning', message: lastBackupAt ? `Hace ${daysSince} días que no hacés backup.` : 'Hace más de una semana que usás la app sin hacer backup.', onClick: downloadBackup })
    }

    return list
  }, [catTotals, ingresos, rules, obligations, obligationChecks, loans, movements, installments, lastBackupAt, firstUsedAt])

  // ---------------- Actions ----------------
  async function addMovement(mv) {
    const saved = await api.addMovement(mv)
    setMovements(prev => [...prev, saved])
    setShowModal(false); setEditingMovement(null)
  }
  async function updateMovement(id, mv) {
    await api.updateMovement(id, mv)
    setMovements(prev => prev.map(m => m.id === id ? { ...m, ...mv } : m))
    setShowModal(false); setEditingMovement(null)
  }
  function deleteMovement(id) {
    requestConfirm('¿Eliminar este movimiento? Esta acción no se puede deshacer.', async () => {
      await api.softDeleteMovement(id)
      setMovements(prev => prev.filter(m => m.id !== id))
    })
  }
  function openEditMovement(m) {
    if (m.isInstallment) return
    setEditingMovement(m); setShowModal(true)
  }

  async function addAccount(name) {
    if (!name.trim()) return
    const acc = await api.addAccount(name.trim())
    setAccounts(prev => [...prev, acc])
  }
  function deleteAccount(id) {
    requestConfirm('¿Eliminar esta cuenta? Los movimientos ya cargados con esta cuenta no se borran, pero dejarán de mostrar un saldo asociado.', async () => {
      await api.softDeleteAccount(id)
      setAccounts(prev => prev.filter(a => a.id !== id))
    })
  }

  async function addObligation(name) {
    if (!name.trim()) return
    const ob = await api.addObligation(name.trim())
    setObligations(prev => [...prev, ob])
  }
  function deleteObligation(id) {
    requestConfirm('¿Eliminar esta obligación mensual? Se va a borrar también su historial de meses marcados.', async () => {
      await api.softDeleteObligation(id)
      setObligations(prev => prev.filter(o => o.id !== id))
    })
  }
  async function toggleObligation(obId) {
    const key = monthKey(monthCursor)
    const newVal = !(obligationChecks[key]?.[obId])
    await api.setObligationCheck(obId, key, newVal)
    setObligationChecks(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [obId]: newVal } }))
  }

  async function addInstallmentPlan(plan) {
    const saved = await api.addInstallmentPlan(plan)
    setInstallments(prev => [...prev, saved])
    setShowModal(false)
  }
  async function updateInstallmentPlan(id, updated) {
    await api.updateInstallmentPlan(id, updated)
    setInstallments(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p))
    setEditingInstallment(null)
  }
  function deleteInstallmentPlan(id) {
    requestConfirm('¿Eliminar esta compra en cuotas? Esto puede modificar tus saldos y totales históricos. Esta acción no se puede deshacer.', async () => {
      await api.softDeleteInstallmentPlan(id)
      setInstallments(prev => prev.filter(p => p.id !== id))
    })
  }
  async function archiveInstallmentPlan(id) {
    await api.archiveInstallmentPlan(id, true)
    setInstallments(prev => prev.map(p => p.id === id ? { ...p, archived: true } : p))
  }
  async function unarchiveInstallmentPlan(id) {
    await api.archiveInstallmentPlan(id, false)
    setInstallments(prev => prev.map(p => p.id === id ? { ...p, archived: false } : p))
  }

  async function addLoan(loan) {
    const saved = await api.addLoan(loan)
    setLoans(prev => [...prev, saved])
    setShowLoanModal(false)
  }
  async function updateLoan(id, updated) {
    await api.updateLoan(id, updated)
    setLoans(prev => prev.map(l => l.id === id ? { ...l, ...updated, total_amount: updated.totalAmount ?? l.total_amount, cuota_amount: updated.cuotaAmount ?? l.cuota_amount } : l))
    setEditingLoan(null)
  }
  function deleteLoan(id) {
    requestConfirm('¿Eliminar este préstamo? Esta acción no se puede deshacer.', async () => {
      await api.softDeleteLoan(id)
      setLoans(prev => prev.filter(l => l.id !== id))
    })
  }
  async function archiveLoan(id) {
    await api.archiveLoan(id, true)
    setLoans(prev => prev.map(l => l.id === id ? { ...l, archived: true } : l))
  }
  async function unarchiveLoan(id) {
    await api.archiveLoan(id, false)
    setLoans(prev => prev.map(l => l.id === id ? { ...l, archived: false } : l))
  }
  async function toggleLoanCuota(loan, n) {
    const cuotas = await api.toggleLoanCuota(loan, n)
    setLoans(prev => prev.map(l => l.id === loan.id ? { ...l, cuotas } : l))
  }

  function downloadBackup() {
    const payload = { movements, accounts, rules, theme, obligations, obligationChecks, installments, loans, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fin-mini-backup-${todayLocalISODate()}.json`
    a.click()
    URL.revokeObjectURL(url)
    const now = new Date().toISOString()
    setLastBackupAt(now)
    api.updateSettings({ lastBackupAt: now })
  }

  function restoreBackup(file) {
    requestConfirm('Restaurar un backup reemplaza los datos visibles ahora mismo (no borra lo que ya está en Supabase). ¿Continuar?', () => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (data.movements) setMovements(data.movements)
          if (data.accounts) setAccounts(data.accounts)
          if (data.rules) setRules(data.rules)
          if (data.obligations) setObligations(data.obligations)
          if (data.obligationChecks) setObligationChecks(data.obligationChecks)
          if (data.installments) setInstallments(data.installments)
          if (data.loans) setLoans(data.loans)
        } catch (err) {
          requestConfirm('El archivo no parece un backup válido.', () => {})
        }
      }
      reader.readAsText(file)
    })
  }

  function downloadReport() {
    const accName = (id) => accounts.find(a => a.id === id)?.name || '—'
    const rows = (catId) => [...monthMovements.filter(m => m.type === 'expense'), ...monthInstallmentEntries].filter(m => m.category === catId)
    const accentHex = '#7c5cff'
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Resumen ${monthLabel(monthCursor)}</title>
    <style>
      * { box-sizing: border-box; }
      body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#1a1a1a;max-width:820px;margin:0 auto;}
      .brand{font-size:15px;font-weight:800;color:${accentHex};letter-spacing:.5px;}
      .brand span{color:#1a1a1a;font-weight:400;}
      h1{margin:6px 0 0;font-size:26px;}
      .sub{color:#777;margin-top:2px;font-size:14px;}
      .summary{display:flex;gap:14px;margin:26px 0;}
      .card{border:1px solid #e5e5ea;border-radius:10px;padding:14px 16px;flex:1;background:#fafafa;}
      .card .lbl{font-size:11px;letter-spacing:.5px;color:#888;font-weight:700;text-transform:uppercase;}
      .card b{display:block;font-size:19px;margin-top:6px;}
      .cat-header{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #1a1a1a;padding-bottom:6px;margin-top:34px;}
      .cat-header h2{margin:0;font-size:17px;}
      .cat-header .amt{font-size:15px;font-weight:700;}
      .overspend{display:inline-block;margin-top:6px;font-size:12px;font-weight:700;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:3px 9px;}
      .onbudget{display:inline-block;margin-top:6px;font-size:12px;font-weight:600;color:#15803d;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:3px 9px;}
      table{width:100%;border-collapse:collapse;margin-top:10px;}
      td,th{text-align:left;padding:7px 4px;border-bottom:1px solid #eee;font-size:12.5px;}
      th{color:#888;font-weight:600;text-transform:uppercase;font-size:10.5px;letter-spacing:.3px;}
      .badge{font-size:10.5px;background:#f1eeff;color:${accentHex};border-radius:4px;padding:1px 7px;margin-left:5px;font-weight:600;}
      .notes{color:#888;font-style:italic;}
      .printbtn{padding:9px 18px;margin-bottom:22px;border:none;border-radius:8px;background:${accentHex};color:#fff;font-weight:700;cursor:pointer;}
      @media print{ .printbtn{display:none;} body{padding:16px;} }
    </style></head><body>
    <button class="printbtn" onclick="window.print()">Imprimir / Guardar como PDF</button>
    <div class="brand">fin<span>. mini</span></div>
    <h1>Resumen mensual</h1>
    <div class="sub">${monthLabel(monthCursor)}</div>
    <div class="summary">
      <div class="card"><div class="lbl">Ingresos</div><b>${fmt(ingresos)}</b></div>
      <div class="card"><div class="lbl">Gastado</div><b style="color:#dc2626">${fmt(gastado)}</b></div>
      <div class="card"><div class="lbl">Disponible</div><b style="color:#16a34a">${fmt(disponible)}</b></div>
    </div>
    ${CATS.map(c => {
      const limit = ingresos * (rules[c.id] / 100)
      const spent = catTotals[c.id]
      const over = limit > 0 && spent > limit
      return `
      <div class="cat-header">
        <h2>${c.label} <span style="color:#999;font-weight:400;font-size:13px;">(${rules[c.id]}%)</span></h2>
        <span class="amt">${fmt(spent)} <span style="color:#999;font-weight:400;">/ ${fmt(limit)}</span></span>
      </div>
      ${limit > 0 ? (over
        ? `<div class="overspend">Te excediste por ${fmt(spent - limit)}</div>`
        : `<div class="onbudget">Dentro del límite</div>`) : ''}
      <table><tr><th>Fecha</th><th>Descripción</th><th>Cuenta</th><th>Monto</th><th>Notas</th></tr>
      ${rows(c.id).map(m => `<tr>
        <td>${parseLocalDate(m.date).toLocaleDateString('es-AR')}</td>
        <td>${m.description || '—'}${m.shared ? '<span class="badge">Compartido</span>' : ''}${m.isInstallment ? `<span class="badge">Cuota ${m.cuotaIndex}/${m.plan.count} · Total ${fmt(m.plan.totalAmount)}</span>` : ''}</td>
        <td>${accName(m.accountId)}</td>
        <td>${fmt(m.amount)}</td>
        <td class="notes">${m.notes || ''}</td>
      </tr>`).join('') || `<tr><td colspan="5" style="color:#999">Sin movimientos</td></tr>`}
      </table>
    `}).join('')}
    </body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  }

  const dark = theme === 'dark'
  const bg = dark ? '#0c0c11' : '#f7f7fa'
  const cardBg = dark ? '#16161f' : '#ffffff'
  const border = dark ? '#26262f' : '#e5e5ea'
  const text = dark ? '#f2f2f5' : '#17171c'
  const subtext = dark ? '#8a8a99' : '#6b6b76'
  const accent = '#7c5cff'

  if (session === undefined) {
    return <div style={{ minHeight: '100vh', background: bg, color: text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando...</div>
  }

  if (!session) {
    return <Login theme={theme} />
  }

  if (!loaded) {
    return <div style={{ minHeight: '100vh', background: bg, color: text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando...</div>
  }

  const iconBtn = { width: 36, height: 36, borderRadius: 10, background: cardBg, border: `1px solid ${border}`, color: text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: "'Poppins', system-ui, sans-serif", paddingBottom: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 8px' }}>
        <div style={{ fontSize: 24, fontWeight: 800 }}>
          <span style={{ color: accent }}>fin.</span> <span style={{ fontWeight: 400, fontSize: 14, color: subtext }}>mini</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setTheme(dark ? 'light' : 'dark')} style={iconBtn}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button onClick={() => setShowSettings(true)} style={iconBtn}><SettingsIcon size={18} /></button>
          <button onClick={() => supabase.auth.signOut()} style={iconBtn} title="Cerrar sesión"><LogOut size={18} /></button>
        </div>
      </div>

      <AlertsSection alerts={alerts} onBackupClick={downloadBackup} cardBg={cardBg} border={border} text={text} subtext={subtext} accent={accent} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '12px 0' }}>
        <button onClick={() => setMonthCursor(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} style={iconBtn}><ChevronLeft size={16} /></button>
        <div style={{ fontWeight: 700, minWidth: 160, textAlign: 'center' }}>{monthLabel(monthCursor)}</div>
        <button onClick={() => setMonthCursor(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} style={iconBtn}><ChevronRight size={16} /></button>
      </div>

      <div style={{ display: 'flex', gap: 10, padding: '0 20px' }}>
        {(() => {
          const vals = [fmt(ingresos), fmt(gastado), fmt(disponible)]
          const sharedSize = Math.min(...vals.map(v => fitFontSize(v, 15)))
          return (
            <>
              <SummaryCard label="Ingresos" value={vals[0]} fontSize={sharedSize} color={text} cardBg={cardBg} border={border} subtext={subtext} />
              <SummaryCard label="Gastado" value={vals[1]} fontSize={sharedSize} color="#ef4444" cardBg={cardBg} border={border} subtext={subtext} />
              <SummaryCard label="Disponible" value={vals[2]} fontSize={sharedSize} color={disponible >= 0 ? '#22c55e' : '#ef4444'} cardBg={cardBg} border={border} subtext={subtext} />
            </>
          )
        })()}
      </div>

      <div style={{ margin: '20px 20px 0', background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: 18 }}>
        <div style={{ fontSize: 12, letterSpacing: 1, color: subtext, fontWeight: 700, marginBottom: 14 }}>REGLA DE DISTRIBUCIÓN</div>
        {CATS.map(c => {
          const limit = ingresos * (rules[c.id] / 100)
          const spent = catTotals[c.id]
          const realPct = limit > 0 ? (spent / limit) * 100 : 0
          const pct = Math.min(100, realPct)
          return (
            <div key={c.id} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, whiteSpace: 'nowrap', marginBottom: 2 }}>{c.label} ({rules[c.id]}%)</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ color: subtext, fontSize: 13, whiteSpace: 'nowrap' }}>{fmt(spent)} / {fmt(limit)}</span>
                {limit > 0 && <span style={{ color: barColor(realPct), fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{Math.round(realPct)}%</span>}
              </div>
              <div style={{ height: 8, borderRadius: 4, background: border, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: barColor(realPct), transition: 'width .3s' }} />
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ margin: '16px 20px 0', background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: 18 }}>
        <div style={{ fontSize: 12, letterSpacing: 1, color: subtext, fontWeight: 700, marginBottom: 12 }}>CUENTAS</div>
        {accounts.map(a => (
          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${border}` }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Wallet size={14} color={subtext} /> {a.name}</span>
            <span style={{ fontWeight: 600, whiteSpace: 'nowrap', color: accountBalances[a.id] >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(accountBalances[a.id])}</span>
          </div>
        ))}
      </div>

      {obligations.length > 0 && (
        <ObligationsSection obligations={obligations} checks={obligationChecks[monthKey(monthCursor)] || {}} onToggle={toggleObligation} cardBg={cardBg} border={border} text={text} subtext={subtext} accent={accent} />
      )}

      <InstallmentsOverview
        items={installments.filter(p => !p.archived)}
        onDelete={deleteInstallmentPlan}
        onArchive={archiveInstallmentPlan}
        onEdit={(plan) => setEditingInstallment(plan)}
        cardBg={cardBg} border={border} text={text} subtext={subtext} accent={accent}
        renderMeta={(plan) => (
          <><b>{CATS.find(c => c.id === plan.category)?.label || ''}</b> · <span style={{ color: '#f472b6', fontWeight: 600 }}>{accounts.find(a => a.id === plan.accountId)?.name || '—'}</span></>
        )}
      />

      <CuotasSection
        title="PRÉSTAMOS · ME DEBEN"
        emptyText="No registraste préstamos donde te deban dinero."
        items={loans.filter(l => l.kind === 'lend' && !l.archived)}
        onToggle={toggleLoanCuota}
        onDelete={deleteLoan}
        onArchive={archiveLoan}
        onEdit={(l) => { setEditingLoan(l); setShowLoanModal(l.kind) }}
        onAdd={() => setShowLoanModal('lend')}
        cardBg={cardBg} border={border} text={text} subtext={subtext} accent={accent}
        renderMeta={() => null}
      />
      <CuotasSection
        title="PRÉSTAMOS · DEBO"
        emptyText="No registraste préstamos que vos debas."
        items={loans.filter(l => l.kind === 'borrow' && !l.archived)}
        onToggle={toggleLoanCuota}
        onDelete={deleteLoan}
        onArchive={archiveLoan}
        onEdit={(l) => { setEditingLoan(l); setShowLoanModal(l.kind) }}
        onAdd={() => setShowLoanModal('borrow')}
        cardBg={cardBg} border={border} text={text} subtext={subtext} accent={accent}
        renderMeta={() => null}
      />

      <ArchivedSection
        installments={installments.filter(p => p.archived)}
        loans={loans.filter(l => l.archived)}
        onUnarchiveInstallment={unarchiveInstallmentPlan}
        onUnarchiveLoan={unarchiveLoan}
        onDeleteInstallment={deleteInstallmentPlan}
        onDeleteLoan={deleteLoan}
        cardBg={cardBg} border={border} text={text} subtext={subtext} accent={accent}
      />

      <div style={{ margin: '16px 20px 0' }}>
        <div style={{ fontSize: 12, letterSpacing: 1, color: subtext, fontWeight: 700, marginBottom: 10, paddingLeft: 2 }}>MOVIMIENTOS DEL MES</div>
        {combinedMonthList.length === 0 && <div style={{ color: subtext, fontSize: 14, padding: '20px 0', textAlign: 'center' }}>Sin movimientos todavía. Usá el botón + para agregar uno.</div>}
        {combinedMonthList.slice(0, 6).map(m => (
          <MovementCard key={m.id} m={m} accounts={accounts} onEdit={openEditMovement} onDelete={deleteMovement} cardBg={cardBg} border={border} text={text} subtext={subtext} accent={accent} />
        ))}
        {combinedMonthList.length > 6 && (
          <button onClick={() => setShowAllMovements(true)} style={{ background: 'none', border: 'none', color: accent, fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: '6px 2px', display: 'flex', alignItems: 'center', gap: 4 }}>
            Consultar todas <span style={{ fontSize: 15 }}>→</span>
          </button>
        )}
      </div>

      {showAllMovements && (
        <AllMovementsView
          movements={combinedMonthList}
          accounts={accounts}
          monthLabelText={monthLabel(monthCursor)}
          onBack={() => setShowAllMovements(false)}
          onEdit={openEditMovement}
          onDelete={deleteMovement}
          cardBg={cardBg} border={border} text={text} subtext={subtext} accent={accent} bg={bg}
        />
      )}

      <button onClick={() => { setEditingMovement(null); setShowModal(true) }} style={{ position: 'fixed', bottom: 24, right: 24, width: 58, height: 58, borderRadius: '50%', background: accent, border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(124,92,255,.5)', cursor: 'pointer' }}>
        <Plus size={28} />
      </button>

      {showModal && (
        <MovementModal
          accounts={accounts}
          initial={editingMovement}
          onClose={() => { setShowModal(false); setEditingMovement(null) }}
          onSave={addMovement}
          onUpdate={updateMovement}
          onSaveInstallment={addInstallmentPlan}
          cardBg={cardBg} border={border} text={text} subtext={subtext} accent={accent} bg={bg}
        />
      )}

      {showSettings && (
        <SettingsPanel
          rules={rules} setRules={setRules}
          accounts={accounts} addAccount={addAccount} deleteAccount={deleteAccount}
          obligations={obligations} addObligation={addObligation} deleteObligation={deleteObligation}
          onClose={() => setShowSettings(false)}
          downloadBackup={downloadBackup} restoreBackup={restoreBackup} downloadReport={downloadReport}
          fileInputRef={fileInputRef}
          cardBg={cardBg} border={border} text={text} subtext={subtext} accent={accent} bg={bg}
        />
      )}

      {showLoanModal && (
        <LoanModal
          kind={showLoanModal}
          initial={editingLoan}
          onClose={() => { setShowLoanModal(false); setEditingLoan(null) }}
          onSave={addLoan}
          onUpdate={updateLoan}
          cardBg={cardBg} border={border} text={text} subtext={subtext} accent={accent} bg={bg}
        />
      )}

      {editingInstallment && (
        <EditInstallmentModal
          plan={editingInstallment}
          accounts={accounts}
          onClose={() => setEditingInstallment(null)}
          onSave={updateInstallmentPlan}
          cardBg={cardBg} border={border} text={text} subtext={subtext} accent={accent} bg={bg}
        />
      )}

      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} cardBg={cardBg} border={border} text={text} />
    </div>
  )
}
