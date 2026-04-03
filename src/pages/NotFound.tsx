import { useNavigate } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageTransition } from '@/components/layout/PageTransition'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <PageTransition className="min-h-screen bg-bg flex flex-col items-center justify-center text-center p-8 gap-6">
      <div className="w-14 h-14 rounded-xl bg-bg-elevated border border-border flex items-center justify-center">
        <Activity size={28} className="text-text-3" />
      </div>
      <div>
        <h1 className="text-text-1 text-2xl font-bold">Page not found</h1>
        <p className="text-text-2 text-sm mt-2">The page you're looking for doesn't exist.</p>
      </div>
      <Button onClick={() => navigate('/')}>Return Home</Button>
    </PageTransition>
  )
}
