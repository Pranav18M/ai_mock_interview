import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { submitAnswer, completeInterview } from '../services/api'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

/* ─── AI Robot Image Panel ─── */
function RobotAvatar({ isSpeaking, isListening }) {
  const glowColor = isSpeaking ? 'rgba(99,102,241,0.5)' : isListening ? 'rgba(16,185,129,0.4)' : 'transparent'
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#0d1220' }}>
      {/* Robot image — full panel like a video call */}
      <img
        src="/AiHr-image.webp"
        alt="AI Interviewer"
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
      />
      {/* Subtle color tint overlay when speaking/listening */}
      <div style={{ position: 'absolute', inset: 0, background: isSpeaking ? 'rgba(99,102,241,0.08)' : isListening ? 'rgba(16,185,129,0.06)' : 'transparent', transition: 'background 0.4s ease', pointerEvents: 'none' }} />
      {/* Speaking sound wave bottom-center */}
      {isSpeaking && (
        <div style={{ position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px', alignItems: 'flex-end', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', padding: '8px 14px', borderRadius: '20px', border: '1px solid rgba(99,102,241,0.3)' }}>
          {[10, 18, 14, 22, 16, 12, 20, 15, 11, 17].map((h, i) => (
            <div key={i} style={{ width: '3px', borderRadius: '3px', background: '#818cf8', animation: `wave 0.5s ease-in-out ${i * 0.07}s infinite alternate`, height: h + 'px' }} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Webcam Panel ─── */
function WebcamPanel({ isListening, userName, webcamError, videoRef }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0d14', overflow: 'hidden' }}>
      <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: webcamError ? 'none' : 'block' }} />
      {webcamError && (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #0d1220, #111827)', gap: '12px' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
              <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              <line x1="1" y1="1" x2="23" y2="23" stroke="rgba(239,68,68,0.6)" strokeWidth="2"/>
            </svg>
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '0 20px' }}>Camera unavailable</p>
        </div>
      )}
      {/* Listening pulse overlay */}
      {isListening && (
        <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(16,185,129,0.5)', borderRadius: 'inherit', animation: 'borderPulse 1.5s ease-in-out infinite', pointerEvents: 'none' }} />
      )}
      {/* Name tag */}
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {isListening && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'blink 1s infinite' }} />}
        <span style={{ fontSize: '12px', color: '#e8eaf0', fontWeight: '500' }}>{userName || 'You'}</span>
      </div>
    </div>
  )
}

