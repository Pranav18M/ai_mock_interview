import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { signup as signupApi } from '../services/api'
import toast from 'react-hot-toast'
import { Brain, User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function Signup() {
  const [form, setForm] = useState({ name:'', email:'', password:'' })
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
    if (!form.name||!form.email||!form.password) return toast.error('Please fill in all fields')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      const res = await signupApi(form)
      login(res.data.access_token, res.data.user)
      toast.success(`Account created! Welcome, ${res.data.user.name}!`)
      navigate('/resume')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed')
    } finally { setLoading(false) }
  }

  const inp = {
    width:'100%', paddingTop:'13px', paddingBottom:'13px', paddingRight:'16px',
    borderRadius:'12px', background:'rgba(255,255,255,0.07)',
    border:'1px solid rgba(255,255,255,0.12)', color:'#ffffff',
    fontSize:'15px', outline:'none', boxSizing:'border-box',
  }

  return (
    <div style={{ minHeight:'100vh', width:'100%', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Sora,sans-serif' }}>

      {/* Background: desktop vs mobile */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage: isMobile ? 'url(/mobile-login.bg.avif)' : 'url(/loginpage.bg.png)',
        backgroundSize:'cover',
        backgroundPosition: isMobile ? 'center top' : 'center',
        backgroundRepeat:'no-repeat',
      }} />
      <div style={{ position:'absolute', inset:0, background: isMobile?'rgba(0,0,0,0.72)':'rgba(0,0,0,0.65)', backdropFilter:'blur(2px)' }} />

      {/* Back */}
      <Link to="/" style={{ position:'absolute', top: isMobile?'16px':'24px', left: isMobile?'16px':'28px', display:'flex', alignItems:'center', gap:'6px', color:'#00f0ff', textDecoration:'none', fontSize:'14px', fontWeight:'500', zIndex:20 }}>
        <ArrowLeft style={{width:'16px',height:'16px'}}/> Back
      </Link>

      {/* Form card */}
      <div style={{ width:'100%', maxWidth: isMobile?'100%':'420px', position:'relative', zIndex:10, padding: isMobile?'0':'16px' }}>

        <div style={{ textAlign:'center', marginBottom: isMobile?'16px':'24px', padding: isMobile?'0 24px':'0' }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width: isMobile?'50px':'60px', height: isMobile?'50px':'60px', borderRadius:'16px', background:'rgba(79,70,229,0.25)', border:'1px solid rgba(99,102,241,0.5)', boxShadow:'0 0 30px rgba(99,102,241,0.4)', marginBottom:'10px' }}>
            <Brain style={{ width: isMobile?'24px':'30px', height: isMobile?'24px':'30px', color:'#818cf8' }} />
          </div>
          <h1 style={{ fontSize: isMobile?'21px':'26px', fontWeight:'700', color:'#ffffff', margin:'0 0 5px' }}>Create account</h1>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'13px', margin:0 }}>Start your AI-powered interview journey</p>
        </div>

        <div style={{
          background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)',
          borderRadius: isMobile?'24px 24px 0 0':'20px',
          padding: isMobile?'24px 24px 40px':'28px',
          backdropFilter:'blur(20px)', boxShadow:'0 20px 60px rgba(0,0,0,0.4)',
          ...(isMobile && { position:'fixed', bottom:0, left:0, right:0 }),
        }}>
          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div style={{ marginBottom:'14px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'500', color:'rgba(255,255,255,0.6)', marginBottom:'7px' }}>Full Name</label>
              <div style={{ position:'relative' }}>
                <User style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', width:'16px', height:'16px', color:'rgba(255,255,255,0.3)' }} />
                <input type="text" placeholder="John Doe" value={form.name}
                  onChange={e=>setForm({...form,name:e.target.value})}
                  style={{ ...inp, paddingLeft:'40px' }}
                  onFocus={e=>e.target.style.border='1px solid #00f0ff'}
                  onBlur={e=>e.target.style.border='1px solid rgba(255,255,255,0.12)'} />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom:'14px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'500', color:'rgba(255,255,255,0.6)', marginBottom:'7px' }}>Email</label>
              <div style={{ position:'relative' }}>
                <Mail style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', width:'16px', height:'16px', color:'rgba(255,255,255,0.3)' }} />
                <input type="email" placeholder="you@example.com" value={form.email}
                  onChange={e=>setForm({...form,email:e.target.value})}
                  style={{ ...inp, paddingLeft:'40px' }}
                  onFocus={e=>e.target.style.border='1px solid #00f0ff'}
                  onBlur={e=>e.target.style.border='1px solid rgba(255,255,255,0.12)'} />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom:'20px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'500', color:'rgba(255,255,255,0.6)', marginBottom:'7px' }}>Password</label>
              <div style={{ position:'relative' }}>
                <Lock style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', width:'16px', height:'16px', color:'rgba(255,255,255,0.3)' }} />
                <input type={showPw?'text':'password'} placeholder="Min. 6 characters" value={form.password}
                  onChange={e=>setForm({...form,password:e.target.value})}
                  style={{ ...inp, paddingLeft:'40px', paddingRight:'44px' }}
                  onFocus={e=>e.target.style.border='1px solid #00f0ff'}
                  onBlur={e=>e.target.style.border='1px solid rgba(255,255,255,0.12)'} />
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', padding:0 }}>
                  {showPw ? <EyeOff style={{width:'16px',height:'16px'}}/> : <Eye style={{width:'16px',height:'16px'}}/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ width:'100%', padding:'14px', borderRadius:'12px', background:'linear-gradient(135deg,#4f46e5,#6366f1)', border:'none', color:'#ffffff', fontSize:'15px', fontWeight:'600', cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 0 20px rgba(99,102,241,0.4)' }}>
              {loading ? <><span style={{width:'16px',height:'16px',border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid white',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite'}}/>Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:'14px', color:'rgba(255,255,255,0.4)', marginTop:'16px', marginBottom:0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'#00f0ff', fontWeight:'500', textDecoration:'none' }}>Sign in</Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}