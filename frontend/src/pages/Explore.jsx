import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getResume, getInterviewHistory } from '../services/api'
import AppLayout from '../components/AppLayout'

const FEATURES = [
  { icon: '⬡', title: 'Resume-Aware Questions', desc: 'AI reads your resume and generates questions tailored to your skills and experience.', color: '#4f46e5' },
  { icon: '◎', title: 'Live Voice Interaction', desc: 'Speak naturally. Captures, transcribes, and evaluates in real time.', color: '#0891b2' },
  { icon: '◈', title: 'Real-Time Scoring', desc: 'Each answer scored instantly across technical knowledge, communication, and relevance.', color: '#d97706' },
  { icon: '◻', title: 'Detailed Report', desc: 'Full feedback with strengths, improvements, skill suggestions, and study topics.', color: '#059669' },
  { icon: '◆', title: 'Multiple Roles', desc: 'Frontend, Backend, Full Stack, Data Science, DevOps — all difficulty levels.', color: '#dc2626' },
  { icon: '◑', title: 'Progress Tracking', desc: 'Track improvement over sessions. Monitor scores and level up consistently.', color: '#7c3aed' },
]

const STEPS = [
  { num: '01', title: 'Upload Resume', desc: 'Upload your PDF. AI extracts your skills, projects, and experience automatically.' },
  { num: '02', title: 'Select Role & Level', desc: 'Choose your target job role and difficulty: beginner to advanced.' },
  { num: '03', title: 'Start Interview', desc: 'The AI interviewer asks 5 tailored questions via voice. Answer naturally.' },
  { num: '04', title: 'Review Report', desc: 'Receive a detailed score report with actionable feedback.' },
]

const SHADOW_MD = '0 4px 20px rgba(80,60,180,0.11), 0 2px 6px rgba(0,0,0,0.06)'
const SHADOW_LG = '0 8px 32px rgba(80,60,180,0.14), 0 4px 12px rgba(0,0,0,0.07)'

