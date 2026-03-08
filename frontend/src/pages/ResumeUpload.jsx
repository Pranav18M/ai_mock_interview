import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadResume } from '../services/api'
import toast from 'react-hot-toast'
import AppLayout from '../components/AppLayout'

export default function ResumeUpload() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef()
  const navigate = useNavigate()

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.endsWith('.pdf')) return toast.error('Only PDF files accepted')
    if (f.size > 5 * 1024 * 1024) return toast.error('Max 5MB')
    setFile(f)
    setResult(null)
  }

  const handleUpload = async () => {
    if (!file) return toast.error('Select a PDF file')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await uploadResume(fd)
      setResult(res.data)
      toast.success('Resume analyzed successfully')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div style={{ padding: '40px 48px', maxWidth: '680px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0f2f8', margin: '0 0 8px 0', letterSpacing: '-0.4px' }}>Resume Upload</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Upload your PDF resume to personalize interview questions</p>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          style={{
            border: `2px dashed ${dragOver ? 'rgba(99,102,241,0.6)' : file ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '16px', padding: '56px', textAlign: 'center', cursor: 'pointer',
            background: dragOver ? 'rgba(99,102,241,0.04)' : file ? 'rgba(16,185,129,0.03)' : 'rgba(255,255,255,0.02)',
            transition: 'all 0.2s',
          }}
        >
          <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: file ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke={file ? '#10b981' : '#6366f1'} strokeWidth="1.8">
              {file
                ? <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>
                : <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>}
            </svg>
          </div>
          {file ? (
            <>
              <p style={{ color: '#10b981', fontWeight: '600', fontSize: '15px', margin: '0 0 6px 0' }}>{file.name}</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: 0 }}>{(file.size / 1024).toFixed(1)} KB — click to change</p>
            </>
          ) : (
            <>
              <p style={{ color: '#e8eaf0', fontWeight: '600', fontSize: '15px', margin: '0 0 6px 0' }}>Drop your PDF resume here</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: 0 }}>or click to browse — PDF only, max 5MB</p>
            </>
          )}
        </div>

        {file && !result && (
          <button onClick={handleUpload} disabled={loading} style={{
            marginTop: '16px', width: '100%', padding: '13px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none',
            color: '#fff', fontWeight: '600', fontSize: '14px',
            cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            {loading
              ? <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Analyzing resume...</>
              : 'Upload & Analyze Resume'}
          </button>
        )}

        {result && (
          <div style={{ marginTop: '24px' }}>
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '14px', padding: '24px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#e8eaf0', margin: 0 }}>Resume Analyzed</p>
              </div>
              {result.skills?.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Skills ({result.skills.length})</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {result.skills.map(s => <span key={s} style={{ fontSize: '12px', background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(99,102,241,0.2)' }}>{s}</span>)}
                  </div>
                </div>
              )}
              {result.projects?.length > 0 && (
                <div>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Projects ({result.projects.length})</p>
                  {result.projects.slice(0, 3).map((p, i) => <p key={i} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 4px 0' }}>{p}</p>)}
                </div>
              )}
            </div>
            <button onClick={() => navigate('/setup')} style={{
              width: '100%', padding: '13px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none',
              color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            }}>
              Continue to Interview Setup
            </button>
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </AppLayout>
  )
}