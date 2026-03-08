import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getInterviewReport } from '../services/api'
import AppLayout from '../components/AppLayout'

function Ring({ score, size = 100 }) {
  const r = size / 2 - 9, circ = 2 * Math.PI * r
  const offset = circ - (score / 10) * circ
  const color = score >= 8 ? '#10b981' : score >= 6 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease' }}/>
    </svg>
  )
}

function QItem({ item, index, isMobile }) {
  const [open, setOpen] = useState(false)
  const s = item.score?.overall ?? 0
  const c = s >= 7 ? '#10b981' : s >= 5 ? '#f59e0b' : '#ef4444'
  const bg = s >= 7 ? 'rgba(16,185,129,0.06)' : s >= 5 ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)'
  const border = s >= 7 ? 'rgba(16,185,129,0.2)' : s >= 5 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '10px' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{index + 1}</span>
        <p style={{ flex: 1, fontSize: isMobile ? '12px' : '14px', color: '#e8eaf0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.question}</p>
        <span style={{ fontSize: '13px', fontWeight: '700', color: c, marginRight: '6px', flexShrink: 0 }}>{s}/10</span>
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.3)" strokeWidth="2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Your Answer</p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '14px', lineHeight: '1.65' }}>{item.answer || 'No answer provided'}</p>
          {item.score && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '10px' }}>
                {[['Technical', item.score.technical_knowledge], ['Communication', item.score.communication], ['Relevance', item.score.relevance]].map(([l, v]) => (
                  <div key={l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: '#e8eaf0', margin: '0 0 3px 0' }}>{v}</p>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{l}</p>
                  </div>
                ))}
              </div>
              {item.score.feedback && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', margin: 0 }}>{item.score.feedback}</p>}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function InterviewReport() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024)

  useEffect(() => {
    getInterviewReport(id).then(r => { setReport(r.data); setLoading(false) }).catch(e => { setError(e.response?.data?.detail || 'Failed to load'); setLoading(false) })
    const handleResize = () => { setIsMobile(window.innerWidth < 768); setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [id])

  if (loading) return <AppLayout><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div style={{ width: '32px', height: '32px', border: '2px solid rgba(99,102,241,0.3)', borderTop: '2px solid #6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div></AppLayout>

  if (error) return <AppLayout><div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p><Link to="/scores" style={{ color: '#6366f1', textDecoration: 'none' }}>Back to Scores</Link></div></AppLayout>

  const fb = report?.feedback || {}
  const answers = report?.answers || []
  const score = fb.overall_score ?? 0
  const scoreColor = score >= 8 ? '#10b981' : score >= 6 ? '#f59e0b' : '#ef4444'
  const date = report?.date ? new Date(report.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
  const p = isMobile ? '24px 20px' : isTablet ? '32px 28px' : '40px 48px'
  const feedbackCols = isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(2,1fr)'

  return (
    <AppLayout>
      <div style={{ padding: p, maxWidth: '860px' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/scores" style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', flexShrink: 0 }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </Link>
          <div>
            <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: '#f0f2f8', margin: '0 0 3px 0', letterSpacing: '-0.4px' }}>Interview Report</h1>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>{date}</p>
          </div>
        </div>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(59,130,246,0.06))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '18px', padding: isMobile ? '24px' : '36px', marginBottom: '24px', display: 'flex', gap: isMobile ? '20px' : '36px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Ring score={score} size={isMobile ? 90 : 110} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '800', color: scoreColor, lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>/10</span>
            </div>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: 'rgba(99,102,241,0.7)', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>Overall Score</p>
            <h2 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: '#f0f2f8', margin: '0 0 5px 0' }}>{report.role}</h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '0 0 10px 0', textTransform: 'capitalize' }}>{report.difficulty} level — {answers.length} questions</p>
            <span style={{ fontSize: '12px', fontWeight: '600', color: scoreColor, background: score >= 8 ? 'rgba(16,185,129,0.1)' : score >= 6 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', padding: '4px 12px', borderRadius: '20px' }}>
              {score >= 8 ? 'Excellent Performance' : score >= 6 ? 'Good Performance' : 'Needs Improvement'}
            </span>
          </div>
        </div>

        {/* Feedback Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: feedbackCols, gap: '14px', marginBottom: '24px' }}>
          {[
            { title: 'Strengths', items: fb.strengths, color: '#10b981', bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.18)' },
            { title: 'Areas to Improve', items: fb.areas_for_improvement, color: '#f59e0b', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.18)' },
            { title: 'Skill Suggestions', items: fb.skill_suggestions, color: '#3b82f6', bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.18)' },
          ].map(section => section.items?.length > 0 && (
            <div key={section.title} style={{ background: section.bg, border: `1px solid ${section.border}`, borderRadius: '14px', padding: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: section.color, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{section.title}</p>
              {section.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '7px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: section.color, flexShrink: 0, marginTop: '6px' }} />
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: '1.6' }}>{item}</p>
                </div>
              ))}
            </div>
          ))}
          {fb.recommended_topics?.length > 0 && (
            <div style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '14px', padding: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#8b5cf6', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Study Topics</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {fb.recommended_topics.map((t, i) => <span key={i} style={{ fontSize: '11px', background: 'rgba(139,92,246,0.12)', color: '#a78bfa', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(139,92,246,0.2)' }}>{t}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* Q Breakdown */}
        {answers.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#e8eaf0', marginBottom: '14px' }}>Question Breakdown</p>
            {answers.map((item, i) => <QItem key={i} item={item} index={i} isMobile={isMobile} />)}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
          <Link to="/setup" style={{ flex: 1, padding: '13px', borderRadius: '10px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', fontWeight: '600', fontSize: '14px', textDecoration: 'none', textAlign: 'center', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>Start New Interview</Link>
          <Link to="/scores" style={{ flex: 1, padding: '13px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontWeight: '500', fontSize: '14px', textDecoration: 'none', textAlign: 'center' }}>All Scores</Link>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AppLayout>
  )
}