export default function Explore() {
  const { user } = useAuth()
  const [resume, setResume] = useState(null)
  const [history, setHistory] = useState([])
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900)

  useEffect(() => {
    getResume().then(r => setResume(r.data)).catch(() => {})
    getInterviewHistory().then(r => setHistory(r.data)).catch(() => {})
    const onResize = () => setIsMobile(window.innerWidth < 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const completed = history.filter(h => h.status === 'completed')
  const avg = completed.length ? (completed.reduce((a, b) => a + (b.overall_score || 0), 0) / completed.length).toFixed(1) : null

  return (
    <AppLayout>
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>

        {/* ── LEFT IMAGE PANEL with right shadow ── */}
        {!isMobile && (
          <div style={{ width: '38%', maxWidth: '520px', flexShrink: 0, position: 'sticky', top: '60px', height: 'calc(100vh - 60px)', overflow: 'hidden',
            boxShadow: '4px 0 32px rgba(80,60,180,0.13), 2px 0 8px rgba(0,0,0,0.07)',
            zIndex: 5,
          }}>
            <img src="/Explorepage.avif" alt="Interview" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 65%, #f0eff5 100%)' }} />
            {/* Bottom card */}
            <div style={{ position: 'absolute', bottom: '36px', left: '28px', right: '52px' }}>
              <div style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', borderRadius: '18px', padding: '20px 24px', border: '1.5px solid rgba(255,255,255,0.95)', boxShadow: '0 12px 40px rgba(80,60,180,0.18), 0 4px 12px rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: '11px', fontWeight: '800', color: '#4f46e5', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '1.5px' }}>AI-Powered</p>
                <p style={{ fontSize: '20px', fontWeight: '900', color: '#1a1a2e', margin: '0 0 6px 0', lineHeight: '1.2', letterSpacing: '-0.5px' }}>Practice Makes<br />Perfect</p>
                <p style={{ fontSize: '13px', color: 'rgba(26,26,46,0.55)', margin: 0, lineHeight: '1.5' }}>Real interview simulation with instant AI feedback</p>
              </div>
            </div>
          </div>
        )}

        {/* ── RIGHT CONTENT ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '28px 20px' : '44px 52px', minWidth: 0 }}>

          {/* Hero card */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: isMobile ? '28px 24px' : '36px 40px', marginBottom: '24px', border: '1.5px solid rgba(79,70,229,0.08)', boxShadow: SHADOW_LG, position: 'relative', overflow: 'hidden' }}>
            {/* Decorative bg circle */}
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <p style={{ fontSize: '11px', fontWeight: '800', color: '#4f46e5', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 8px 0' }}>Welcome back</p>
            <h1 style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: '900', color: '#1a1a2e', margin: '0 0 10px 0', letterSpacing: '-1px', lineHeight: 1.1 }}>
              Hello, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ fontSize: '15px', color: 'rgba(26,26,46,0.5)', margin: '0 0 26px 0', maxWidth: '460px', lineHeight: '1.65' }}>
              Practice with AI-powered mock interviews tailored to your resume. Track your progress and land your dream job.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link to={resume ? '/setup' : '/interview-resume'} style={{ padding: '12px 28px', borderRadius: '12px', background: '#1a1a2e', color: '#fff', fontWeight: '700', fontSize: '14px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(26,26,46,0.28)', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,26,46,0.32)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,26,46,0.28)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Start Interview
              </Link>
              {!resume && (
                <Link to="/interview-resume" style={{ padding: '12px 24px', borderRadius: '12px', background: '#fff', border: '1.5px solid rgba(79,70,229,0.15)', color: '#4f46e5', fontWeight: '600', fontSize: '14px', textDecoration: 'none', boxShadow: '0 2px 8px rgba(79,70,229,0.1)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,70,229,0.18)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(79,70,229,0.1)'; e.currentTarget.style.transform = 'none' }}
                >Upload Resume</Link>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4},1fr)`, gap: '14px', marginBottom: '28px' }}>
            {[
              { label: 'Total Sessions', value: history.length, bg: '#f0f0ff', color: '#4f46e5', border: 'rgba(79,70,229,0.12)', shadow: 'rgba(79,70,229,0.12)' },
              { label: 'Completed', value: completed.length, bg: '#f0fdf4', color: '#059669', border: 'rgba(5,150,105,0.12)', shadow: 'rgba(5,150,105,0.1)' },
              { label: 'Avg Score', value: avg ? `${avg}/10` : '—', bg: '#fffbeb', color: '#d97706', border: 'rgba(217,119,6,0.12)', shadow: 'rgba(217,119,6,0.1)' },
              { label: 'Resume', value: resume ? '✓ Ready' : 'Missing', bg: resume ? '#f0fdf4' : '#fff1f2', color: resume ? '#059669' : '#e11d48', border: resume ? 'rgba(5,150,105,0.12)' : 'rgba(225,29,72,0.12)', shadow: resume ? 'rgba(5,150,105,0.1)' : 'rgba(225,29,72,0.08)' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: '14px', padding: '18px 20px', boxShadow: `0 4px 16px ${s.shadow}, 0 1px 4px rgba(0,0,0,0.04)`, transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${s.shadow}, 0 2px 6px rgba(0,0,0,0.05)` }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 16px ${s.shadow}, 0 1px 4px rgba(0,0,0,0.04)` }}
              >
                <p style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: '900', color: s.color, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>{s.value}</p>
                <p style={{ fontSize: '11.5px', color: 'rgba(26,26,46,0.45)', margin: 0, fontWeight: '500' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(79,70,229,0.12), transparent)', marginBottom: '28px', boxShadow: '0 1px 3px rgba(79,70,229,0.08)' }} />

          {/* How it works */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1a1a2e', margin: 0, letterSpacing: '-0.4px' }}>How It Works</h2>
              <span style={{ fontSize: '12px', color: 'rgba(26,26,46,0.38)', fontWeight: '500' }}>4 simple steps</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: '14px' }}>
              {STEPS.map((step, i) => (
                <div key={i} style={{ background: '#fff', border: '1.5px solid rgba(79,70,229,0.07)', borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden', boxShadow: SHADOW_MD, transition: 'box-shadow 0.2s, transform 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = SHADOW_LG; e.currentTarget.style.transform = 'translateY(-3px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = SHADOW_MD; e.currentTarget.style.transform = 'none' }}
                >
                  <span style={{ fontSize: '38px', fontWeight: '900', color: 'rgba(79,70,229,0.06)', position: 'absolute', top: '6px', right: '10px', lineHeight: 1, fontFamily: 'Georgia,serif' }}>{step.num}</span>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 7px 0' }}>{step.title}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(26,26,46,0.48)', margin: 0, lineHeight: '1.6' }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(79,70,229,0.12), transparent)', marginBottom: '28px', boxShadow: '0 1px 3px rgba(79,70,229,0.08)' }} />

          {/* Features */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1a1a2e', margin: 0, letterSpacing: '-0.4px' }}>Platform Features</h2>
              <span style={{ fontSize: '12px', color: 'rgba(26,26,46,0.38)', fontWeight: '500' }}>Everything you need</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: '14px' }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{ background: '#fff', border: '1.5px solid rgba(79,70,229,0.07)', borderRadius: '16px', padding: '20px 22px', display: 'flex', gap: '16px', alignItems: 'flex-start', boxShadow: SHADOW_MD, transition: 'box-shadow 0.2s, transform 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = SHADOW_LG; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = SHADOW_MD; e.currentTarget.style.transform = 'none' }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: `${f.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1.5px solid ${f.color}20`, boxShadow: `0 2px 8px ${f.color}18` }}>
                    <span style={{ fontSize: '19px', color: f.color }}>{f.icon}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: '13.5px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 5px 0' }}>{f.title}</p>
                    <p style={{ fontSize: '12.5px', color: 'rgba(26,26,46,0.48)', margin: 0, lineHeight: '1.6' }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}