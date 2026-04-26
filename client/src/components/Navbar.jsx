import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-teal-400 font-mono font-bold text-lg tracking-tight">
            🔍 SecureLens
          </span>
        </Link>

        {/* Nav links */}
        {user && (
          <div className="flex items-center gap-6">
            <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">
              Scanner
            </Link>
            <Link to="/history" className="text-gray-400 hover:text-white text-sm transition-colors">
              History
            </Link>
            <span className="text-gray-600 text-sm">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
