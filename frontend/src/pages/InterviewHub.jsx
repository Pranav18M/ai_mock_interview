import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateQuestions, uploadResume } from '../services/api'
import toast from 'react-hot-toast'
import AppLayout from '../components/AppLayout'

const ROLES = [
  { value: 'Frontend Developer',  desc: 'React, CSS, UI/UX',   color: '#6366f1', glow: 'glow-indigo'  },
  { value: 'Backend Developer',   desc: 'APIs, Databases',     color: '#10b981', glow: 'glow-emerald' },
  { value: 'Full Stack Developer',desc: 'End-to-end',          color: '#06b6d4', glow: 'glow-cyan'    },
  { value: 'Java Developer',      desc: 'Java, Spring',        color: '#f59e0b', glow: 'glow-amber'   },
  { value: 'Python Developer',    desc: 'FastAPI, Django',     color: '#8b5cf6', glow: 'glow-violet'  },
  { value: 'Data Scientist',      desc: 'ML, Statistics',      color: '#ec4899', glow: 'glow-pink'    },
  { value: 'DevOps Engineer',     desc: 'Docker, Cloud',       color: '#06b6d4', glow: 'glow-cyan'    },
  { value: 'Mobile Developer',    desc: 'iOS, Android',        color: '#10b981', glow: 'glow-emerald' },
]

const LEVELS = [
  { value: 'beginner',     label: 'Beginner',     desc: '0–1 yr',   color: '#10b981', pulse: 'pulse-glow-emerald', icon: '🌱' },
  { value: 'intermediate', label: 'Intermediate', desc: '1–3 yrs',  color: '#f59e0b', pulse: 'pulse-glow-amber',   icon: '🔥' },
  { value: 'advanced',     label: 'Advanced',     desc: '3+ yrs',   color: '#ec4899', pulse: 'pulse-glow-rose',    icon: '⚡' },
]

