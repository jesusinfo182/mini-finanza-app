import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Trash2, Pencil, Plus } from 'lucide-react'
import { CATS, fmt, fitFontSize, monthLabel, cuotaStatus, formatLocalDate, truncateNotes } from '../lib/helpers'

function SectionChevron({ open, subtext }) {
  return (
    <div style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: subtext, flexShrink: 0 }}>
      <ChevronDown size={18} strokeWidth={2.25} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }} />
    </div>
  )
}

export function SummaryCard({ label, value, fontSize, color, cardBg, border, subtext }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: '14px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, letterSpacing: 1, color: subtext, fontWeight: 700 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize, fontWeight: 800, color, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden' }}>{value}</div>
    </div>
  )
}

export function MovementCard({ m, accounts, onEdit, onDelete, cardBg, border, text, subtext, accent }) {
  return (
    <div onClick={() => onEdit(m)} style={{ background: cardBg, border: `1px solid ${m.isInstallment ? accent + '55' : border}`, borderRadius: 12, padding: 14, marginBottom: 8, cursor: m.isInstallment ? 'default' : 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{m.description || '(Sin descripción)'}</div>
        {!m.isInstallment && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 8 }}>
            <button onClick={(e) => { e.stopPropagation(); onEdit(m) }} style={{ background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}><Pencil size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(m.id) }} style={{ background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}><Trash2 size={15} /></button>
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: subtext, marginTop: 2 }}>
        <b style={{ color: subtext }}>{CATS.find(c => c.id === m.category)?.label || 'Ingreso'}</b> · <span style={{ color: '#f472b6', fontWeight: 600 }}>{accounts.find(a => a.id === m.accountId)?.name || '—'}</span>
      </div>
      {(m.shared || m.isInstallment) && (
        <div style={{ fontSize: 12, color: accent, marginTop: 2 }}>
          {m.isInstallment && `Cuota ${m.cuotaIndex}/${m.plan.count} (Total ${fmt(m.plan.totalAmount)})`}
          {m.isInstallment && m.shared && ' · '}
          {m.shared && 'Compartido'}
        </div>
      )}
      {m.notes && <div style={{ fontSize: 12, color: subtext, marginTop: 4, fontStyle: 'italic' }}>"{truncateNotes(m.notes)}"</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
        <span style={{ fontSize: 12, color: subtext }}>{formatLocalDate(m.date)}</span>
        <span style={{ fontWeight: 700, whiteSpace: 'nowrap', color: m.type === 'income' ? '#22c55e' : '#ef4444' }}>{m.type === 'income' ? '+' : '-'}{fmt(m.amount)}</span>
      </div>
    </div>
  )
}

export function AllMovementsView({ movements, accounts, monthLabelText, onBack, onEdit, onDelete, cardBg, border, text, subtext, accent, bg }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: bg, zIndex: 60, overflowY: 'auto' }}>
      <div style={{ position: 'sticky', top: 0, background: bg, display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', borderBottom: `1px solid ${border}` }}>
        <button onClick={onBack} style={{ width: 34, height: 34, borderRadius: 10, background: cardBg, border: `1px solid ${border}`, color: text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ChevronDown size={18} strokeWidth={2.25} style={{ transform: 'rotate(90deg)' }} />
        </button>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: text }}>Todos los movimientos</div>
          <div style={{ fontSize: 12, color: subtext }}>{monthLabelText}</div>
        </div>
      </div>
      <div style={{ padding: '16px 20px' }}>
        {movements.length === 0 && <div style={{ color: subtext, fontSize: 14, padding: '20px 0', textAlign: 'center' }}>Sin movimientos todavía.</div>}
        {movements.map(m => (
          <MovementCard key={m.id} m={m} accounts={accounts} onEdit={onEdit} onDelete={onDelete} cardBg={cardBg} border={border} text={text} subtext={subtext} accent={accent} />
        ))}
      </div>
    </div>
  )
}

