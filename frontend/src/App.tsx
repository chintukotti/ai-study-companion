import { useEffect } from "react"
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
// Pages
// Layout
import { AppShell } from "@/components/layout/AppShell"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { SpacesPage } from "@/pages/SpacesPage"
import { SpaceDetailPage } from "@/pages/SpaceDetailPage"
import { ProjectWorkspacePage } from "@/pages/ProjectWorkspacePage"
import { AdminDashboardPage } from "@/pages/AdminDashboardPage"

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, profile, loading } = useAuthStore()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (adminOnly && profile?.role !== "admin") {
    return <Navigate to="/" />
  }

  return <>{children}</>
}

export default function App() {
  const { initialize, initialized } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!initialized) {
    return <div className="min-h-screen flex items-center justify-center">Initializing...</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="spaces" element={<SpacesPage />} />
          <Route path="spaces/:spaceId" element={<SpaceDetailPage />} />
          <Route path="projects/:projectId/*" element={<ProjectWorkspacePage />} />
          <Route path="admin" element={
            <ProtectedRoute adminOnly>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
