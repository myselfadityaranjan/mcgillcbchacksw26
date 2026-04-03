import { lazy, Suspense } from 'react'
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/Spinner'

// Code-split every page — each chunk only loads when needed
const Landing = lazy(() => import('@/pages/Landing'))
const CameraSetup = lazy(() => import('@/pages/CameraSetup'))
const Assessment = lazy(() => import('@/pages/Assessment'))
const Analyzing = lazy(() => import('@/pages/Analyzing'))
const Results = lazy(() => import('@/pages/Results'))
const DrillDetail = lazy(() => import('@/pages/DrillDetail'))
const Coaching = lazy(() => import('@/pages/Coaching'))
const SessionComplete = lazy(() => import('@/pages/SessionComplete'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
)

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: withSuspense(Landing) },
      { path: '/setup', element: withSuspense(CameraSetup) },
      { path: '/scan', element: withSuspense(Assessment) },
      { path: '/analyzing', element: withSuspense(Analyzing) },
      { path: '/results', element: withSuspense(Results) },
      { path: '/drill/:drillId', element: withSuspense(DrillDetail) },
      { path: '/coach/:drillId', element: withSuspense(Coaching) },
      { path: '/complete', element: withSuspense(SessionComplete) },
      { path: '*', element: withSuspense(NotFound) },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
