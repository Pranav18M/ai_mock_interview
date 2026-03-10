import { useState, useRef, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import { analyzeATS } from '../services/api'
import toast from 'react-hot-toast'

const SH_MD = '0 4px 20px rgba(80,60,180,0.11), 0 2px 6px rgba(0,0,0,0.06)'
const SH_LG = '0 8px 32px rgba(80,60,180,0.14), 0 4px 12px rgba(0,0,0,0.07)'

const ROLES = [
  { value: 'frontend developer', label: 'Frontend Developer', icon: '🎨', color: '#4f46e5' },
  { value: 'backend developer', label: 'Backend Developer', icon: '⚙️', color: '#059669' },
  { value: 'full stack developer', label: 'Full Stack Developer', icon: '🔥', color: '#0891b2' },
  { value: 'java developer', label: 'Java Developer', icon: '☕', color: '#d97706' },
  { value: 'python developer', label: 'Python Developer', icon: '🐍', color: '#7c3aed' },
  { value: 'data scientist', label: 'Data Scientist', icon: '📊', color: '#dc2626' },
  { value: 'devops engineer', label: 'DevOps Engineer', icon: '🚀', color: '#0891b2' },
  { value: 'mobile developer', label: 'Mobile Developer', icon: '📱', color: '#059669' },
  { value: 'web developer', label: 'Web Developer', icon: '🌐', color: '#4f46e5' },
]

const VERDICT_CONFIG = {
  'Likely to Pass':    { color: '#059669', bg: '#f0fdf4', border: 'rgba(5,150,105,0.2)',   icon: '✓', shadow: 'rgba(5,150,105,0.15)' },
  'Needs Improvement': { color: '#d97706', bg: '#fffbeb', border: 'rgba(217,119,6,0.2)',   icon: '⚠', shadow: 'rgba(217,119,6,0.12)' },
  'Unlikely to Pass':  { color: '#dc2626', bg: '#fff1f2', border: 'rgba(220,38,38,0.2)',   icon: '✕', shadow: 'rgba(220,38,38,0.1)'  },
}

function ScoreRing({ score, size = 110, stroke = 10 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(Math.max(score / 10, 0), 1)
  const offset = circ * (1 - pct)
  const color = score >= 7 ? '#059669' : score >= 5 ? '#d97706' : '#dc2626'
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size > 90 ? '22px' : '16px', fontWeight: '900', color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '10px', color: 'rgba(26,26,46,0.4)', fontWeight: '600' }}>/10</span>
      </div>
    </div>
  )
}

