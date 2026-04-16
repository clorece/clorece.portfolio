import { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Languages, Trophy, Zap, Globe, Github, LogIn, LogOut, Send, Loader2, CheckCircle2, XCircle, AlertCircle, Search, ShieldCheck, Lock, EyeOff, RefreshCw, Bot, ExternalLink } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || "/api"

// --- Components ---

const renderMarkdown = (text: string) => {
  if (!text) return null;
  // Handle bold (**text**) and italics (*text*)
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-200">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic text-slate-300">{part.slice(1, -1)}</em>;
    }
    return part;
  });
};

const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
        MyPortfolio
      </Link>
      <div className="flex gap-8">
        <Link to="/" className="hover:text-blue-400 transition-colors text-sm font-medium">Projects</Link>
        <Link to="/langy" className="hover:text-emerald-400 transition-colors flex items-center gap-1 text-sm font-medium">
          <Languages size={16} /> Langy
        </Link>
      </div>
    </div>
  </nav>
)

const Hero = () => (
  <section className="pt-32 pb-20 px-4 text-center">
    <motion.h1 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-5xl md:text-7xl font-extrabold mb-6"
    >
      Building Digital <br />
      <span className="text-blue-500">Experiences</span>
    </motion.h1>
    <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
      I'm a developer passionate about creating interactive applications, from Discord bots to modern web platforms.
    </p>
    <div className="flex justify-center gap-4">
      <Link to="/langy" className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-full font-semibold transition-all flex items-center gap-2">
        Try Langy Bot <Zap size={18} />
      </Link>
      <a href="https://github.com" className="border border-slate-700 hover:bg-slate-800 px-8 py-3 rounded-full font-semibold transition-all flex items-center gap-2">
        GitHub <Github size={18} />
      </a>
    </div>
  </section>
)

const ProjectCard = ({ title, description, tags, link }: any) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all group">
    <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-400 transition-colors">{title}</h3>
    <p className="text-slate-400 mb-6">{description}</p>
    <div className="flex flex-wrap gap-2 mb-6">
      {tags.map((tag: string) => (
        <span key={tag} className="text-xs font-medium bg-slate-900 px-3 py-1 rounded-full text-slate-300 border border-slate-700">
          {tag}
        </span>
      ))}
    </div>
    <Link to={link} className="text-blue-400 font-semibold hover:underline">View Project &rarr; </Link>
  </div>
)

const Projects = () => (
  <section id="projects" className="py-20 max-w-7xl mx-auto px-4">
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
  </section>
)

// --- Langy Web App ---