/* ─── Main Component ─── */
export default function LiveInterview() {
  const { id: interviewId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const questions = location.state?.questions || []
  const role = location.state?.role || 'Developer'

  const [phase, setPhase] = useState('greeting')
  const [currentQ, setCurrentQ] = useState(0)
  const [submissions, setSubmissions] = useState([])
  const [finalizing, setFinalizing] = useState(false)
  const [currentScore, setCurrentScore] = useState(null)
  const [currentAnswerText, setCurrentAnswerText] = useState('')
  const [webcamError, setWebcamError] = useState(false)
  const [micMuted, setMicMuted] = useState(false)
  const [camOff, setCamOff] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 640 && window.innerWidth < 1024)
  const [showQuestion, setShowQuestion] = useState(true)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const hasGreeted = useRef(false)

  const { speak, cancel: cancelSpeech, isSpeaking } = useSpeechSynthesis()
  const { isListening, transcript, error: micError, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Start webcam
  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: { width: 1280, height: 720 }, audio: false })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => setWebcamError(true))
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()) }
  }, [])

  // Greet
  useEffect(() => {
    if (!hasGreeted.current && questions.length > 0) {
      hasGreeted.current = true
      setTimeout(() => {
        speak(`Hello ${user?.name?.split(' ')[0] || 'there'}, welcome to your mock interview for ${role}. I am your AI interviewer today. Let's begin!`, () => setTimeout(() => askQuestion(0), 500))
      }, 1000)
    }
  }, [questions])

  const askQuestion = useCallback((index) => {
    if (index >= questions.length) return
    setPhase('asking'); setCurrentQ(index); setCurrentAnswerText(''); resetTranscript(); setCurrentScore(null)
    speak(questions[index], () => setPhase('listening'))
  }, [questions, speak, resetTranscript])

  const handleStopListening = () => {
    stopListening()
    const answer = transcript.trim() || currentAnswerText.trim()
    setCurrentAnswerText(answer)
    if (!answer) { toast.error('No answer detected'); setPhase('listening'); return }
    handleSubmitAnswer(answer)
  }

  const handleSubmitAnswer = async (answerText) => {
    if (!answerText) return
    setPhase('evaluating')
    try {
      const res = await submitAnswer({ interview_id: interviewId, question_index: currentQ, question: questions[currentQ], answer: answerText })
      const score = res.data.score
      setCurrentScore(score)
      setSubmissions(prev => [...prev, { question: questions[currentQ], answer: answerText, score }])
      speak(`Good answer. You scored ${score.overall} out of 10. ${score.feedback}`, () => {
        setTimeout(() => {
          if (currentQ + 1 < questions.length) askQuestion(currentQ + 1)
          else speak("Excellent! You have completed all questions. Generating your detailed report now.", () => { setPhase('completed'); handleFinalize() })
        }, 500)
      })
    } catch { toast.error('Failed to evaluate answer'); setPhase('listening') }
  }

  const handleFinalize = async () => {
    setFinalizing(true)
    try { await completeInterview(interviewId); setTimeout(() => navigate(`/report/${interviewId}`), 2000) }
    catch { toast.error('Failed to generate report'); setFinalizing(false) }
  }

  const handleSkip = () => { if (isListening) stopListening(); cancelSpeech(); handleSubmitAnswer('[No answer provided]') }

  const toggleCam = () => {
    setCamOff(p => {
      if (streamRef.current) streamRef.current.getVideoTracks().forEach(t => t.enabled = p)
      return !p
    })
  }

  const progress = questions.length > 0 ? ((currentQ + (phase === 'completed' ? 1 : 0)) / questions.length) * 100 : 0

  if (questions.length === 0) return (
    <div style={{ minHeight: '100vh', background: '#080c14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>No questions found.</p>
        <button onClick={() => navigate('/setup')} style={{ padding: '10px 24px', borderRadius: '8px', background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer' }}>Go to Setup</button>
      </div>
    </div>
  )

  const videoLayout = isMobile ? 'column' : 'row'
  const panelH = isMobile ? '220px' : isTablet ? '280px' : '340px'

  return (
    <div style={{ height: '100vh', background: '#060810', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans','Sora',sans-serif", overflow: 'hidden' }}>

      {/* ── Top Bar ── */}
      <div style={{ background: 'rgba(13,18,32,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'blink 2s infinite' }} />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>LIVE</span>
          </div>
          {!isMobile && <span style={{ fontSize: '13px', color: '#818cf8', fontWeight: '600' }}>{role}</span>}
        </div>

        {/* Progress */}
        <div style={{ flex: 1, maxWidth: '300px', margin: '0 20px' }}>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#3b82f6,#6366f1)', width: `${progress}%`, transition: 'width 0.6s ease', borderRadius: '2px' }} />
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '4px 0 0', textAlign: 'center' }}>{phase === 'completed' ? 'Complete' : `Question ${Math.min(currentQ + 1, questions.length)} of ${questions.length}`}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Q&A dots */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {questions.map((_, i) => {
              const done = submissions[i]
              const c = done ? (done.score.overall >= 7 ? '#10b981' : done.score.overall >= 5 ? '#f59e0b' : '#ef4444') : (i === currentQ ? '#6366f1' : 'rgba(255,255,255,0.1)')
              return <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: c, transition: 'background 0.3s' }} />
            })}
          </div>
        </div>
      </div>

      {/* ── Video Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: videoLayout, gap: '8px', padding: '12px', overflow: 'hidden', minHeight: 0 }}>

        {/* AI Panel */}
        <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', position: 'relative', minHeight: isMobile ? '200px' : 'unset', border: `2px solid ${isSpeaking ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`, transition: 'border-color 0.3s', boxShadow: isSpeaking ? '0 0 30px rgba(99,102,241,0.2)' : 'none' }}>
          <RobotAvatar isSpeaking={isSpeaking} isListening={isListening} />
          {/* AI name tag */}
          <div style={{ position: 'absolute', bottom: '14px', left: '14px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isSpeaking && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8', animation: 'blink 0.7s infinite' }} />}
            <span style={{ fontSize: '12px', color: '#e8eaf0', fontWeight: '500' }}>AI Interviewer</span>
          </div>
          {/* Speaking indicator top-right */}
          {isSpeaking && (
            <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '2px', alignItems: 'flex-end', background: 'rgba(0,0,0,0.5)', padding: '6px 8px', borderRadius: '8px' }}>
              {[8,14,10,18,12].map((h, i) => <div key={i} style={{ width: '3px', borderRadius: '2px', background: '#818cf8', animation: `wave 0.5s ease ${i*0.07}s infinite alternate`, height: h + 'px' }} />)}
            </div>
          )}
        </div>

        {/* User Webcam Panel */}
        <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', position: 'relative', minHeight: isMobile ? '200px' : 'unset', border: `2px solid ${isListening ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.06)'}`, transition: 'border-color 0.3s', boxShadow: isListening ? '0 0 30px rgba(16,185,129,0.15)' : 'none' }}>
          <WebcamPanel isListening={isListening} userName={user?.name?.split(' ')[0]} webcamError={webcamError || camOff} videoRef={videoRef} />
        </div>
      </div>

      {/* ── Question Card (overlay style) ── */}
      {phase !== 'completed' && !finalizing && (
        <div style={{ flexShrink: 0, padding: '0 12px', marginBottom: '8px' }}>
          <div style={{ background: 'rgba(13,18,32,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#818cf8' }}>{currentQ + 1}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 5px 0' }}>Question</p>
              <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#f0f2f8', margin: 0, lineHeight: '1.55', fontWeight: '500' }}>{questions[currentQ]}</p>
            </div>
            {isSpeaking && (
              <div style={{ display: 'flex', gap: '2px', alignItems: 'center', flexShrink: 0 }}>
                {[...Array(4)].map((_, i) => <div key={i} style={{ width: '2px', background: '#818cf8', borderRadius: '2px', animation: `wave 0.6s ease ${i*0.09}s infinite alternate`, height: '10px' }} />)}
              </div>
            )}
          </div>

          {/* Transcript */}
          {(isListening || (currentAnswerText && phase === 'evaluating')) && (
            <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '10px 14px', marginTop: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                {isListening && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', animation: 'blink 0.8s infinite' }} />}
                <p style={{ fontSize: '10px', color: 'rgba(16,185,129,0.7)', textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>{isListening ? 'Listening...' : 'Your Answer'}</p>
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: '1.6' }}>
                {transcript || currentAnswerText || <span style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Start speaking...</span>}
              </p>
            </div>
          )}

          {/* Score feedback */}
          {phase === 'evaluating' && currentScore && (
            <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '10px 14px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#818cf8' }}>{currentScore.overall}/10</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[['Tech', currentScore.technical_knowledge], ['Comm', currentScore.communication], ['Rel', currentScore.relevance]].map(([l, v]) => (
                  <span key={l} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '6px', color: 'rgba(255,255,255,0.5)' }}>{l}: <b style={{ color: '#e8eaf0' }}>{v}</b></span>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0, fontStyle: 'italic', flex: 1, minWidth: '100%' }}>{currentScore.feedback}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Completion Screen ── */}
      {(phase === 'completed' || finalizing) && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,8,16,0.85)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            {finalizing ? <div style={{ width: '24px', height: '24px', border: '2px solid rgba(16,185,129,0.3)', borderTop: '2px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#f0f2f8', margin: '0 0 8px 0' }}>Interview Complete!</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Generating your detailed feedback report...</p>
        </div>
      )}

      {/* ── Controls Bar ── */}
      <div style={{ background: 'rgba(13,18,32,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '12px 16px' : '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '12px' : '20px', flexShrink: 0 }}>

        {/* Cam toggle */}
        <button onClick={toggleCam} title={camOff ? 'Turn camera on' : 'Turn camera off'} style={{ width: isMobile ? '42px' : '48px', height: isMobile ? '42px' : '48px', borderRadius: '50%', border: 'none', background: camOff ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.07)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={camOff ? '#ef4444' : 'rgba(255,255,255,0.6)'} strokeWidth="1.8">
            {camOff ? <><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></>}
          </svg>
        </button>

        {/* Skip */}
        <button onClick={handleSkip} disabled={phase === 'evaluating' || phase === 'asking' || isSpeaking || phase === 'completed'} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: isMobile ? '9px 16px' : '10px 22px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer', opacity: (phase === 'evaluating' || phase === 'asking' || isSpeaking || phase === 'completed') ? 0.3 : 1, transition: 'all 0.2s' }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
          {!isMobile && 'Skip'}
        </button>

        {/* Main mic button */}
        <button
          onClick={isListening ? handleStopListening : () => { if (phase !== 'listening') return; resetTranscript(); startListening() }}
          disabled={phase !== 'listening' || isSpeaking}
          style={{ width: isMobile ? '58px' : '66px', height: isMobile ? '58px' : '66px', borderRadius: '50%', border: 'none', background: isListening ? '#ef4444' : phase === 'listening' ? 'linear-gradient(135deg,#6366f1,#3b82f6)' : 'rgba(255,255,255,0.05)', boxShadow: isListening ? '0 0 0 8px rgba(239,68,68,0.15), 0 0 30px rgba(239,68,68,0.4)' : phase === 'listening' ? '0 0 0 6px rgba(99,102,241,0.15)' : 'none', cursor: (phase !== 'listening' || isSpeaking) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s', opacity: (phase !== 'listening' || isSpeaking) ? 0.45 : 1 }}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.8">
            {isListening
              ? <><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4M8 23h8"/></>
              : <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></>}
          </svg>
        </button>

        {/* Status text */}
        <div style={{ minWidth: isMobile ? '60px' : '90px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: isListening ? '#10b981' : isSpeaking ? '#818cf8' : 'rgba(255,255,255,0.25)', margin: 0, fontWeight: '500', transition: 'color 0.3s' }}>
            {phase === 'greeting' && 'Greeting...'}{phase === 'asking' && 'Listening...'}{phase === 'listening' && (isListening ? '● Recording' : 'Tap mic')}{phase === 'evaluating' && 'Evaluating...'}{phase === 'completed' && 'Done ✓'}
          </p>
        </div>

        {/* End call */}
        <button onClick={() => { cancelSpeech(); if (isListening) stopListening(); navigate('/scores') }} style={{ width: isMobile ? '42px' : '48px', height: isMobile ? '42px' : '48px', borderRadius: '50%', border: 'none', background: 'rgba(239,68,68,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth="2">
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.43 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.34 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.32 9.88"/>
            <line x1="23" y1="1" x2="1" y2="23" stroke="#ef4444" strokeWidth="2"/>
          </svg>
        </button>
      </div>

      {micError && (
        <div style={{ position: 'absolute', bottom: '90px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '8px 16px', zIndex: 20 }}>
          <p style={{ fontSize: '12px', color: '#fca5a5', margin: 0 }}>{micError}</p>
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes wave{from{height:4px}to{height:var(--h,18px)}}
        @keyframes borderPulse{0%,100%{opacity:0.5}50%{opacity:1}}
      `}</style>
    </div>
  )
}