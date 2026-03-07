import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getResume, getInterviewHistory } from '../services/api'
import { Brain, Play, FileText, Clock, Trophy, ChevronRight, LogOut, Upload, Star } from 'lucide-react'
import toast from 'react-hot-toast'

function ScoreBadge({ score }) {
  if (score === null || score === undefined) return <span className="text-white/30 text-sm">—</span>
  const color = score >= 8 ? 'text-emerald-400 bg-emerald-400/10' : score >= 6 ? 'text-yellow-400 bg-yellow-400/10' : 'text-red-400 bg-red-400/10'
  return (
    <span className={`score-badge ${color}`}>
      {score}/10
    </span>
  )
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resumeRes = await getResume()
        setResume(resumeRes.data)
      } catch {
        // No resume yet
      }
      try {
        const histRes = await getInterviewHistory()
        setHistory(histRes.data)
      } catch {
        // No history
      }
      setLoadingHistory(false)
    }
    fetchData()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  const completedInterviews = history.filter(h => h.status === 'completed')
  const avgScore = completedInterviews.length
    ? (completedInterviews.reduce((a, b) => a + (b.overall_score || 0), 0) / completedInterviews.length).toFixed(1)
    : null

  return (
    <div className="min-h-screen bg-surface-900">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600/20 rounded-xl border border-indigo-500/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="font-bold text-white text-lg">InterviewAI</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-white/40">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome + Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">
            Hello, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-white/40">Ready for your next mock interview?</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Interviews', value: history.length, icon: FileText, color: 'text-blue-400' },
            { label: 'Completed', value: completedInterviews.length, icon: Trophy, color: 'text-emerald-400' },
            { label: 'Avg Score', value: avgScore ? `${avgScore}/10` : '—', icon: Star, color: 'text-yellow-400' },
            { label: 'Resume', value: resume ? 'Uploaded' : 'Missing', icon: Upload, color: resume ? 'text-emerald-400' : 'text-red-400' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-5">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/40 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Actions */}
          <div className="lg:col-span-1 space-y-4">
            {/* Start Interview */}
            <div className="glass-card p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-violet-600/5" />
              <div className="relative">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-xl border border-indigo-500/30 flex items-center justify-center mb-4">
                  <Play className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Start Interview</h3>
                <p className="text-sm text-white/40 mb-4">
                  {resume ? 'AI-powered mock interview with your resume' : 'Upload your resume first to begin'}
                </p>
                {resume ? (
                  <Link to="/setup" className="btn-primary block text-center text-sm">
                    Start Now
                  </Link>
                ) : (
                  <Link to="/resume" className="btn-secondary block text-center text-sm">
                    Upload Resume First
                  </Link>
                )}
              </div>
            </div>

            {/* Resume Status */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Resume</h3>
                <Link to="/resume" className="text-xs text-indigo-400 hover:text-indigo-300">
                  {resume ? 'Update' : 'Upload'}
                </Link>
              </div>
              {resume ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-white/40 mb-2">Skills detected</p>
                    <div className="flex flex-wrap gap-1">
                      {resume.skills.slice(0, 6).map(s => (
                        <span key={s} className="text-xs bg-indigo-600/15 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20">
                          {s}
                        </span>
                      ))}
                      {resume.skills.length > 6 && (
                        <span className="text-xs text-white/30">+{resume.skills.length - 6} more</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-white/40">
                    {resume.projects.length} project(s) · {resume.experience.length} experience entries
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Upload className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-sm text-white/40">No resume uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Interview History */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="section-title mb-0">Interview History</h3>
                <span className="text-xs text-white/30">{history.length} total</span>
              </div>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-white/30 text-sm">No interviews yet</p>
                  <p className="text-white/20 text-xs mt-1">Start your first mock interview above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <Link
                      key={item.id}
                      to={`/report/${item.id}`}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.role}</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {item.difficulty} · {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="text-right">
                          <ScoreBadge score={item.overall_score} />
                          <p className={`text-xs mt-0.5 ${item.status === 'completed' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                            {item.status}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}