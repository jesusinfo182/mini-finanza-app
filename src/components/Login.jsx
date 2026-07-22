import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login({ theme }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const dark = theme === 'dark'
  const bg = dark ? '#0c0c11' : '#f7f7fa'
  const cardBg = dark ? '#16161f' : '#ffffff'
  const border = dark ? '#26262f' : '#e5e5ea'
  const text = dark ? '#f2f2f5' : '#17171c'
  const subtext = dark ? '#8a8a99' : '#6b6b76'
  const accent = '#7c5cff'
  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${border}`, background: bg, color: text, fontSize: 14, marginTop: 6, boxSizing: 'border-box' }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Completá email y contraseña.'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError('Email o contraseña incorrectos.')
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: "'Poppins', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 340, background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 800, textAlign: 'center', marginBottom: 24 }}>
          <span style={{ color: accent }}>fin.</span> <span style={{ fontWeight: 400, fontSize: 14, color: subtext }}>mini</span>
        </div>

        <label style={{ fontSize: 12, color: subtext, fontWeight: 600 }}>Email</label>
        <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" />

        <div style={{ marginTop: 14 }}>
          <label style={{ fontSize: 12, color: subtext, fontWeight: 600 }}>Contraseña</label>
          <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
        </div>

        {error && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 14, background: '#ef444422', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ width: '100%', marginTop: 20, padding: 13, borderRadius: 10, border: 'none', background: accent, color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  )
}
