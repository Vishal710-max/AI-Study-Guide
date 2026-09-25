import { useRef, useState } from 'react'
import { UploadCloud, FileCheck2, AlertTriangle } from 'lucide-react'
import { extractPdf } from '../services/api'
import { toast } from 'sonner'

const STATES = {
  idle: null,
  uploading: 'Uploading...',
  extracting: 'Extracting text...',
  preparing: 'Preparing study material...',
  ready: 'Ready ✓',
}

export default function PDFUpload({ onExtracted }) {
  const inputRef = useRef(null)
  const [state, setState] = useState('idle')
  const [error, setError] = useState(null)
  const [warning, setWarning] = useState(null)

  async function handleFile(file) {
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file.')
      return
    }
    setError(null)
    setWarning(null)
    setState('uploading')
    try {
      setState('extracting')
      const result = await extractPdf(file)
      setState('preparing')
      if (result.looksScanned) {
        setWarning('This PDF appears to contain scanned pages. Text extraction may not work correctly.')
      }
      setState('ready')
      onExtracted?.(result)
      toast.success('Study material ready!')
    } catch (err) {
      setError(err.message || 'Unable to read this PDF. Please upload another file.')
      setState('idle')
    }
  }

  return (
    <div>
      <div
        className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl2 p-6 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50/40 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFile(e.dataTransfer.files?.[0])
        }}
      >
        {state === 'ready' ? (
          <div className="flex flex-col items-center gap-2 text-emerald-600">
            <FileCheck2 size={28} />
            <p className="text-sm font-medium">Ready ✓ — click to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <UploadCloud size={28} />
            <p className="text-sm">
              {STATES[state] || 'Click or drag a PDF here to upload your study material'}
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {warning && (
        <p className="mt-2 text-xs text-amber-600 flex items-center gap-1"><AlertTriangle size={13} /> {warning}</p>
      )}
      {error && (
        <p className="mt-2 text-xs text-rose-600 flex items-center gap-1"><AlertTriangle size={13} /> {error}</p>
      )}
    </div>
  )
}
