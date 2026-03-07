import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { generateQuestions } from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Brain, Briefcase, BarChart, Loader2 } from 'lucide-react'

const ROLES = [
  { value: 'Frontend Developer', icon: '🎨', desc: 'React, CSS, UI/UX' },
  { value: 'Backend Developer', icon: '⚙️', desc: 'APIs, Databases, Server' },
  { value: 'Full Stack Developer', icon: '🚀', desc: 'End-to-end development' },
  { value: 'Java Developer', icon: '☕', desc: 'Java, Spring, OOP' },
  { value: 'Python Developer', icon: '🐍', desc: 'Python, FastAPI, Django' },
  { value: 'Data Scientist', icon: '📊', desc: 'ML, Statistics, Python' },
  { value: 'DevOps Engineer', icon: '🔧', desc: 'CI/CD, Docker, Cloud' },
  { value: 'Mobile Developer', icon: '📱', desc: 'iOS, Android, Flutter' },
]

const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner', desc: '0-1 year experience', color: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400' },
  { value: 'intermediate', label: 'Intermediate', desc: '1-3 years experience', color: 'border-yellow-500/40 bg-yellow-500/5 text-yellow-400' },
  { value: 'advanced', label: 'Advanced', desc: '3+ years experience', color: 'border-red-500/40 bg-red-500/5 text-red-400' },
]

export default function InterviewSetup() {
  const [role, setRole] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleStart = async () => {
    if (!role) return toast.error('Please select a job role')
    if (!difficulty) return toast.error('Please select a difficulty level')
    setLoading(true)
    try {
      const res = await generateQuestions({ role, difficulty })
      toast.success(`${res.data.total_questions} questions generated!`)
      navigate(`/interview/${res.data.interview_id}`, {
        state: { questions: res.data.questions, role, difficulty },
      })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate questions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/dashboard" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </Link>
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white">Interview Setup</h1>
          </div>
        </div>

        {/* Role Selection */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-white">Select Job Role</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  role === r.value
                    ? 'border-indigo-500/60 bg-indigo-500/10'
                    : 'border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5'
                }`}
              >
                <span className="text-2xl block mb-2">{r.icon}</span>
                <p className="text-sm font-medium text-white leading-tight">{r.value}</p>
                <p className="text-xs text-white/30 mt-1">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BarChart className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-white">Difficulty Level</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={`p-5 rounded-xl border text-center transition-all ${
                  difficulty === d.value
                    ? d.color + ' border-opacity-60'
                    : 'border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5'
                }`}
              >
                <p className="font-semibold text-white mb-1">{d.label}</p>
                <p className="text-xs text-white/40">{d.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        {role && difficulty && (
          <div className="glass-card p-5 mb-6 border-indigo-500/20 bg-indigo-500/5">
            <p className="text-sm text-white/60">
              <span className="text-white font-medium">{role}</span> interview at{' '}
              <span className="text-white font-medium capitalize">{difficulty}</span> level with{' '}
              <span className="text-indigo-300">5 AI-generated questions</span> tailored to your resume.
            </p>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={loading || !role || !difficulty}
          className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating questions...
            </>
          ) : (
            <>
              <Brain className="w-5 h-5" />
              Start Interview
            </>
          )}
        </button>
      </div>
    </div>
  )
}