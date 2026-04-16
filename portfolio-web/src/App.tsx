import { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Languages, Trophy, Zap, Globe, Github, LogIn, Send, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

// --- Components ---

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
    <Link to={link} className="text-blue-400 font-semibold hover:underline">View Project →</Link>
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
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:10000/api"

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
      fetchLeaderboard()
    }
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
      if (res.ok) setLeaderboard(await res.json())
    } catch (e) { console.error(e) }
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
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Total Points</p>
              <p className="text-2xl font-bold text-blue-400">{user?.points || 0}</p>
            </div>
            <div className="text-center border-l border-slate-700 pl-8">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Streak Multiplier</p>
              <p className="text-2xl font-bold text-orange-400">🔥 x{user?.multiplier || 1}</p>
            </div>
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
        <div className="lg:col-span-2">
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

              <div className="space-y-3 mb-10">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">3. Language Selection</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['Spanish', 'French', 'Japanese', 'German', 'Italian', 'Korean', 'Chinese', 'Russian'].map(lang => (
                    <button 
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`border p-3 rounded-xl font-semibold text-sm transition-all focus:ring-2 focus:ring-emerald-500 outline-none ${selectedLanguage === lang ? 'bg-emerald-600 border-emerald-500' : 'bg-slate-900 border-slate-700 hover:bg-slate-800'}`}
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
                  {isDaily ? 'Daily' : 'Practice'} • {challenge.category}
                </span>
                <div className={`text-xl font-mono font-bold ${timer < 10 ? 'text-red-500' : 'text-slate-400'}`}>
                  00:{timer < 10 ? `0${timer}` : timer}
                </div>
              </div>

              <h2 className="text-center text-slate-400 mb-4 tracking-widest uppercase text-xs font-bold">
                {isInverse ? `Translate to ${challenge.language}` : 'Translate to English'}
              </h2>
              <h1 className="text-center text-4xl md:text-5xl font-extrabold mb-12 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                ✨ {isInverse ? challenge.english_word : challenge.translated_word} ✨
              </h1>

              <AnimatePresence>
                {!result ? (
                  <div className="flex gap-4">
                    <input 
                      autoFocus
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
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
                      <p className="text-slate-400 italic text-sm leading-relaxed">
                        "{result.reason}"
                      </p>
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
            <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Trophy className="text-yellow-500" size={20} /> Leaderboard
            </h4>
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
                          🔥 x{mult} Streak
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
    </div>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0f172a] text-slate-200">
        <Navbar />
        <Routes>
          <Route path="/" element={<><Hero /><Projects /></>} />
          <Route path="/langy" element={<LangyPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
