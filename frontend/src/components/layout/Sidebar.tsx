import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import { 
  BookOpen, 
  LayoutDashboard, 
  Library, 
  FileText, 
  MessageSquare, 
  HelpCircle, 
  GraduationCap, 
  BarChart, 
  LogOut,
  ChevronDown,
  ShieldCheck,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, logout } = useAuthStore()

  // Match routes to highlight sidebar items
  const isDashboard = location.pathname === "/"
  const isSpaces = location.pathname.startsWith("/spaces")
  const isProject = location.pathname.startsWith("/projects/")
  const isAdmin = location.pathname.startsWith("/admin")
  
  const projectId = isProject ? location.pathname.split("/")[2] : null

  return (
    <div className="flex flex-col h-full border-r bg-white w-64 md:w-64 flex-shrink-0">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-500" />
          <span className="font-bold text-lg text-slate-800">AI Study Tutor</span>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="md:hidden p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <ScrollArea className="flex-1 py-4">
        <div className="px-3 space-y-1">
          <Link to="/" onClick={() => onClose?.()}>
            <Button variant={isDashboard ? "secondary" : "ghost"} className={cn("w-full justify-start", isDashboard && "bg-blue-50 text-blue-600 font-semibold")}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link to="/spaces" onClick={() => onClose?.()}>
            <Button variant={isSpaces ? "secondary" : "ghost"} className={cn("w-full justify-start", isSpaces && "bg-blue-50 text-blue-600 font-semibold")}>
              <Library className="mr-2 h-4 w-4" />
              My Spaces
            </Button>
          </Link>

          {profile?.role === "admin" && (
            <Link to="/admin" onClick={() => onClose?.()}>
              <Button 
                variant={isAdmin ? "secondary" : "ghost"} 
                className={cn(
                  "w-full justify-start font-medium", 
                  isAdmin 
                    ? "bg-purple-100 text-purple-800 font-semibold shadow-2xs" 
                    : "text-slate-700 hover:text-purple-700 hover:bg-purple-50"
                )}
              >
                <ShieldCheck className="mr-2 h-4 w-4 text-purple-600" />
                Admin Dashboard
              </Button>
            </Link>
          )}
        </div>

        {projectId && (
          <div className="px-3 mt-6 space-y-1">
            <h3 className="mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</h3>
            
            <Link to={`/projects/${projectId}/documents`} onClick={() => onClose?.()}>
              <Button variant={location.pathname.includes("/documents") ? "secondary" : "ghost"} className={cn("w-full justify-start", location.pathname.includes("/documents") && "bg-blue-50 text-blue-600")}>
                <FileText className="mr-2 h-4 w-4" />
                Documents
              </Button>
            </Link>
            
            <Link to={`/projects/${projectId}/tutor`} onClick={() => onClose?.()}>
              <Button variant={location.pathname.includes("/tutor") ? "secondary" : "ghost"} className={cn("w-full justify-start", location.pathname.includes("/tutor") && "bg-blue-50 text-blue-600")}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Tutor Chat
              </Button>
            </Link>

            <Link to={`/projects/${projectId}/quiz`} onClick={() => onClose?.()}>
              <Button variant={location.pathname.includes("/quiz") ? "secondary" : "ghost"} className={cn("w-full justify-start", location.pathname.includes("/quiz") && "bg-blue-50 text-blue-600")}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Quizzes
              </Button>
            </Link>

            <Link to={`/projects/${projectId}/mastery`} onClick={() => onClose?.()}>
              <Button variant={location.pathname.includes("/mastery") ? "secondary" : "ghost"} className={cn("w-full justify-start", location.pathname.includes("/mastery") && "bg-blue-50 text-blue-600")}>
                <GraduationCap className="mr-2 h-4 w-4" />
                Mastery
              </Button>
            </Link>

            <Link to={`/projects/${projectId}/analytics`} onClick={() => onClose?.()}>
              <Button variant={location.pathname.includes("/analytics") ? "secondary" : "ghost"} className={cn("w-full justify-start", location.pathname.includes("/analytics") && "bg-blue-50 text-blue-600")}>
                <BarChart className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </Link>
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start px-2 py-6 h-auto">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
                  {profile?.full_name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left flex-1 overflow-hidden">
                <div className="flex items-center gap-1.5 w-full">
                  <span className="text-sm font-medium truncate">{profile?.full_name || "User"}</span>
                  {profile?.role === "admin" && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded">Admin</span>
                  )}
                </div>
                <span className="text-xs text-slate-500 truncate w-full">{profile?.email}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500 ml-auto shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {profile?.role === "admin" && (
              <DropdownMenuItem 
                onClick={() => {
                  onClose?.();
                  navigate('/admin');
                }} 
                className="cursor-pointer text-purple-700 font-medium"
              >
                <ShieldCheck className="mr-2 h-4 w-4 text-purple-600" />
                Admin Dashboard
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
