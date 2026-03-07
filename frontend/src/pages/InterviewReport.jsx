import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getInterviewReport } from '../services/api'
import { ArrowLeft, Brain, Trophy, Target, TrendingUp, BookOpen, CheckCircle, XCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

function ScoreRing({ score, size = 80 }) {
  const radius = size / 2 - 8
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 10) * circumference
  const color = score >= 8 ? '#34d399' : score >= 6 ? '#fbbf24' : '#f87171'

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
      <circle
        cx={size/2} cy={size/2} r={radius}
        fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  )
}

function ScoreCard({ label, score }) {
  const color = score >= 8 ? 'text-emerald-400' : score >= 6 ? 'text-yellow-400' : 'text-red-400'
  return (
    <div className="glass-card p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{score}</p>
      <p className="text-xs text-white/40 mt-1">{label}</p>
    </div>
  )
}

function QuestionAccordion({ item, index }) {
  const [open, setOpen] = useState(false)
  const overall = item.score?.overall ?? 0
  const color = overall >= 7 ? 'border-emerald-500/30 bg-emerald-500/5' : overall >= 5 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5'
  const textColor = overall >= 7 ? 'text-emerald-400' : overall >= 5 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${color}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-white/50 flex-shrink-0">
            {index + 1}
          </span>
          <p className="text-sm text-white line-clamp-1">{item.question}</p>
        </div>
        <div className="flex items-center gap-3 ml-3">
          <span className={`text-sm font-bold ${textColor}`}>{overall}/10</span>
          {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-3">
          <div>
            <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Your Answer</p>
            <p className="text-sm text-white/70">{item.answer || 'No answer provided'}</p>
          </div>
          {item.score && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Technical', val: item.score.technical_knowledge },
                  { label: 'Communication', val: item.score.communication },
                  { label: 'Relevance', val: item.score.relevance },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-base font-bold text-white">{s.val}</p>
                    <p className="text-xs text-white/30">{s.label}</p>
                  </div>
                ))}
              </div>
              {item.score.feedback && (
                <p className="text-xs text-white/50 italic">{item.score.feedback}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function InterviewReport() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getInterviewReport(id)
        setReport(res.data)
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load report')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-3" />
        <p className="text-white/40">Loading report...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4">
      <div className="text-center">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-white mb-4">{error}</p>
        <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
      </div>
    </div>
  )

  const feedback = report?.feedback || {}
  const answers = report?.answers || []
  const overallScore = feedback.overall_score ?? 0
  const date = report?.date ? new Date(report.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

  return (
    <div className="min-h-screen bg-surface-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/dashboard" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </Link>
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white">Interview Report</h1>
          </div>
        </div>

        {/* Hero Score Card */}
        <div className="glass-card p-8 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-violet-600/5" />
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <ScoreRing score={overallScore} size={120} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{overallScore}</span>
                <span className="text-xs text-white/30">/ 10</span>
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-xs text-indigo-300 uppercase tracking-wider mb-1">Overall Score</p>
              <h2 className="text-2xl font-bold text-white mb-2">{report.role}</h2>
              <p className="text-white/40 text-sm">
                {report.difficulty} level · {answers.length} questions answered
                {date && ` · ${date}`}
              </p>
              <p className={`text-sm font-medium mt-2 ${overallScore >= 8 ? 'text-emerald-400' : overallScore >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>
                {overallScore >= 8 ? '🎉 Excellent Performance!' : overallScore >= 6 ? '👍 Good Performance' : '💪 Keep Practicing'}
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Sections */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          {feedback.strengths?.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-emerald-400" />
                <h3 className="section-title mb-0">Strengths</h3>
              </div>
              <ul className="space-y-2">
                {feedback.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/70">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {feedback.areas_for_improvement?.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-yellow-400" />
                <h3 className="section-title mb-0">Areas to Improve</h3>
              </div>
              <ul className="space-y-2">
                {feedback.areas_for_improvement.map((a, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full border border-yellow-400/40 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/70">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skill Suggestions */}
          {feedback.skill_suggestions?.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h3 className="section-title mb-0">Skill Suggestions</h3>
              </div>
              <ul className="space-y-2">
                {feedback.skill_suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-2" />
                    <span className="text-sm text-white/70">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Topics */}
          {feedback.recommended_topics?.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-violet-400" />
                <h3 className="section-title mb-0">Study Topics</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {feedback.recommended_topics.map((t, i) => (
                  <span key={i} className="text-sm bg-violet-600/15 text-violet-300 px-3 py-1.5 rounded-full border border-violet-500/20">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Per-Question Breakdown */}
        {answers.length > 0 && (
          <div className="glass-card p-6 mb-6">
            <h3 className="section-title">Question Breakdown</h3>
            <div className="space-y-3">
              {answers.map((item, i) => (
                <QuestionAccordion key={i} item={item} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link to="/setup" className="btn-primary flex-1 text-center">
            Start New Interview
          </Link>
          <Link to="/dashboard" className="btn-secondary flex-1 text-center">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}