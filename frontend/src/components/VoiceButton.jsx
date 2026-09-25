import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Square } from 'lucide-react'
import { useSpeechRecognition } from '../utils/useSpeech'
import { transcribeAudio } from '../services/api'
import { toast } from 'sonner'

/**
 * Voice input button. Prefers the browser's native SpeechRecognition API;
 * if unsupported, falls back to recording audio and sending it to the
 * FastAPI /api/speech/transcribe endpoint (Groq Whisper).
 */
export default function VoiceButton({ onResult, label = 'Ask by Voice' }) {
  const native = useSpeechRecognition()
  const [fallbackRecording, setFallbackRecording] = useState(false)
  const [fallbackBusy, setFallbackBusy] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  useEffect(() => {
    if (!native.listening && native.transcript) {
      onResult?.(native.transcript)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native.listening])

  useEffect(() => {
    if (native.error === 'permission-denied') {
      toast.error('Microphone permission denied. Please allow mic access to use voice input.')
    }
  }, [native.error])

  async function startFallbackRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        setFallbackBusy(true)
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach((t) => t.stop())
        try {
          const text = await transcribeAudio(blob)
          onResult?.(text)
        } catch (err) {
          toast.error(err.message)
        } finally {
          setFallbackBusy(false)
        }
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setFallbackRecording(true)
    } catch {
      toast.error('Microphone permission denied. Please allow mic access to use voice input.')
    }
  }

  function stopFallbackRecording() {
    mediaRecorderRef.current?.stop()
    setFallbackRecording(false)
  }

  if (native.supported) {
    return (
      <button
        type="button"
        onClick={native.listening ? native.stop : native.start}
        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
          native.listening ? 'bg-rose-500 text-white' : 'btn-secondary'
        }`}
      >
        {native.listening ? <Square size={16} /> : <Mic size={16} />}
        {native.listening ? 'Listening... tap to stop' : `🎙 ${label}`}
      </button>
    )
  }

  // Fallback: MediaRecorder + backend transcription
  if (!navigator.mediaDevices) {
    return (
      <button type="button" disabled className="flex items-center gap-2 btn-secondary opacity-60">
        <MicOff size={16} /> Voice not supported on this browser
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={fallbackRecording ? stopFallbackRecording : startFallbackRecording}
      disabled={fallbackBusy}
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
        fallbackRecording ? 'bg-rose-500 text-white' : 'btn-secondary'
      }`}
    >
      {fallbackRecording ? <Square size={16} /> : <Mic size={16} />}
      {fallbackBusy ? 'Transcribing...' : fallbackRecording ? 'Recording... tap to stop' : `🎙 ${label}`}
    </button>
  )
}
