import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useUiStore } from '@/store'
import { cn } from '@/lib/cn'
import type { ToastType } from '@/store'

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} className="text-success" />,
  error: <AlertCircle size={16} className="text-danger" />,
  warning: <AlertTriangle size={16} className="text-warning" />,
  info: <Info size={16} className="text-brand" />,
}

const borderMap: Record<ToastType, string> = {
  success: 'border-success/25',
  error: 'border-danger/25',
  warning: 'border-warning/25',
  info: 'border-brand/25',
}

export function ToastContainer() {
  const { toasts, removeToast } = useUiStore()

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            durationMs={toast.durationMs}
            onDismiss={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({
  id,
  message,
  type,
  durationMs,
  onDismiss,
}: {
  id: string
  message: string
  type: ToastType
  durationMs: number
  onDismiss: (id: string) => void
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), durationMs)
    return () => clearTimeout(timer)
  }, [id, durationMs, onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, x: 48, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 48, scale: 0.96 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'pointer-events-auto',
        'bg-bg-elevated border rounded-lg px-3 py-2.5',
        'flex items-start gap-2.5 shadow-surface',
        borderMap[type]
      )}
    >
      <span className="shrink-0 mt-0.5">{iconMap[type]}</span>
      <p className="flex-1 text-sm text-text-1 leading-snug">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 text-text-3 hover:text-text-1 transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}
