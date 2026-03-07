import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { submitAnswer, completeInterview } from '../services/api'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Mic, MicOff, SkipForward, CheckCircle, Volume2, Loader2, AlertCircle } from 'lucide-react'

// AI Avatar Component
function AIAvatar({ isSpeaking, isListening }) {
  return (
    <div className={`relative ${isSpeaking ? 'avatar-speaking' : ''}`}>
      {/* Outer glow rings */}
      <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
        isSpeaking ? 'animate-ping bg-indigo-500/20 scale-110' : isListening ? 'bg-emerald-500/10' : 'bg-transparent'
      }`} style={{ animationDuration: '1.5s' }} />

      {/* Avatar circle */}
      <div className={`relative w-36 h-36 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
        isSpeaking
          ? 'border-indigo-400/80 bg-indigo-600/20 shadow-[0_0_40px_rgba(99,102,241,0.4)]'
          : isListening
          ? 'border-emerald-400/60 bg-emerald-600/10 shadow-[0_0_30px_rgba(52,211,153,0.2)]'
          : 'border-white/10 bg-white/5'
      }`}>
        {/* Face */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-1">
            {/* AI face SVG */}
            <svg viewBox="0 0 64 64" className="w-full h-full">
              <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="1.5"
                className={`${isSpeaking ? 'text-indigo-400' : isListening ? 'text-emerald-400' : 'text-white/20'}`} />
              {/* Eyes */}
              <circle cx="22" cy="26" r="3" className={`${isSpeaking ? 'fill-indigo-300' : isListening ? 'fill-emerald-300' : 'fill-white/50'}`}/>
              <circle cx="42" cy="26" r="3" className={`${isSpeaking ? 'fill-indigo-300' : isListening ? 'fill-emerald-300' : 'fill-white/50'}`}/>
              {/* Mouth - animated when speaking */}
              {isSpeaking ? (
                <ellipse cx="32" cy="42" rx="8" ry="5" className="fill-indigo-400/40 stroke-indigo-400" strokeWidth="1"/>
              ) : (
                <path d="M24 40 Q32 46 40 40" fill="none" className={`${isListening ? 'stroke-emerald-400' : 'stroke-white/30'}`} strokeWidth="1.5" strokeLinecap="round"/>
              )}
              {/* Circuit pattern on forehead */}
              <path d="M20 18 L28 18 M28 18 L28 14 M32 18 L32 12 M36 18 L36 14 M36 14 L44 14" fill="none" stroke="currentColor" strokeWidth="0.8"
                className={`${isSpeaking ? 'text-indigo-400/60' : 'text-white/15'}`}/>
            </svg>
          </div>
          <p className={`text-xs font-medium ${
            isSpeaking ? 'text-indigo-300' : isListening ? 'text-emerald-300' : 'text-white/30'
          }`}>
            {isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'AI Interviewer'}
          </p>
        </div>
      </div>

      {/* Sound wave bars - shown when speaking */}
      {isSpeaking && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="wave-bar w-1 bg-indigo-400/60 rounded-full" style={{ height: '8px' }} />
          ))}
        </div>
      )}
    </div>
  )
}

// Mic Button Component
function MicButton({ isListening, onStart, onStop, disabled }) {
  return (
    <button
      onClick={isListening ? onStop : onStart}
      disabled={disabled}
      className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
        isListening
          ? 'bg-red-500 hover:bg-red-400 mic-active shadow-[0_0_30px_rgba(239,68,68,0.5)]'
          : 'bg-white/10 hover:bg-white/15 border-2 border-white/20 hover:border-white/40'
      }`}
    >
      {isListening ? (
        <MicOff className="w-8 h-8 text-white" />
      ) : (
        <Mic className="w-8 h-8 text-white/80" />
      )}
    </button>
  )
}

