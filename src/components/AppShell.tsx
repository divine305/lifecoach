import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Command,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  X,
} from 'lucide-react'
import { navigationGroups, utilityNavigation } from '../data/demo'
import { useAuth } from '../contexts/useAuth'

type AppShellProps = {
  theme: 'dark' | 'light'
  onToggleTheme: () => Promise<string | null>
}

export function AppShell({ theme, onToggleTheme }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [themeError, setThemeError] = useState<string | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut, user } = useAuth()
  const studentName = profile?.full_name || user?.email?.split('@')[0] || 'Student'
  const initials = studentName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const searchResults = useMemo(() => {
    const items = [...navigationGroups.flatMap((group) => group.items), ...utilityNavigation]
    const query = searchQuery.trim().toLowerCase()
    return query ? items.filter((item) => item.label.toLowerCase().includes(query)).slice(0, 5) : []
  }, [searchQuery])
  const pageTitle = location.pathname === '/dashboard'
    ? 'Dashboard'
    : location.pathname.split('/').pop()?.replaceAll('-', ' ') ?? 'Dashboard'

  const closeSidebar = () => setSidebarOpen(false)
  const handleSignOut = async () => {
    setSignOutError(null)
    const error = await signOut()
    if (error) setSignOutError(error)
  }
  const handleToggleTheme = async () => {
    setThemeError(null)
    const error = await onToggleTheme()
    if (error) setThemeError(error)
  }

  return (
    <div className={`app-shell ${theme === 'light' ? 'light-theme' : ''}`}>
      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={closeSidebar} />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <NavLink to="/" className="brand-lockup" aria-label="LifeOS home" onClick={closeSidebar}>
            <span className="brand-mark"><Command size={17} strokeWidth={2.6} /></span>
            <span>life<span className="brand-light">os</span></span>
          </NavLink>
          <button className="icon-button mobile-close" aria-label="Close menu" onClick={closeSidebar}><X size={18} /></button>
        </div>

        <div className="workspace-switcher">
          <span className="workspace-avatar">{initials.slice(0, 1)}</span>
          <span className="workspace-copy"><strong>{studentName}</strong><small>Student workspace</small></span>
        </div>

        <nav className="side-nav" aria-label="Main navigation">
          {navigationGroups.map((group) => (
            <div className="nav-group" key={group.title}>
              <p className="nav-group-label">{group.title}</p>
              {group.items.map(({ label, path, icon: Icon, badge }) => (
                <NavLink key={path} to={path} onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Icon size={17} strokeWidth={1.8} />
                  <span>{label}</span>
                  {badge && <span className="nav-badge">{badge}</span>}
                </NavLink>
              ))}
            </div>
          ))}
          <div className="nav-group nav-group-utility">
            <p className="nav-group-label">More</p>
            {utilityNavigation.map(({ label, path, icon: Icon }) => (
              <NavLink key={path} to={path} onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={17} strokeWidth={1.8} />
                <span>{label}</span>
                {label === 'AI Life Coach' && <span className="ai-pill">NEW</span>}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="sidebar-bottom">
          <div className="coach-card">
            <div className="coach-sparkle"><Sparkles size={16} /></div>
            <strong>A little guidance?</strong>
            <p>Your AI coach can help you plan a more balanced week.</p>
            <NavLink to="/ai-coach" onClick={closeSidebar}>Talk to your coach <span>↗</span></NavLink>
          </div>
          <div className="profile-actions">
            <NavLink to="/settings" className="profile-button">
              <span className="profile-avatar">{initials || 'S'}</span>
              <span className="profile-copy"><strong>{studentName}</strong><small>{user?.email}</small></span>
            </NavLink>
            <button type="button" className="icon-button sign-out-button" aria-label="Sign out" title="Sign out" onClick={() => void handleSignOut()}><LogOut size={15} /></button>
          </div>
          {signOutError && <p className="sign-out-error" role="alert">{signOutError}</p>}
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-leading">
            <button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setSidebarOpen(true)}><Menu size={19} /></button>
            <div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-separator">/</span><strong>{pageTitle}</strong></div>
          </div>
          <div className="topbar-actions">
            {themeError && <span className="theme-save-error" role="alert">{themeError}</span>}
            {searchOpen ? (
              <div className="search-container">
                <label className="search-field">
                  <Search size={16} />
                  <input
                    autoFocus
                    aria-label="Search LifeOS"
                    placeholder="Search workspace..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && searchResults[0]) {
                        navigate(searchResults[0].path)
                        setSearchOpen(false)
                        setSearchQuery('')
                      }
                    }}
                  />
                  <button className="search-close" aria-label="Close search" onClick={() => { setSearchOpen(false); setSearchQuery('') }}><X size={15} /></button>
                </label>
                {searchQuery.trim() && <div className="search-results">
                  {searchResults.length ? searchResults.map(({ label, path, icon: Icon }) => (
                    <NavLink key={path} to={path} onClick={() => { setSearchOpen(false); setSearchQuery('') }} className="search-result">
                      <Icon size={15} /><span>{label}</span>
                    </NavLink>
                  )) : <span className="search-no-results">No matching pages</span>}
                </div>}
              </div>
            ) : (
              <button className="topbar-search icon-button" aria-label="Search" onClick={() => setSearchOpen(true)}><Search size={17} /><span>Search</span><kbd>⌘ K</kbd></button>
            )}
            <button className="icon-button theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={() => void handleToggleTheme()}>
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button className="icon-button notification-button" aria-label="View notifications" onClick={() => navigate('/notifications')}>
              <Bell size={17} /><span className="notification-dot" />
            </button>
            <button className="topbar-create button button-primary" onClick={() => navigate('/planner')}><Plus size={16} /><span>Quick add</span></button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  )
}