export function ConfirmDialog({ dialog, onClose, cardBg, border, text }) {
  if (!dialog) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }} onClick={onClose}>
      <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 22, maxWidth: 340 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 14, color: text, marginBottom: 18, lineHeight: 1.4 }}>{dialog.message}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: text, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => { dialog.onConfirm(); onClose() }} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export function ObligationsSection({ obligations, checks, onToggle, cardBg, border, text, subtext, accent }) {
  const [open, setOpen] = useState(false)
  const paidCount = obligations.filter(ob => checks[ob.id]).length
  if (obligations.length === 0) return null
  return (
    <div style={{ margin: '16px 20px 0', background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: 18 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 12, letterSpacing: 1, color: subtext, fontWeight: 700 }}>OBLIGACIONES MENSUALES</div>
          <div style={{ fontSize: 11, color: subtext }}>({paidCount}/{obligations.length})</div>
        </div>
        <SectionChevron open={open} subtext={subtext} />
      </button>
      {open && (
        <div style={{ marginTop: 12 }}>
          {obligations.map(ob => {
            const checked = !!checks[ob.id]
            return (
              <div key={ob.id} onClick={() => onToggle(ob.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${border}`, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${checked ? '#22c55e' : subtext}`, background: checked ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {checked && <Check size={13} color="#fff" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: 14, color: checked ? subtext : text, textDecoration: checked ? 'line-through' : 'none' }}>{ob.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: checked ? '#22c55e' : '#f97316' }}>{checked ? 'Pagado' : 'Pendiente'}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function CuotasSection({ title, emptyText, items, onToggle, onDelete, onArchive, onEdit, onAdd, hideAdd, renderMeta, cardBg, border, text, subtext, accent }) {
  const [open, setOpen] = useState(false)
  const prevCount = useRef(items.length)
  useEffect(() => {
    if (items.length > prevCount.current) setOpen(true)
    prevCount.current = items.length
  }, [items.length])

  return (
    <div style={{ margin: '16px 20px 0', background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: open ? 12 : 0 }}>
        <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 12, letterSpacing: 1, color: subtext, fontWeight: 700 }}>{title}</div>
          {items.length > 0 && <div style={{ fontSize: 11, color: subtext }}>({items.length})</div>}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!hideAdd && (
            <button onClick={onAdd} style={{ width: 26, height: 26, borderRadius: 7, background: accent, border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Plus size={15} /></button>
          )}
          <button onClick={() => setOpen(o => !o)} style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: subtext, cursor: 'pointer', flexShrink: 0 }}>
            <ChevronDown size={18} strokeWidth={2.25} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }} />
          </button>
        </div>
      </div>
      {open && (
        <>
          {items.length === 0 && <div style={{ color: subtext, fontSize: 13, padding: '6px 0' }}>{emptyText}</div>}
          {items.map(item => {
            const paidCount = item.cuotas.filter(c => c.paid).length
            const done = paidCount === item.cuotas.length
            return (
              <div key={item.id} style={{ marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: text }}>{item.name} {done && <span style={{ color: '#22c55e', fontSize: 12 }}>· Completado</span>}</div>
                    {renderMeta(item) && <div style={{ fontSize: 12, color: subtext }}>{renderMeta(item)}</div>}
                    <div style={{ fontSize: 12, color: subtext, marginTop: 2 }}>Total {fmt(item.total_amount)} · {paidCount}/{item.cuotas.length} cuotas</div>
                    {item.created_at && <div style={{ fontSize: 11, color: subtext, marginTop: 2 }}>Creado el {formatLocalDate(item.created_at)}</div>}
                    {item.notes && <div style={{ fontSize: 12, color: subtext, fontStyle: 'italic', marginTop: 2 }}>"{truncateNotes(item.notes)}"</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {done && <button onClick={() => onArchive(item.id)} title="Archivar" style={{ fontSize: 11, fontWeight: 700, color: accent, background: 'none', border: `1px solid ${accent}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>Archivar</button>}
                    <button onClick={() => onEdit(item)} style={{ background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}><Pencil size={14} /></button>
                    <button onClick={() => onDelete(item.id)} style={{ background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
                  {item.cuotas.map(c => (
                    <div key={c.n} onClick={() => onToggle(item, c.n)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '3px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${c.paid ? '#22c55e' : subtext}`, background: c.paid ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {c.paid && <Check size={11} color="#fff" strokeWidth={3} />}
                        </div>
                        <span style={{ fontSize: 13, color: c.paid ? subtext : text, textDecoration: c.paid ? 'line-through' : 'none' }}>Cuota {String(c.n).padStart(2, '0')}/{String(item.cuotas.length).padStart(2, '0')}</span>
                        {c.paid && c.paid_date && <span style={{ fontSize: 11, color: subtext }}>· {formatLocalDate(c.paid_date)}</span>}
                      </div>
                      <span style={{ fontSize: 13, color: c.paid ? subtext : text }}>{fmt(item.cuota_amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

export function InstallmentsOverview({ items, onDelete, onArchive, onEdit, renderMeta, cardBg, border, text, subtext, accent }) {
  const [open, setOpen] = useState(false)
  const prevCount = useRef(items.length)
  useEffect(() => {
    if (items.length > prevCount.current) setOpen(true)
    prevCount.current = items.length
  }, [items.length])

  const statusLabel = { paid: 'Pagada', actual: 'Actual', pending: 'Pendiente' }
  const statusColor = { paid: '#22c55e', actual: '#eab308', pending: subtext }

  return (
    <div style={{ margin: '16px 20px 0', background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: 18 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 12, letterSpacing: 1, color: subtext, fontWeight: 700 }}>COMPRAS EN CUOTAS</div>
          {items.length > 0 && <div style={{ fontSize: 11, color: subtext }}>({items.length})</div>}
        </div>
        <SectionChevron open={open} subtext={subtext} />
      </button>
      {open && (
        <div style={{ marginTop: 12 }}>
          {items.length === 0 && <div style={{ color: subtext, fontSize: 13, padding: '6px 0' }}>No tenés compras en cuotas activas. Se crean desde el botón + marcando "Es una compra en cuotas".</div>}
          {items.map(plan => {
            const statuses = Array.from({ length: plan.count }, (_, i) => cuotaStatus(plan, i + 1))
            const paidCount = statuses.filter(s => s === 'paid' || s === 'actual').length
            return (
              <div key={plan.id} style={{ marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: text }}>{plan.name} {plan.shared && <span style={{ color: accent, fontSize: 12, fontWeight: 600 }}>· Compartido</span>}</div>
                    <div style={{ fontSize: 12, color: subtext }}>{renderMeta(plan)}</div>
                    <div style={{ fontSize: 12, color: subtext, marginTop: 2 }}>Total {fmt(plan.totalAmount)} · {paidCount}/{plan.count} cuotas</div>
                    <div style={{ fontSize: 11, color: subtext, marginTop: 2 }}>Comprado el {formatLocalDate(plan.purchaseDate)}</div>
                    {plan.notes && <div style={{ fontSize: 12, color: subtext, fontStyle: 'italic', marginTop: 2 }}>"{truncateNotes(plan.notes)}"</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {paidCount === plan.count && <button onClick={() => onArchive(plan.id)} title="Archivar" style={{ fontSize: 11, fontWeight: 700, color: accent, background: 'none', border: `1px solid ${accent}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>Archivar</button>}
                    <button onClick={() => onEdit(plan)} style={{ background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}><Pencil size={14} /></button>
                    <button onClick={() => onDelete(plan.id)} style={{ background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
                  {Array.from({ length: plan.count }, (_, i) => i + 1).map(n => {
                    const st = cuotaStatus(plan, n)
                    const due = new Date(plan.purchaseDate)
                    due.setMonth(due.getMonth() + (n - 1))
                    return (
                      <div key={n} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[st], flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: st === 'pending' ? subtext : text }}>Cuota {String(n).padStart(2, '0')}/{String(plan.count).padStart(2, '0')} — {monthLabel(due)}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: statusColor[st] }}>{statusLabel[st]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ArchivedSection({ installments, loans, onUnarchiveInstallment, onUnarchiveLoan, onDeleteInstallment, onDeleteLoan, cardBg, border, text, subtext, accent }) {
  const [open, setOpen] = useState(false)
  const total = installments.length + loans.length
  if (total === 0) return null
  return (
    <div style={{ margin: '16px 20px 0', background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: 18 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 12, letterSpacing: 1, color: subtext, fontWeight: 700 }}>ARCHIVADOS</div>
          <div style={{ fontSize: 11, color: subtext }}>({total})</div>
        </div>
        <SectionChevron open={open} subtext={subtext} />
      </button>
      {open && (
        <div style={{ marginTop: 12 }}>
          {installments.map(plan => (
            <div key={plan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${border}` }}>
              <div>
                <div style={{ fontSize: 14, color: text }}>{plan.name}</div>
                <div style={{ fontSize: 12, color: subtext }}>Compra en cuotas · Total {fmt(plan.totalAmount)}</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => onUnarchiveInstallment(plan.id)} style={{ fontSize: 11, fontWeight: 700, color: accent, background: 'none', border: `1px solid ${accent}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>Desarchivar</button>
                <button onClick={() => onDeleteInstallment(plan.id)} style={{ background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {loans.map(loan => (
            <div key={loan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${border}` }}>
              <div>
                <div style={{ fontSize: 14, color: text }}>{loan.name}</div>
                <div style={{ fontSize: 12, color: subtext }}>Préstamo · {loan.kind === 'lend' ? 'Me debían' : 'Debía'} · Total {fmt(loan.total_amount)}</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => onUnarchiveLoan(loan.id)} style={{ fontSize: 11, fontWeight: 700, color: accent, background: 'none', border: `1px solid ${accent}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>Desarchivar</button>
                <button onClick={() => onDeleteLoan(loan.id)} style={{ background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
