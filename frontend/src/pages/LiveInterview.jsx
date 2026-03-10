import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { submitAnswer, completeInterview, getGreeting, getIntroResponse } from '../services/api'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

function RobotAvatar({ isSpeaking, isListening }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#0d1220' }}>
      <img src="/AiHr-image.webp" alt="AI Interviewer" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
      <div style={{ position: 'absolute', inset: 0, background: isSpeaking ? 'rgba(99,102,241,0.08)' : isListening ? 'rgba(16,185,129,0.06)' : 'transparent', transition: 'background 0.4s ease', pointerEvents: 'none' }} />
      {isSpeaking && (
        <div style={{ position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px', alignItems: 'flex-end', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', padding: '8px 14px', borderRadius: '20px', border: '1px solid rgba(99,102,241,0.3)' }}>
          {[10,18,14,22,16,12,20,15,11,17].map((h,i) => (
            <div key={i} style={{ width: '3px', borderRadius: '3px', background: '#818cf8', animation: `wave 0.5s ease-in-out ${i*0.07}s infinite alternate`, height: h+'px' }} />
          ))}
        </div>
      )}
    </div>
  )
}

function WebcamPanel({ isListening, userName, webcamError, videoRef }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0d14', overflow: 'hidden' }}>
      <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: webcamError ? 'none' : 'block' }} />
      {webcamError && (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,#0d1220,#111827)', gap: '12px' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/><line x1="1" y1="1" x2="23" y2="23" stroke="rgba(239,68,68,0.6)" strokeWidth="2"/></svg>
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '0 20px' }}>Camera unavailable</p>
        </div>
      )}
      {isListening && <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(16,185,129,0.5)', borderRadius: 'inherit', animation: 'borderPulse 1.5s ease-in-out infinite', pointerEvents: 'none' }} />}
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {isListening && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'blink 1s infinite' }} />}
        <span style={{ fontSize: '12px', color: '#e8eaf0', fontWeight: '500' }}>{userName || 'You'}</span>
      </div>
    </div>
  )
}