export default function InterviewHub() {
  const [tab, setTab]               = useState('setup')
  const [role, setRole]             = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [loading, setLoading]       = useState(false)
  const [file, setFile]             = useState(null)
  const [resumeResult, setResumeResult] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [dragOver, setDragOver]     = useState(false)
  const [isMobile, setIsMobile]     = useState(window.innerWidth < 768)
  const fileRef  = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.endsWith('.pdf')) return toast.error('Only PDF files accepted')
    if (f.size > 5*1024*1024) return toast.error('Max 5MB')
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
    } catch (e) {
      const msg = e.response?.data?.detail || ''
      if (msg.includes('quota') || msg.includes('429') || msg.includes('QUOTA')) {
        toast.error('⚠️ AI quota limit reached. Using built-in questions instead — please retry.')
      } else {
        toast.error(msg || 'Failed to generate questions. Please try again.')
      }
    }
    finally { setLoading(false) }
  }

  const p = isMobile ? '20px 16px' : '40px 48px'
  const selectedRole = ROLES.find(r => r.value === role)

  return (
    <AppLayout>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: p }}>

        {/* ── Page header ── */}
        <div className="glow-card" style={{ padding: isMobile ? '24px' : '28px 32px', marginBottom: '20px', animation: 'fadeUp 0.4s ease both' }}>
          <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: '900', color: '#1a1a2e', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Interview Setup</h1>
          <p style={{ fontSize: '14px', color: 'rgba(26,26,46,0.45)', margin: 0 }}>Configure your mock interview session</p>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: '#f0eff5', borderRadius: '11px', padding: '4px', marginTop: '18px', width: 'fit-content', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.07)' }}>
            {[{id:'setup',label:'Configure'},{id:'resume',label:'Resume'}].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '7px 22px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: tab===t.id ? '#fff' : 'transparent', color: tab===t.id ? '#1a1a2e' : 'rgba(26,26,46,0.42)', fontSize: '13px', fontWeight: tab===t.id ? '700' : '500', transition: 'all 0.15s', boxShadow: tab===t.id ? '0 2px 8px rgba(99,102,241,0.14)' : 'none' }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* ── Resume tab ── */}
        {tab === 'resume' && (
          <div className="glow-card glow-indigo" style={{ padding: isMobile ? '24px' : '28px 32px', animation: 'fadeUp 0.3s ease both' }}>
            <p style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(26,26,46,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>Upload Your Resume</p>
            <div onClick={() => fileRef.current?.click()}
              onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0])}}
              onDragOver={e=>{e.preventDefault();setDragOver(true)}}
              onDragLeave={()=>setDragOver(false)}
              style={{ border: `2px dashed ${dragOver?'#6366f1':file?'#10b981':'rgba(99,102,241,0.22)'}`, borderRadius: '14px', padding: isMobile?'36px 16px':'52px', textAlign: 'center', cursor: 'pointer', background: dragOver?'#f0f0ff':file?'#f0fdf4':'#fafaff', transition: 'all 0.2s' }}>
              <input ref={fileRef} type="file" accept=".pdf" style={{display:'none'}} onChange={e=>handleFile(e.target.files[0])} />
              <div style={{ width:'52px',height:'52px',borderRadius:'14px',background:file?'#d1fae5':'#ede9fe',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',boxShadow:file?'0 4px 14px rgba(16,185,129,0.25)':'0 4px 14px rgba(99,102,241,0.2)' }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={file?'#10b981':'#6366f1'} strokeWidth="1.8">
                  {file?<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>:<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>}
                </svg>
              </div>
              {file
                ?<><p style={{color:'#10b981',fontWeight:'700',fontSize:'14px',margin:'0 0 3px'}}>{file.name}</p><p style={{color:'rgba(26,26,46,0.4)',fontSize:'12px'}}>{(file.size/1024).toFixed(1)} KB · click to change</p></>
                :<><p style={{color:'#1a1a2e',fontWeight:'700',fontSize:'14px',margin:'0 0 4px'}}>Drop your PDF resume here</p><p style={{color:'rgba(26,26,46,0.4)',fontSize:'12px'}}>or click to browse · max 5MB</p></>}
            </div>
            {file && (
              <button onClick={handleUpload} disabled={uploadLoading} style={{ marginTop:'14px',width:'100%',padding:'13px',borderRadius:'12px',background:'#1a1a2e',border:'none',color:'#fff',fontWeight:'700',fontSize:'14px',cursor:uploadLoading?'wait':'pointer',opacity:uploadLoading?0.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',boxShadow:'0 4px 20px rgba(99,102,241,0.28)',transition:'all 0.2s' }}>
                {uploadLoading?<><span style={{width:'15px',height:'15px',border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite'}}/>Analyzing...</>:'Upload & Analyze Resume'}
              </button>
            )}
            {resumeResult && (
              <div style={{ marginTop:'14px',background:'#f0fdf4',border:'1.5px solid rgba(16,185,129,0.18)',borderRadius:'14px',padding:'16px',boxShadow:'0 4px 16px rgba(16,185,129,0.1)' }}>
                <p style={{color:'#10b981',fontWeight:'700',fontSize:'13px',margin:'0 0 10px'}}>✓ Resume analyzed successfully</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                  {resumeResult.skills?.slice(0,12).map(s=><span key={s} style={{fontSize:'11px',background:'#fff',color:'#6366f1',padding:'3px 10px',borderRadius:'20px',border:'1.5px solid rgba(99,102,241,0.18)',fontWeight:'600'}}>{s}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Setup tab ── */}
        {tab === 'setup' && (
          <>
            {/* Role grid */}
            <div className="glow-card" style={{ padding: isMobile?'22px 18px':'26px 28px', marginBottom:'16px', animation:'fadeUp 0.35s ease both' }}>
              <p style={{ fontSize:'11px',fontWeight:'800',color:'rgba(26,26,46,0.35)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:'14px' }}>Job Role</p>
              <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:'10px' }}>
                {ROLES.map(r => {
                  const isSelected = role === r.value
                  return (
                    <button key={r.value} onClick={() => setRole(r.value)}
                      className={`glow-card ${r.glow} ${isSelected ? 'selected' : ''}`}
                      style={{ padding:'14px 12px', textAlign:'left', background: isSelected ? `${r.color}0d` : '#fafaff', cursor:'pointer', border:'none', width:'100%', transition:'all 0.18s' }}>
                      <div style={{ width:'8px',height:'8px',borderRadius:'50%',background:r.color,marginBottom:'8px',boxShadow:isSelected?`0 0 10px ${r.color}`:undefined }} />
                      <p style={{ fontSize:'12.5px',fontWeight:'700',color:isSelected?r.color:'#1a1a2e',margin:'0 0 2px' }}>{r.value}</p>
                      <p style={{ fontSize:'11px',color:'rgba(26,26,46,0.38)',margin:0 }}>{r.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Level grid */}
            <div className="glow-card" style={{ padding: isMobile?'22px 18px':'26px 28px', marginBottom:'16px', animation:'fadeUp 0.4s ease both' }}>
              <p style={{ fontSize:'11px',fontWeight:'800',color:'rgba(26,26,46,0.35)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:'14px' }}>Experience Level</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
                {LEVELS.map(l => {
                  const isSelected = difficulty === l.value
                  return (
                    <button key={l.value} onClick={() => setDifficulty(l.value)}
                      className={isSelected ? `glow-card ${l.pulse}` : 'glow-card'}
                      style={{ padding:isMobile?'16px 10px':'22px', textAlign:'center', background: isSelected ? `${l.color}0d` : '#fafaff', cursor:'pointer', border:'none', width:'100%', transition:'all 0.18s' }}>
                      <div style={{ fontSize:'22px', marginBottom:'8px' }}>{l.icon}</div>
                      <p style={{ fontSize:'14px',fontWeight:'700',color:isSelected?l.color:'#1a1a2e',margin:'0 0 3px' }}>{l.label}</p>
                      <p style={{ fontSize:'11px',color:'rgba(26,26,46,0.38)',margin:0 }}>{l.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* CTA */}
            <div className="glow-card glow-indigo" style={{ padding: isMobile?'22px 18px':'26px 28px', animation:'fadeUp 0.45s ease both' }}>
              {role && difficulty && (
                <div style={{ background:`${selectedRole?.color}0a`, border:`1.5px solid ${selectedRole?.color}25`, borderRadius:'12px', padding:'12px 16px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'8px',height:'8px',borderRadius:'50%',background:selectedRole?.color,flexShrink:0,boxShadow:`0 0 8px ${selectedRole?.color}` }} />
                  <p style={{ fontSize:'13px',color:'rgba(26,26,46,0.6)',margin:0 }}>
                    <span style={{color:'#1a1a2e',fontWeight:'700'}}>{role}</span> · <span style={{color:selectedRole?.color,fontWeight:'700',textTransform:'capitalize'}}>{difficulty}</span> · 5 AI-generated questions
                  </p>
                </div>
              )}
              <button onClick={handleStart} disabled={loading||!role||!difficulty}
                style={{ width:'100%',padding:'14px',borderRadius:'12px',background:(!role||!difficulty)?'#f0eff5':'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',color:(!role||!difficulty)?'rgba(26,26,46,0.3)':'#fff',fontWeight:'700',fontSize:'15px',cursor:(!role||!difficulty)?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',boxShadow:(!role||!difficulty)?'none':'0 4px 20px rgba(99,102,241,0.4)',transition:'all 0.2s' }}
                onMouseEnter={e=>{ if(role&&difficulty&&!loading){e.currentTarget.style.boxShadow='0 8px 32px rgba(99,102,241,0.5)';e.currentTarget.style.transform='translateY(-2px)'}}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow=(!role||!difficulty)?'none':'0 4px 20px rgba(99,102,241,0.4)';e.currentTarget.style.transform='none'}}
              >
                {loading?<><span style={{width:'16px',height:'16px',border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite'}}/>Generating questions...</>:'Begin Interview Session →'}
              </button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}