import { useState, useEffect, useRef } from 'react'
import { HashRouter as Router, Routes, Route, Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Languages, Trophy, Zap, Globe, Github, LogIn, LogOut, Send, Loader2, CheckCircle2, XCircle, AlertCircle, Search, ShieldCheck, Lock, EyeOff, RefreshCw, Bot, ExternalLink, Sun, Moon } from 'lucide-react'
import NodeBackground from './NodeBackground'

const API_BASE = import.meta.env.VITE_API_URL || "/api"

// --- Components ---

const renderMarkdown = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-catppuccin-text">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic text-catppuccin-text-soft">{part.slice(1, -1)}</em>;
    }
    return part;
  });
};

const Navbar = ({ isDark, toggleTheme, isGlass, toggleGlass }: { isDark: boolean; toggleTheme: () => void; isGlass: boolean; toggleGlass: () => void }) => (
  <nav className={`fixed top-0 w-full z-50 ${isGlass ? 'bg-catppuccin-bg/95 backdrop-blur-md' : 'bg-catppuccin-bg'} border-b border-catppuccin-border transition-all`}>
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <Link to="/" className="text-lg md:text-xl font-bold bg-gradient-to-r from-catppuccin-accent to-catppuccin-accent-soft bg-clip-text text-transparent">
        MyPortfolio
      </Link>
      <div className="flex items-center gap-2 md:gap-8">
        <Link to="/" className="hover:text-catppuccin-accent transition-colors text-xs md:text-sm font-medium hidden sm:block">Projects</Link>
        <Link to="/langy" className="hover:text-catppuccin-accent-soft transition-colors flex items-center gap-1 text-xs md:text-sm font-medium">
          <Languages size={14} className="md:w-4 md:h-4" /> Langy
        </Link>
        <div className="flex items-center gap-1.5 md:gap-2">
          <button 
            onClick={toggleGlass}
            className="flex p-1.5 md:p-2 rounded-full hover:bg-catppuccin-bg-soft transition-colors text-catppuccin-accent border border-catppuccin-border items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 md:px-3"
            title="Toggle Glass Effect"
          >
            {isGlass ? <ShieldCheck size={16} /> : <EyeOff size={16} />} 
            <span className="hidden xs:block">Glass</span>
          </button>
          <button 
            onClick={toggleTheme}
            className="p-1.5 md:p-2 rounded-full hover:bg-catppuccin-bg-soft transition-colors text-catppuccin-accent border border-catppuccin-border"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </div>
  </nav>
)