export default function LiveInterview() {
  const { id: interviewId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const questions = location.state?.questions || []
  const role = location.state?.role || 'Developer'
  const difficulty = location.state?.difficulty || 'intermediate'

  // phases: 'init' | 'greeting' | 'intro_listening' | 'intro_response' | 'asking' | 'listening' | 'evaluating' | 'completed'
  const [phase, setPhase] = useState('init')
  const [currentQ, setCurrentQ] = useState(0)
  const [submissions, setSubmissions] = useState([])
  const [finalizing, setFinalizing] = useState(false)
  const [currentScore, setCurrentScore] = useState(null)
  const [currentAnswerText, setCurrentAnswerText] = useState('')
  const [webcamError, setWebcamError] = useState(false)
  const [camOff, setCamOff] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const [isTablet, setIsTablet] = useState(window.innerWidth < 1024)
  const [displayText, setDisplayText] = useState('')
  const [introTranscript, setIntroTranscript] = useState('')

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const phaseRef = useRef('init')
  const introRef = useRef('')

  const { speak, cancel: cancelSpeech, isSpeaking } = useSpeechSynthesis()
  const { transcript, isListening, startListening, stopListening, resetTranscript, error: micError } = useSpeechRecognition()

  useEffect(() => { phaseRef.current = phase }, [phase])

  useEffect(() => {
    const onResize = () => { setIsMobile(window.innerWidth < 640); setIsTablet(window.innerWidth < 1024) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Webcam
  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
      .then(stream => { streamRef.current = stream; if (videoRef.current) videoRef.current.srcObject = stream })
      .catch(() => setWebcamError(true))
    return () => streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  // Greeting on mount
  useEffect(() => {
    if (questions.length === 0) return
    startGreeting()
  }, [])

  const startGreeting = async () => {
    setPhase('greeting')
    try {
      const res = await getGreeting({
        user_name: user?.name?.split(' ')[0] || 'there',
        role, difficulty
      })
      const greetingText = res.data.greeting
      setDisplayText(greetingText)
      speak(greetingText, () => {
        setPhase('intro_listening')
        setDisplayText("Please introduce yourself — tell me about your background and experience.")
        resetTranscript()
        startListening()
      })
    } catch {
      const fallback = `Good morning ${user?.name?.split(' ')[0] || 'there'}! Welcome to your ${role} mock interview. Please introduce yourself and tell me about your background.`
      setDisplayText(fallback)
      speak(fallback, () => {
        setPhase('intro_listening')
        setDisplayText("Please introduce yourself — tell me about your background and experience.")
        resetTranscript()
        startListening()
      })
    }
  }

  // Handle intro listening
  useEffect(() => {
    if (phase === 'intro_listening') {
      introRef.current = transcript
      setIntroTranscript(transcript)
    }
  }, [transcript, phase])

  const handleStopIntro = async () => {
    stopListening()
    const intro = introRef.current || transcript || "I have experience in software development."
    setIntroTranscript(intro)
    setPhase('intro_response')
    setDisplayText("Thank you for sharing that...")

    try {
      const res = await getIntroResponse({
        user_intro: intro,
        user_name: user?.name?.split(' ')[0] || 'there',
        role
      })
      const responseText = res.data.response
      setDisplayText(responseText)
      speak(responseText, () => {
        setPhase('asking')
        askQuestion(0)
      })
    } catch {
      const fallback = `Thank you! That's great background. Now let's move to the 5 technical questions for the ${role} role.`
      setDisplayText(fallback)
      speak(fallback, () => {
        setPhase('asking')
        askQuestion(0)
      })
    }
  }

  const askQuestion = useCallback((qIndex) => {
    if (qIndex >= questions.length) { finishInterview(); return }
    setCurrentQ(qIndex)
    setCurrentScore(null)
    setCurrentAnswerText('')
    resetTranscript()
    const q = questions[qIndex]
    setDisplayText(q)
    setPhase('asking')
    speak(q, () => { setPhase('listening') })
  }, [questions])

  const handleStopListening = useCallback(async () => {
    stopListening()
    const answer = transcript || currentAnswerText || ''
    setCurrentAnswerText(answer)
    setPhase('evaluating')
    setDisplayText("Evaluating your answer...")

    try {
      const res = await submitAnswer({
        interview_id: interviewId,
        question_index: currentQ,
        question: questions[currentQ],
        answer,
      })
      const score = res.data
      setCurrentScore(score)

      const feedbackMsg = `You scored ${score.overall} out of 10. ${score.feedback}`
      setDisplayText(feedbackMsg)
      speak(feedbackMsg, () => {
        const nextQ = currentQ + 1
        if (nextQ >= questions.length) { finishInterview() }
        else { askQuestion(nextQ) }
      })
    } catch {
      toast.error('Failed to evaluate answer')
      const nextQ = currentQ + 1
      if (nextQ >= questions.length) finishInterview()
      else askQuestion(nextQ)
    }
  }, [transcript, currentAnswerText, currentQ, questions, interviewId])

  const handleSkip = useCallback(() => {
    if (phase !== 'listening') return
    stopListening()
    const nextQ = currentQ + 1
    if (nextQ >= questions.length) finishInterview()
    else askQuestion(nextQ)
  }, [phase, currentQ, questions])

  const finishInterview = async () => {
    setPhase('completed')
    setFinalizing(true)
    const doneMsg = "Excellent! You've completed all questions. I'm now generating your detailed feedback report."
    setDisplayText(doneMsg)
    speak(doneMsg)
    try {
      await completeInterview(interviewId)
      setTimeout(() => navigate(`/report/${interviewId}`), 3500)
    } catch {
      setTimeout(() => navigate(`/report/${interviewId}`), 2000)
    }
  }

  const toggleCam = () => {
    setCamOff(p => {
      if (streamRef.current) streamRef.current.getVideoTracks().forEach(t => t.enabled = p)
      return !p
    })
  }

  const progress = questions.length > 0 ? ((currentQ + (['completed'].includes(phase) ? 1 : 0)) / questions.length) * 100 : 0

  const getStatusText = () => {
    if (phase === 'init') return 'Starting...'
    if (phase === 'greeting') return 'AI Speaking...'
    if (phase === 'intro_listening') return isListening ? '● Recording Intro' : 'Tap mic to speak'
    if (phase === 'intro_response') return 'AI Responding...'
    if (phase === 'asking') return 'Listening...'
    if (phase === 'listening') return isListening ? '● Recording' : 'Tap mic'
    if (phase === 'evaluating') return 'Evaluating...'
    if (phase === 'completed') return 'Done ✓'
    return ''
  }

  const getStatusColor = () => {
    if (isListening) return '#10b981'
    if (isSpeaking) return '#818cf8'
    return 'rgba(255,255,255,0.25)'
  }

  const isIntroPhase = phase === 'intro_listening'
  const canPressMic = phase === 'listening' && !isSpeaking
  const canPressIntroMic = phase === 'intro_listening'
  const micActive = isListening

  if (questions.length === 0) return (
    <div style={{ minHeight: '100vh', background: '#080c14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>No questions found.</p>
        <button onClick={() => navigate('/setup')} style={{ padding: '10px 24px', borderRadius: '8px', background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer' }}>Go to Setup</button>
      </div>
    </div>
  )

  return (
    <div style={{ height: '100vh', background: '#060810', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans',sans-serif", overflow: 'hidden' }}>

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
          {/* Phase badge */}
          {(phase === 'greeting' || phase === 'intro_listening' || phase === 'intro_response') && (
            <span style={{ fontSize: '11px', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', padding: '2px 10px', borderRadius: '20px', fontWeight: '600' }}>
              {phase === 'greeting' ? 'Greeting' : phase === 'intro_listening' ? 'Introduction' : 'AI Responding'}
            </span>
          )}
        </div>

        <div style={{ flex: 1, maxWidth: '300px', margin: '0 20px' }}>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#3b82f6,#6366f1)', width: `${progress}%`, transition: 'width 0.6s ease', borderRadius: '2px' }} />
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '4px 0 0', textAlign: 'center' }}>
            {['greeting','intro_listening','intro_response'].includes(phase) ? 'Introduction phase' : phase === 'completed' ? 'Complete' : `Question ${Math.min(currentQ+1,questions.length)} of ${questions.length}`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {questions.map((_,i) => {
            const done = submissions[i]
            const c = done ? (done.score?.overall >= 7 ? '#10b981' : done.score?.overall >= 5 ? '#f59e0b' : '#ef4444') : (i === currentQ && !['greeting','intro_listening','intro_response'].includes(phase) ? '#6366f1' : 'rgba(255,255,255,0.1)')
            return <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: c, transition: 'background 0.3s' }} />
          })}
        </div>
      </div>

      {/* ── Video Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px', padding: '12px', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', position: 'relative', minHeight: isMobile ? '200px' : 'unset', border: `2px solid ${isSpeaking ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`, transition: 'border-color 0.3s', boxShadow: isSpeaking ? '0 0 30px rgba(99,102,241,0.2)' : 'none' }}>
          <RobotAvatar isSpeaking={isSpeaking} isListening={isListening} />
          <div style={{ position: 'absolute', bottom: '14px', left: '14px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isSpeaking && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8', animation: 'blink 0.7s infinite' }} />}
            <span style={{ fontSize: '12px', color: '#e8eaf0', fontWeight: '500' }}>AI Interviewer</span>
          </div>
          {isSpeaking && (
            <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '2px', alignItems: 'flex-end', background: 'rgba(0,0,0,0.5)', padding: '6px 8px', borderRadius: '8px' }}>
              {[8,14,10,18,12].map((h,i) => <div key={i} style={{ width: '3px', borderRadius: '2px', background: '#818cf8', animation: `wave 0.5s ease ${i*0.07}s infinite alternate`, height: h+'px' }} />)}
            </div>
          )}
        </div>

        <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', position: 'relative', minHeight: isMobile ? '200px' : 'unset', border: `2px solid ${isListening ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.06)'}`, transition: 'border-color 0.3s', boxShadow: isListening ? '0 0 30px rgba(16,185,129,0.15)' : 'none' }}>
          <WebcamPanel isListening={isListening} userName={user?.name?.split(' ')[0]} webcamError={webcamError || camOff} videoRef={videoRef} />
        </div>
      </div>

      {/* ── Chat/Question Card ── */}
      {phase !== 'completed' && !finalizing && (
        <div style={{ flexShrink: 0, padding: '0 12px', marginBottom: '8px' }}>
          {/* AI message bubble */}
          <div style={{ background: 'rgba(13,18,32,0.92)', backdropFilter: 'blur(12px)', border: `1px solid ${['greeting','intro_response'].includes(phase) ? 'rgba(251,191,36,0.25)' : 'rgba(99,102,241,0.2)'}`, borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: ['greeting','intro_response'].includes(phase) ? 'rgba(251,191,36,0.15)' : 'rgba(99,102,241,0.2)', border: `1px solid ${['greeting','intro_response'].includes(phase) ? 'rgba(251,191,36,0.3)' : 'rgba(99,102,241,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {['greeting','intro_response'].includes(phase)
                ? <span style={{ fontSize: '13px' }}>🤖</span>
                : <span style={{ fontSize: '11px', fontWeight: '700', color: '#818cf8' }}>{currentQ+1}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 5px 0' }}>
                {['greeting','intro_response'].includes(phase) ? 'AI Interviewer' : phase === 'intro_listening' ? 'Waiting for your introduction' : 'Question'}
              </p>
              <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#f0f2f8', margin: 0, lineHeight: '1.55', fontWeight: '500' }}>{displayText}</p>
            </div>
            {isSpeaking && (
              <div style={{ display: 'flex', gap: '2px', alignItems: 'center', flexShrink: 0 }}>
                {[...Array(4)].map((_,i) => <div key={i} style={{ width: '2px', background: '#818cf8', borderRadius: '2px', animation: `wave 0.6s ease ${i*0.09}s infinite alternate`, height: '10px' }} />)}
              </div>
            )}
          </div>

          {/* User intro transcript */}
          {phase === 'intro_listening' && (
            <div style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px', padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                {isListening && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', animation: 'blink 0.8s infinite' }} />}
                <p style={{ fontSize: '10px', color: 'rgba(251,191,36,0.7)', textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>{isListening ? 'Listening to your intro...' : 'Your Introduction'}</p>
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: '1.6' }}>
                {introTranscript || transcript || <span style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Start speaking about yourself...</span>}
              </p>
              {isListening && introTranscript.length > 20 && (
                <button onClick={handleStopIntro} style={{ marginTop: '8px', padding: '6px 16px', borderRadius: '8px', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                  Done, start interview →
                </button>
              )}
            </div>
          )}

          {/* Regular answer transcript */}
          {(isListening || (currentAnswerText && phase === 'evaluating')) && phase !== 'intro_listening' && (
            <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                {isListening && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', animation: 'blink 0.8s infinite' }} />}
                <p style={{ fontSize: '10px', color: 'rgba(16,185,129,0.7)', textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>{isListening ? 'Listening...' : 'Your Answer'}</p>
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: '1.6' }}>
                {transcript || currentAnswerText || <span style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Start speaking...</span>}
              </p>
            </div>
          )}

          {/* Score card */}
          {phase === 'evaluating' && currentScore && (
            <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '10px 14px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#818cf8' }}>{currentScore.overall}/10</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[['Tech', currentScore.technical_knowledge],['Comm', currentScore.communication],['Rel', currentScore.relevance]].map(([l,v]) => (
                  <span key={l} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '6px', color: 'rgba(255,255,255,0.5)' }}>{l}: <b style={{ color: '#e8eaf0' }}>{v}</b></span>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0, fontStyle: 'italic', flex: 1, minWidth: '100%' }}>{currentScore.feedback}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Completion Overlay ── */}
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

        <button onClick={toggleCam} style={{ width: isMobile ? '42px' : '48px', height: isMobile ? '42px' : '48px', borderRadius: '50%', border: 'none', background: camOff ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.07)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={camOff ? '#ef4444' : 'rgba(255,255,255,0.6)'} strokeWidth="1.8">
            {camOff ? <><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></>}
          </svg>
        </button>

        {/* Skip — only for question phase */}
        {!['greeting','intro_listening','intro_response'].includes(phase) && (
          <button onClick={handleSkip} disabled={phase !== 'listening'} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: isMobile ? '9px 16px' : '10px 22px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer', opacity: phase !== 'listening' ? 0.3 : 1 }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
            {!isMobile && 'Skip'}
          </button>
        )}

        {/* Main mic */}
        <button
          onClick={() => {
            if (isIntroPhase) {
              if (isListening) handleStopIntro()
              else { resetTranscript(); startListening() }
            } else {
              if (isListening) handleStopListening()
              else if (canPressMic) { resetTranscript(); startListening() }
            }
          }}
          disabled={!canPressMic && !canPressIntroMic && !isListening}
          style={{ width: isMobile ? '58px' : '66px', height: isMobile ? '58px' : '66px', borderRadius: '50%', border: 'none', background: micActive ? '#ef4444' : (canPressMic || canPressIntroMic) ? 'linear-gradient(135deg,#6366f1,#3b82f6)' : 'rgba(255,255,255,0.05)', boxShadow: micActive ? '0 0 0 8px rgba(239,68,68,0.15),0 0 30px rgba(239,68,68,0.4)' : (canPressMic || canPressIntroMic) ? '0 0 0 6px rgba(99,102,241,0.15)' : 'none', cursor: (!canPressMic && !canPressIntroMic && !isListening) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s', opacity: (!canPressMic && !canPressIntroMic && !isListening) ? 0.45 : 1 }}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.8">
            {micActive ? <><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4M8 23h8"/></> : <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></>}
          </svg>
        </button>

        <div style={{ minWidth: isMobile ? '60px' : '90px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: getStatusColor(), margin: 0, fontWeight: '500', transition: 'color 0.3s' }}>{getStatusText()}</p>
        </div>

        <button onClick={() => { cancelSpeech(); if (isListening) stopListening(); navigate('/scores') }} style={{ width: isMobile ? '42px' : '48px', height: isMobile ? '42px' : '48px', borderRadius: '50%', border: 'none', background: 'rgba(239,68,68,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth="2"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.43 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.34 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.32 9.88"/><line x1="23" y1="1" x2="1" y2="23" stroke="#ef4444" strokeWidth="2"/></svg>
        </button>
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes wave{from{height:4px}to{height:18px}}
        @keyframes borderPulse{0%,100%{opacity:0.5}50%{opacity:1}}
      `}</style>
    </div>
  )
}