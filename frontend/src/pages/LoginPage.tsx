import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, ShieldCheck, User, Lock, KeyRound } from "lucide-react"

export function LoginPage() {
  const location = useLocation()
  const isInitiallyAdmin = location.pathname.includes('/admin') || location.search.includes('admin')
  
  const [isAdminMode, setIsAdminMode] = useState(isInitiallyAdmin)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { initialize } = useAuthStore()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError || !data.user) {
        setError(signInError?.message || "Invalid email or password")
        setLoading(false)
        return
      }

      // If Admin Login mode, verify user is an admin
      if (isAdminMode) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single()

        if (profileError || profile?.role !== "admin") {
          // Revert session since user lacks admin authorization
          await supabase.auth.signOut()
          setError("Access Denied: This account is not authorized as an administrator. Please switch to Student Login.")
          setLoading(false)
          return
        }

        await initialize()
        setLoading(false)
        navigate("/admin")
        return
      }

      // Normal Student Login
      await initialize()
      setLoading(false)
      navigate("/")
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during sign-in")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-6 sm:p-8">
        
        {/* Login Mode Tabs: Student vs Admin */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setIsAdminMode(false);
              setError("");
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              !isAdminMode 
                ? "bg-white text-blue-700 shadow-2xs font-bold" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Student Login
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdminMode(true);
              setError("");
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              isAdminMode 
                ? "bg-white text-purple-700 shadow-2xs font-bold" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            Admin Login
          </button>
        </div>

        {/* Header Branding */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className={`p-3.5 rounded-2xl mb-3 ${isAdminMode ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
            {isAdminMode ? (
              <ShieldCheck className="h-8 w-8" />
            ) : (
              <BookOpen className="h-8 w-8" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAdminMode ? "Admin Portal" : "Welcome Back"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdminMode 
              ? "Sign in with platform administrator credentials" 
              : "Sign in to your AI Study Companion workspace"}
          </p>
        </div>

        {/* Quick Demo & Testing Credentials Card */}
        <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-500" /> Demo & Testing Accounts
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Click to auto-fill</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Student Account */}
            <button
              type="button"
              onClick={() => {
                setIsAdminMode(false);
                setEmail("chintukotti79@gmail.com");
                setPassword("adminn");
                setError("");
              }}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                !isAdminMode && email === "chintukotti79@gmail.com"
                  ? "bg-blue-50/80 border-blue-300 ring-1 ring-blue-300 shadow-2xs"
                  : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-blue-700 flex items-center gap-1">
                  <User className="w-3 h-3 text-blue-600" /> Student
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.5 rounded">Auto-fill</span>
              </div>
              <p className="text-[11px] text-slate-700 truncate font-mono">chintukotti79@gmail.com</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Password: <span className="font-mono font-semibold text-slate-800">adminn</span></p>
            </button>

            {/* Admin Account */}
            <button
              type="button"
              onClick={() => {
                setIsAdminMode(true);
                setEmail("chintukotti78@gmail.com");
                setPassword("adminn");
                setError("");
              }}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                isAdminMode && email === "chintukotti78@gmail.com"
                  ? "bg-purple-50/80 border-purple-300 ring-1 ring-purple-300 shadow-2xs"
                  : "bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-purple-700 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-purple-600" /> Admin
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-700 font-semibold px-1.5 py-0.5 rounded">Auto-fill</span>
              </div>
              <p className="text-[11px] text-slate-700 truncate font-mono">chintukotti78@gmail.com</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Password: <span className="font-mono font-semibold text-slate-800">adminn</span></p>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-medium mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-slate-700">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder={isAdminMode ? "admin@example.com" : "student@example.com"} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10"
              required 
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium text-slate-700">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10"
              required 
            />
          </div>

          <Button 
            type="submit" 
            className={`w-full h-10 font-semibold text-white transition-colors ${
              isAdminMode 
                ? "bg-purple-600 hover:bg-purple-700" 
                : "bg-blue-600 hover:bg-blue-700"
            }`} 
            disabled={loading}
          >
            {loading ? "Verifying..." : isAdminMode ? "Sign In as Administrator" : "Sign In to Workspace"}
          </Button>
        </form>

        {/* Footer Actions */}
        {isAdminMode ? (
          <div className="mt-6 pt-4 border-t text-center text-xs text-slate-400">
            <p>Admin privileges are assigned in the Supabase database.</p>
            <p className="mt-1">
              Need to test student features?{" "}
              <button 
                type="button" 
                onClick={() => { setIsAdminMode(false); setError(""); }}
                className="text-purple-600 hover:underline font-semibold"
              >
                Switch to Student Login
              </button>
            </p>
          </div>
        ) : (
          <div className="mt-6 pt-4 border-t text-center text-xs sm:text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:underline font-semibold">
              Sign up here
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