const Hero = ({ isGlass }: { isGlass: boolean }) => (
  <section className="pt-24 md:pt-32 pb-10 md:pb-20 px-4 text-center max-w-4xl mx-auto">
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${isGlass ? 'bg-catppuccin-bg/95 backdrop-blur-md' : 'bg-catppuccin-bg'} border-2 border-catppuccin-border p-6 md:p-12 rounded-3xl md:rounded-[2.5rem] shadow-2xl shadow-black/20 transition-all`}
    >
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-7xl font-extrabold mb-6"
      >
        Building Digital <br />
        <span className="text-catppuccin-accent">Experiences</span>
      </motion.h1>
      <p className="text-catppuccin-text-soft text-base md:text-lg max-w-2xl mx-auto mb-10">
        I'm a developer passionate about creating interactive applications, from Discord bots to modern web platforms.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link to="/langy" className="bg-catppuccin-accent-soft hover:brightness-110 text-catppuccin-bg px-6 md:px-8 py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-catppuccin-accent-soft/20">
          Try Langy Bot <Zap size={18} />
        </Link>
        <a href="https://github.com" className="border border-catppuccin-border hover:bg-catppuccin-bg-soft px-6 md:px-8 py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-2">
          GitHub <Github size={18} />
        </a>
      </div>
    </motion.div>
  </section>
)

const ProjectCard = ({ title, description, tags, link }: any) => (
  <div className="bg-catppuccin-bg-soft border-2 border-catppuccin-border rounded-2xl p-6 hover:border-catppuccin-accent/50 transition-all group shadow-sm">
    <h3 className="text-2xl font-bold mb-3 group-hover:text-catppuccin-accent transition-colors">{title}</h3>
    <p className="text-catppuccin-text-soft mb-6">{description}</p>
    <div className="flex flex-wrap gap-2 mb-6">
      {tags.map((tag: string) => (
        <span key={tag} className="text-xs font-medium bg-catppuccin-bg px-3 py-1 rounded-full text-catppuccin-text border border-catppuccin-border">
          {tag}
        </span>
      ))}
    </div>
    <Link to={link} className="text-catppuccin-accent font-semibold hover:underline">View Project &rarr; </Link>
  </div>
)

const Projects = ({ isGlass }: { isGlass: boolean }) => (
  <section id="projects" className="py-20 max-w-7xl mx-auto px-4">
    <div className={`${isGlass ? 'bg-catppuccin-bg/95 backdrop-blur-md' : 'bg-catppuccin-bg'} border-2 border-catppuccin-border p-6 md:p-12 rounded-3xl md:rounded-[2.5rem] shadow-xl shadow-black/10 transition-all`}>
      <h2 className="text-3xl font-bold mb-12">Featured Projects</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ProjectCard 
          title="Langy Discord Bot"
          description="A language learning bot that uses semantic ML to grade translations and track streaks."
          tags={['Python', 'Discord.py', 'NLP', 'FastAPI']}
          link="/langy"
        />
        <ProjectCard 
          title="Personal Portfolio"
          description="This website! Built with React, Vite, and Tailwind CSS."
          tags={['React', 'TypeScript', 'Tailwind']}
          link="/"
        />
      </div>
    </div>
  </section>
)

// --- Langy Web App ---

const LangyPage = ({ isGlass }: { isGlass: boolean }) => {
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState<string | null>(localStorage.getItem('langy_token'))
  const [user, setUser] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [lastSync, setLastSync] = useState<number>(0)
  const [isRefreshingLeaderboard, setIsRefreshingLeaderboard] = useState(false)
  const [loading, setLoading] = useState(false)
  const [challenge, setChallenge] = useState<any>(null)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<any>(null)
  const [timer, setTimer] = useState(60)
  const [category, setCategory] = useState<'Word' | 'Sentence'>('Word')
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null)
  const [isDaily, setIsDaily] = useState(false)
  const [isInverse, setIsInverse] = useState(false)
  const [dbError, setDbError] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [clientId, setClientId] = useState<string | null>(null)

  // Track the current EDT date to detect midnight resets reliably
  const dailyRefreshRef = useRef(
    new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString().split('T')[0]
  )

  useEffect(() => {
    fetchLanguages()
    fetch(`${API_BASE}/config`)
      .then(res => res.json())
      .then(data => setClientId(data.clientId))
      .catch(err => console.error("Config fetch error:", err));
  }, [])

  const fetchLanguages = async () => {
    try {
      const res = await fetch(`${API_BASE}/languages`)
      if (res.ok) setLanguages(await res.json())
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      // Target: 12 AM EDT = 4 AM UTC (Currently most users are in DST)
      let target = new Date(now)
      target.setUTCHours(4, 0, 0, 0)
      if (target <= now) {
        target.setUTCDate(target.getUTCDate() + 1)
      }
      
      const diff = target.getTime() - now.getTime()
      
      // Detect daily reset by comparing EDT dates. When the date string changes
      // (midnight EDT), we know a new day has started — refresh stats exactly once
      // so the "Launch Daily" button appears without a manual page refresh.
      const edtMs = now.getTime() - (4 * 60 * 60 * 1000)
      const edtDate = new Date(edtMs).toISOString().split('T')[0]
      if (edtDate !== dailyRefreshRef.current && token) {
        dailyRefreshRef.current = edtDate
        fetchUserStats()
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(timer)
  }, [token])

  useEffect(() => {
    const urlToken = searchParams.get('token')
    if (urlToken) {
      localStorage.setItem('langy_token', urlToken)
      setToken(urlToken)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [searchParams])

  useEffect(() => {
    if (token) fetchUserStats()
    fetchLeaderboard()
    const interval = setInterval(() => setLastSync(prev => prev), 30000)
    return () => clearInterval(interval)
  }, [token])

  useEffect(() => {
    let interval: any
    if (challenge && !result && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000)
    } else if (timer === 0 && !result && challenge) {
      submitAnswer()
    }
    return () => clearInterval(interval)
  }, [challenge, result, timer])

  const fetchUserStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/user/stats?t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        if (data.points === undefined) setDbError(true);
      } else {
        localStorage.removeItem('langy_token')
        setToken(null)
        setUser(null)
      }
    } catch (e) { console.error(e) }
  }

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/leaderboard`)
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(data.players || [])
        setLastSync(data.last_refresh || 0)
      }
    } catch (e) { console.error(e) }
  }

  const handleRefreshLeaderboard = async () => {
    if (isRefreshingLeaderboard) return
    setIsRefreshingLeaderboard(true)
    try {
      const res = await fetch(`${API_BASE}/leaderboard/refresh`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(data.players || [])
        setLastSync(data.last_refresh || 0)
      }
    } catch (e) { console.error(e) }
    finally {
      setTimeout(() => setIsRefreshingLeaderboard(false), 500)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('langy_token')
    setToken(null)
    setUser(null)
  }

  const startChallenge = async (type: 'practice' | 'daily') => {
    if (!selectedLanguage) {
      alert("Please choose a language before starting the challenge!");
      return;
    }
    setLoading(true)
    setIsDaily(type === 'daily')
    setResult(null)
    setAnswer('')
    setTimer(60)
    try {
      const res = await fetch(`${API_BASE}/challenge?language=${selectedLanguage}&category=${category}&is_daily=${type === 'daily'}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.detail || "Failed to start challenge")
        setLoading(false)
        return
      }
      const data = await res.json()
      setChallenge(data)
    } catch (e) { alert("Failed to start challenge") }
    setLoading(false)
  }

  const submitAnswer = async () => {
    if (!challenge) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/grade`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          language: challenge.language,
          original_english: challenge.english_word,
          user_input: answer,
          is_daily: isDaily,
          category: challenge.category,
          is_inverse: isInverse
        })
      })
      const data = await res.json()
      setResult(data)
      fetchUserStats()
      fetchLeaderboard()
    } catch (e) { alert("Failed to grade answer") }
    setLoading(false)
  }

  return (
    <div className="pt-20 md:pt-32 max-w-5xl mx-auto px-4 pb-20">
      {token && user && (
        <div className={`flex flex-col lg:flex-row items-center justify-between mb-8 md:mb-12 ${isGlass ? 'bg-catppuccin-bg/95 backdrop-blur-sm' : 'bg-catppuccin-bg'} p-4 md:p-6 rounded-2xl border-2 border-catppuccin-border gap-6 shadow-md transition-all`}>
          <div className="flex items-center gap-4 w-full lg:w-auto">
            {user?.avatar ? (
              <img 
                src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} 
                alt="Profile"
                className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-catppuccin-accent-soft shadow-lg shadow-catppuccin-accent-soft/20"
              />
            ) : (
              <div className="w-12 h-12 md:w-14 md:h-14 bg-catppuccin-accent-soft rounded-full flex items-center justify-center font-bold text-xl md:text-2xl text-catppuccin-bg">
                {user?.username?.[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-lg md:text-xl truncate">{user?.username}</h3>
              <p className="text-xs md:text-sm text-catppuccin-text-soft">Level: Language Learner</p>
            </div>
          </div>
          <div className="flex flex-wrap md:flex-nowrap gap-4 md:gap-8 items-center justify-center w-full lg:w-auto">
            <div className="text-center flex-1 lg:flex-none">
              <p className="text-[10px] md:text-xs text-catppuccin-text-soft uppercase tracking-widest mb-1 font-bold">Total Points</p>
              <p className="text-xl md:text-2xl font-bold text-catppuccin-accent">{user?.points || 0}</p>
            </div>
            <div className="text-center border-l-2 border-catppuccin-border pl-4 md:pl-8 flex-1 lg:flex-none">
              <p className="text-[10px] md:text-xs text-catppuccin-text-soft uppercase tracking-widest mb-1 font-bold">Streak Multiplier</p>
              <p className="text-xl md:text-2xl font-bold text-catppuccin-accent-soft flex items-center justify-center">
                <Zap className="mr-1 w-5 h-5 md:w-6 md:h-6" /> x{user?.multiplier || 1}
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-catppuccin-text-soft hover:text-red-400 transition-colors border-2 border-catppuccin-border rounded-lg hover:bg-red-500/10"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      )}

      {dbError && (
        <div className={`mb-8 p-4 bg-red-500/10 border-2 border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 ${isGlass ? 'backdrop-blur-sm' : ''}`}>
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-xs md:text-sm">Database connection issue detected. Points may not be saving correctly.</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
        <div className="lg:col-span-2 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${isGlass ? 'bg-catppuccin-bg/95 backdrop-blur-sm' : 'bg-catppuccin-bg'} border-2 border-catppuccin-border rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm transition-all`}>
            <h4 className="text-[10px] md:text-xs font-bold mb-6 flex items-center gap-2 text-catppuccin-text uppercase tracking-widest">
              <AlertCircle size={16} className="text-catppuccin-accent" /> How to Play
            </h4>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-catppuccin-accent/10 rounded-lg flex items-center justify-center text-catppuccin-accent mb-3 border border-catppuccin-accent/20 font-bold">1</div>
                <h5 className="font-bold text-sm">Pick a Language</h5>
                <p className="text-xs text-catppuccin-text-soft leading-relaxed">Choose from 20 top-studied languages and select your difficulty.</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-catppuccin-accent-soft/10 rounded-lg flex items-center justify-center text-catppuccin-accent-soft mb-3 border border-catppuccin-accent-soft/20 font-bold">2</div>
                <h5 className="font-bold text-sm">Translate</h5>
                <p className="text-xs text-catppuccin-text-soft leading-relaxed">Translate the prompt. Our AI grades you on meaning!</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-catppuccin-accent-soft/10 rounded-lg flex items-center justify-center text-catppuccin-accent-soft mb-3 border border-catppuccin-accent-soft/20 font-bold">3</div>
                <h5 className="font-bold text-sm">Earn Points</h5>
                <p className="text-xs text-catppuccin-text-soft leading-relaxed">Maintain your streak to climb the leaderboard.</p>
              </div>
            </div>
          </motion.div>

          {!challenge ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${isGlass ? 'bg-catppuccin-bg/95 backdrop-blur-sm' : 'bg-catppuccin-bg'} p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 border-catppuccin-border shadow-xl transition-all`}>
              <h4 className="text-lg md:text-xl font-bold mb-8 flex items-center gap-2">
                <Zap className="text-catppuccin-accent-soft" /> Start a Challenge
              </h4>
              <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-10">
                <div className="space-y-3">
                  <p className="text-[10px] md:text-xs text-catppuccin-text uppercase tracking-widest font-bold">1. Mode</p>
                  <div className="flex gap-2">
                    <button onClick={() => setIsInverse(false)} className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${!isInverse ? 'bg-catppuccin-accent text-catppuccin-bg border-catppuccin-accent' : 'bg-catppuccin-bg border-catppuccin-border hover:bg-catppuccin-bg-soft text-catppuccin-text'}`}>Standard</button>
                    <button onClick={() => setIsInverse(true)} className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${isInverse ? 'bg-catppuccin-accent text-catppuccin-bg border-catppuccin-accent' : 'bg-catppuccin-bg border-catppuccin-border hover:bg-catppuccin-bg-soft text-catppuccin-text'}`}>Inverse</button>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] md:text-xs text-catppuccin-text uppercase tracking-widest font-bold">2. Difficulty</p>
                  <div className="flex gap-2">
                    <button onClick={() => setCategory('Word')} className={`flex-1 py-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${category === 'Word' ? 'bg-catppuccin-accent-soft text-catppuccin-bg border-catppuccin-accent-soft' : 'bg-catppuccin-bg border-catppuccin-border hover:bg-catppuccin-bg-soft text-catppuccin-text'}`}>
                      <span className="text-sm font-bold">Word</span>
                      {user && <span className={`text-[10px] opacity-80 ${category === 'Word' ? 'text-catppuccin-bg' : 'text-catppuccin-accent-soft'}`}>15pts {user.multiplier > 1 && `(x${user.multiplier} = ${15 * user.multiplier})`}</span>}
                    </button>
                    <button onClick={() => setCategory('Sentence')} className={`flex-1 py-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${category === 'Sentence' ? 'bg-catppuccin-accent-soft text-catppuccin-bg border-catppuccin-accent-soft' : 'bg-catppuccin-bg border-catppuccin-border hover:bg-catppuccin-bg-soft text-catppuccin-text'}`}>
                      <span className="text-sm font-bold">Sentence</span>
                      {user && <span className={`text-[10px] opacity-80 ${category === 'Sentence' ? 'text-catppuccin-bg' : 'text-catppuccin-accent-soft'}`}>30pts {user.multiplier > 1 && `(x${user.multiplier} = ${30 * user.multiplier})`}</span>}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <p className="text-[10px] md:text-xs text-catppuccin-text uppercase tracking-widest font-bold">3. Language Selection</p>
                  <div className="relative group w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-catppuccin-text-soft group-focus-within:text-catppuccin-accent transition-colors" size={14} />
                    <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-catppuccin-bg border-2 border-catppuccin-border rounded-lg pl-9 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-catppuccin-accent outline-none w-full sm:w-48 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar bg-catppuccin-bg p-3 md:p-4 rounded-xl border-2 border-catppuccin-border">
                  {languages.filter(lang => lang.toLowerCase().includes(searchQuery.toLowerCase())).map(lang => (
                    <button key={lang} onClick={() => setSelectedLanguage(lang)} className={`border-2 p-2.5 md:p-3 rounded-xl font-semibold text-[10px] md:text-xs transition-all truncate ${selectedLanguage === lang ? 'bg-catppuccin-accent-soft border-catppuccin-accent-soft text-catppuccin-bg shadow-lg shadow-catppuccin-accent-soft/20' : 'bg-catppuccin-bg border-catppuccin-border hover:bg-catppuccin-bg-soft text-catppuccin-text-soft'}`}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t-2 border-catppuccin-border flex flex-col sm:flex-row gap-4">
                <button onClick={() => startChallenge('practice')} disabled={loading} className="flex-1 bg-catppuccin-bg border-2 border-catppuccin-border hover:bg-catppuccin-bg-soft py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">Practice Only</button>
                {!token ? (
                  <a href={`${API_BASE}/auth/login`} className="flex-1 bg-[#5865F2] hover:brightness-110 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl text-white"><LogIn size={20} /> Login for Daily</a>
                ) : !user ? (
                  <div className="flex-1 bg-catppuccin-bg border-2 border-catppuccin-border py-4 rounded-2xl flex items-center justify-center">
                    <Loader2 className="animate-spin text-catppuccin-accent" size={24} />
                  </div>
                ) : user?.can_do_daily ? (
                  <button onClick={() => startChallenge('daily')} disabled={loading} className="flex-1 bg-gradient-to-r from-catppuccin-accent to-catppuccin-accent-soft hover:brightness-110 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 text-catppuccin-bg"><Trophy size={18} /> Launch Daily</button>
                ) : (
                  <div className="flex-1 h-full flex flex-col items-center justify-center py-2 px-4 bg-catppuccin-bg rounded-2xl border-2 border-catppuccin-border text-catppuccin-text-soft text-sm font-medium">
                    <span className="italic opacity-60 text-[10px]">Next Daily In:</span>
                    <span className="font-mono text-base md:text-lg text-catppuccin-accent-soft font-bold">{timeLeft}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`${isGlass ? 'bg-catppuccin-bg/95 backdrop-blur-md' : 'bg-catppuccin-bg'} border-2 border-catppuccin-border rounded-2xl md:rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-2xl transition-all`}>
              <div className="flex justify-between items-center mb-8">
                <span className="bg-catppuccin-accent/20 text-catppuccin-accent px-3 md:px-4 py-1 rounded-full text-[10px] md:text-xs font-bold border-2 border-catppuccin-accent/30 uppercase tracking-widest">{isDaily ? 'Daily' : 'Practice'} - {challenge.category}</span>
                <div className={`text-lg md:text-xl font-mono font-bold ${timer < 10 ? 'text-red-500' : 'text-catppuccin-text-soft'}`}>00:{timer < 10 ? `0${timer}` : timer}</div>
              </div>
              <h2 className="text-center text-catppuccin-text-soft mb-4 tracking-widest uppercase text-[10px] font-bold">{isInverse ? `Translate to ${challenge.language}` : 'Translate to English'}</h2>
              <h1 className="text-center text-3xl md:text-5xl font-extrabold mb-8 md:mb-12 bg-gradient-to-r from-catppuccin-text to-catppuccin-text-soft bg-clip-text text-transparent break-words">{isInverse ? challenge.english_word : challenge.translated_word}</h1>
              {isInverse && challenge.meaning_hint && <p className="text-center text-catppuccin-text-soft italic mb-8 md:mb-12 -mt-6 md:-mt-8 text-sm">{challenge.meaning_hint}</p>}
              <AnimatePresence>
                {!result ? (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input autoFocus value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && answer && submitAnswer()} placeholder={isInverse ? `Type in ${challenge.language}...` : "Type English translation..."} className="flex-1 bg-catppuccin-bg border-2 border-catppuccin-border rounded-2xl px-4 md:px-6 py-3 md:py-4 focus:ring-2 focus:ring-catppuccin-accent outline-none transition-all placeholder:text-catppuccin-text-soft/40 text-sm md:text-base" />
                    <button onClick={submitAnswer} disabled={loading || !answer} className="bg-catppuccin-accent hover:brightness-110 p-3 md:p-4 rounded-2xl disabled:opacity-50 transition-all shadow-lg text-catppuccin-bg flex items-center justify-center">{loading ? <Loader2 className="animate-spin" /> : <Send />}</button>
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <div className={`inline-flex items-center gap-2 px-4 md:px-6 py-2 rounded-full mb-6 font-bold border-2 text-sm ${result.is_correct ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' : 'bg-red-600/20 text-red-400 border-red-500/30'}`}>{result.is_correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}{result.is_correct ? 'Correct!' : 'Incorrect'}</div>
                    <div className="mb-6 md:mb-8"><p className="text-[10px] md:text-xs text-catppuccin-text-soft uppercase tracking-widest mb-1 font-bold">Accuracy Score</p><p className={`text-3xl md:text-4xl font-black ${result.is_correct ? 'text-emerald-400' : 'text-red-400'}`}>{(result.score * 100).toFixed(0)}%</p></div>
                    <div className="space-y-2 mb-6 md:mb-8 bg-catppuccin-bg p-4 md:p-6 rounded-2xl border-2 border-catppuccin-border">
                      <p className="text-lg md:text-xl font-bold text-catppuccin-text">Expected: <span className="text-catppuccin-accent-soft">{isInverse ? challenge.translated_word : result.expected}</span></p>
                      <p className="text-xs md:text-sm font-bold text-catppuccin-text-soft uppercase tracking-wide">You said: <span className={result.is_correct ? "text-emerald-500/70" : "text-red-400/70"}>{answer}</span></p>
                      <div className="text-catppuccin-text-soft italic text-xs md:text-sm leading-relaxed whitespace-pre-line mt-2">"{renderMarkdown(result.reason)}"</div>
                    </div>
                    {result.earned && <div className="bg-catppuccin-accent-soft/10 border-2 border-catppuccin-accent-soft/20 p-3 md:p-4 rounded-2xl mb-6 md:mb-8"><p className="text-catppuccin-accent-soft font-bold text-lg md:text-xl">+ {result.earned} Points!</p></div>}
                    <button onClick={() => setChallenge(null)} className="bg-catppuccin-bg border-2 border-catppuccin-border hover:bg-catppuccin-bg-soft px-8 md:px-12 py-2.5 md:py-3 rounded-xl font-bold transition-all shadow-md text-sm md:text-base">Finish</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className={`${isGlass ? 'bg-catppuccin-bg/95 backdrop-blur-sm' : 'bg-catppuccin-bg'} border-2 border-catppuccin-border rounded-3xl p-6 h-full shadow-md transition-all`}>
            <div className="flex flex-col mb-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold flex items-center gap-2"><Trophy className="text-catppuccin-accent" size={20} /> Leaderboard</h4>
                {token && <button onClick={handleRefreshLeaderboard} disabled={isRefreshingLeaderboard} className={`p-1.5 rounded-lg hover:bg-catppuccin-bg transition-colors text-catppuccin-text-soft border border-catppuccin-border ${isRefreshingLeaderboard ? 'animate-spin' : ''}`}><RefreshCw size={16} /></button>}
              </div>
              <p className="text-[10px] text-catppuccin-text-soft mt-1 flex items-center gap-1 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-catppuccin-accent-soft animate-pulse"></span>Last synced: {lastSync === 0 ? 'Pending...' : Math.floor((Date.now() / 1000 - lastSync) / 60) < 1 ? 'Just now' : `${Math.floor((Date.now() / 1000 - lastSync) / 60)}m ago`}</p>
            </div>
            <div className="space-y-4">
              {leaderboard.length > 0 ? leaderboard.map((entry, idx) => {
                const [uid, pts, mult, username, avatar] = entry;
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-catppuccin-bg rounded-xl border-2 border-catppuccin-border hover:border-catppuccin-accent/20 transition-colors shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-catppuccin-text-soft w-4">{idx + 1}.</span>
                      {avatar ? <img src={`https://cdn.discordapp.com/avatars/${uid}/${avatar}.png`} alt="" className="w-8 h-8 rounded-full border border-catppuccin-border" /> : <div className="w-8 h-8 bg-catppuccin-bg-soft rounded-full flex items-center justify-center text-[10px] font-bold">{(username || 'U')[0].toUpperCase()}</div>}
                      <div className="min-w-0"><p className="text-sm font-bold truncate text-catppuccin-text">{username || `User ${uid.slice(-4)}`}</p><p className="text-[10px] text-catppuccin-text-soft flex items-center gap-1"><Zap size={10} className="text-catppuccin-accent-soft" /> x{mult}</p></div>
                    </div>
                    <p className="text-sm font-black text-catppuccin-accent-soft ml-2 whitespace-nowrap">{pts} <span className="text-[10px] font-normal text-catppuccin-text-soft">pts</span></p>
                  </div>
                );
              }) : <p className="text-center text-catppuccin-text-soft text-sm py-10 italic">No rankings yet...</p>}
            </div>
          </div>
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }} 
        whileInView={{ opacity: 1 }} 
        viewport={{ once: true }} 
        className={`mt-12 md:mt-20 ${isGlass ? 'bg-catppuccin-bg/95 backdrop-blur-md' : 'bg-catppuccin-bg'} border-2 border-catppuccin-border p-6 md:p-12 rounded-3xl md:rounded-[2.5rem] grid md:grid-cols-2 gap-8 md:gap-12 text-catppuccin-text-soft shadow-xl shadow-black/10 transition-all`}
      >
        <div>
          <h4 className="text-xl md:text-2xl font-bold mb-4 bg-gradient-to-r from-catppuccin-text to-catppuccin-text-soft bg-clip-text text-transparent">About Project</h4>
          <p className="leading-relaxed mb-6 text-sm md:text-base font-medium">Langy uses semantic embeddings and hierarchical linguistic analysis to understand the <em>meaning</em> behind your translations.</p>
        </div>
        <div>
          <h4 className="text-xl md:text-2xl font-bold mb-4 text-catppuccin-accent">Add to Discord</h4>
          <p className="leading-relaxed mb-6 md:mb-8 text-sm md:text-base font-medium">Master new languages with your community! Add Langy for daily challenges and leaderboard tracking.</p>
          <motion.a 
            whileHover={{ scale: 1.05, y: -2 }} 
            whileTap={{ scale: 0.95 }} 
            href={clientId ? `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=2147483648&scope=bot%20applications.commands` : "#"} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`inline-flex items-center justify-center gap-3 bg-catppuccin-accent hover:brightness-110 px-6 md:px-10 py-4 md:py-5 rounded-2xl font-black text-catppuccin-bg shadow-2xl shadow-catppuccin-accent/30 transition-all border-2 border-catppuccin-accent/20 w-full sm:w-auto ${!clientId ? 'opacity-50' : ''}`}
          >
            <Bot size={24} />{clientId ? 'Add Langy to Discord' : 'Loading...'}
          </motion.a>
        </div>
      </motion.div>

      {/* Security & Privacy Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`mt-8 md:mt-12 ${isGlass ? 'bg-catppuccin-bg/95 backdrop-blur-sm' : 'bg-catppuccin-bg'} border-2 border-catppuccin-border rounded-2xl md:rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-lg shadow-black/10 transition-all`}
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <ShieldCheck size={120} />
        </div>
        
        <h4 className="text-xs md:text-sm font-bold mb-8 flex items-center gap-2 text-catppuccin-text uppercase tracking-widest">
          <Lock size={16} className="text-catppuccin-accent" /> Privacy & Data Security
        </h4>

        <div className="grid md:grid-cols-3 gap-8 relative z-10">
          <div className="space-y-4">
            <h5 className="font-bold flex items-center gap-2 text-catppuccin-text text-sm md:text-base">
              <ShieldCheck size={18} className="text-catppuccin-accent" /> What we store
            </h5>
            <ul className="text-[10px] md:text-xs text-catppuccin-text space-y-2 leading-relaxed font-medium">
              <li>- <strong>Discord ID:</strong> To link your points to your account.</li>
              <li>- <strong>Username and Avatar:</strong> To display on the global leaderboard.</li>
              <li>- <strong>Game Stats:</strong> Your points, streaks, and timestamps.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="font-bold flex items-center gap-2 text-catppuccin-text text-sm md:text-base">
              <EyeOff size={18} className="text-red-400" /> What we NEVER access
            </h5>
            <ul className="text-[10px] md:text-xs text-catppuccin-text space-y-2 leading-relaxed font-medium">
              <li>- Your <strong>Email Address</strong> is never requested.</li>
              <li>- Your <strong>Server List</strong> and private messages.</li>
              <li>- Any information not marked as 'Public' on Discord.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="font-bold flex items-center gap-2 text-catppuccin-text text-sm md:text-base">
              <Lock size={18} className="text-catppuccin-accent-soft" /> Security
            </h5>
            <p className="text-[10px] md:text-xs text-catppuccin-text font-medium leading-relaxed">
              Langy uses <strong>JSON Web Tokens (JWT)</strong> for secure session management. 
              Data is stored in a <strong>Supabase (PostgreSQL)</strong> database protected by 
              Row Level Security (RLS) to ensure data integrity.
            </p>
          </div>
        </div>

        <p className="mt-8 pt-8 border-t-2 border-catppuccin-border text-[10px] text-catppuccin-text-soft italic text-center font-bold">
          Discord login uses the <strong>'identify'</strong> scope only. No administrative permissions are requested.
        </p>
      </motion.div>
    </div>
  )
}

const Footer = ({ isGlass }: { isGlass: boolean }) => {
  return (
    <footer id="global-footer" className={`relative z-50 mt-auto py-8 px-6 border-t-2 border-catppuccin-border ${isGlass ? 'bg-catppuccin-bg/95 backdrop-blur-2xl' : 'bg-catppuccin-bg'} transition-all`}>
      <div className="max-w-6xl mx-auto flex justify-center">
        <p className="text-[10px] text-catppuccin-text-soft font-bold tracking-[0.2em] uppercase">
          © {new Date().getFullYear()} Clorece Portfolio
        </p>
      </div>
    </footer>
  );
};

function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  const [isGlass, setIsGlass] = useState(() => {
    const saved = localStorage.getItem('glass_effect');
    return saved ? saved === 'true' : false; // Default to off
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('glass_effect', isGlass.toString());
  }, [isGlass]);

  return (
    <Router>
      <div className="min-h-screen flex flex-col text-catppuccin-text selection:bg-catppuccin-accent/30 relative">
        <NodeBackground />
        <div className="flex-grow flex flex-col relative z-10">
          <Navbar 
            isDark={isDark} 
            toggleTheme={() => setIsDark(!isDark)} 
            isGlass={isGlass} 
            toggleGlass={() => setIsGlass(!isGlass)} 
          />
          <Routes>
            <Route path="/" element={<><Hero isGlass={isGlass} /><Projects isGlass={isGlass} /></>} />
            <Route path="/langy" element={<LangyPage isGlass={isGlass} />} />
          </Routes>
          <Footer isGlass={isGlass} />
        </div>
      </div>
    </Router>
  )
}

export default App
