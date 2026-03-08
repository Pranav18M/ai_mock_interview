import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getInterviewHistory } from '../services/api'
import AppLayout from '../components/AppLayout'

export default function Scores() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024)

  useEffect(() => {
    getInterviewHistory().then(r => { setHistory(r.data); setLoading(false) }).catch(() => setLoading(false))
    const handleResize = () => { setIsMobile(window.innerWidth < 768); setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const completed = history.filter(h => h.status === 'completed')
  const avg = completed.length ? (completed.reduce((a, b) => a + (b.overall_score || 0), 0) / completed.length).toFixed(1) : null
  const best = completed.length ? Math.max(...completed.map(h => h.overall_score || 0)) : null
  const sc = (s) => s >= 8 ? '#10b981' : s >= 6 ? '#f59e0b' : s >= 4 ? '#f97316' : '#ef4444'
  const sb = (s) => s >= 8 ? 'rgba(16,185,129,0.1)' : s >= 6 ? 'rgba(245,158,11,0.1)' : s >= 4 ? 'rgba(249,115,22,0.1)' : 'rgba(239,68,68,0.1)'
  const sbo = (s) => s >= 8 ? 'rgba(16,185,129,0.25)' : s >= 6 ? 'rgba(245,158,11,0.25)' : s >= 4 ? 'rgba(249,115,22,0.25)' : 'rgba(239,68,68,0.25)'
  const p = isMobile ? '24px 20px' : isTablet ? '32px 28px' : '40px 48px'

  return (
    <AppLayout>
      <div style={{ padding: p, maxWidth: '900px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#f0f2f8', margin: '0 0 6px 0', letterSpacing: '-0.4px' }}>Scores & History</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Track your interview performance over time</p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '12px', marginBottom: '32px' }}>
          {[
            { label: 'Total Sessions', value: history.length, color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
            { label: 'Completed', value: completed.length, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
            { label: 'Average Score', value: avg ? `${avg}/10` : '—', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
            { label: 'Best Score', value: best ? `${best}/10` : '—', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '14px', padding: isMobile ? '16px' : '20px 24px' }}>
              <p style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: '700', color: s.color, margin: '0 0 5px 0' }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: '500' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#e8eaf0', margin: 0 }}>Interview Sessions</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{history.length} total</p>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ width: '28px', height: '28px', border: '2px solid rgba(99,102,241,0.3)', borderTop: '2px solid #6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px', margin: '0 0 10px 0' }}>No interview sessions yet</p>
              <Link to="/setup" style={{ color: '#6366f1', fontSize: '13px', textDecoration: 'none' }}>Start your first interview</Link>
            </div>
          ) : isMobile ? (
            /* Mobile card list */
            <div>
              {history.map((item, i) => {
                const score = item.overall_score
                const hasScore = score !== null && score !== undefined
                return (
                  <Link key={item.id} to={`/report/${item.id}`} style={{ display: 'block', padding: '16px 20px', borderBottom: i < history.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', textDecoration: 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#e8eaf0', margin: '0 0 4px 0' }}>{item.role}</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0, textTransform: 'capitalize' }}>
                          {item.difficulty} · {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {hasScore
                          ? <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', background: sb(score), border: `1px solid ${sbo(score)}`, color: sc(score), fontSize: '13px', fontWeight: '600' }}>{score}/10</span>
                          : <span style={{ fontSize: '12px', color: item.status === 'in_progress' ? '#f59e0b' : 'rgba(255,255,255,0.25)', fontWeight: '500' }}>{item.status === 'in_progress' ? 'In Progress' : '—'}</span>}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            /* Desktop table */
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 70px', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Role', 'Level', 'Date', 'Score', ''].map(h => (
                  <p key={h} style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.25)', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</p>
                ))}
              </div>
              {history.map((item, i) => {
                const score = item.overall_score
                const hasScore = score !== null && score !== undefined
                return (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 70px', padding: '16px 24px', borderBottom: i < history.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <p style={{ fontSize: '14px', fontWeight: '500', color: '#e8eaf0', margin: 0 }}>{item.role}</p>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0, textTransform: 'capitalize' }}>{item.difficulty}</p>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</p>
                    <div>{hasScore
                      ? <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', background: sb(score), border: `1px solid ${sbo(score)}`, color: sc(score), fontSize: '13px', fontWeight: '600' }}>{score}/10</span>
                      : <span style={{ fontSize: '12px', color: item.status === 'in_progress' ? '#f59e0b' : 'rgba(255,255,255,0.25)', fontWeight: '500' }}>{item.status === 'in_progress' ? 'In Progress' : '—'}</span>}
                    </div>
                    <Link to={`/report/${item.id}`} style={{ fontSize: '12px', color: '#6366f1', textDecoration: 'none', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      View <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link to="/setup" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 28px', borderRadius: '10px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', fontWeight: '600', fontSize: '14px', textDecoration: 'none', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
              Start New Interview
            </Link>
          </div>
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AppLayout>
  )
}