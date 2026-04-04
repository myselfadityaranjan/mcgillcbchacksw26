import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ToastContainer } from './ToastContainer'

/** Root layout wrapper — provides toast infrastructure and global styles */
export function AppShell() {
  return (
    <div className="min-h-screen bg-bg text-text-1 font-sans antialiased">
      <Outlet />
      <ToastContainer />
      {/* react-hot-toast fallback (we use our own, but keep as safety net) */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            color: '#1C1810',
            border: '1px solid rgba(161,143,114,0.22)',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(100,80,50,0.10)',
            fontSize: '13px',
          },
        }}
      />
    </div>
  )
}
