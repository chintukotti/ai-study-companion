import { useLocation, useNavigate, Link } from "react-router-dom"
import { ChevronRight, Menu } from "lucide-react"

interface HeaderProps {
  onToggleMobileMenu?: () => void
}

export function Header({ onToggleMobileMenu }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Breadcrumb logic based on path
  const paths = location.pathname.split("/").filter(Boolean)
  
  const breadcrumbs = paths.map((path, index) => {
    const prevPath = index > 0 ? paths[index - 1] : ""
    const isGuid = path.length > 20 && path.includes("-")
    
    // Format human-readable segment names
    let displayPath = path.charAt(0).toUpperCase() + path.slice(1)
    if (isGuid) {
      if (prevPath === "projects") {
        displayPath = "Project Workspace"
      } else if (prevPath === "spaces") {
        displayPath = "Space Details"
      } else {
        displayPath = "Details"
      }
    } else if (path === "tutor") {
      displayPath = "AI Tutor"
    } else if (path === "quiz" || path === "quizzes") {
      displayPath = "Quizzes"
    } else if (path === "mastery") {
      displayPath = "Mastery"
    } else if (path === "analytics") {
      displayPath = "Analytics"
    } else if (path === "documents") {
      displayPath = "Documents"
    }

    // Determine target link for clickable breadcrumb
    let targetHref = "/" + paths.slice(0, index + 1).join("/")
    if (path === "projects") {
      targetHref = "/spaces"
    }

    const isLast = index === paths.length - 1

    return (
      <div key={index} className="flex items-center">
        <ChevronRight className="h-4 w-4 text-slate-400 mx-1 shrink-0" />
        {isLast ? (
          <span className="font-semibold text-slate-900">
            {displayPath}
          </span>
        ) : (
          <Link 
            to={targetHref}
            className="text-slate-500 hover:text-blue-600 font-medium transition-colors"
          >
            {displayPath}
          </Link>
        )}
      </div>
    )
  })

  return (
    <header className="h-14 border-b bg-white flex items-center px-3 sm:px-6 shrink-0 justify-between">
      <div className="flex items-center text-sm min-w-0">
        {/* Mobile menu toggle button */}
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 mr-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            title="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Breadcrumb path */}
        <div className="flex items-center flex-wrap">
          <Link 
            to="/" 
            className="text-slate-500 hover:text-blue-600 font-medium transition-colors"
          >
            Home
          </Link>
          {breadcrumbs}
        </div>
      </div>
    </header>
  )
}
