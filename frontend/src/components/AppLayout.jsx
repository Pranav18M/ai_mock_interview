import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const NAV = [
  {
    id: 'explore', label: 'Explore', path: '/explore',
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88"/></svg>,
  },
  {
    id: 'interview', label: 'Interview', path: '/setup',
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2z"/><path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none"/></svg>,
  },
  {
    id: 'scores', label: 'Scores', path: '/scores',
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  },
]

export default function AppLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/'); toast.success('Signed out') }
  const active = NAV.find(n => location.pathname.startsWith(n.path))?.id || 'explore'

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: (collapsed && !isMobile) ? '20px 0' : '20px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', justifyContent: (collapsed && !isMobile) ? 'center' : 'flex-start' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        {(!collapsed || isMobile) && <span style={{ fontWeight: '700', fontSize: '15px', letterSpacing: '-0.3px', color: '#f0f2f8' }}>InterviewAI</span>}
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 10px' }}>
        {NAV.map(item => {
          const isActive = active === item.id
          return (
            <Link key={item.id} to={item.path} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: (collapsed && !isMobile) ? '11px 0' : '11px 12px',
              borderRadius: '10px', marginBottom: '4px',
              justifyContent: (collapsed && !isMobile) ? 'center' : 'flex-start',
              background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: isActive ? '#818cf8' : 'rgba(255,255,255,0.45)',
              textDecoration: 'none', fontWeight: isActive ? '600' : '400',
              fontSize: '14px', transition: 'all 0.15s ease',
              borderLeft: isActive ? '2px solid #6366f1' : '2px solid transparent',
            }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' } }}
            >
              {item.icon}
              {(!collapsed || isMobile) && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: (collapsed && !isMobile) ? '16px 0' : '16px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {(!collapsed || isMobile) && (
          <div style={{ marginBottom: '10px', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#e8eaf0', margin: 0 }}>{user?.name}</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
          </div>
        )}
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          width: '100%', padding: (collapsed && !isMobile) ? '10px 0' : '9px 10px',
          justifyContent: (collapsed && !isMobile) ? 'center' : 'flex-start',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.35)', fontSize: '13px', borderRadius: '8px', transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          {(!collapsed || isMobile) && <span>Sign out</span>}
        </button>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#080c14', fontFamily: "'DM Sans','Sora',sans-serif", color: '#e8eaf0' }}>
        {/* Mobile Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d1220', position: 'sticky', top: 0, zIndex: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <span style={{ fontWeight: '700', fontSize: '14px', color: '#f0f2f8' }}>InterviewAI</span>
          </div>
          <button onClick={() => setMobileOpen(true)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>

        {/* Mobile Drawer Overlay */}
        {mobileOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
            <div onClick={() => setMobileOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '260px', background: 'linear-gradient(180deg,#0d1220,#0a0f1a)', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.25s ease' }}>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Mobile Bottom Nav */}
        <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0d1220', position: 'sticky', bottom: 0, zIndex: 20 }}>
          {NAV.map(item => {
            const isActive = active === item.id
            return (
              <Link key={item.id} to={item.path} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                padding: '12px 8px', textDecoration: 'none',
                color: isActive ? '#818cf8' : 'rgba(255,255,255,0.35)',
                borderTop: isActive ? '2px solid #6366f1' : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
                {item.icon}
                <span style={{ fontSize: '10px', fontWeight: isActive ? '600' : '400' }}>{item.label}</span>
              </Link>
            )
          })}
        </div>
        <style>{`@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080c14', fontFamily: "'DM Sans','Sora',sans-serif", color: '#e8eaf0' }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: collapsed ? '64px' : '220px', minHeight: '100vh',
        background: 'linear-gradient(180deg,#0d1220,#0a0f1a)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        flexShrink: 0, position: 'relative', zIndex: 10,
      }}>
        <SidebarContent />
        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          position: 'absolute', top: '50%', right: '-12px',
          width: '24px', height: '24px', borderRadius: '50%',
          background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.4)', zIndex: 20, transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#252d45'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#1a2035'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {collapsed ? <path d="M9 18l6-6-6-6"/> : <path d="M15 18l-6-6 6-6"/>}
          </svg>
        </button>
      </aside>
      <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>{children}</main>
    </div>
  )
}