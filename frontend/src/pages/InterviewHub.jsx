import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateQuestions, uploadResume } from '../services/api'
import toast from 'react-hot-toast'
import AppLayout from '../components/AppLayout'

const SH_SM = '0 2px 10px rgba(80,60,180,0.09), 0 1px 3px rgba(0,0,0,0.05)'
const SH_MD = '0 4px 20px rgba(80,60,180,0.11), 0 2px 6px rgba(0,0,0,0.06)'
const SH_LG = '0 8px 32px rgba(80,60,180,0.14), 0 4px 12px rgba(0,0,0,0.07)'

const ROLES = [
  { value: 'Frontend Developer', desc: 'React, CSS, UI/UX', color: '#4f46e5' },
  { value: 'Backend Developer', desc: 'APIs, Databases', color: '#059669' },
  { value: 'Full Stack Developer', desc: 'End-to-end', color: '#0891b2' },
  { value: 'Java Developer', desc: 'Java, Spring', color: '#d97706' },
  { value: 'Python Developer', desc: 'FastAPI, Django', color: '#7c3aed' },
  { value: 'Data Scientist', desc: 'ML, Statistics', color: '#dc2626' },
  { value: 'DevOps Engineer', desc: 'Docker, Cloud', color: '#0891b2' },
  { value: 'Mobile Developer', desc: 'iOS, Android', color: '#059669' },
]

