import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { uploadResume } from '../services/api'
import toast from 'react-hot-toast'
import { Upload, FileText, CheckCircle, ArrowLeft, Brain, X } from 'lucide-react'

export default function ResumeUpload() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef()
  const navigate = useNavigate()

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.endsWith('.pdf')) return toast.error('Only PDF files are accepted')
    if (f.size > 5 * 1024 * 1024) return toast.error('File size must be under 5MB')
    setFile(f)
    setResult(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    handleFile(f)
  }

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a PDF file')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await uploadResume(formData)
      setResult(res.data)
      toast.success('Resume uploaded and analyzed!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/dashboard" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </Link>
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white">Resume Upload</h1>
          </div>
        </div>

        <p className="text-white/40 mb-8 text-sm">
          Upload your resume so the AI can tailor interview questions to your skills and projects.
        </p>

        {/* Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          className={`relative glass-card p-10 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-indigo-500/60 bg-indigo-500/5'
              : file
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'hover:border-white/20 hover:bg-white/5'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {file ? (
            <div>
              <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-white/40 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="mt-3 text-xs text-white/30 hover:text-white/60 flex items-center gap-1 mx-auto"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
          ) : (
            <div>
              <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                <Upload className="w-7 h-7 text-indigo-400" />
              </div>
              <p className="text-white font-medium">Drop your PDF here</p>
              <p className="text-white/40 text-sm mt-1">or click to browse</p>
              <p className="text-white/20 text-xs mt-3">Max 5MB · PDF only</p>
            </div>
          )}
        </div>

        {/* Upload Button */}
        {file && !result && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing resume...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload & Analyze
              </>
            )}
          </button>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 space-y-4">
            <div className="glass-card p-6 border-emerald-500/20">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white">Resume Analyzed</h3>
              </div>

              <div className="space-y-4">
                {result.skills.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                      Skills ({result.skills.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.skills.map(s => (
                        <span key={s} className="text-xs bg-indigo-600/15 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.projects.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                      Projects ({result.projects.length})
                    </p>
                    <ul className="space-y-1">
                      {result.projects.slice(0, 4).map((p, i) => (
                        <li key={i} className="text-sm text-white/60 flex items-start gap-2">
                          <span className="text-indigo-400 mt-0.5">•</span>
                          <span className="line-clamp-1">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.experience.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                      Experience ({result.experience.length} entries)
                    </p>
                    <p className="text-sm text-white/60 line-clamp-2">{result.experience[0]}</p>
                  </div>
                )}
              </div>
            </div>

            <button onClick={() => navigate('/setup')} className="btn-primary w-full flex items-center justify-center gap-2">
              Continue to Interview Setup →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}