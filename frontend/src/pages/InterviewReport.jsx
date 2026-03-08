import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getInterviewReport } from '../services/api'
import AppLayout from '../components/AppLayout'

function Ring({ score, size = 100 }) {
  const r = size / 2 - 9, circ = 2 * Math.PI * r
  const offset = circ - (score / 10) * circ
  const color = score >= 8 ? '#059669' : score >= 6 ? '#d97706' : '#dc2626'
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="7"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease' }}/>
    </svg>
  )
}

function QItem({ item, index, isMobile }) {
  const [open, setOpen] = useState(false)
  const s = item.score?.overall ?? 0
  const c = s >= 7 ? '#059669' : s >= 5 ? '#d97706' : '#dc2626'
  const bg = s >= 7 ? '#f0fdf4' : s >= 5 ? '#fffbeb' : '#fff1f2'
  const border = s >= 7 ? '#d1fae5' : s >= 5 ? '#fef3c7' : '#ffe4e6'
  return (
    <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '10px' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#fff', border: '1.5px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'rgba(26,26,46,0.5)', flexShrink: 0 }}>{index + 1}</span>
        <p style={{ flex: 1, fontSize: isMobile ? '13px' : '14px', color: '#1a1a2e', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500' }}>{item.question}</p>
        <span style={{ fontSize: '14px', fontWeight: '800', color: c, marginRight: '6px', flexShrink: 0 }}>{s}/10</span>
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,0.3)" strokeWidth="2.5" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '14px' }}>
          <p style={{ fontSize: '11px', color: 'rgba(26,26,46,0.4)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Your Answer</p>
          <p style={{ fontSize: '13px', color: 'rgba(26,26,46,0.65)', marginBottom: '14px', lineHeight: '1.65' }}>{item.answer || 'No answer provided'}</p>
          {item.score && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '10px' }}>
                {[['Technical', item.score.technical_knowledge], ['Communication', item.score.communication], ['Relevance', item.score.relevance]].map(([l, v]) => (
                  <div key={l} style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,0.07)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: '18px', fontWeight: '800', color: '#1a1a2e', margin: '0 0 3px 0' }}>{v}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(26,26,46,0.4)', margin: 0 }}>{l}</p>
                  </div>
                ))}
              </div>
              {item.score.feedback && <p style={{ fontSize: '12.5px', color: 'rgba(26,26,46,0.55)', fontStyle: 'italic', margin: 0, lineHeight: '1.6' }}>{item.score.feedback}</p>}
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

  useEffect(() => {
    getInterviewReport(id).then(r => { setReport(r.data); setLoading(false) }).catch(e => { setError(e.response?.data?.detail || 'Failed to load'); setLoading(false) })
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [id])

  if (loading) return <AppLayout><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div style={{ width: '32px', height: '32px', border: '2px solid rgba(79,70,229,0.15)', borderTop: '2px solid #4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /></div></AppLayout>
  if (error) return <AppLayout><div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: '#dc2626', marginBottom: '16px' }}>{error}</p><Link to="/scores" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: '600' }}>← Back to Scores</Link></div></AppLayout>

  const fb = report?.feedback || {}
  const answers = report?.answers || []
  const score = fb.overall_score ?? 0
  const scoreColor = score >= 8 ? '#059669' : score >= 6 ? '#d97706' : '#dc2626'
  const scoreBg = score >= 8 ? '#f0fdf4' : score >= 6 ? '#fffbeb' : '#fff1f2'
  const date = report?.date ? new Date(report.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
  const p = isMobile ? '24px 20px' : '40px 48px'

  return (
    <AppLayout>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: p }}>
        {/* Header */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/scores" style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fff', border: '1.5px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(26,26,46,0.5)', textDecoration: 'none', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </Link>
          <div>
            <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '800', color: '#1a1a2e', margin: '0 0 3px 0', letterSpacing: '-0.5px' }}>Interview Report</h1>
            <p style={{ fontSize: '13px', color: 'rgba(26,26,46,0.4)', margin: 0 }}>{date}</p>
          </div>
        </div>

        {/* Hero score card */}
        <div style={{ background: scoreBg, border: `1.5px solid ${score >= 8 ? '#d1fae5' : score >= 6 ? '#fef3c7' : '#ffe4e6'}`, borderRadius: '18px', padding: isMobile ? '24px' : '32px 40px', marginBottom: '24px', display: 'flex', gap: isMobile ? '20px' : '36px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Ring score={score} size={isMobile ? 90 : 110} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: isMobile ? '24px' : '30px', fontWeight: '900', color: scoreColor, lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: '11px', color: 'rgba(26,26,46,0.4)', fontWeight: '600' }}>/10</span>
            </div>
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '700', color: scoreColor, margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Overall Score</p>
            <h2 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '800', color: '#1a1a2e', margin: '0 0 5px 0', letterSpacing: '-0.4px' }}>{report.role}</h2>
            <p style={{ fontSize: '13px', color: 'rgba(26,26,46,0.5)', margin: '0 0 12px 0', textTransform: 'capitalize' }}>{report.difficulty} level · {answers.length} questions</p>
            <span style={{ fontSize: '13px', fontWeight: '700', color: scoreColor, background: '#fff', padding: '5px 14px', borderRadius: '20px', border: `1.5px solid ${score >= 8 ? '#d1fae5' : score >= 6 ? '#fef3c7' : '#ffe4e6'}` }}>
              {score >= 8 ? '🎉 Excellent Performance' : score >= 6 ? '👍 Good Performance' : '📈 Needs Improvement'}
            </span>
          </div>
        </div>

        {/* Feedback grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: '14px', marginBottom: '24px' }}>
          {[
            { title: 'Strengths', items: fb.strengths, color: '#059669', bg: '#f0fdf4', border: '#d1fae5', icon: '✓' },
            { title: 'Areas to Improve', items: fb.areas_for_improvement, color: '#d97706', bg: '#fffbeb', border: '#fef3c7', icon: '↑' },
            { title: 'Skill Suggestions', items: fb.skill_suggestions, color: '#4f46e5', bg: '#f0f0ff', border: '#e0e0ff', icon: '◆' },
          ].filter(s => s.items?.length > 0).map(section => (
            <div key={section.title} style={{ background: section.bg, border: `1.5px solid ${section.border}`, borderRadius: '14px', padding: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: '800', color: section.color, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{section.icon} {section.title}</p>
              {section.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '7px' }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: section.color, flexShrink: 0, marginTop: '7px' }} />
                  <p style={{ fontSize: '13px', color: 'rgba(26,26,46,0.65)', margin: 0, lineHeight: '1.6' }}>{item}</p>
                </div>
              ))}
            </div>
          ))}
          {fb.recommended_topics?.length > 0 && (
            <div style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,0.07)', borderRadius: '14px', padding: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: '800', color: '#7c3aed', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>◎ Study Topics</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {fb.recommended_topics.map((t, i) => <span key={i} style={{ fontSize: '12px', background: '#f0f0ff', color: '#4f46e5', padding: '5px 12px', borderRadius: '20px', border: '1.5px solid #e0e0ff', fontWeight: '600' }}>{t}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* Question breakdown */}
        {answers.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '15px', fontWeight: '800', color: '#1a1a2e', marginBottom: '14px', letterSpacing: '-0.3px' }}>Question Breakdown</p>
            {answers.map((item, i) => <QItem key={i} item={item} index={i} isMobile={isMobile} />)}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
          <Link to="/setup" style={{ flex: 1, padding: '13px', borderRadius: '12px', background: '#1a1a2e', color: '#fff', fontWeight: '700', fontSize: '14px', textDecoration: 'none', textAlign: 'center', boxShadow: '0 4px 14px rgba(26,26,46,0.2)' }}>Start New Interview →</Link>
          <Link to="/scores" style={{ flex: 1, padding: '13px', borderRadius: '12px', background: '#fff', border: '1.5px solid rgba(0,0,0,0.09)', color: '#1a1a2e', fontWeight: '600', fontSize: '14px', textDecoration: 'none', textAlign: 'center' }}>← All Scores</Link>
        </div>
      </div>
    </AppLayout>
  )
}