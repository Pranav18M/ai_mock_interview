import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateQuestions, uploadResume } from '../services/api'
import toast from 'react-hot-toast'
import AppLayout from '../components/AppLayout'

const ROLES = [
  { value: 'Frontend Developer', desc: 'React, CSS, UI/UX', color: '#3b82f6' },
  { value: 'Backend Developer', desc: 'APIs, Databases, Server', color: '#10b981' },
  { value: 'Full Stack Developer', desc: 'End-to-end development', color: '#6366f1' },
  { value: 'Java Developer', desc: 'Java, Spring, OOP', color: '#f59e0b' },
  { value: 'Python Developer', desc: 'Python, FastAPI, Django', color: '#3b82f6' },
  { value: 'Data Scientist', desc: 'ML, Statistics, Python', color: '#8b5cf6' },
  { value: 'DevOps Engineer', desc: 'CI/CD, Docker, Cloud', color: '#ec4899' },
  { value: 'Mobile Developer', desc: 'iOS, Android, Flutter', color: '#06b6d4' },
]

const LEVELS = [
  { value: 'beginner', label: 'Beginner', desc: '0–1 yr', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
  { value: 'intermediate', label: 'Intermediate', desc: '1–3 yrs', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  { value: 'advanced', label: 'Advanced', desc: '3+ yrs', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
]

export default function InterviewHub() {
  const [tab, setTab] = useState('setup')
  const [role, setRole] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)
  const [resumeResult, setResumeResult] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024)
  const fileRef = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.endsWith('.pdf')) return toast.error('Only PDF files accepted')
    if (f.size > 5 * 1024 * 1024) return toast.error('Max 5MB')
    setFile(f)
  }

  const handleUpload = async () => {
    if (!file) return toast.error('Select a PDF file')
    setUploadLoading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await uploadResume(fd)
      setResumeResult(res.data)
      toast.success('Resume analyzed')
      setTab('setup')
    } catch (e) { toast.error(e.response?.data?.detail || 'Upload failed') }
    finally { setUploadLoading(false) }
  }

  const handleStart = async () => {
    if (!role) return toast.error('Select a job role')
    if (!difficulty) return toast.error('Select difficulty level')
    setLoading(true)
    try {
      const res = await generateQuestions({ role, difficulty })
      toast.success('Questions ready')
      navigate(`/interview/${res.data.interview_id}`, { state: { questions: res.data.questions, role, difficulty } })
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to generate questions') }
    finally { setLoading(false) }
  }

  const p = isMobile ? '24px 20px' : isTablet ? '32px 28px' : '40px 48px'
  const roleColumns = isMobile ? 'repeat(2,1fr)' : isTablet ? 'repeat(3,1fr)' : 'repeat(4,1fr)'

  return (
    <AppLayout>
      <div style={{ padding: p, maxWidth: '860px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#f0f2f8', margin: '0 0 6px 0', letterSpacing: '-0.4px' }}>Interview Setup</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Configure your mock interview session</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px', marginBottom: '28px', width: 'fit-content' }}>
          {[{ id: 'setup', label: 'Configure' }, { id: 'resume', label: 'Resume' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: isMobile ? '7px 16px' : '8px 20px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              background: tab === t.id ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: tab === t.id ? '#818cf8' : 'rgba(255,255,255,0.4)',
              fontSize: '13px', fontWeight: tab === t.id ? '600' : '400', transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'resume' && (
          <div>
            <div onClick={() => fileRef.current?.click()}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              style={{
                border: `2px dashed ${dragOver ? 'rgba(99,102,241,0.6)' : file ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '16px', padding: isMobile ? '36px 20px' : '52px', textAlign: 'center', cursor: 'pointer',
                background: dragOver ? 'rgba(99,102,241,0.05)' : file ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s',
              }}>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: file ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={file ? '#10b981' : '#6366f1'} strokeWidth="1.8">
                  {file ? <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></> : <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>}
                </svg>
              </div>
              {file ? (
                <><p style={{ color: '#10b981', fontWeight: '600', fontSize: '14px', margin: '0 0 4px 0' }}>{file.name}</p><p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>{(file.size/1024).toFixed(1)} KB — click to change</p></>
              ) : (
                <><p style={{ color: '#e8eaf0', fontWeight: '600', fontSize: '14px', margin: '0 0 6px 0' }}>Drop your PDF resume here</p><p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>or click to browse — max 5MB</p></>
              )}
            </div>
            {file && (
              <button onClick={handleUpload} disabled={uploadLoading} style={{ marginTop: '14px', width: '100%', padding: '13px', borderRadius: '10px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', border: 'none', color: '#fff', fontWeight: '600', fontSize: '14px', cursor: uploadLoading ? 'wait' : 'pointer', opacity: uploadLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {uploadLoading ? <><span style={{ width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Analyzing...</> : 'Upload & Analyze'}
              </button>
            )}
            {resumeResult && (
              <div style={{ marginTop: '18px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '14px', padding: '18px' }}>
                <p style={{ color: '#10b981', fontWeight: '600', fontSize: '13px', margin: '0 0 10px 0' }}>Resume analyzed successfully</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {resumeResult.skills?.slice(0, 10).map(s => <span key={s} style={{ fontSize: '11px', background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(99,102,241,0.2)' }}>{s}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'setup' && (
          <>
            <div style={{ marginBottom: '32px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>Job Role</p>
              <div style={{ display: 'grid', gridTemplateColumns: roleColumns, gap: '10px' }}>
                {ROLES.map(r => (
                  <button key={r.value} onClick={() => setRole(r.value)} style={{
                    padding: isMobile ? '12px' : '16px', borderRadius: '12px', textAlign: 'left',
                    background: role === r.value ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${role === r.value ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { if (role !== r.value) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
                    onMouseLeave={e => { if (role !== r.value) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
                  >
                    <p style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: '600', color: role === r.value ? '#f0f2f8' : 'rgba(255,255,255,0.7)', margin: '0 0 3px 0' }}>{r.value}</p>
                    {!isMobile && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{r.desc}</p>}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>Experience Level</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                {LEVELS.map(l => (
                  <button key={l.value} onClick={() => setDifficulty(l.value)} style={{
                    padding: isMobile ? '14px 10px' : '20px', borderRadius: '12px', textAlign: 'center',
                    background: difficulty === l.value ? l.bg : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${difficulty === l.value ? l.border : 'rgba(255,255,255,0.07)'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: l.color, margin: '0 auto 8px', boxShadow: `0 0 8px ${l.color}` }} />
                    <p style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '600', color: '#e8eaf0', margin: '0 0 3px 0' }}>{l.label}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>{l.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {role && difficulty && (
              <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
                  <span style={{ color: '#e8eaf0', fontWeight: '600' }}>{role}</span> — <span style={{ color: '#e8eaf0', fontWeight: '600', textTransform: 'capitalize' }}>{difficulty}</span> — 5 AI-generated questions
                </p>
              </div>
            )}

            <button onClick={handleStart} disabled={loading || !role || !difficulty} style={{
              width: '100%', padding: isMobile ? '13px' : '14px', borderRadius: '12px',
              background: (!role || !difficulty) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#3b82f6,#6366f1)',
              border: 'none', color: (!role || !difficulty) ? 'rgba(255,255,255,0.25)' : '#fff',
              fontWeight: '600', fontSize: isMobile ? '14px' : '15px',
              cursor: (!role || !difficulty) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: (!role || !difficulty) ? 'none' : '0 4px 20px rgba(99,102,241,0.3)',
              transition: 'all 0.2s',
            }}>
              {loading ? <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Generating questions...</> : 'Begin Interview Session'}
            </button>
          </>
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AppLayout>
  )
}