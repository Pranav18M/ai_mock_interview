import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getResume, getInterviewHistory } from '../services/api'
import AppLayout from '../components/AppLayout'

const FEATURES = [
  { icon: '⬡', title: 'Resume-Aware Questions', desc: 'AI reads your resume and generates questions tailored to your skills, projects, and experience.', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
  { icon: '◎', title: 'Live Voice Interaction', desc: 'Speak your answers naturally. Speech engine captures, transcribes, and evaluates in real time.', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
  { icon: '◈', title: 'Real-Time Scoring', desc: 'Each answer scored instantly across technical knowledge, communication, and relevance.', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  { icon: '◻', title: 'Detailed Report', desc: 'Comprehensive feedback with strengths, improvement areas, skill suggestions, and study topics.', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
  { icon: '◆', title: 'Multiple Roles', desc: 'Practice for Frontend, Backend, Full Stack, Data Science, DevOps — all difficulty levels.', color: '#ec4899', bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.2)' },
  { icon: '◑', title: 'Progress Tracking', desc: 'Track improvement over sessions. Monitor scores, identify patterns, level up consistently.', color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)' },
]

const STEPS = [
  { num: '01', title: 'Upload Resume', desc: 'Upload your PDF resume. AI extracts your skills, projects, and experience automatically.' },
  { num: '02', title: 'Select Role & Level', desc: 'Choose your target job role and difficulty level from beginner to advanced.' },
  { num: '03', title: 'Start Interview', desc: 'The AI interviewer asks 5 tailored questions via voice. Answer naturally.' },
  { num: '04', title: 'Review Report', desc: 'Receive a detailed score report with actionable feedback to improve.' },
]

export default function Explore() {
  const { user } = useAuth()
  const [resume, setResume] = useState(null)
  const [history, setHistory] = useState([])
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024)

  useEffect(() => {
    getResume().then(r => setResume(r.data)).catch(() => {})
    getInterviewHistory().then(r => setHistory(r.data)).catch(() => {})
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const completed = history.filter(h => h.status === 'completed')
  const avg = completed.length ? (completed.reduce((a, b) => a + (b.overall_score || 0), 0) / completed.length).toFixed(1) : null
  const p = isMobile ? '24px 20px' : isTablet ? '32px 28px' : '40px 48px'

  return (
    <AppLayout>
      <div style={{ padding: p, maxWidth: '1100px' }}>
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg,rgba(59,130,246,0.12),rgba(99,102,241,0.08),rgba(139,92,246,0.06))',
          border: '1px solid rgba(99,102,241,0.2)', borderRadius: '18px',
          padding: isMobile ? '28px 24px' : '40px 44px', marginBottom: isMobile ? '28px' : '40px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.15),transparent)', pointerEvents: 'none' }} />
          <p style={{ fontSize: '11px', color: 'rgba(99,102,241,0.8)', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Welcome back</p>
          <h1 style={{ fontSize: isMobile ? '24px' : '30px', fontWeight: '700', color: '#f0f2f8', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
            Hello, {user?.name?.split(' ')[0]}
          </h1>
          <p style={{ fontSize: isMobile ? '13px' : '15px', color: 'rgba(255,255,255,0.45)', margin: '0 0 28px 0', maxWidth: '480px', lineHeight: '1.6' }}>
            Practice with AI-powered mock interviews tailored to your resume. Track your progress and land your dream job.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to={resume ? '/setup' : '/interview-resume'} style={{
              padding: isMobile ? '10px 22px' : '11px 28px', borderRadius: '10px',
              background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff',
              fontWeight: '600', fontSize: isMobile ? '13px' : '14px', textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
            }}>Start Interview</Link>
            {!resume && (
              <Link to="/interview-resume" style={{
                padding: isMobile ? '10px 22px' : '11px 28px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.7)', fontWeight: '500', fontSize: isMobile ? '13px' : '14px', textDecoration: 'none',
              }}>Upload Resume</Link>
            )}
          </div>
          {/* Stats */}
          <div style={{ display: 'flex', gap: isMobile ? '20px' : '32px', marginTop: '28px', flexWrap: 'wrap' }}>
            {[['Total Sessions', history.length], ['Completed', completed.length], ['Avg Score', avg ? `${avg}/10` : '—'], ['Resume', resume ? 'Uploaded' : 'Missing']].map(([label, value]) => (
              <div key={label}>
                <p style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: '#f0f2f8', margin: 0 }}>{value}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '2px 0 0 0' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it Works */}
        <div style={{ marginBottom: isMobile ? '32px' : '48px' }}>
          <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#e8eaf0', marginBottom: '6px' }}>How It Works</h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '20px' }}>Four steps to interview mastery</p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '14px' }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '22px', position: 'relative', overflow: 'hidden' }}>
                <span style={{ fontSize: '32px', fontWeight: '800', color: 'rgba(99,102,241,0.12)', position: 'absolute', top: '10px', right: '14px', lineHeight: 1, fontFamily: 'monospace' }}>{step.num}</span>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#e8eaf0', margin: '0 0 8px 0' }}>{step.title}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: '1.6' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div>
          <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#e8eaf0', marginBottom: '6px' }}>Platform Features</h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '20px' }}>Everything you need to ace your next interview</p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: '14px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background: f.bg, border: `1px solid ${f.border}`, borderRadius: '14px', padding: '22px', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <p style={{ fontSize: '22px', color: f.color, margin: '0 0 12px 0' }}>{f.icon}</p>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#e8eaf0', margin: '0 0 8px 0' }}>{f.title}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: '1.65' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}