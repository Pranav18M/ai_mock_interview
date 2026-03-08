import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getInterviewHistory } from '../services/api'
import AppLayout from '../components/AppLayout'

const SH_MD = '0 4px 20px rgba(80,60,180,0.11), 0 2px 6px rgba(0,0,0,0.06)'
const SH_LG = '0 8px 32px rgba(80,60,180,0.14), 0 4px 12px rgba(0,0,0,0.07)'

export default function Scores() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    getInterviewHistory().then(r => { setHistory(r.data); setLoading(false) }).catch(() => setLoading(false))
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const completed = history.filter(h => h.status === 'completed')
  const avg = completed.length ? (completed.reduce((a, b) => a + (b.overall_score || 0), 0) / completed.length).toFixed(1) : null
  const best = completed.length ? Math.max(...completed.map(h => h.overall_score || 0)) : null
  const sc = s => s >= 8 ? '#059669' : s >= 6 ? '#d97706' : '#dc2626'
  const sb = s => s >= 8 ? '#f0fdf4' : s >= 6 ? '#fffbeb' : '#fff1f2'
  const sbo = s => s >= 8 ? 'rgba(5,150,105,0.18)' : s >= 6 ? 'rgba(217,119,6,0.18)' : 'rgba(220,38,38,0.18)'

  return (
    <AppLayout>
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: isMobile ? '24px 20px' : '44px 52px' }}>

        {/* Header */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: isMobile ? '24px' : '32px 36px', marginBottom: '24px', border: '1.5px solid rgba(79,70,229,0.08)', boxShadow: SH_LG }}>
          <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '900', color: '#1a1a2e', margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>Scores & History</h1>
          <p style={{ fontSize: '14px', color: 'rgba(26,26,46,0.48)', margin: 0 }}>Track your interview performance over time</p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Total Sessions', value: history.length, bg: '#f0f0ff', color: '#4f46e5', border: 'rgba(79,70,229,0.14)', glow: 'rgba(79,70,229,0.12)' },
            { label: 'Completed', value: completed.length, bg: '#f0fdf4', color: '#059669', border: 'rgba(5,150,105,0.14)', glow: 'rgba(5,150,105,0.1)' },
            { label: 'Average Score', value: avg ? `${avg}/10` : '—', bg: '#fffbeb', color: '#d97706', border: 'rgba(217,119,6,0.14)', glow: 'rgba(217,119,6,0.1)' },
            { label: 'Best Score', value: best ? `${best}/10` : '—', bg: '#fff1f2', color: '#dc2626', border: 'rgba(220,38,38,0.14)', glow: 'rgba(220,38,38,0.08)' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: '16px', padding: '20px', boxShadow: `0 4px 20px ${s.glow}, 0 1px 4px rgba(0,0,0,0.04)`, transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 32px ${s.glow}, 0 2px 8px rgba(0,0,0,0.06)` }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 20px ${s.glow}, 0 1px 4px rgba(0,0,0,0.04)` }}
            >
              <p style={{ fontSize: isMobile ? '24px' : '30px', fontWeight: '900', color: s.color, margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: 'rgba(26,26,46,0.45)', margin: 0, fontWeight: '500' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1.5px solid rgba(79,70,229,0.08)', borderRadius: '20px', overflow: 'hidden', boxShadow: SH_LG }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(79,70,229,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(180deg,#fff,#fafaff)' }}>
            <p style={{ fontSize: '15px', fontWeight: '800', color: '#1a1a2e', margin: 0 }}>Interview Sessions</p>
            <span style={{ fontSize: '12px', color: 'rgba(26,26,46,0.4)', background: '#f0f0ff', border: '1px solid rgba(79,70,229,0.12)', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>{history.length} total</span>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ width: '30px', height: '30px', border: '2.5px solid rgba(79,70,229,0.15)', borderTop: '2.5px solid #4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ color: 'rgba(26,26,46,0.35)', fontSize: '14px', margin: '0 0 12px 0' }}>No interview sessions yet</p>
              <Link to="/setup" style={{ color: '#4f46e5', fontSize: '13px', textDecoration: 'none', fontWeight: '700' }}>Start your first interview →</Link>
            </div>
          ) : isMobile ? (
            <div>
              {history.map((item, i) => {
                const score = item.overall_score
                const hasScore = score !== null && score !== undefined
                return (
                  <Link key={item.id} to={`/report/${item.id}`} style={{ display: 'block', padding: '16px 20px', borderBottom: i < history.length - 1 ? '1px solid rgba(79,70,229,0.05)' : 'none', textDecoration: 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafaff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 3px 0' }}>{item.role}</p>
                        <p style={{ fontSize: '12px', color: 'rgba(26,26,46,0.4)', margin: 0, textTransform: 'capitalize' }}>{item.difficulty} · {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {hasScore
                          ? <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', background: sb(score), border: `1.5px solid ${sbo(score)}`, color: sc(score), fontSize: '13px', fontWeight: '800', boxShadow: `0 2px 8px ${sbo(score)}` }}>{score}/10</span>
                          : <span style={{ fontSize: '12px', color: item.status === 'in_progress' ? '#d97706' : 'rgba(26,26,46,0.3)', fontWeight: '600' }}>{item.status === 'in_progress' ? 'In Progress' : '—'}</span>}
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,0.25)" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', padding: '12px 24px', borderBottom: '1px solid rgba(79,70,229,0.05)', background: '#fafaff' }}>
                {['Role', 'Level', 'Date', 'Score', ''].map(h => (
                  <p key={h} style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(26,26,46,0.32)', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</p>
                ))}
              </div>
              {history.map((item, i) => {
                const score = item.overall_score
                const hasScore = score !== null && score !== undefined
                return (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', padding: '16px 24px', borderBottom: i < history.length - 1 ? '1px solid rgba(79,70,229,0.05)' : 'none', transition: 'background 0.15s', alignItems: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafaff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a2e', margin: 0 }}>{item.role}</p>
                    <p style={{ fontSize: '13px', color: 'rgba(26,26,46,0.48)', margin: 0, textTransform: 'capitalize' }}>{item.difficulty}</p>
                    <p style={{ fontSize: '13px', color: 'rgba(26,26,46,0.48)', margin: 0 }}>{item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</p>
                    <div>{hasScore
                      ? <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', background: sb(score), border: `1.5px solid ${sbo(score)}`, color: sc(score), fontSize: '13px', fontWeight: '800', boxShadow: `0 2px 8px ${sbo(score)}` }}>{score}/10</span>
                      : <span style={{ fontSize: '12px', color: item.status === 'in_progress' ? '#d97706' : 'rgba(26,26,46,0.3)', fontWeight: '600' }}>{item.status === 'in_progress' ? 'In Progress' : '—'}</span>}
                    </div>
                    <Link to={`/report/${item.id}`} style={{ fontSize: '13px', color: '#4f46e5', textDecoration: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      View <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Link to="/setup" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 30px', borderRadius: '12px', background: '#1a1a2e', color: '#fff', fontWeight: '700', fontSize: '14px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(26,26,46,0.25)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(26,26,46,0.32)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,26,46,0.25)'; e.currentTarget.style.transform = 'none' }}
            >Start New Interview →</Link>
          </div>
        )}
      </div>
    </AppLayout>
  )
}