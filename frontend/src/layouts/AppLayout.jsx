import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const employeeLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/chat', label: 'Ask AI' },
  { to: '/documents', label: 'Documents' },
  { to: '/compare', label: 'Compare' },
  { to: '/rules/test', label: 'Eligibility' },
  { to: '/chat-history', label: 'Chat History' },
  { to: '/profile', label: 'Profile' },
];

const adminLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/documents', label: 'Documents' },
  { to: '/documents/upload', label: 'Upload' },
  { to: '/permissions', label: 'Permissions' },
  { to: '/rules', label: 'Rules' },
  { to: '/employees', label: 'Employees' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/chat', label: 'Ask AI' },
  { to: '/chat-history', label: 'Chat History' },
  { to: '/profile', label: 'Profile' },
];

export default function AppLayout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const links = isAdmin ? adminLinks : employeeLinks;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">EKA</span>
          <div>
            <strong>Knowledge Assistant</strong>
            <small>Enterprise docs · RAG · Rules</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
              end={link.to === '/dashboard'}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="user-avatar">{user?.name?.charAt(0)?.toUpperCase()}</span>
            <div>
              <strong>{user?.name}</strong>
              <small>
                {user?.role} · {user?.department}
              </small>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-block" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <h1 className="topbar-title">Enterprise Knowledge Assistant</h1>
          <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
