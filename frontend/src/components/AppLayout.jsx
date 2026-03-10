import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const NAV = [
  { id: 'explore', label: 'Explore', path: '/explore', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88"/></svg> },
  { id: 'interview', label: 'Interview', path: '/setup', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2z"/><path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none"/></svg> },
  { id: 'ats', label: 'ATS Score', path: '/ats', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { id: 'scores', label: 'Scores', path: '/scores', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> },
]

export default function AppLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMobileMenuOpen(false), [location.pathname])

  const handleLogout = () => { logout(); navigate('/'); toast.success('Signed out') }
  const active = NAV.find(n => location.pathname.startsWith(n.path))?.id || 'explore'

  return (
    <div style={{ minHeight: '100vh', background: '#f0eff5', fontFamily: "'DM Sans',sans-serif", color: '#1a1a2e' }}>

      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'rgba(240,239,245,0.94)' : '#f0eff5',
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
        borderBottom: '1px solid rgba(79,70,229,0.08)',
        boxShadow: scrolled ? '0 2px 20px rgba(80,60,180,0.10),0 1px 4px rgba(0,0,0,0.05)' : '0 1px 0 rgba(79,70,229,0.07)',
        transition: 'all 0.25s ease',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: '60px', gap: '20px' }}>

          <Link to="/explore" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: '33px', height: '33px', borderRadius: '10px', background: 'linear-gradient(135deg,#1a1a2e,#2d2d5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(26,26,46,0.3)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <span style={{ fontWeight: '800', fontSize: '15px', color: '#1a1a2e', letterSpacing: '-0.4px' }}>InterviewAI</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(255,255,255,0.6)', borderRadius: '13px', padding: '4px', flex: 'none', border: '1px solid rgba(79,70,229,0.1)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06),0 1px 4px rgba(80,60,180,0.07)' }}>
            {NAV.map(item => {
              const isActive = active === item.id
              return (
                <Link key={item.id} to={item.path} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '10px', background: isActive ? '#fff' : 'transparent', color: isActive ? '#1a1a2e' : 'rgba(26,26,46,0.42)', textDecoration: 'none', fontWeight: isActive ? '700' : '500', fontSize: '13px', transition: 'all 0.18s ease', boxShadow: isActive ? '0 2px 8px rgba(80,60,180,0.14),0 1px 3px rgba(0,0,0,0.07)' : 'none', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color='#1a1a2e'; e.currentTarget.style.background='rgba(255,255,255,0.5)' }}}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color='rgba(26,26,46,0.42)'; e.currentTarget.style.background='transparent' }}}
                >
                  {item.icon}{item.label}
                </Link>
              )
            })}
          </nav>

          <div style={{ flex: 1 }} />

          {/* User */}
          <div className="desktop-user" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid rgba(79,70,229,0.1)', borderRadius: '40px', padding: '4px 14px 4px 4px', boxShadow: '0 2px 8px rgba(80,60,180,0.09)' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(79,70,229,0.35)' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>{user?.name?.[0]?.toUpperCase()}</span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a2e' }}>{user?.name?.split(' ')[0]}</span>
            </div>
            <button onClick={handleLogout} style={{ padding: '7px 15px', borderRadius: '9px', border: '1px solid rgba(0,0,0,0.09)', background: '#fff', color: 'rgba(26,26,46,0.55)', fontSize: '12.5px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
              onMouseEnter={e => { e.currentTarget.style.background='#fef2f2'; e.currentTarget.style.color='#dc2626'; e.currentTarget.style.borderColor='rgba(220,38,38,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.color='rgba(26,26,46,0.55)'; e.currentTarget.style.borderColor='rgba(0,0,0,0.09)' }}
            >Sign out</button>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(o => !o)} className="mobile-menu-btn"
            style={{ display: 'none', background: '#fff', border: '1px solid rgba(79,70,229,0.1)', borderRadius: '9px', padding: '8px', cursor: 'pointer', color: '#1a1a2e', boxShadow: '0 1px 4px rgba(80,60,180,0.1)' }}>
            {mobileMenuOpen
              ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div style={{ borderTop: '1px solid rgba(79,70,229,0.08)', background: '#fff', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 8px 24px rgba(80,60,180,0.12)' }}>
            {NAV.map(item => {
              const isActive = active === item.id
              return (
                <Link key={item.id} to={item.path} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderRadius: '10px', background: isActive ? '#f0f0ff' : 'transparent', color: isActive ? '#4f46e5' : '#1a1a2e', textDecoration: 'none', fontWeight: isActive ? '700' : '400', fontSize: '14px', boxShadow: isActive ? '0 2px 8px rgba(79,70,229,0.1)' : 'none' }}>
                  {item.icon}{item.label}
                </Link>
              )
            })}
            <div style={{ borderTop: '1px solid rgba(79,70,229,0.08)', marginTop: '8px', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#fff' }}>{user?.name?.[0]?.toUpperCase()}</span>
                </div>
                <span style={{ fontSize: '13px', color: '#1a1a2e', fontWeight: '600' }}>{user?.name}</span>
              </div>
              <button onClick={handleLogout} style={{ padding: '6px 12px', borderRadius: '7px', border: '1px solid rgba(220,38,38,0.2)', background: '#fef2f2', color: '#dc2626', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>Sign out</button>
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .desktop-user { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  )
}