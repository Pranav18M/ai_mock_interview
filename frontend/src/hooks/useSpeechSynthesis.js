import { useState, useRef, useCallback } from 'react'

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef(null)

  const speak = useCallback((text, onEnd) => {
    if (!window.speechSynthesis) {
      console.warn('SpeechSynthesis not supported')
      onEnd?.()
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utteranceRef.current = utterance

    // Select a good voice
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(
      (v) =>
        v.name.includes('Google US English') ||
        v.name.includes('Samantha') ||
        v.name.includes('Alex') ||
        v.lang === 'en-US'
    )
    if (preferred) utterance.voice = preferred

    utterance.rate = 0.95
    utterance.pitch = 1.0
    utterance.volume = 1.0

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => {
      setIsSpeaking(false)
      onEnd?.()
    }
    utterance.onerror = () => {
      setIsSpeaking(false)
      onEnd?.()
    }

    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }, [])

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }, [])

  return { speak, cancel, isSpeaking }
}