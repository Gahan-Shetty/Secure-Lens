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
    <nav style={{ backgroundColor: '#0f0a1e', borderBottom: '1px solid #2d1b69' }} className="backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <span className="glitch-logo" data-text="🔍 SecureLens">
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