const LEVELS = [
  { value: 'beginner', label: 'Beginner', desc: '0–1 yr', color: '#059669', bg: '#f0fdf4', border: 'rgba(5,150,105,0.15)' },
  { value: 'intermediate', label: 'Intermediate', desc: '1–3 yrs', color: '#d97706', bg: '#fffbeb', border: 'rgba(217,119,6,0.15)' },
  { value: 'advanced', label: 'Advanced', desc: '3+ yrs', color: '#dc2626', bg: '#fff1f2', border: 'rgba(220,38,38,0.15)' },
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
  const fileRef = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
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
      toast.success('Resume analyzed!')
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
      toast.success('Questions ready!')
      navigate(`/interview/${res.data.interview_id}`, { state: { questions: res.data.questions, role, difficulty } })
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed') }
    finally { setLoading(false) }
  }

  const p = isMobile ? '24px 20px' : '44px 52px'

  return (
    <AppLayout>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: p }}>

        {/* Page header */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: isMobile ? '24px' : '32px 36px', marginBottom: '24px', border: '1.5px solid rgba(79,70,229,0.08)', boxShadow: SH_LG }}>
          <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '900', color: '#1a1a2e', margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>Interview Setup</h1>
          <p style={{ fontSize: '14px', color: 'rgba(26,26,46,0.48)', margin: 0 }}>Configure your mock interview session</p>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: '#f0eff5', borderRadius: '11px', padding: '4px', marginTop: '20px', width: 'fit-content', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.07)' }}>
            {[{ id: 'setup', label: 'Configure' }, { id: 'resume', label: 'Resume' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '7px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? '#1a1a2e' : 'rgba(26,26,46,0.42)', fontSize: '13.5px', fontWeight: tab === t.id ? '700' : '500', transition: 'all 0.15s', boxShadow: tab === t.id ? SH_SM : 'none' }}>{t.label}</button>
            ))}
          </div>
        </div>

        {tab === 'resume' && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: isMobile ? '24px' : '32px', border: '1.5px solid rgba(79,70,229,0.08)', boxShadow: SH_LG }}>
            <div onClick={() => fileRef.current?.click()}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              style={{ border: `2px dashed ${dragOver ? '#4f46e5' : file ? '#059669' : 'rgba(79,70,229,0.2)'}`, borderRadius: '16px', padding: isMobile ? '40px 20px' : '60px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#f0f0ff' : file ? '#f0fdf4' : '#fafaff', transition: 'all 0.2s', boxShadow: dragOver ? 'inset 0 2px 12px rgba(79,70,229,0.1)' : 'inset 0 1px 4px rgba(0,0,0,0.04)' }}>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              <div style={{ width: '54px', height: '54px', borderRadius: '15px', background: file ? '#d1fae5' : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: file ? '0 4px 12px rgba(5,150,105,0.2)' : '0 4px 12px rgba(79,70,229,0.15)' }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={file ? '#059669' : '#4f46e5'} strokeWidth="1.8">
                  {file ? <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></> : <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>}
                </svg>
              </div>
              {file
                ? <><p style={{ color: '#059669', fontWeight: '700', fontSize: '14px', margin: '0 0 4px 0' }}>{file.name}</p><p style={{ color: 'rgba(26,26,46,0.4)', fontSize: '12px' }}>{(file.size/1024).toFixed(1)} KB · click to change</p></>
                : <><p style={{ color: '#1a1a2e', fontWeight: '700', fontSize: '15px', margin: '0 0 6px 0' }}>Drop your PDF resume here</p><p style={{ color: 'rgba(26,26,46,0.4)', fontSize: '13px' }}>or click to browse · max 5MB</p></>}
            </div>
            {file && (
              <button onClick={handleUpload} disabled={uploadLoading} style={{ marginTop: '16px', width: '100%', padding: '13px', borderRadius: '12px', background: '#1a1a2e', border: 'none', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: uploadLoading ? 'wait' : 'pointer', opacity: uploadLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(26,26,46,0.25)' }}>
                {uploadLoading ? <><span style={{ width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Analyzing...</> : 'Upload & Analyze Resume'}
              </button>
            )}
            {resumeResult && (
              <div style={{ marginTop: '16px', background: '#f0fdf4', border: '1.5px solid rgba(5,150,105,0.15)', borderRadius: '14px', padding: '18px', boxShadow: '0 4px 16px rgba(5,150,105,0.1)' }}>
                <p style={{ color: '#059669', fontWeight: '700', fontSize: '13px', margin: '0 0 10px 0' }}>✓ Resume analyzed successfully</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {resumeResult.skills?.slice(0, 12).map(s => <span key={s} style={{ fontSize: '12px', background: '#fff', color: '#4f46e5', padding: '4px 12px', borderRadius: '20px', border: '1.5px solid rgba(79,70,229,0.15)', fontWeight: '600', boxShadow: '0 1px 4px rgba(79,70,229,0.1)' }}>{s}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'setup' && (
          <>
            {/* Role grid */}
            <div style={{ background: '#fff', borderRadius: '20px', padding: isMobile ? '24px' : '28px 32px', marginBottom: '16px', border: '1.5px solid rgba(79,70,229,0.08)', boxShadow: SH_MD }}>
              <p style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(26,26,46,0.38)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px' }}>Job Role</p>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '10px' }}>
                {ROLES.map(r => (
                  <button key={r.value} onClick={() => setRole(r.value)} style={{ padding: '14px', borderRadius: '12px', textAlign: 'left', background: role === r.value ? `${r.color}08` : '#fafaff', border: `1.5px solid ${role === r.value ? r.color : 'rgba(79,70,229,0.09)'}`, cursor: 'pointer', transition: 'all 0.15s', boxShadow: role === r.value ? `0 4px 14px ${r.color}28` : SH_SM }}
                    onMouseEnter={e => { if (role !== r.value) e.currentTarget.style.boxShadow = `0 4px 14px rgba(79,70,229,0.12)` }}
                    onMouseLeave={e => { if (role !== r.value) e.currentTarget.style.boxShadow = SH_SM }}
                  >
                    <p style={{ fontSize: '12.5px', fontWeight: '700', color: role === r.value ? r.color : '#1a1a2e', margin: '0 0 3px 0' }}>{r.value}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(26,26,46,0.38)', margin: 0 }}>{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Level */}
            <div style={{ background: '#fff', borderRadius: '20px', padding: isMobile ? '24px' : '28px 32px', marginBottom: '16px', border: '1.5px solid rgba(79,70,229,0.08)', boxShadow: SH_MD }}>
              <p style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(26,26,46,0.38)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px' }}>Experience Level</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
                {LEVELS.map(l => (
                  <button key={l.value} onClick={() => setDifficulty(l.value)} style={{ padding: isMobile ? '16px 10px' : '22px', borderRadius: '14px', textAlign: 'center', background: difficulty === l.value ? l.bg : '#fafaff', border: `1.5px solid ${difficulty === l.value ? l.border : 'rgba(79,70,229,0.09)'}`, cursor: 'pointer', transition: 'all 0.15s', boxShadow: difficulty === l.value ? `0 6px 20px ${l.color}22` : SH_SM }}>
                    <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: l.color, margin: '0 auto 9px', boxShadow: difficulty === l.value ? `0 0 10px ${l.color}` : `0 1px 4px ${l.color}40` }} />
                    <p style={{ fontSize: '14px', fontWeight: '700', color: difficulty === l.value ? l.color : '#1a1a2e', margin: '0 0 3px 0' }}>{l.label}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(26,26,46,0.38)', margin: 0 }}>{l.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary + CTA */}
            <div style={{ background: '#fff', borderRadius: '20px', padding: isMobile ? '24px' : '28px 32px', border: '1.5px solid rgba(79,70,229,0.08)', boxShadow: SH_LG }}>
              {role && difficulty && (
                <div style={{ background: '#f0f0ff', border: '1.5px solid rgba(79,70,229,0.15)', borderRadius: '12px', padding: '14px 18px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(79,70,229,0.08)' }}>
                  <p style={{ fontSize: '13.5px', color: 'rgba(26,26,46,0.6)', margin: 0 }}>
                    <span style={{ color: '#1a1a2e', fontWeight: '700' }}>{role}</span> · <span style={{ color: '#4f46e5', fontWeight: '700', textTransform: 'capitalize' }}>{difficulty}</span> · 5 AI-generated questions
                  </p>
                </div>
              )}
              <button onClick={handleStart} disabled={loading || !role || !difficulty} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: (!role || !difficulty) ? '#f0eff5' : '#1a1a2e', border: 'none', color: (!role || !difficulty) ? 'rgba(26,26,46,0.3)' : '#fff', fontWeight: '700', fontSize: '15px', cursor: (!role || !difficulty) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: (!role || !difficulty) ? 'none' : '0 4px 16px rgba(26,26,46,0.25)', transition: 'all 0.2s' }}
                onMouseEnter={e => { if (role && difficulty && !loading) { e.currentTarget.style.boxShadow = '0 8px 28px rgba(26,26,46,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)' }}}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = (!role || !difficulty) ? 'none' : '0 4px 16px rgba(26,26,46,0.25)'; e.currentTarget.style.transform = 'none' }}
              >
                {loading ? <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Generating questions...</> : 'Begin Interview Session →'}
              </button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}