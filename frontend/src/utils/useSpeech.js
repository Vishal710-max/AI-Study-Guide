import { useRef, useState, useCallback, useEffect } from 'react'

// ---- Text to speech (browser window.speechSynthesis) ----
export function useTextToSpeech(defaultRate = 1) {
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const utterRef = useRef(null)

  const speak = useCallback((text, rate = defaultRate) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = rate
    utter.onend = () => { setSpeaking(false); setPaused(false) }
    utter.onerror = () => { setSpeaking(false); setPaused(false) }
    utterRef.current = utter
    window.speechSynthesis.speak(utter)
    setSpeaking(true)
    setPaused(false)
  }, [defaultRate])

  const pause = useCallback(() => {
    window.speechSynthesis?.pause()
    setPaused(true)
  }, [])

  const resume = useCallback(() => {
    window.speechSynthesis?.resume()
    setPaused(false)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
    setPaused(false)
  }, [])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  return { speak, pause, resume, stop, speaking, paused, supported: 'speechSynthesis' in window }
}

// ---- Speech to text (browser SpeechRecognition, with graceful fallback flag) ----
export function useSpeechRecognition() {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)

  const SpeechRecognitionImpl = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null

  const start = useCallback(() => {
    setError(null)
    setTranscript('')
    if (!SpeechRecognitionImpl) {
      setError('unsupported')
      return
    }
    const recognition = new SpeechRecognitionImpl()
    recognition.lang = 'en-IN'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onresult = (event) => {
      let finalText = ''
      for (let i = 0; i < event.results.length; i++) {
        finalText += event.results[i][0].transcript
      }
      setTranscript(finalText)
    }
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setError('permission-denied')
      } else {
        setError(event.error)
      }
      setListening(false)
    }
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [SpeechRecognitionImpl])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return {
    start, stop, listening, transcript, error,
    supported: !!SpeechRecognitionImpl,
    setTranscript,
  }
}
