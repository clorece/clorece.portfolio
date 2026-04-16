import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Languages, Trophy, Zap, Globe, Github, LogIn, Send, Loader2, CheckCircle2, XCircle } from 'lucide-react'

// --- Components ---

const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
        MyPortfolio
      </Link>
      <div className="flex gap-8">
        <Link to="/" className="hover:text-blue-400 transition-colors">Projects</Link>
        <Link to="/langy" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
          <Languages size={18} /> Langy
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
  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all">
    <h3 className="text-2xl font-bold mb-3">{title}</h3>
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
      {/* Add more projects here */}
    </div>
  </section>
)

// --- Langy Web App ---

const LangyPage = () => {
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState<string | null>(localStorage.getItem('langy_token'))
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [challenge, setChallenge] = useState<any>(null)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<any>(null)
  const [timer, setTimer] = useState(60)
  const [category, setCategory] = useState<'Word' | 'Sentence'>('Word')
  const [isDaily, setIsDaily] = useState(false)
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:10000/api"

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
  }, [token])

  useEffect(() => {
    let interval: any
    if (challenge && !result && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000)
    } else if (timer === 0 && !result) {
      submitAnswer()
    }
    return () => clearInterval(interval)
  }, [challenge, result, timer])

  const fetchUserStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/user/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setUser(await res.json())
      else {
        localStorage.removeItem('langy_token')
        setToken(null)
      }
    } catch (e) { console.error(e) }
  }

  const startChallenge = async (lang: string, type: 'practice' | 'daily') => {
    setLoading(true)
    setIsDaily(type === 'daily')
    setResult(null)
    setAnswer('')
    setTimer(60)
    try {
      const res = await fetch(`${API_BASE}/challenge?language=${lang}&category=${category}`)
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          language: challenge.language,
          original_english: challenge.english_word,
          user_input: answer,
          is_daily: isDaily,
          category: challenge.category
        })
      })
      const data = await res.json()
      setResult(data)
      fetchUserStats()
    } catch (e) { alert("Failed to grade answer") }
    setLoading(false)
  }

  if (!token) {
    return (
      <div className="pt-40 flex flex-col items-center px-4">
        <Languages size={64} className="text-emerald-500 mb-6" />
        <h2 className="text-4xl font-bold mb-4">Langy Web</h2>
        <p className="text-slate-400 mb-8 max-w-md text-center">
          Practice languages and build your streak directly from your browser.
        </p>
        <a 
          href={`${API_BASE}/auth/login`}
          className="bg-[#5865F2] hover:bg-[#4752C4] px-10 py-4 rounded-full font-bold flex items-center gap-3 transition-all"
        >
          <LogIn size={20} /> Login with Discord
        </a>
      </div>
    )
  }

  return (
    <div className="pt-32 max-w-4xl mx-auto px-4 pb-20">
      <div className="flex items-center justify-between mb-12 bg-slate-800/30 p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-xl">
            {user?.username?.[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-lg">{user?.username}</h3>
            <p className="text-sm text-slate-400">Language Learner</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Points</p>
            <p className="text-xl font-bold text-blue-400">{user?.points}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Streak</p>
            <p className="text-xl font-bold text-orange-400">🔥 x{user?.multiplier}</p>
          </div>
        </div>
      </div>

      {!challenge ? (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700">
            <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Zap className="text-emerald-400" /> Start Practice
            </h4>
            <div className="flex gap-4 mb-6">
              <button 
                onClick={() => setCategory('Word')}
                className={`flex-1 py-2 rounded-lg border ${category === 'Word' ? 'bg-emerald-600 border-emerald-500' : 'border-slate-700 hover:bg-slate-800'}`}
              >Word</button>
              <button 
                onClick={() => setCategory('Sentence')}
                className={`flex-1 py-2 rounded-lg border ${category === 'Sentence' ? 'bg-emerald-600 border-emerald-500' : 'border-slate-700 hover:bg-slate-800'}`}
              >Sentence</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['Spanish', 'French', 'Japanese', 'German'].map(lang => (
                <button 
                  key={lang}
                  onClick={() => startChallenge(lang, 'practice')}
                  disabled={loading}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-700 p-4 rounded-xl font-semibold disabled:opacity-50"
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-8 rounded-3xl border border-indigo-500/30">
            <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Trophy className="text-yellow-400" /> Daily Challenge
            </h4>
            <p className="text-slate-300 mb-8">
              Test your skills once a day to earn points and grow your multiplier!
            </p>
            {user?.can_do_daily ? (
              <button 
                onClick={() => startChallenge('Spanish', 'daily')}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-bold transition-all disabled:opacity-50"
              >
                Launch Daily Challenge
              </button>
            ) : (
              <div className="text-center p-4 bg-slate-900/50 rounded-xl border border-slate-700 text-slate-400">
                Come back tomorrow! 
              </div>
            )}
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800/50 border border-slate-700 rounded-3xl p-10 relative overflow-hidden"
        >
          <div className="flex justify-between items-center mb-8">
            <span className="bg-blue-600/20 text-blue-400 px-4 py-1 rounded-full text-sm font-bold border border-blue-500/30">
              {isDaily ? 'DAILY' : 'PRACTICE'} • {challenge.category.toUpperCase()}
            </span>
            <div className={`text-xl font-mono font-bold ${timer < 10 ? 'text-red-500' : 'text-slate-400'}`}>
              00:{timer < 10 ? `0${timer}` : timer}
            </div>
          </div>

          <h2 className="text-center text-slate-400 mb-4 tracking-widest uppercase text-sm">Translate to English</h2>
          <h1 className="text-center text-4xl md:text-5xl font-extrabold mb-12">
            ✨ {challenge.translated_word} ✨
          </h1>

          <AnimatePresence>
            {!result ? (
              <div className="flex gap-4">
                <input 
                  autoFocus
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
                  placeholder="Type your translation..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <button 
                  onClick={submitAnswer}
                  disabled={loading || !answer}
                  className="bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl disabled:opacity-50 transition-all"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Send />}
                </button>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className={`inline-flex items-center gap-2 px-6 py-2 rounded-full mb-6 font-bold ${result.is_correct ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-600/20 text-red-400 border border-red-500/30'}`}>
                  {result.is_correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                  {result.is_correct ? 'Correct Answer!' : 'Incorrect'}
                </div>
                
                <p className="text-2xl font-bold mb-2">Expected: <span className="text-emerald-400">{result.expected}</span></p>
                <p className="text-slate-400 mb-8 italic">"{result.reason}"</p>

                {result.earned && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl mb-8">
                    <p className="text-emerald-400 font-bold text-xl">+ {result.earned} Points Earned!</p>
                  </div>
                )}

                <button 
                  onClick={() => setChallenge(null)}
                  className="bg-slate-700 hover:bg-slate-600 px-8 py-3 rounded-xl font-bold transition-all"
                >
                  Continue
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0f172a] text-slate-200">
        <Navbar />
        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <Projects />
            </>
          } />
          <Route path="/langy" element={<LangyPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
