import { supabase } from './supabaseClient'

// ---------- Fetch everything the app needs on load ----------
export async function fetchAllData() {
  const [settings, accounts, movements, obligations, obligationChecks, installments, loans] = await Promise.all([
    supabase.from('app_settings').select('*').eq('id', 1).single(),
    supabase.from('accounts').select('*').eq('deleted', false).order('created_at'),
    supabase.from('movements').select('*').eq('deleted', false).order('created_at', { ascending: false }),
    supabase.from('obligations').select('*').eq('deleted', false).order('created_at'),
    supabase.from('obligation_checks').select('*'),
    supabase.from('installments').select('*').eq('deleted', false).order('created_at', { ascending: false }),
    supabase.from('loans').select('*').eq('deleted', false).order('created_at', { ascending: false }),
  ])

  return {
    settings: settings.data,
    accounts: accounts.data || [],
    movements: (movements.data || []).map(fromDbMovement),
    obligations: obligations.data || [],
    obligationChecks: obligationChecks.data || [],
    installments: (installments.data || []).map(fromDbInstallment),
    loans: loans.data || [],
  }
}

// ---------- mapping helpers (DB snake_case <-> app camelCase) ----------
function fromDbMovement(m) {
  return { id: m.id, type: m.type, amount: Number(m.amount), category: m.category, accountId: m.account_id, description: m.description, notes: m.notes, shared: m.shared, date: m.date, createdAt: new Date(m.created_at).getTime() }
}
function fromDbInstallment(p) {
  return { id: p.id, name: p.name, category: p.category, accountId: p.account_id, totalAmount: Number(p.total_amount), count: p.count, cuotaAmount: Number(p.cuota_amount), notes: p.notes, shared: p.shared, purchaseDate: p.purchase_date, archived: p.archived, createdAt: new Date(p.created_at).getTime() }
}

// ---------- Accounts ----------
export async function addAccount(name) {
  const { data } = await supabase.from('accounts').insert({ name }).select().single()
  return data
}
export async function softDeleteAccount(id) {
  await supabase.from('accounts').update({ deleted: true }).eq('id', id)
}

// ---------- Movements ----------
export async function addMovement(mv) {
  const { data } = await supabase.from('movements').insert({
    type: mv.type, amount: mv.amount, category: mv.category, account_id: mv.accountId,
    description: mv.description, notes: mv.notes, shared: mv.shared, date: mv.date.slice(0, 10),
  }).select().single()
  return fromDbMovement(data)
}
export async function updateMovement(id, mv) {
  await supabase.from('movements').update({
    type: mv.type, amount: mv.amount, category: mv.category, account_id: mv.accountId,
    description: mv.description, notes: mv.notes, shared: mv.shared, date: mv.date.slice(0, 10),
  }).eq('id', id)
}
export async function softDeleteMovement(id) {
  await supabase.from('movements').update({ deleted: true }).eq('id', id)
}

// ---------- Obligations ----------
export async function addObligation(name) {
  const { data } = await supabase.from('obligations').insert({ name }).select().single()
  return data
}
export async function softDeleteObligation(id) {
  await supabase.from('obligations').update({ deleted: true }).eq('id', id)
}
export async function setObligationCheck(obligationId, monthKeyStr, checked) {
  await supabase.from('obligation_checks').upsert({ obligation_id: obligationId, month_key: monthKeyStr, checked }, { onConflict: 'obligation_id,month_key' })
}

// ---------- Installments (compras en cuotas) ----------
export async function addInstallmentPlan(plan) {
  const { data } = await supabase.from('installments').insert({
    name: plan.name, category: plan.category, account_id: plan.accountId,
    total_amount: plan.totalAmount, count: plan.count, cuota_amount: plan.cuotaAmount,
    notes: plan.notes, shared: plan.shared, purchase_date: plan.purchaseDate.slice(0, 10), archived: false,
  }).select().single()
  return fromDbInstallment(data)
}
export async function updateInstallmentPlan(id, updated) {
  await supabase.from('installments').update({
    name: updated.name, category: updated.category, account_id: updated.accountId,
    total_amount: updated.totalAmount, count: updated.count, cuota_amount: updated.cuotaAmount,
    notes: updated.notes, shared: updated.shared,
  }).eq('id', id)
}
export async function archiveInstallmentPlan(id, archived) {
  await supabase.from('installments').update({ archived }).eq('id', id)
}
export async function softDeleteInstallmentPlan(id) {
  await supabase.from('installments').update({ deleted: true }).eq('id', id)
}

// ---------- Loans (préstamos) ----------
export async function addLoan(loan) {
  const { data } = await supabase.from('loans').insert({
    kind: loan.kind, name: loan.name, notes: loan.notes, total_amount: loan.totalAmount,
    count: loan.count, cuota_amount: loan.cuotaAmount, cuotas: loan.cuotas, archived: false,
  }).select().single()
  return data
}
export async function updateLoan(id, updated) {
  const payload = { name: updated.name, notes: updated.notes, total_amount: updated.totalAmount, count: updated.count, cuota_amount: updated.cuotaAmount }
  if (updated.cuotas) payload.cuotas = updated.cuotas
  await supabase.from('loans').update(payload).eq('id', id)
}
export async function toggleLoanCuota(loan, n) {
  const cuotas = loan.cuotas.map(c => c.n === n ? { ...c, paid: !c.paid, paid_date: !c.paid ? new Date().toISOString() : null } : c)
  await supabase.from('loans').update({ cuotas }).eq('id', loan.id)
  return cuotas
}
export async function archiveLoan(id, archived) {
  await supabase.from('loans').update({ archived }).eq('id', id)
}
export async function softDeleteLoan(id) {
  await supabase.from('loans').update({ deleted: true }).eq('id', id)
}

// ---------- Settings (rules, theme, backup timestamp) ----------
export async function updateSettings(fields) {
  const payload = {}
  if (fields.theme !== undefined) payload.theme = fields.theme
  if (fields.rules !== undefined) {
    payload.necesidades_pct = fields.rules.necesidades
    payload.deseos_pct = fields.rules.deseos
    payload.ahorro_pct = fields.rules.ahorro
  }
  if (fields.lastBackupAt !== undefined) payload.last_backup_at = fields.lastBackupAt
  await supabase.from('app_settings').update(payload).eq('id', 1)
}