export default function LiveInterview() {
  const { id: interviewId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const questions = location.state?.questions || []
  const role = location.state?.role || 'Developer'

  const [phase, setPhase] = useState('greeting') // greeting | asking | listening | evaluating | completed
  const [currentQ, setCurrentQ] = useState(0)
  const [submissions, setSubmissions] = useState([])
  const [finalizing, setFinalizing] = useState(false)
  const [currentScore, setCurrentScore] = useState(null)
  const [currentAnswerText, setCurrentAnswerText] = useState('')

  const { speak, cancel: cancelSpeech, isSpeaking } = useSpeechSynthesis()
  const { isListening, transcript, error: micError, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition()

  const hasGreeted = useRef(false)

  // Greet user on mount
  useEffect(() => {
    if (!hasGreeted.current && questions.length > 0) {
      hasGreeted.current = true
      const greeting = `Hello ${user?.name?.split(' ')[0] || 'there'}, welcome to your mock interview for ${role}. I'll ask you ${questions.length} questions. Take your time with each answer. Let's begin!`
      speak(greeting, () => {
        setTimeout(() => askQuestion(0), 500)
      })
    }
  }, [questions])

  const askQuestion = useCallback((index) => {
    if (index >= questions.length) return
    setPhase('asking')
    setCurrentQ(index)
    setCurrentAnswerText('')
    resetTranscript()
    setCurrentScore(null)

    speak(questions[index], () => {
      setPhase('listening')
    })
  }, [questions, speak, resetTranscript])

  const handleStopListening = () => {
    stopListening()
    const answer = transcript.trim() || currentAnswerText.trim()
    setCurrentAnswerText(answer)
    if (!answer) {
      toast.error('No answer detected. Please try again.')
      setPhase('listening')
      return
    }
    handleSubmitAnswer(answer)
  }

  const handleSubmitAnswer = async (answerText) => {
    if (!answerText) return
    setPhase('evaluating')
    try {
      const res = await submitAnswer({
        interview_id: interviewId,
        question_index: currentQ,
        question: questions[currentQ],
        answer: answerText,
      })
      const score = res.data.score
      setCurrentScore(score)
      setSubmissions(prev => [...prev, { question: questions[currentQ], answer: answerText, score }])

      const feedback = `Good answer. You scored ${score.overall} out of 10. ${score.feedback}`
      speak(feedback, () => {
        setTimeout(() => {
          if (currentQ + 1 < questions.length) {
            askQuestion(currentQ + 1)
          } else {
            speak("Excellent! You've completed all questions. Let me generate your detailed feedback report.", () => {
              setPhase('completed')
              handleFinalize()
            })
          }
        }, 500)
      })
    } catch (err) {
      toast.error('Failed to evaluate answer')
      setPhase('listening')
    }
  }

  const handleFinalize = async () => {
    setFinalizing(true)
    try {
      await completeInterview(interviewId)
      setTimeout(() => navigate(`/report/${interviewId}`), 1500)
    } catch {
      toast.error('Failed to generate report')
      setFinalizing(false)
    }
  }

  const handleSkip = () => {
    if (isListening) stopListening()
    cancelSpeech()
    const emptyAnswer = '[No answer provided]'
    handleSubmitAnswer(emptyAnswer)
  }

  const progress = questions.length > 0 ? ((currentQ) / questions.length) * 100 : 0

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-white/60">No questions found. Please start a new interview.</p>
          <button onClick={() => navigate('/setup')} className="btn-primary mt-4">Go to Setup</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-white/5 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/40">Mock Interview</span>
            <span className="text-white/20">·</span>
            <span className="text-sm text-indigo-300">{role}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/40">
              {phase === 'completed' ? 'Completed' : `Question ${Math.min(currentQ + 1, questions.length)} of ${questions.length}`}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-4xl mx-auto mt-2">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${phase === 'completed' ? 100 : progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-4xl mx-auto w-full">

        {/* Avatar Section */}
        <div className="mb-12 flex flex-col items-center">
          <AIAvatar isSpeaking={isSpeaking} isListening={isListening} />
        </div>

        {/* Phase-based UI */}
        {phase === 'completed' || finalizing ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              {finalizing ? (
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              ) : (
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              )}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Interview Complete!</h2>
            <p className="text-white/40">Generating your detailed feedback report...</p>
          </div>
        ) : (
          <>
            {/* Question Card */}
            <div className="w-full glass-card p-6 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-indigo-400">{currentQ + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/30 mb-2 uppercase tracking-wider">Current Question</p>
                  <p className="text-white text-lg leading-relaxed font-medium">
                    {questions[currentQ]}
                  </p>
                </div>
                {isSpeaking && (
                  <Volume2 className="w-5 h-5 text-indigo-400 flex-shrink-0 animate-pulse" />
                )}
              </div>
            </div>

            {/* Score feedback */}
            {phase === 'evaluating' && currentScore && (
              <div className="w-full glass-card p-5 mb-6 border-indigo-500/20 bg-indigo-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-indigo-400" />
                  <p className="text-sm font-medium text-white">Answer Evaluated</p>
                  <span className="ml-auto text-indigo-300 font-bold">{currentScore.overall}/10</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center mb-3">
                  {[
                    { label: 'Technical', val: currentScore.technical_knowledge },
                    { label: 'Communication', val: currentScore.communication },
                    { label: 'Relevance', val: currentScore.relevance },
                  ].map(s => (
                    <div key={s.label} className="bg-white/5 rounded-lg p-2">
                      <p className="text-lg font-bold text-white">{s.val}</p>
                      <p className="text-xs text-white/40">{s.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/50 italic">{currentScore.feedback}</p>
              </div>
            )}

            {/* Transcript */}
            {(isListening || currentAnswerText) && (
              <div className="w-full glass-card p-5 mb-6">
                <p className="text-xs text-white/30 uppercase tracking-wider mb-3">
                  {isListening ? 'Live Transcript' : 'Your Answer'}
                </p>
                <p className="text-white/70 leading-relaxed min-h-[60px]">
                  {transcript || currentAnswerText || (
                    <span className="text-white/20 italic">Listening for your answer...</span>
                  )}
                </p>
                {isListening && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    <span className="text-xs text-red-400">Recording...</span>
                  </div>
                )}
              </div>
            )}

            {/* Mic Error */}
            {micError && (
              <div className="w-full bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{micError}</p>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-6 mt-4">
              {/* Skip Button */}
              <button
                onClick={handleSkip}
                disabled={phase === 'evaluating' || phase === 'asking' || isSpeaking}
                className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm disabled:opacity-30"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>

              {/* Mic Button */}
              <MicButton
                isListening={isListening}
                onStart={() => {
                  if (phase !== 'listening') return
                  resetTranscript()
                  startListening()
                }}
                onStop={handleStopListening}
                disabled={phase !== 'listening' || isSpeaking}
              />

              <div className="w-24 text-center">
                <p className="text-xs text-white/30">
                  {phase === 'greeting' && 'Greeting...'}
                  {phase === 'asking' && 'Listen...'}
                  {phase === 'listening' && (isListening ? 'Tap to stop' : 'Tap to answer')}
                  {phase === 'evaluating' && 'Evaluating...'}
                </p>
              </div>
            </div>

            {/* Instruction hint */}
            {phase === 'listening' && !isListening && (
              <p className="text-xs text-white/20 mt-4 text-center">
                {isSupported ? 'Click the microphone and speak your answer' : 'Speech recognition requires Chrome browser'}
              </p>
            )}
          </>
        )}
      </div>

      {/* Bottom: answered summary */}
      {submissions.length > 0 && phase !== 'completed' && !finalizing && (
        <div className="border-t border-white/5 px-6 py-3">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto">
              {submissions.map((s, i) => (
                <div key={i} className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                  s.score.overall >= 7 ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' :
                  s.score.overall >= 5 ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' :
                  'border-red-500/40 bg-red-500/10 text-red-400'
                }`}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}