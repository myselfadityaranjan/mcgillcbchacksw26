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
            background: '#161B27',
            color: '#E8EDF8',
            border: '1px solid rgba(99, 120, 186, 0.25)',
            borderRadius: '10px',
          },
        }}
      />
    </div>
  )
}