const LangyPage = () => {
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

  useEffect(() => {
    fetchLanguages()
    // Fetch Discord Client ID for invite button
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
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)
      const diff = midnight.getTime() - now.getTime()
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const urlToken = searchParams.get('token')
    if (urlToken) {
      localStorage.setItem('langy_token', urlToken)
      setToken(urlToken)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [searchParams])

  useEffect(() => {
    if (token) {
      fetchUserStats()
    }
    fetchLeaderboard()
    
    // Refresh the local sync timer display every 30 seconds
    const interval = setInterval(() => {
      setLastSync(prev => prev) // Force re-render
    }, 30000)
    
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
      const res = await fetch(`${API_BASE}/user/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        // Relaxed check: Only error if points are somehow undefined or connection explicitly failed
        if (data.points === undefined) setDbError(true);
      } else {
        localStorage.removeItem('langy_token')
        setToken(null)
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
      // Small artificial delay for the animation to feel satisfying
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
      const res = await fetch(`${API_BASE}/challenge?language=${selectedLanguage}&category=${category}`)
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
    <div className="pt-32 max-w-5xl mx-auto px-4 pb-20">
      {/* User Header */}
      {token && user && (
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 bg-slate-800/30 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm gap-6">
          <div className="flex items-center gap-4">
            {user?.avatar ? (
              <img 
                src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} 
                alt="Profile"
                className="w-14 h-14 rounded-full border-2 border-emerald-500 shadow-lg shadow-emerald-500/20"
              />
            ) : (
              <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-2xl text-slate-900">
                {user?.username?.[0].toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-bold text-xl">{user?.username}</h3>
              <p className="text-sm text-slate-400">Level: Language Learner</p>
            </div>
          </div>
          <div className="flex gap-8 items-center">
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Total Points</p>
              <p className="text-2xl font-bold text-blue-400">{user?.points || 0}</p>
            </div>
            <div className="text-center border-l border-slate-700 pl-8">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Streak Multiplier</p>
              <p className="text-2xl font-bold text-orange-400">
                <Zap className="inline-block mr-1" size={24} /> x{user?.multiplier || 1} Streak
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="ml-4 p-2 text-slate-400 hover:text-red-400 transition-colors border border-slate-700 rounded-lg hover:bg-red-500/10"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      )}

      {dbError && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle size={20} />
          <p className="text-sm">Database connection issue detected. Points may not be saving correctly.</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* How to Play Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/30 border border-slate-800 rounded-3xl p-6"
          >
            <h4 className="text-sm font-bold mb-6 flex items-center gap-2 text-slate-400 uppercase tracking-widest">
              <AlertCircle size={16} className="text-blue-400" /> How to Play
            </h4>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 mb-3 border border-blue-500/20">1</div>
                <h5 className="font-bold text-sm">Pick a Language</h5>
                <p className="text-xs text-slate-500 leading-relaxed">Choose from 20 top-studied languages and select your difficulty (Word or Sentence).</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 mb-3 border border-emerald-500/20">2</div>
                <h5 className="font-bold text-sm">Translate</h5>
                <p className="text-xs text-slate-500 leading-relaxed">Translate the prompt. Our AI grades you on meaning, not just spelling!</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-400 mb-3 border border-orange-500/20">3</div>
                <h5 className="font-bold text-sm">Earn Points</h5>
                <p className="text-xs text-slate-500 leading-relaxed">Maintain your daily streak to multiply your rewards and climb the leaderboard.</p>
              </div>
            </div>
          </motion.div>

          {!challenge ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 shadow-2xl"
            >
              <h4 className="text-xl font-bold mb-8 flex items-center gap-2">
                <Zap className="text-emerald-400" /> Start a Challenge
              </h4>
              
              <div className="grid md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">1. Mode</p>
                  <div className="flex gap-2">
                    <button onClick={() => setIsInverse(false)} className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${!isInverse ? 'bg-blue-600 border-blue-500' : 'border-slate-700 hover:bg-slate-800'}`}>Standard</button>
                    <button onClick={() => setIsInverse(true)} className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${isInverse ? 'bg-blue-600 border-blue-500' : 'border-slate-700 hover:bg-slate-800'}`}>Inverse</button>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">2. Difficulty</p>
                  <div className="flex gap-2">
                    <button onClick={() => setCategory('Word')} className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${category === 'Word' ? 'bg-emerald-600 border-emerald-500' : 'border-slate-700 hover:bg-slate-800'}`}>Word</button>
                    <button onClick={() => setCategory('Sentence')} className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${category === 'Sentence' ? 'bg-emerald-600 border-emerald-500' : 'border-slate-700 hover:bg-slate-800'}`}>Sentence</button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">3. Language Selection</p>
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={14} />
                    <input 
                      type="text"
                      placeholder="Search languages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none w-48 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar bg-slate-900/30 p-4 rounded-2xl border border-slate-800">
                  {languages
                    .filter(lang => lang.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(lang => (
                      <button 
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`border p-3 rounded-xl font-semibold text-xs transition-all focus:ring-2 focus:ring-emerald-500 outline-none truncate ${selectedLanguage === lang ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-400'}`}
                        title={lang}
                      >
                        {lang}
                      </button>
                    ))}
                </div>
              </div>

              <div className="pt-8 border-t border-slate-700 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => startChallenge('practice')}
                  disabled={loading}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                   Practice Only
                </button>
                
                {!token ? (
                  <a 
                    href={`${API_BASE}/auth/login`}
                    className="flex-1 bg-[#5865F2] hover:bg-[#4752C4] py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl text-white"
                  >
                    <LogIn size={20} /> Login for Daily
                  </a>
                ) : user?.can_do_daily ? (
                  <button 
                    onClick={() => startChallenge('daily')}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                  >
                    <Trophy size={18} /> Launch Daily
                  </button>
                ) : (
                  <div className="flex-1 h-full flex flex-col items-center justify-center px-4 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-500 text-sm font-medium">
                    <span className="italic opacity-60">Next Daily In:</span>
                    <span className="font-mono text-lg text-emerald-500/80">{timeLeft}</span>
                  </div>
                )}
              </div>
              
              {(!token || user?.can_do_daily) && (
                <p className="text-center text-xs text-slate-500 mt-4 uppercase tracking-tighter">
                  Potential Reward: <span className="text-emerald-400 font-bold">{(category === 'Word' ? 15 : 30) * (user?.multiplier || 1)} Pts</span>
                </p>
              )}
              {isInverse && (
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                  <Globe size={20} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    <strong>Keyboard Note:</strong> Inverse mode requires typing in the target language. Ensure you have the correct input method (IME) active.
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800/50 border border-slate-700 rounded-3xl p-10 relative overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <span className="bg-blue-600/20 text-blue-400 px-4 py-1 rounded-full text-xs font-bold border border-blue-500/30 uppercase tracking-widest">
                  {isDaily ? 'Daily' : 'Practice'} - {challenge.category}
                </span>
                <div className={`text-xl font-mono font-bold ${timer < 10 ? 'text-red-500' : 'text-slate-400'}`}>
                  00:{timer < 10 ? `0${timer}` : timer}
                </div>
              </div>

              <h2 className="text-center text-slate-400 mb-4 tracking-widest uppercase text-xs font-bold">
                {isInverse ? `Translate to ${challenge.language}` : 'Translate to English'}
              </h2>
              <h1 className="text-center text-4xl md:text-5xl font-extrabold mb-12 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                {isInverse ? challenge.english_word : challenge.translated_word}
              </h1>

              {isInverse && challenge.meaning_hint && (
                <p className="text-center text-slate-400 italic mb-12 -mt-8">
                  {challenge.meaning_hint}
                </p>
              )}

              <AnimatePresence>
                {!result ? (
                  <div className="flex gap-4">
                    <input 
                      autoFocus
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && answer && submitAnswer()}
                      placeholder={isInverse ? `Type in ${challenge.language}...` : "Type English translation..."}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                    />
                    <button 
                      onClick={submitAnswer}
                      disabled={loading || !answer}
                      className="bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl disabled:opacity-50 transition-all shadow-lg"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : <Send />}
                    </button>
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <div className={`inline-flex items-center gap-2 px-6 py-2 rounded-full mb-6 font-bold ${result.is_correct ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-600/20 text-red-400 border border-red-500/30'}`}>
                      {result.is_correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                      {result.is_correct ? 'Correct!' : 'Incorrect'}
                    </div>

                    <div className="mb-8">
                      <p className="text-sm text-slate-500 uppercase tracking-widest mb-1">Accuracy Score</p>
                      <p className={`text-4xl font-black ${result.is_correct ? 'text-emerald-400' : 'text-red-400'}`}>
                        {(result.score * 100).toFixed(0)}%
                      </p>
                    </div>
                    
                    <div className="space-y-2 mb-8 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                      <p className="text-xl font-bold text-slate-200">
                        Expected: <span className="text-emerald-400">{isInverse ? challenge.translated_word : result.expected}</span>
                      </p>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                        You said: <span className={result.is_correct ? "text-emerald-500/70" : "text-red-400/70"}>{answer}</span>
                      </p>
                      <div className="text-slate-400 italic text-sm leading-relaxed">
                        "{renderMarkdown(result.reason)}"
                      </div>
                    </div>
                    {result.earned && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl mb-8">
                        <p className="text-emerald-400 font-bold text-xl">+ {result.earned} Points!</p>
                      </div>
                    )}
                    <button onClick={() => setChallenge(null)} className="bg-slate-700 hover:bg-slate-600 px-12 py-3 rounded-xl font-bold transition-all shadow-md">
                      Finish
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Sidebar - Leaderboard */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/30 border border-slate-800 rounded-3xl p-6 h-full backdrop-blur-sm">
            <div className="flex flex-col mb-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold flex items-center gap-2">
                  <Trophy className="text-yellow-500" size={20} /> Leaderboard
                </h4>
                {token && (
                  <button 
                    onClick={handleRefreshLeaderboard}
                    disabled={isRefreshingLeaderboard}
                    className={`p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-500 hover:text-emerald-400 ${isRefreshingLeaderboard ? 'animate-spin' : ''}`}
                    title="Manual Refresh"
                  >
                    <RefreshCw size={16} />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Last synced: {lastSync === 0 ? 'Pending...' : 
                  Math.floor((Date.now() / 1000 - lastSync) / 60) < 1 ? 'Just now' : 
                  `${Math.floor((Date.now() / 1000 - lastSync) / 60)}m ago`}
              </p>
            </div>
            <div className="space-y-4">
              {leaderboard.length > 0 ? leaderboard.map((entry, idx) => {
                const [uid, pts, mult, username, avatar] = entry;
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-slate-500 w-4">{idx + 1}.</span>
                      {avatar ? (
                        <img 
                          src={`https://cdn.discordapp.com/avatars/${uid}/${avatar}.png`} 
                          alt="" 
                          className="w-8 h-8 rounded-full border border-slate-700"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold">
                          {(username || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate text-slate-200">
                          {username || `User ${uid.slice(-4)}`}
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Zap size={10} className="text-orange-400" /> x{mult} Streak
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-emerald-400 ml-2 whitespace-nowrap">{pts} <span className="text-[10px] font-normal text-slate-500">pts</span></p>
                  </div>
                );
              }) : (
                <p className="text-center text-slate-500 text-sm py-10 italic">No rankings yet...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* About Me / Project Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-20 pt-12 border-t border-slate-800 grid md:grid-cols-2 gap-12"
      >
        <div>
          <h4 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">About the Project</h4>
          <p className="text-slate-400 leading-relaxed mb-6">
            Langy is a demonstration of modern Natural Language Processing (NLP) in an interactive setting. 
            By using semantic embeddings and hierarchical linguistic analysis, Langy understands the <em>meaning</em> behind your translations rather than just checking for exact character matches.
          </p>
          <div className="flex gap-4">
            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase">Sentence Transformers</span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase">React/Framer Motion</span>
            <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400 uppercase">FastAPI</span>
          </div>
        </div>
        <div>
          <h4 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">Add Langy to Your Server</h4>
          <p className="text-slate-400 leading-relaxed mb-8">
            Master new languages with your community! Add Langy to your Discord server for daily challenges, leaderboard tracking, and group learning.
          </p>
          <motion.a 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            href={clientId ? `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=2147483648&scope=bot%20applications.commands` : "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 px-10 py-5 rounded-2xl font-black text-white shadow-2xl shadow-indigo-500/30 transition-all border border-indigo-400/20 ${!clientId ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Bot size={24} />
            {clientId ? 'Add Langy to Discord' : 'Loading Invite...'}
          </motion.a>
        </div>
      </motion.div>

      {/* Security & Privacy Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-12 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <ShieldCheck size={120} />
        </div>
        
        <h4 className="text-sm font-bold mb-8 flex items-center gap-2 text-slate-400 uppercase tracking-widest">
          <Lock size={16} className="text-emerald-400" /> Privacy & Data Security
        </h4>

        <div className="grid md:grid-cols-3 gap-8 relative z-10">
          <div className="space-y-4">
            <h5 className="font-bold flex items-center gap-2 text-slate-200">
              <ShieldCheck size={18} className="text-blue-400" /> What we store
            </h5>
            <ul className="text-xs text-slate-500 space-y-2 leading-relaxed">
              <li>- <strong>Discord ID:</strong> To link your points to your account.</li>
              <li>- <strong>Username and Avatar:</strong> To display on the global leaderboard.</li>
              <li>- <strong>Game Stats:</strong> Your points, streaks, and timestamps.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="font-bold flex items-center gap-2 text-slate-200">
              <EyeOff size={18} className="text-red-400" /> What we NEVER access
            </h5>
            <ul className="text-xs text-slate-500 space-y-2 leading-relaxed">
              <li>- Your <strong>Email Address</strong> is never requested.</li>
              <li>- Your <strong>Server List</strong> and private messages.</li>
              <li>- Any information not marked as 'Public' on Discord.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="font-bold flex items-center gap-2 text-slate-200">
              <Lock size={18} className="text-emerald-400" /> Security
            </h5>
            <p className="text-xs text-slate-500 leading-relaxed">
              Langy uses <strong>JSON Web Tokens (JWT)</strong> for secure session management. 
              Data is stored in a <strong>Supabase (PostgreSQL)</strong> database protected by 
              Row Level Security (RLS) to ensure data integrity.
            </p>
          </div>
        </div>

        <p className="mt-8 pt-8 border-t border-slate-800/50 text-[10px] text-slate-500 italic text-center">
          Discord login uses the <strong>'identify'</strong> scope only. No administrative permissions are requested.
        </p>
      </motion.div>
    </div>
  )
}

const Footer = () => {
  return (
    <footer id="global-footer" className="relative z-50 mt-auto py-8 px-6 border-t border-slate-800 bg-slate-900/95 backdrop-blur-2xl">
      <div className="max-w-6xl mx-auto flex justify-center">
        <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
          © {new Date().getFullYear()} Clorece Portfolio
        </p>
      </div>
    </footer>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#0f172a] text-slate-200">
        <div className="flex-grow">
          <Navbar />
          <Routes>
            <Route path="/" element={<><Hero /><Projects /></>} />
            <Route path="/langy" element={<LangyPage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  )
}

export default App
