import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as loginApi } from '../services/api'
import toast from 'react-hot-toast'
import { Brain, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      const res = await loginApi(form)
      login(res.data.access_token, res.data.user)
      toast.success(`Welcome back, ${res.data.user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', width:'100%', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Sora,sans-serif' }}>

      {/* ── Background: desktop = loginpage.bg.png, mobile = mobile-login.avif ── */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage: isMobile ? 'url(/mobile-login.bg.avif)' : 'url(/loginpage.bg.png)',
        backgroundSize:'cover',
        backgroundPosition: isMobile ? 'center top' : 'center',
        backgroundRepeat:'no-repeat',
        transition:'background-image 0.3s',
      }} />

      {/* Dark overlay — slightly stronger on mobile for readability */}
      <div style={{ position:'absolute', inset:0, background: isMobile ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.65)', backdropFilter:'blur(2px)' }} />

      {/* Back to home */}
      <Link to="/" style={{ position:'absolute', top: isMobile?'16px':'24px', left: isMobile?'16px':'28px', display:'flex', alignItems:'center', gap:'6px', color:'#00f0ff', textDecoration:'none', fontSize:'14px', fontWeight:'500', zIndex:20 }}>
        <ArrowLeft style={{ width:'16px', height:'16px' }} />
        Back
      </Link>

      {/* Form Card */}
      <div style={{ width:'100%', maxWidth: isMobile?'100%':'420px', position:'relative', zIndex:10, padding: isMobile?'0':'16px' }}>

        {/* Logo + title */}
        <div style={{ textAlign:'center', marginBottom: isMobile?'20px':'28px', padding: isMobile?'0 24px':'0' }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width: isMobile?'52px':'60px', height: isMobile?'52px':'60px', borderRadius:'16px', background:'rgba(79,70,229,0.25)', border:'1px solid rgba(99,102,241,0.5)', boxShadow:'0 0 30px rgba(99,102,241,0.4)', marginBottom:'12px' }}>
            <Brain style={{ width: isMobile?'26px':'30px', height: isMobile?'26px':'30px', color:'#818cf8' }} />
          </div>
          <h1 style={{ fontSize: isMobile?'22px':'26px', fontWeight:'700', color:'#ffffff', margin:'0 0 6px' }}>Welcome back</h1>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'14px', margin:0 }}>Sign in to your interview platform</p>
        </div>

        {/* Card */}
        <div style={{
          background:'rgba(255,255,255,0.06)',
          border:'1px solid rgba(255,255,255,0.15)',
          borderRadius: isMobile?'20px 20px 0 0':'20px',
          padding: isMobile?'28px 24px 40px':'32px',
          backdropFilter:'blur(20px)',
          boxShadow:'0 20px 60px rgba(0,0,0,0.4)',
          margin: isMobile?'0':'0',
          /* On mobile: card sits at bottom, full-width */
          ...(isMobile && { position:'fixed', bottom:0, left:0, right:0, borderRadius:'24px 24px 0 0' }),
        }}>
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom:'18px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'500', color:'rgba(255,255,255,0.6)', marginBottom:'8px' }}>Email</label>
              <div style={{ position:'relative' }}>
                <Mail style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', width:'16px', height:'16px', color:'rgba(255,255,255,0.3)' }} />
                <input type="email" placeholder="you@example.com" value={form.email}
                  onChange={e => setForm({...form, email:e.target.value})}
                  style={{ width:'100%', paddingLeft:'40px', paddingRight:'16px', paddingTop:'13px', paddingBottom:'13px', borderRadius:'12px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'#ffffff', fontSize:'15px', outline:'none', boxSizing:'border-box' }}
                  onFocus={e=>e.target.style.border='1px solid #00f0ff'}
                  onBlur={e=>e.target.style.border='1px solid rgba(255,255,255,0.12)'} />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom:'24px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'500', color:'rgba(255,255,255,0.6)', marginBottom:'8px' }}>Password</label>
              <div style={{ position:'relative' }}>
                <Lock style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', width:'16px', height:'16px', color:'rgba(255,255,255,0.3)' }} />
                <input type={showPw?'text':'password'} placeholder="••••••••" value={form.password}
                  onChange={e => setForm({...form, password:e.target.value})}
                  style={{ width:'100%', paddingLeft:'40px', paddingRight:'44px', paddingTop:'13px', paddingBottom:'13px', borderRadius:'12px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'#ffffff', fontSize:'15px', outline:'none', boxSizing:'border-box' }}
                  onFocus={e=>e.target.style.border='1px solid #00f0ff'}
                  onBlur={e=>e.target.style.border='1px solid rgba(255,255,255,0.12)'} />
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', padding:0 }}>
                  {showPw ? <EyeOff style={{width:'16px',height:'16px'}}/> : <Eye style={{width:'16px',height:'16px'}}/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ width:'100%', padding:'14px', borderRadius:'12px', background:'linear-gradient(135deg,#4f46e5,#6366f1)', border:'none', color:'#ffffff', fontSize:'15px', fontWeight:'600', cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 0 20px rgba(99,102,241,0.4)' }}>
              {loading ? <><span style={{ width:'16px',height:'16px',border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid white',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite' }}/>Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:'14px', color:'rgba(255,255,255,0.4)', marginTop:'20px', marginBottom:0 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color:'#00f0ff', fontWeight:'500', textDecoration:'none' }}>Sign up</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        /* On very small phones, shrink logo */
        @media (max-width: 360px) {
          input { font-size: 14px !important; }
        }
      `}</style>
    </div>
  )
}