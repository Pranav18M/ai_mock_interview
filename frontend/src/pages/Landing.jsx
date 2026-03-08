import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Landing() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [loaded, setLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024)

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100)
    const handleMouse = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
    }
    window.addEventListener('mousemove', handleMouse)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const navPadding = isMobile ? '16px 20px' : isTablet ? '18px 32px' : '20px 40px'
  const contentPadding = isMobile ? '24px 24px 40px' : isTablet ? '36px 36px 44px' : '48px 48px 52px'
  const titleSize = isMobile ? '17px' : isTablet ? '19px' : '20px'
  const subtitleSize = isMobile ? '13px' : isTablet ? '15px' : '17px'
  const logoTextVisible = !isMobile

  return (
    <div style={{
      minHeight: '100vh', width: '100%', position: 'relative',
      overflow: 'hidden', fontFamily: 'Sora, sans-serif',
    }}>
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/loginpage.bg.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />

      {/* Mouse glow - desktop only */}
      {!isMobile && (
        <div style={{
          position: 'absolute', zIndex: 2, pointerEvents: 'none',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,240,255,0.08) 0%, transparent 70%)',
          transform: `translate(${mousePos.x - 300}px, ${mousePos.y - 300}px)`,
          transition: 'transform 0.15s ease',
        }} />
      )}

      {/* Overlays */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.5) 100%)', zIndex: 1 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)', zIndex: 1 }} />

      {/* TOP NAV */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: navPadding, zIndex: 10,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
        backdropFilter: 'blur(4px)',
        opacity: loaded ? 1 : 0,
        transform: loaded ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.8s ease',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: isMobile ? '32px' : '36px',
            height: isMobile ? '32px' : '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f46e5, #00f0ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0,240,255,0.3)', flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontWeight: '800', fontSize: isMobile ? '13px' : '16px' }}>AI</span>
          </div>
          {logoTextVisible && (
            <span style={{ color: '#ffffff', fontWeight: '700', fontSize: '15px', letterSpacing: '0.5px' }}>MockInterview</span>
          )}
        </div>

        {/* Nav Buttons */}
        <div style={{ display: 'flex', gap: isMobile ? '8px' : '12px', alignItems: 'center' }}>
          <Link to="/login" style={{
            color: '#ffffff', fontWeight: '600',
            fontSize: isMobile ? '13px' : '14px',
            textDecoration: 'none',
            padding: isMobile ? '8px 16px' : '9px 22px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.25)',
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.18)' }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.08)' }}
          >
            Login
          </Link>
          <Link to="/signup" style={{
            color: '#000000', fontWeight: '700',
            fontSize: isMobile ? '13px' : '14px',
            textDecoration: 'none',
            padding: isMobile ? '8px 16px' : '9px 22px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #00f0ff, #0080ff)',
            boxShadow: '0 0 20px rgba(0,240,255,0.4)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => { e.target.style.transform = 'scale(1.05)' }}
            onMouseLeave={e => { e.target.style.transform = 'scale(1)' }}
          >
            Sign up
          </Link>
        </div>
      </div>

      {/* BOTTOM CONTENT */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: contentPadding,
        zIndex: 10,
        opacity: loaded ? 1 : 0,
        transform: loaded ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 1s ease 0.3s',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)',
          borderRadius: '100px', padding: '5px 14px', marginBottom: isMobile ? '12px' : '18px',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00f0ff', boxShadow: '0 0 8px #00f0ff', animation: 'pulse 2s infinite' }} />
          <span style={{ color: '#00f0ff', fontSize: isMobile ? '10px' : '12px', fontWeight: '600', letterSpacing: '1px' }}>AI-POWERED INTERVIEWS</span>
        </div>

        <h1 style={{
          fontSize: titleSize, fontWeight: '700', color: '#ffffff',
          margin: `0 0 ${isMobile ? '10px' : '12px'} 0`, letterSpacing: '0.3px',
          maxWidth: isMobile ? '100%' : '600px',
        }}>
          AI Mock Interview Platform
        </h1>

        <p style={{
          fontSize: subtitleSize, fontWeight: '800', color: '#00f0ff',
          margin: `0 0 ${isMobile ? '24px' : '32px'} 0`,
          maxWidth: isMobile ? '100%' : '520px',
          lineHeight: '1.6', textTransform: 'uppercase', letterSpacing: isMobile ? '0.8px' : '1.5px',
          textShadow: '0 0 30px rgba(0,240,255,0.5)',
        }}>
          {isMobile
            ? 'AI Mock Interviews with Voice, Real-Time Evaluation & Feedback.'
            : 'Full-Stack AI Mock Interview System with Live Voice, Real-Time Evaluation & Intelligent Feedback.'}
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: isMobile ? '10px' : '14px', flexWrap: 'wrap' }}>
          <Link to="/signup" style={{
            padding: isMobile ? '12px 24px' : '14px 32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            color: '#ffffff', fontWeight: '700',
            fontSize: isMobile ? '14px' : '15px',
            textDecoration: 'none',
            boxShadow: '0 0 30px rgba(99,102,241,0.6)',
            transition: 'all 0.25s ease',
            border: '1px solid rgba(139,92,246,0.5)',
            whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 40px rgba(99,102,241,0.8)' }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 0 30px rgba(99,102,241,0.6)' }}
          >
            🚀 Get Started Free
          </Link>
          <Link to="/login" style={{
            padding: isMobile ? '12px 24px' : '14px 32px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff', fontWeight: '600',
            fontSize: isMobile ? '14px' : '15px',
            textDecoration: 'none', backdropFilter: 'blur(10px)',
            transition: 'all 0.25s ease',
            whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.15)'; e.target.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.07)'; e.target.style.transform = 'translateY(0)' }}
          >
            Sign In →
          </Link>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '16px' : '32px',
          marginTop: isMobile ? '24px' : '36px',
          flexWrap: 'wrap',
        }}>
          {[['🎯', 'Smart Questions', 'Role-based AI'],
            ['🎙️', 'Voice Enabled', 'Live speech interaction'],
            ['📊', 'Instant Feedback', 'Detailed reports']].map(([icon, title, sub]) => (
            <div key={title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: isMobile ? '16px' : '20px' }}>{icon}</span>
              <div>
                <div style={{ color: '#ffffff', fontSize: isMobile ? '11px' : '13px', fontWeight: '600' }}>{title}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: isMobile ? '10px' : '11px' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}