function SectionBar({ label, score }) {
  const color = score >= 7 ? '#059669' : score >= 5 ? '#d97706' : '#dc2626'
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a2e', textTransform: 'capitalize' }}>{label.replace(/_/g,' ')}</span>
        <span style={{ fontSize: '13px', fontWeight: '800', color }}>{score}/10</span>
      </div>
      <div style={{ height: '7px', background: 'rgba(0,0,0,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score*10}%`, background: color, borderRadius: '10px', transition: 'width 1s ease', boxShadow: `0 0 8px ${color}55` }} />
      </div>
    </div>
  )
}

export default function ATSScore() {
  const [file, setFile]         = useState(null)
  const [role, setRole]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const fileRef   = useRef()
  const resultRef = useRef()

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.endsWith('.pdf')) return toast.error('Only PDF files accepted')
    if (f.size > 5*1024*1024) return toast.error('Max 5MB')
    setFile(f); setResult(null)
  }

  const handleAnalyze = async () => {
    if (!file) return toast.error('Please upload your resume PDF')
    if (!role) return toast.error('Please select your target job role')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('role', role)
      const res = await analyzeATS(fd)
      setResult(res.data)
      toast.success('ATS analysis complete!')
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Analysis failed. Please try again.')
    } finally { setLoading(false) }
  }

  const verdict   = result ? (VERDICT_CONFIG[result.ats_verdict] || VERDICT_CONFIG['Needs Improvement']) : null
  const roleInfo  = ROLES.find(r => r.value === role)
  const fmt       = result?.formatting_check
  const gram      = result?.grammar_check
  const roleKw    = result?.role_keywords

  return (
    <AppLayout>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '24px 16px' : '44px 52px' }}>

        {/* ── Header ── */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: isMobile ? '24px' : '32px 36px', marginBottom: '20px', border: '1.5px solid rgba(79,70,229,0.08)', boxShadow: SH_LG, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(79,70,229,0.06) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(79,70,229,0.3)' }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '900', color: '#1a1a2e', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>ATS Score Checker</h1>
              <p style={{ fontSize: '14px', color: 'rgba(26,26,46,0.5)', margin: 0, lineHeight: '1.6' }}>
                Select your target role, upload resume → AI checks keywords, grammar, formatting and gives a full ATS score.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
            {[{n:'01',t:'Pick Job Role',c:'#4f46e5'},{n:'02',t:'Upload Resume PDF',c:'#7c3aed'},{n:'03',t:'Get Full ATS Report',c:'#059669'}].map(s => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f7f6fb', border: '1px solid rgba(79,70,229,0.08)', borderRadius: '10px', padding: '7px 14px', boxShadow: '0 2px 6px rgba(80,60,180,0.07)' }}>
                <span style={{ fontSize: '11px', fontWeight: '900', color: s.c }}>{s.n}</span>
                <span style={{ fontSize: '12px', color: 'rgba(26,26,46,0.6)', fontWeight: '500' }}>{s.t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Role Selector ── */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: isMobile ? '20px' : '28px 32px', marginBottom: '16px', border: '1.5px solid rgba(79,70,229,0.08)', boxShadow: SH_MD }}>
          <p style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(26,26,46,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>Step 1 — Select Target Job Role</p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: '10px' }}>
            {ROLES.map(r => (
              <button key={r.value} onClick={() => setRole(r.value)} style={{ padding: '12px 14px', borderRadius: '12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', background: role === r.value ? `${r.color}09` : '#fafaff', border: `1.5px solid ${role === r.value ? r.color : 'rgba(79,70,229,0.09)'}`, cursor: 'pointer', transition: 'all 0.15s', boxShadow: role === r.value ? `0 4px 14px ${r.color}25` : '0 1px 4px rgba(80,60,180,0.06)' }}
                onMouseEnter={e => { if (role !== r.value) e.currentTarget.style.boxShadow = '0 4px 12px rgba(80,60,180,0.12)' }}
                onMouseLeave={e => { if (role !== r.value) e.currentTarget.style.boxShadow = '0 1px 4px rgba(80,60,180,0.06)' }}
              >
                <span style={{ fontSize: '18px' }}>{r.icon}</span>
                <span style={{ fontSize: '12.5px', fontWeight: role === r.value ? '700' : '500', color: role === r.value ? r.color : '#1a1a2e' }}>{r.label}</span>
              </button>
            ))}
          </div>
          {role && (
            <div style={{ marginTop: '12px', background: `${roleInfo?.color}09`, border: `1.5px solid ${roleInfo?.color}25`, borderRadius: '12px', padding: '12px 16px', boxShadow: `0 2px 8px ${roleInfo?.color}15` }}>
              <p style={{ fontSize: '12px', color: 'rgba(26,26,46,0.5)', margin: '0 0 6px 0', fontWeight: '600' }}>Required keywords for <span style={{ color: roleInfo?.color }}>{roleInfo?.label}</span>:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {ROLES.find(r2 => r2.value === role) && ['frontend developer','backend developer','full stack developer','java developer','python developer','data scientist','devops engineer','mobile developer','web developer'].includes(role) &&
                  getKeywordsForDisplay(role).map(k => (
                    <span key={k} style={{ fontSize: '11px', background: '#fff', color: roleInfo?.color, padding: '3px 10px', borderRadius: '20px', border: `1.5px solid ${roleInfo?.color}30`, fontWeight: '700' }}>{k}</span>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* ── Upload ── */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: isMobile ? '20px' : '28px 32px', marginBottom: '20px', border: '1.5px solid rgba(79,70,229,0.08)', boxShadow: SH_MD }}>
          <p style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(26,26,46,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>Step 2 — Upload Resume PDF</p>
          <div onClick={() => fileRef.current?.click()}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            style={{ border: `2px dashed ${dragOver ? '#4f46e5' : file ? '#059669' : 'rgba(79,70,229,0.18)'}`, borderRadius: '14px', padding: isMobile ? '32px 16px' : '44px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#f0f0ff' : file ? '#f0fdf4' : '#fafaff', transition: 'all 0.2s', boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.03)' }}>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: file ? '#d1fae5' : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: file ? '0 4px 12px rgba(5,150,105,0.2)' : '0 4px 12px rgba(79,70,229,0.15)' }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={file ? '#059669' : '#4f46e5'} strokeWidth="1.8">
                {file ? <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></> : <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>}
              </svg>
            </div>
            {file
              ? <><p style={{ color: '#059669', fontWeight: '700', fontSize: '14px', margin: '0 0 3px 0' }}>{file.name}</p><p style={{ color: 'rgba(26,26,46,0.4)', fontSize: '12px', margin: 0 }}>{(file.size/1024).toFixed(1)} KB · click to change</p></>
              : <><p style={{ color: '#1a1a2e', fontWeight: '700', fontSize: '14px', margin: '0 0 4px 0' }}>Drop PDF resume here or click to browse</p><p style={{ color: 'rgba(26,26,46,0.4)', fontSize: '12px', margin: 0 }}>Max 5MB · PDF only</p></>}
          </div>

          <button onClick={handleAnalyze} disabled={loading || !file || !role}
            style={{ marginTop: '14px', width: '100%', padding: '14px', borderRadius: '12px', background: (!file || !role) ? '#f0eff5' : '#1a1a2e', border: 'none', color: (!file || !role) ? 'rgba(26,26,46,0.3)' : '#fff', fontWeight: '700', fontSize: '15px', cursor: (!file || !role) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: (!file || !role) ? 'none' : '0 4px 16px rgba(26,26,46,0.22)', transition: 'all 0.2s' }}
            onMouseEnter={e => { if (file && role && !loading) { e.currentTarget.style.boxShadow='0 8px 28px rgba(26,26,46,0.3)'; e.currentTarget.style.transform='translateY(-1px)' }}}
            onMouseLeave={e => { e.currentTarget.style.boxShadow='0 4px 16px rgba(26,26,46,0.22)'; e.currentTarget.style.transform='none' }}
          >
            {loading
              ? <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Analyzing with AI...</>
              : (!role ? 'Select a job role first' : !file ? 'Upload your resume first' : <><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12"/></svg>Analyze ATS Score</>)}
          </button>
        </div>

        {/* ── Results ── */}
        {result && (
          <div ref={resultRef}>

            {/* Score + Verdict row */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

              <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1.5px solid rgba(79,70,229,0.08)', boxShadow: SH_LG, display: 'flex', alignItems: 'center', gap: '22px' }}>
                <ScoreRing score={result.overall_score} size={isMobile ? 90 : 110} />
                <div>
                  <p style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(26,26,46,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 5px 0' }}>Overall ATS Score</p>
                  <p style={{ fontSize: '26px', fontWeight: '900', color: '#1a1a2e', margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>
                    {result.overall_score >= 8 ? 'Excellent 🎉' : result.overall_score >= 6 ? 'Good 👍' : result.overall_score >= 4 ? 'Average ⚠️' : 'Needs Work ❌'}
                  </p>
                  <p style={{ fontSize: '13px', color: 'rgba(26,26,46,0.5)', margin: 0, lineHeight: '1.55' }}>{result.summary}</p>
                </div>
              </div>

              <div style={{ background: verdict.bg, borderRadius: '20px', padding: '28px', border: `1.5px solid ${verdict.border}`, boxShadow: `0 8px 32px ${verdict.shadow}`, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${verdict.color}15`, border: `1.5px solid ${verdict.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${verdict.color}20` }}>
                    <span style={{ fontSize: '20px', fontWeight: '900', color: verdict.color }}>{verdict.icon}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(26,26,46,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 3px 0' }}>ATS Verdict</p>
                    <p style={{ fontSize: '18px', fontWeight: '900', color: verdict.color, margin: 0 }}>{result.ats_verdict}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {result.keywords_found?.slice(0,8).map(k => (
                    <span key={k} style={{ fontSize: '11px', background: '#fff', color: '#059669', padding: '3px 10px', borderRadius: '20px', border: '1.5px solid rgba(5,150,105,0.2)', fontWeight: '700', boxShadow: '0 1px 4px rgba(5,150,105,0.1)' }}>✓ {k}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Role Keywords check */}
            {roleKw && (
              <div style={{ background: '#fff', borderRadius: '20px', padding: isMobile ? '22px' : '28px 32px', marginBottom: '16px', border: '1.5px solid rgba(79,70,229,0.08)', boxShadow: SH_MD }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <p style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(26,26,46,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>Role Keywords — {result.role}</p>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: roleKw.score >= 7 ? '#059669' : roleKw.score >= 5 ? '#d97706' : '#dc2626', background: roleKw.score >= 7 ? '#f0fdf4' : roleKw.score >= 5 ? '#fffbeb' : '#fff1f2', border: `1.5px solid ${roleKw.score >= 7 ? 'rgba(5,150,105,0.2)' : roleKw.score >= 5 ? 'rgba(217,119,6,0.2)' : 'rgba(220,38,38,0.2)'}`, padding: '3px 12px', borderRadius: '20px' }}>{roleKw.score}/10</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#059669', margin: '0 0 8px 0' }}>✓ Must-have keywords found</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {roleKw.must_have_found?.length > 0
                        ? roleKw.must_have_found.map(k => <span key={k} style={{ fontSize: '11px', background: '#f0fdf4', color: '#059669', padding: '3px 10px', borderRadius: '20px', border: '1.5px solid rgba(5,150,105,0.2)', fontWeight: '700' }}>✓ {k}</span>)
                        : <span style={{ fontSize: '12px', color: 'rgba(26,26,46,0.4)' }}>None found</span>}
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626', margin: '0 0 8px 0' }}>✕ Missing must-have keywords</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {roleKw.must_have_missing?.length > 0
                        ? roleKw.must_have_missing.map(k => <span key={k} style={{ fontSize: '11px', background: '#fff1f2', color: '#dc2626', padding: '3px 10px', borderRadius: '20px', border: '1.5px solid rgba(220,38,38,0.2)', fontWeight: '700' }}>✕ {k}</span>)
                        : <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>All must-have keywords present! ✓</span>}
                    </div>
                  </div>
                </div>
                {roleKw.good_to_have_missing?.length > 0 && (
                  <div style={{ marginTop: '14px', padding: '12px 14px', background: '#f7f6fb', borderRadius: '12px', border: '1px solid rgba(79,70,229,0.08)' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#4f46e5', margin: '0 0 8px 0' }}>💡 Recommended to add</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {roleKw.good_to_have_missing.map(k => <span key={k} style={{ fontSize: '11px', background: '#fff', color: '#4f46e5', padding: '3px 10px', borderRadius: '20px', border: '1.5px solid rgba(79,70,229,0.2)', fontWeight: '600' }}>+ {k}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Formatting + Grammar mini cards */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

              {/* Formatting */}
              {fmt && (
                <div style={{ background: '#fff', borderRadius: '20px', padding: '22px 26px', border: '1.5px solid rgba(79,70,229,0.08)', boxShadow: SH_MD }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(26,26,46,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>Formatting</p>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: fmt.score >= 7 ? '#059669' : fmt.score >= 5 ? '#d97706' : '#dc2626', background: fmt.score >= 7 ? '#f0fdf4' : fmt.score >= 5 ? '#fffbeb' : '#fff1f2', padding: '3px 12px', borderRadius: '20px', border: `1.5px solid ${fmt.score >= 7 ? 'rgba(5,150,105,0.2)' : fmt.score >= 5 ? 'rgba(217,119,6,0.2)' : 'rgba(220,38,38,0.2)'}` }}>{fmt.score}/10</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {[{ label: `${fmt.word_count} words`, ok: fmt.word_count >= 150 && fmt.word_count <= 900 },
                      { label: 'Email', ok: fmt.has_email },
                      { label: 'Phone', ok: fmt.has_phone },
                      { label: 'Action verbs', ok: fmt.action_verbs_found?.length >= 3 }].map(i => (
                      <span key={i.label} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: i.ok ? '#f0fdf4' : '#fff1f2', color: i.ok ? '#059669' : '#dc2626', border: `1px solid ${i.ok ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}`, fontWeight: '700' }}>
                        {i.ok ? '✓' : '✕'} {i.label}
                      </span>
                    ))}
                  </div>
                  {fmt.issues?.length > 0
                    ? fmt.issues.map((issue, i) => <p key={i} style={{ fontSize: '12.5px', color: 'rgba(26,26,46,0.6)', margin: '0 0 5px 0', lineHeight: '1.5' }}>⚠ {issue}</p>)
                    : <p style={{ fontSize: '13px', color: '#059669', fontWeight: '600', margin: 0 }}>✓ No formatting issues found!</p>}
                </div>
              )}

              {/* Grammar */}
              {gram && (
                <div style={{ background: '#fff', borderRadius: '20px', padding: '22px 26px', border: '1.5px solid rgba(79,70,229,0.08)', boxShadow: SH_MD }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(26,26,46,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>Grammar & Language</p>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: gram.score >= 7 ? '#059669' : gram.score >= 5 ? '#d97706' : '#dc2626', background: gram.score >= 7 ? '#f0fdf4' : gram.score >= 5 ? '#fffbeb' : '#fff1f2', padding: '3px 12px', borderRadius: '20px', border: `1.5px solid ${gram.score >= 7 ? 'rgba(5,150,105,0.2)' : gram.score >= 5 ? 'rgba(217,119,6,0.2)' : 'rgba(220,38,38,0.2)'}` }}>{gram.score}/10</span>
                  </div>
                  {gram.issues?.length > 0
                    ? gram.issues.map((issue, i) => (
                        <div key={i} style={{ background: '#fffbeb', border: '1px solid rgba(217,119,6,0.15)', borderRadius: '10px', padding: '10px 12px', marginBottom: '8px' }}>
                          <p style={{ fontSize: '12.5px', color: 'rgba(26,26,46,0.7)', margin: 0, lineHeight: '1.5' }}>⚠ {issue}</p>
                        </div>
                      ))
                    : <p style={{ fontSize: '13px', color: '#059669', fontWeight: '600', margin: 0 }}>✓ No grammar issues detected!</p>}
                  {gram.typos_found && Object.keys(gram.typos_found).length > 0 && (
                    <div style={{ marginTop: '10px', padding: '10px 12px', background: '#fff1f2', borderRadius: '10px', border: '1px solid rgba(220,38,38,0.15)' }}>
                      <p style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626', margin: '0 0 6px 0' }}>Spelling corrections:</p>
                      {Object.entries(gram.typos_found).map(([t, c]) => (
                        <p key={t} style={{ fontSize: '12px', color: 'rgba(26,26,46,0.6)', margin: '0 0 3px 0' }}>"{t}" → "{c}"</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section Scores */}
            <div style={{ background: '#fff', borderRadius: '20px', padding: isMobile ? '22px' : '28px 32px', marginBottom: '16px', border: '1.5px solid rgba(79,70,229,0.08)', boxShadow: SH_MD }}>
              <p style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(26,26,46,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 20px 0' }}>Section Breakdown</p>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0 32px' }}>
                {Object.entries(result.section_scores || {}).map(([key, val]) => <SectionBar key={key} label={key} score={val} />)}
              </div>
            </div>

            {/* Missing keywords */}
            {result.keywords_missing?.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '20px', padding: isMobile ? '22px' : '28px 32px', marginBottom: '16px', border: '1.5px solid rgba(79,70,229,0.08)', boxShadow: SH_MD }}>
                <p style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(26,26,46,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 14px 0' }}>General Missing Keywords</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {result.keywords_missing.map(k => <span key={k} style={{ fontSize: '12px', background: '#fff1f2', color: '#dc2626', padding: '5px 14px', borderRadius: '20px', border: '1.5px solid rgba(220,38,38,0.18)', fontWeight: '700', boxShadow: '0 2px 6px rgba(220,38,38,0.1)' }}>✕ {k}</span>)}
                </div>
              </div>
            )}

            {/* Strengths + Improvements */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ background: '#fff', borderRadius: '20px', padding: '24px 28px', border: '1.5px solid rgba(5,150,105,0.12)', boxShadow: '0 4px 20px rgba(5,150,105,0.08)' }}>
                <p style={{ fontSize: '11px', fontWeight: '800', color: '#059669', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 14px 0' }}>✓ Strengths</p>
                {result.strengths?.map((s,i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                      <span style={{ fontSize: '10px', color: '#059669', fontWeight: '900' }}>✓</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#1a1a2e', margin: 0, lineHeight: '1.55' }}>{s}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', borderRadius: '20px', padding: '24px 28px', border: '1.5px solid rgba(217,119,6,0.12)', boxShadow: '0 4px 20px rgba(217,119,6,0.08)' }}>
                <p style={{ fontSize: '11px', fontWeight: '800', color: '#d97706', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 14px 0' }}>⚡ Top Improvements</p>
                {result.improvements?.slice(0,4).map((imp,i) => (
                  <div key={i} style={{ background: '#fffbeb', border: '1.5px solid rgba(217,119,6,0.12)', borderRadius: '12px', padding: '12px 14px', marginBottom: '10px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '800', color: '#d97706', margin: '0 0 3px 0', textTransform: 'uppercase' }}>{imp.section}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(26,26,46,0.55)', margin: '0 0 5px 0' }}>{imp.issue}</p>
                    <p style={{ fontSize: '12.5px', color: '#1a1a2e', fontWeight: '600', margin: 0 }}>→ {imp.fix}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#2d2d5e)', borderRadius: '20px', padding: isMobile ? '28px 24px' : '32px 36px', textAlign: 'center', boxShadow: '0 8px 32px rgba(26,26,46,0.25)', marginBottom: '8px' }}>
              <p style={{ fontSize: '18px', fontWeight: '900', color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.3px' }}>Resume optimized? Now practice the interview!</p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 20px 0' }}>Test your skills with a role-specific AI mock interview</p>
              <a href="/setup" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 30px', borderRadius: '12px', background: '#fff', color: '#1a1a2e', fontWeight: '800', fontSize: '14px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(255,255,255,0.2)' }}>Start Mock Interview →</a>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </AppLayout>
  )
}

// Helper used in JSX for keyword preview
function getKeywordsForDisplay(role) {
  const map = {
    'frontend developer': ['HTML','CSS','JavaScript','React','Git','Responsive'],
    'backend developer': ['API','REST','SQL','Database','Server','Git'],
    'full stack developer': ['Frontend','Backend','API','Database','JavaScript','Git'],
    'java developer': ['Java','Spring','OOP','Maven','SQL','Git'],
    'python developer': ['Python','Git','API','SQL','OOP'],
    'data scientist': ['Python','Machine Learning','SQL','Statistics','Data Analysis'],
    'devops engineer': ['Docker','CI/CD','Linux','Git','Cloud'],
    'mobile developer': ['Mobile','Git','API','UI'],
    'web developer': ['HTML','CSS','JavaScript','Git','Responsive'],
  }
  return map[role] || []
}