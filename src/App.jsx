import { useState, useEffect, useCallback } from 'react'

// ── CONSTANTS ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a creative at-home activity generator for parents. Generate ONE specific, highly personalized activity using ONLY the materials the parent listed.

CRITICAL RULES:
1. Use ONLY the materials listed. Do NOT require any other materials.
2. Make the activity deeply specific to the child's stated interests.
3. Activity must be completable in under 2 hours.
4. Match difficulty: simple=minimal mess, medium=some setup, crafty=real project.
5. Match energy: calm=seated, medium=some movement, wild=active.
6. Age-appropriate.
7. For books: recommend a real, well-known children's book matching the activity theme. Use actual titles that exist.
8. For spice-up products: suggest 1-3 specific affordable products under $25. Be specific — not "craft supplies" but "Crayola washable dot markers."

Respond ONLY in valid JSON, no markdown:
{"activity_name":"Creative fun name","tagline":"One sentence that makes a kid say YES","duration":"e.g. 25-35 min","steps":["Step 1","Step 2","Step 3","Step 4"],"why_kids_love_it":"Brief reason tied to their specific interests","parent_tip":"One practical tip","materials_used":["item1","item2"],"book":{"title":"Real book title","author":"Author name","why":"One sentence connecting this book to the activity and child's interests"},"spice_ups":[{"name":"Specific product name","why":"How it enhances the activity","search":"Amazon search term"},{"name":"Specific product name","why":"How it enhances the activity","search":"Amazon search term"}],"kiwico_angle":"One sentence about KiwiCo relevance"}`

const AGE_GROUPS = [
  { v: '2-3', l: '2–3 yrs', e: '🐣', d: 'Toddler' },
  { v: '4-5', l: '4–5 yrs', e: '🌱', d: 'Preschool' },
  { v: '6-8', l: '6–8 yrs', e: '⭐', d: 'Elementary' },
  { v: '9-12', l: '9–12 yrs', e: '🚀', d: 'Tween' },
]
const ENERGY = [
  { v: 'calm', l: 'Calm & cozy', e: '☁️', d: 'Low-key, focused' },
  { v: 'medium', l: 'Playful', e: '🌤️', d: 'Some movement' },
  { v: 'wild', l: 'Full energy', e: '⚡', d: 'Needs to RUN IT OUT' },
]
const DIFFICULTY = [
  { v: 'simple', l: 'Keep it simple', e: '😊', d: 'Minimal mess' },
  { v: 'medium', l: 'We can do this', e: '🛠️', d: 'Some setup' },
  { v: 'crafty', l: "I'm crafty!", e: '🎨', d: 'Real project' },
]
const LOAD_STAGES = [
  { label: "Reading your child's profile...", pct: 15 },
  { label: 'Matching to your materials at home...', pct: 35 },
  { label: 'Crafting a personalized activity...', pct: 58 },
  { label: 'Finding the perfect book to pair...', pct: 75 },
  { label: 'Selecting product suggestions...', pct: 90 },
  { label: 'Almost done...', pct: 98 },
]
const ADMIN_KEY = 'zsadmin2026'
const KIWICO = 'https://www.kiwico.com/?ref=YOURAFFILIATEID'
const AMZN = (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=zenmonkeystud-20`

// ── STORAGE HELPERS ────────────────────────────────────────────────────────────

const storageSet = async (key, val, shared = true) => {
  try { await window.storage.set(key, JSON.stringify(val), shared) } catch {}
}
const storageGet = async (key, shared = true) => {
  try { const r = await window.storage.get(key, shared); return r ? JSON.parse(r.value) : null } catch { return null }
}
const storageList = async (prefix, shared = true) => {
  try { const r = await window.storage.list(prefix, shared); return r?.keys || [] } catch { return [] }
}

// ── MAIN APP ───────────────────────────────────────────────────────────────────

export default function App() {
  const [stage, setStage] = useState('landing')      // landing | quiz | loading | result | error
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({ age: '', interests: '', energy: '', materials: '', difficulty: '' })
  const [activity, setActivity] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [savedProfile, setSavedProfile] = useState(null)
  const [profileSaved, setProfileSaved] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [activeNav, setActiveNav] = useState('generator')
  const [loadStage, setLoadStage] = useState(0)
  const [currentPostId, setCurrentPostId] = useState(null)
  const [votedIds, setVotedIds] = useState(new Set())
  const [communityPosts, setCommunityPosts] = useState([])
  const [communityLoading, setCommunityLoading] = useState(false)
  const [bestOf, setBestOf] = useState([])
  const [bestOfLoading, setBestOfLoading] = useState(false)
  const [bestFilter, setBestFilter] = useState('all')
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [adminData, setAdminData] = useState([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminAge, setAdminAge] = useState('all')
  const [isAdmin, setIsAdmin] = useState(false)

  // Load persisted data on mount
  useEffect(() => {
    try { const s = localStorage.getItem('kid_profile_v3'); if (s) setSavedProfile(JSON.parse(s)) } catch {}
    try { const v = localStorage.getItem('voted_ids'); if (v) setVotedIds(new Set(JSON.parse(v))) } catch {}
    if (window.location.hash === '#admin') setIsAdmin(true)
  }, [])

  const saveVoted = (ids) => {
    try { localStorage.setItem('voted_ids', JSON.stringify([...ids])) } catch {}
  }
  const saveProfileToStorage = (ans) => {
    try { localStorage.setItem('kid_profile_v3', JSON.stringify(ans)) } catch {}
  }

  // ── API CALL ──
  const generate = useCallback(async (ans) => {
    setStage('loading')
    setErrorMsg('')
    setLoadStage(0)

    const timer = setInterval(() => {
      setLoadStage(prev => {
        if (prev < LOAD_STAGES.length - 1) return prev + 1
        clearInterval(timer)
        return prev
      })
    }, 1800)

    const msg = `Child age: ${ans.age}\nChild's interests: ${ans.interests}\nEnergy: ${ans.energy}\nDifficulty: ${ans.difficulty}\nMaterials at home: ${ans.materials}\n\nGenerate a personalized activity using ONLY these materials, deeply tied to the child's specific interests.`

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1200,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: msg }],
        }),
      })

      clearInterval(timer)

      if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`Server error ${res.status}: ${errBody.slice(0, 200)}`)
      }

      const data = await res.json()
      if (data.error) throw new Error(data.error.message || 'API returned an error')

      const txt = data.content?.find(b => b.type === 'text')?.text || ''
      if (!txt) throw new Error('No content in response')

      const parsed = JSON.parse(txt.replace(/```json|```/g, '').trim())
      setActivity(parsed)

      // Publish to community feed
      try {
        const id = 'post:' + Date.now() + ':' + Math.random().toString(36).slice(2, 7)
        const post = {
          id, votes: 0, ts: Date.now(),
          activity_name: parsed.activity_name, tagline: parsed.tagline,
          duration: parsed.duration, steps: parsed.steps,
          why_kids_love_it: parsed.why_kids_love_it, parent_tip: parsed.parent_tip,
          book: parsed.book || null, spice_ups: parsed.spice_ups || [],
          materials_used: parsed.materials_used || [],
          age: ans.age, interests: ans.interests, energy: ans.energy, difficulty: ans.difficulty,
        }
        await storageSet(id, post, true)
        setCurrentPostId(id)
      } catch {}

      setStage('result')
      setActiveNav('generator')
    } catch (e) {
      clearInterval(timer)
      setErrorMsg(e.message || 'Something went wrong')
      setStage('error')
    }
  }, [])

  // ── COMMUNITY / BEST OF ──
  const loadCommunity = async () => {
    setCommunityLoading(true)
    const keys = await storageList('post:', true)
    const posts = []
    for (const k of keys.slice(-60)) { const p = await storageGet(k, true); if (p) posts.push({ ...p, key: k }) }
    posts.sort((a, b) => b.ts - a.ts)
    setCommunityPosts(posts.slice(0, 30))
    setCommunityLoading(false)
  }

  const loadBestOf = async () => {
    setBestOfLoading(true)
    const keys = await storageList('post:', true)
    const posts = []
    for (const k of keys.slice(-100)) { const p = await storageGet(k, true); if (p && (p.votes || 0) >= 1) posts.push({ ...p, key: k }) }
    posts.sort((a, b) => (b.votes || 0) - (a.votes || 0))
    setBestOf(posts.slice(0, 20))
    setBestOfLoading(false)
  }

  const loadAdminData = async () => {
    setAdminLoading(true)
    const keys = await storageList('post:', true)
    const posts = []
    for (const k of keys) { const p = await storageGet(k, true); if (p) posts.push({ ...p, key: k }) }
    setAdminData(posts)
    setAdminLoading(false)
  }

  const handleUpvote = async (key) => {
    if (votedIds.has(key)) return
    const post = await storageGet(key, true)
    if (!post) return
    post.votes = (post.votes || 0) + 1
    await storageSet(key, post, true)
    const newIds = new Set(votedIds)
    newIds.add(key)
    setVotedIds(newIds)
    saveVoted(newIds)
    setCommunityPosts(prev => prev.map(p => p.key === key ? { ...p, votes: post.votes } : p))
    setBestOf(prev => prev.map(p => p.key === key ? { ...p, votes: post.votes } : p))
  }

  const switchNav = (tab) => {
    setActiveNav(tab)
    if (tab === 'community') loadCommunity()
    if (tab === 'bestof') loadBestOf()
  }

  const startFresh = () => {
    setStage('quiz'); setStep(0); setActivity(null); setErrorMsg('')
    setAnswers({ age: '', interests: '', energy: '', materials: '', difficulty: '' })
    setProfileSaved(false); setEmailSent(false); setActiveNav('generator')
  }

  const startSaved = () => {
    if (!savedProfile) return
    setAnswers({ ...savedProfile }); setStep(4); setStage('quiz')
    setProfileSaved(true); setEmailSent(false); setActivity(null); setActiveNav('generator')
  }

  const doSaveProfile = () => {
    saveProfileToStorage(answers); setSavedProfile({ ...answers }); setProfileSaved(true)
  }

  const shareActivity = () => {
    if (!activity) return
    const txt = `We just did "${activity.activity_name}" with things we already had at home and my kid LOVED it. Try whatshouldmykiddo.com 🎉`
    if (navigator.share) navigator.share({ text: txt, url: 'https://whatshouldmykiddo.com' })
    else navigator.clipboard?.writeText(txt).then(() => alert('Copied! Paste in your group chat.'))
  }

  const emailActivity = () => {
    if (!activity) return
    const sub = encodeURIComponent(`Activity: ${activity.activity_name}`)
    const body = encodeURIComponent(
      `${activity.activity_name}\n${activity.tagline}\n\nTime: ${activity.duration}\n\nSteps:\n${activity.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nParent tip: ${activity.parent_tip || ''}${activity.book ? `\n\nRead after: ${activity.book.title} by ${activity.book.author}` : ''}`
    )
    window.open(`mailto:?subject=${sub}&body=${body}`)
    setEmailSent(true)
  }

  const exportCSV = () => {
    const data = adminAge === 'all' ? adminData : adminData.filter(p => p.age === adminAge)
    if (!data.length) { alert('No data to export.'); return }
    const sorted = [...data].sort((a, b) => (b.votes || 0) - (a.votes || 0))
    const rows = [['Activity Name', 'Tagline', 'Age Group', 'Duration', 'Energy', 'Difficulty', 'Steps', 'Why Kids Love It', 'Parent Tip', 'Book Title', 'Book Author', 'Book Why', 'Votes', 'Timestamp']]
    sorted.forEach(p => rows.push([
      `"${(p.activity_name || '').replace(/"/g, '""')}"`,
      `"${(p.tagline || '').replace(/"/g, '""')}"`,
      p.age || '', `"${p.duration || ''}"`, p.energy || '', p.difficulty || '',
      `"${(p.steps || []).join(' | ').replace(/"/g, '""')}"`,
      `"${(p.why_kids_love_it || '').replace(/"/g, '""')}"`,
      `"${(p.parent_tip || '').replace(/"/g, '""')}"`,
      `"${(p.book?.title || '').replace(/"/g, '""')}"`,
      `"${(p.book?.author || '').replace(/"/g, '""')}"`,
      `"${(p.book?.why || '').replace(/"/g, '""')}"`,
      p.votes || 0, new Date(p.ts || 0).toLocaleDateString()
    ]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `activities_${adminAge}_${Date.now()}.csv`
    a.click()
  }

  // ── RENDER ──
  if (isAdmin) return <AdminView adminUnlocked={adminUnlocked} setAdminUnlocked={setAdminUnlocked} adminData={adminData} adminLoading={adminLoading} adminAge={adminAge} setAdminAge={setAdminAge} loadAdminData={loadAdminData} exportCSV={exportCSV} onExit={() => { setIsAdmin(false); if (history.pushState) history.pushState('', '', location.pathname) }} />

  if (stage === 'quiz' || stage === 'loading') {
    return stage === 'quiz'
      ? <QuizView step={step} answers={answers} setAnswers={setAnswers} onNext={(ans) => { if (step < 4) setStep(step + 1); else generate(ans) }} onPrev={() => setStep(step - 1)} />
      : <LoadingView loadStage={loadStage} interests={answers.interests} />
  }

  return (
    <div style={{ fontFamily: "'Nunito Sans', 'Trebuchet MS', system-ui, sans-serif", minHeight: '100vh', background: '#FFFCF5', color: '#2C2416' }}>
      <NavBar activeNav={activeNav} onSwitch={switchNav} stage={stage} />
      {stage === 'error' && <ErrorView errorMsg={errorMsg} answers={answers} onRetry={() => generate(answers)} onBack={() => setStage('quiz')} />}
      {stage === 'result' && activeNav === 'generator' && <ResultView activity={activity} answers={answers} currentPostId={currentPostId} votedIds={votedIds} profileSaved={profileSaved} emailSent={emailSent} savedProfile={savedProfile} onUpvote={handleUpvote} onSave={doSaveProfile} onEmail={emailActivity} onShare={shareActivity} onNew={startFresh} onNewSaved={startSaved} />}
      {activeNav === 'community' && <CommunityView posts={communityPosts} loading={communityLoading} votedIds={votedIds} onUpvote={handleUpvote} onRefresh={loadCommunity} onBuild={startFresh} />}
      {activeNav === 'bestof' && <BestOfView posts={bestOf} loading={bestOfLoading} filter={bestFilter} setFilter={setBestFilter} votedIds={votedIds} onUpvote={handleUpvote} onRefresh={loadBestOf} />}
      {activeNav === 'generator' && stage === 'landing' && <LandingView savedProfile={savedProfile} onStart={startFresh} onStartSaved={startSaved} />}
    </div>
  )
}

// ── NAV ────────────────────────────────────────────────────────────────────────

function NavBar({ activeNav, onSwitch }) {
  const tabs = [{ k: 'generator', l: '🎨 Generator' }, { k: 'community', l: '🌍 Community' }, { k: 'bestof', l: '⭐ Best Of' }]
  return (
    <div style={{ background: '#fff', borderBottom: '1.5px solid #FFE4B5', display: 'flex', overflowX: 'auto', padding: '0 8px', position: 'sticky', top: 0, zIndex: 10 }}>
      {tabs.map(t => (
        <button key={t.k} onClick={() => onSwitch(t.k)} style={{ cursor: 'pointer', padding: '10px 16px', fontSize: 13, fontWeight: 700, border: 'none', background: 'transparent', borderBottom: activeNav === t.k ? '3px solid #FF8C42' : '3px solid transparent', color: activeNav === t.k ? '#FF8C42' : '#888', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
          {t.l}
        </button>
      ))}
    </div>
  )
}

// ── LANDING ────────────────────────────────────────────────────────────────────

function LandingView({ savedProfile, onStart, onStartSaved }) {
  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg,#FF8C42,#FFCF77)', padding: '48px 24px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🎨</div>
        <h1 style={{ fontSize: 'clamp(26px,6vw,48px)', fontWeight: 900, color: '#fff', margin: '0 0 10px', lineHeight: 1.1, textShadow: '0 2px 8px rgba(0,0,0,.15)', fontFamily: 'Nunito, sans-serif' }}>
          What should my kid do today?
        </h1>
        <p style={{ color: 'rgba(255,255,255,.92)', fontSize: 'clamp(14px,3vw,17px)', margin: '0 0 26px', lineHeight: 1.5 }}>
          Tell us what's in your house. We'll build the perfect activity — just for your kid.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onStart} style={btnDark}>Build an activity →</button>
          {savedProfile && <button onClick={onStartSaved} style={btnGhost}>Use saved profile</button>}
        </div>
      </div>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
          {[['📦', 'Use what you have', 'No shopping required.'], ['🎯', 'Built for your kid', 'Tied to their specific interests, not generic categories.'], ['🌍', 'Community feed', 'See what others made. Upvote your favorites.']].map(([e, t, d]) => (
            <div key={t} style={{ background: '#fff', border: '1.5px solid #FFE4B5', borderRadius: 16, padding: '18px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{e}</div>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4, fontFamily: 'Nunito, sans-serif' }}>{t}</div>
              <div style={{ fontSize: 12, color: '#8C6E3F', lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <button onClick={onStart} style={btnOrange}>Let's go →</button>
        </div>
        <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', lineHeight: 1.6 }}>
          COPPA compliant — parents fill this out. No children's data collected.
        </p>
      </div>
    </div>
  )
}

// ── QUIZ ────────────────────────────────────────────────────────────────────────

function QuizView({ step, answers, setAnswers, onNext, onPrev }) {
  const stepNames = ['Age', 'Interests', 'Energy', 'Materials', 'Difficulty']
  const pct = ((step + 1) / 5) * 100

  const canAdvance = () => {
    if (step === 0) return !!answers.age
    if (step === 1) return answers.interests.trim().length > 3
    if (step === 2) return !!answers.energy
    if (step === 3) return answers.materials.trim().length > 5
    if (step === 4) return !!answers.difficulty
    return false
  }

  const handleNext = () => {
    // Read textarea values directly from DOM before advancing
    const interestsEl = document.getElementById('interests-input')
    const matsEl = document.getElementById('mats-input')
    const current = { ...answers }
    if (interestsEl) current.interests = interestsEl.value
    if (matsEl) current.materials = matsEl.value
    setAnswers(current)
    if (canAdvanceWith(current)) onNext(current)
  }

  const canAdvanceWith = (ans) => {
    if (step === 0) return !!ans.age
    if (step === 1) return ans.interests.trim().length > 3
    if (step === 2) return !!ans.energy
    if (step === 3) return ans.materials.trim().length > 5
    if (step === 4) return !!ans.difficulty
    return false
  }

  const handlePrev = () => {
    const interestsEl = document.getElementById('interests-input')
    const matsEl = document.getElementById('mats-input')
    if (interestsEl) setAnswers(a => ({ ...a, interests: interestsEl.value }))
    if (matsEl) setAnswers(a => ({ ...a, materials: matsEl.value }))
    onPrev()
  }

  return (
    <div style={{ fontFamily: "'Nunito Sans','Trebuchet MS',system-ui,sans-serif", minHeight: '100vh', background: '#FFFCF5' }}>
      <div style={{ background: '#FF8C42', padding: '11px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 13, fontFamily: 'Nunito, sans-serif' }}>Activity Generator</span>
        <span style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, fontWeight: 600 }}>{step + 1} / 5 — {stepNames[step]}</span>
      </div>
      <div style={{ height: 4, background: '#FFE4B5' }}>
        <div style={{ background: '#FF8C42', height: '100%', width: `${pct}%`, transition: 'width .4s ease' }} />
      </div>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '28px 18px' }}>
        {step === 0 && <AgeStep answers={answers} setAnswers={setAnswers} />}
        {step === 1 && <InterestsStep answers={answers} />}
        {step === 2 && <EnergyStep answers={answers} setAnswers={setAnswers} />}
        {step === 3 && <MaterialsStep answers={answers} />}
        {step === 4 && <DifficultyStep answers={answers} setAnswers={setAnswers} />}
        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          {step > 0 && <button onClick={handlePrev} style={btnOutline}>← Back</button>}
          <button onClick={handleNext} style={{ flex: 1, background: canAdvance() ? '#FF8C42' : '#FFD89E', color: canAdvance() ? '#fff' : '#A05A00', border: 'none', borderRadius: 50, padding: '11px 18px', fontSize: 15, fontWeight: 900, cursor: canAdvance() ? 'pointer' : 'default', fontFamily: 'Nunito, sans-serif' }}>
            {step < 4 ? 'Next →' : '✨ Build my activity'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
          Parents fill this out — no children's data collected.
        </p>
      </div>
    </div>
  )
}

function AgeStep({ answers, setAnswers }) {
  return (
    <>
      <p style={qStyle}>How old is your child?</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {AGE_GROUPS.map(ag => (
          <button key={ag.v} onClick={() => setAnswers(a => ({ ...a, age: ag.v }))}
            style={{ border: `2px solid ${answers.age === ag.v ? '#FF8C42' : '#FFE4B5'}`, borderRadius: 13, padding: '16px 10px', cursor: 'pointer', background: answers.age === ag.v ? '#FF8C42' : '#fff', color: answers.age === ag.v ? '#fff' : '#2C2416', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all .15s', fontFamily: 'Nunito, sans-serif' }}>
            <span style={{ fontSize: 22 }}>{ag.e}</span>
            <span style={{ fontWeight: 800, fontSize: 13 }}>{ag.l}</span>
            <span style={{ fontSize: 10, opacity: .7, fontWeight: 600 }}>{ag.d}</span>
          </button>
        ))}
      </div>
    </>
  )
}

function InterestsStep({ answers }) {
  return (
    <>
      <p style={qStyle}>What is your child into right now?</p>
      <p style={{ color: '#8C6E3F', fontSize: 13, margin: '0 0 12px', lineHeight: 1.6, fontWeight: 500 }}>
        Write it in your own words — the more specific, the better.<br />
        <em style={{ color: '#A07040' }}>e.g. "She loves shapes, counting, building tall towers" or "He's obsessed with dinosaurs and drawing maps"</em>
      </p>
      <textarea
        id="interests-input"
        defaultValue={answers.interests}
        placeholder="Tell us about your kid's interests, passions, and current obsessions..."
        style={{ width: '100%', border: '2px solid #FFE4B5', borderRadius: 13, padding: '13px 15px', fontSize: 14, fontFamily: 'Nunito Sans, sans-serif', resize: 'vertical', minHeight: 110, color: '#2C2416', background: '#FFFCF5', outline: 'none', boxSizing: 'border-box', lineHeight: 1.7 }}
        onFocus={e => e.target.style.borderColor = '#FF8C42'}
      />
      <div style={{ background: '#F5F0E8', borderRadius: 11, padding: '10px 13px', marginTop: 10 }}>
        <p style={{ margin: 0, fontSize: 11, color: '#8C6E3F', lineHeight: 1.7, fontWeight: 600 }}>
          💡 Tips: include specific things ("not just art, but drawing animals"), current obsessions, shows or books they love.
        </p>
      </div>
    </>
  )
}

function EnergyStep({ answers, setAnswers }) {
  return (
    <>
      <p style={qStyle}>Energy level right now?</p>
      {ENERGY.map(e => (
        <button key={e.v} onClick={() => setAnswers(a => ({ ...a, energy: e.v }))}
          style={{ width: '100%', border: `2px solid ${answers.energy === e.v ? '#FF8C42' : '#FFE4B5'}`, borderRadius: 13, padding: '13px 16px', marginBottom: 8, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, background: answers.energy === e.v ? '#FF8C42' : '#fff', color: answers.energy === e.v ? '#fff' : '#2C2416', transition: 'all .15s', fontFamily: 'Nunito, sans-serif' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{e.e}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{e.l}</div>
            <div style={{ fontSize: 11, opacity: .75, fontWeight: 600 }}>{e.d}</div>
          </div>
        </button>
      ))}
    </>
  )
}

function MaterialsStep({ answers }) {
  return (
    <>
      <p style={qStyle}>What do you have at home?</p>
      <p style={{ color: '#8C6E3F', fontSize: 13, margin: '0 0 10px', lineHeight: 1.5, fontWeight: 500 }}>
        List whatever's around — paper, boxes, tape, crayons, food items, string... The more you list, the better.
      </p>
      <textarea
        id="mats-input"
        defaultValue={answers.materials}
        placeholder="e.g. cardboard boxes, tape, crayons, aluminum foil, dried pasta, rubber bands, cups..."
        style={{ width: '100%', border: '2px solid #FFE4B5', borderRadius: 12, padding: '12px 14px', fontSize: 14, fontFamily: 'Nunito Sans, sans-serif', resize: 'vertical', minHeight: 90, color: '#2C2416', background: '#FFFCF5', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
        onFocus={e => e.target.style.borderColor = '#FF8C42'}
      />
    </>
  )
}

function DifficultyStep({ answers, setAnswers }) {
  return (
    <>
      <p style={qStyle}>How ambitious are we feeling?</p>
      {DIFFICULTY.map(d => (
        <button key={d.v} onClick={() => setAnswers(a => ({ ...a, difficulty: d.v }))}
          style={{ width: '100%', border: `2px solid ${answers.difficulty === d.v ? '#FF8C42' : '#FFE4B5'}`, borderRadius: 13, padding: '13px 16px', marginBottom: 8, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, background: answers.difficulty === d.v ? '#FF8C42' : '#fff', color: answers.difficulty === d.v ? '#fff' : '#2C2416', transition: 'all .15s', fontFamily: 'Nunito, sans-serif' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{d.e}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{d.l}</div>
            <div style={{ fontSize: 11, opacity: .75, fontWeight: 600 }}>{d.d}</div>
          </div>
        </button>
      ))}
    </>
  )
}

// ── LOADING ────────────────────────────────────────────────────────────────────

function LoadingView({ loadStage, interests }) {
  const stage = LOAD_STAGES[Math.min(loadStage, LOAD_STAGES.length - 1)]
  return (
    <div style={{ fontFamily: "'Nunito Sans','Trebuchet MS',system-ui,sans-serif", minHeight: '100vh', background: '#FFFCF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 460, width: '100%', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>🎨</div>
        <h2 style={{ fontSize: 19, fontWeight: 900, color: '#FF8C42', margin: '0 0 6px', fontFamily: 'Nunito, sans-serif' }}>Building your activity...</h2>
        <p style={{ color: '#8C6E3F', fontSize: 13, margin: '0 0 24px', minHeight: 18 }}>{stage.label}</p>
        <div style={{ background: '#FFE4B5', borderRadius: 50, height: 10, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ background: 'linear-gradient(90deg,#FF8C42,#FFCF77)', height: '100%', width: `${stage.pct}%`, borderRadius: 50, transition: 'width .8s ease' }} />
        </div>
        <p style={{ fontSize: 11, color: '#bbb', marginBottom: 24 }}>{stage.pct}% complete</p>
        <div style={{ background: '#FFF8F0', borderRadius: 13, padding: '14px 18px', textAlign: 'left' }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 800, color: '#FF8C42', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif' }}>Based on your answers</p>
          <p style={{ margin: 0, fontSize: 13, color: '#8C6E3F', lineHeight: 1.6 }}>
            Crafting something for: <strong style={{ color: '#2C2416' }}>{interests.slice(0, 60)}{interests.length > 60 ? '...' : ''}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── ERROR ──────────────────────────────────────────────────────────────────────

function ErrorView({ errorMsg, answers, onRetry, onBack }) {
  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😬</div>
      <h2 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 10px', fontFamily: 'Nunito, sans-serif' }}>Something went wrong</h2>
      <p style={{ fontSize: 14, color: '#8C6E3F', margin: '0 0 8px', lineHeight: 1.6 }}>
        The activity generator hit an error. Your answers are saved — just try again.
      </p>
      {errorMsg && <p style={{ fontSize: 11, color: '#888', background: '#F5F0E8', borderRadius: 8, padding: '8px 12px', margin: '0 0 24px', wordBreak: 'break-word', fontFamily: 'monospace', textAlign: 'left' }}>{errorMsg}</p>}
      {!errorMsg && <div style={{ marginBottom: 24 }} />}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onRetry} style={btnOrange}>↻ Try again</button>
        <button onClick={onBack} style={btnOutline}>← Edit answers</button>
      </div>
      <div style={{ marginTop: 28, background: '#FFF8F0', borderRadius: 13, padding: '14px 18px', textAlign: 'left' }}>
        <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 800, color: '#FF8C42', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif' }}>Your answers</p>
        <p style={{ margin: 0, fontSize: 13, color: '#8C6E3F', lineHeight: 1.7 }}>
          Age {answers.age} · {answers.energy} energy · {answers.difficulty}<br />
          <em style={{ color: '#2C2416' }}>"{answers.interests.slice(0, 80)}{answers.interests.length > 80 ? '...' : ''}"</em>
        </p>
      </div>
    </div>
  )
}

// ── RESULT ─────────────────────────────────────────────────────────────────────

function ResultView({ activity: act, answers: a, currentPostId, votedIds, profileSaved, emailSent, savedProfile, onUpvote, onSave, onEmail, onShare, onNew, onNewSaved }) {
  const voted = votedIds.has(currentPostId || '')
  const book = act.book || null
  const spiceUps = act.spice_ups || []

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg,#FF8C42,#FFCF77)', padding: '28px 20px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.8)', marginBottom: 5, fontFamily: 'Nunito, sans-serif' }}>Your personalized activity · age {a.age}</div>
        <h1 style={{ fontSize: 'clamp(20px,5vw,36px)', fontWeight: 900, color: '#fff', margin: '0 0 8px', lineHeight: 1.15, textShadow: '0 2px 6px rgba(0,0,0,.1)', fontFamily: 'Nunito, sans-serif' }}>{act.activity_name}</h1>
        <p style={{ color: 'rgba(255,255,255,.95)', fontSize: 'clamp(12px,3vw,15px)', margin: '0 0 12px', lineHeight: 1.5 }}>{act.tagline}</p>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[`⏱ ${act.duration}`, `⚡ ${a.energy}`, `🎯 ${a.difficulty}`].map(t => (
            <span key={t} style={{ background: 'rgba(255,255,255,.2)', borderRadius: 50, padding: '3px 11px', color: '#fff', fontSize: 11, fontWeight: 700 }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 660, margin: '0 auto', padding: '20px 16px' }}>
        {/* Steps card */}
        <div style={{ background: '#fff', borderRadius: 18, border: '2px solid #FFD89E', overflow: 'hidden', boxShadow: '0 4px 20px rgba(255,140,66,.1)', marginBottom: 14 }}>
          <div style={{ padding: '20px 20px 4px' }}>
            <div style={sectionLabel}>Steps</div>
            {act.steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 11, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#FF8C42', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#2C2416', fontWeight: 500 }}>{s}</p>
              </div>
            ))}
          </div>
          {act.why_kids_love_it && <InfoBox color="#FFF8F0" label="Why they'll love it" labelColor="#FF8C42" text={act.why_kids_love_it} textColor="#8C6E3F" />}
          {act.parent_tip && <InfoBox color="#F0F9FF" label="Parent tip" labelColor="#0369A1" text={act.parent_tip} textColor="#0C4A6E" border="1px solid #BAE6FD" />}
        </div>

        <Divider label="⬆ Make it even more special" />
        <p style={{ textAlign: 'center', fontSize: 12, color: '#8C6E3F', margin: '0 0 14px', lineHeight: 1.5 }}>
          Your kid can do this <strong>right now</strong> with what you have.<br />These extras are totally optional.
        </p>

        {/* Book */}
        {book && (
          <div onClick={() => window.open(AMZN(`${book.title} ${book.author} children book`), '_blank')}
            style={{ background: '#fff', border: '1.5px solid #E8D5FF', borderRadius: 14, padding: '16px 18px', marginBottom: 10, cursor: 'pointer', transition: 'all .2s' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 40, height: 52, background: 'linear-gradient(135deg,#7C3AED,#A855F7)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📖</div>
              <div style={{ flex: 1 }}>
                <div style={{ ...sectionLabel, color: '#7C3AED' }}>Read together after</div>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 2, lineHeight: 1.3, fontFamily: 'Nunito, sans-serif' }}>{book.title}</div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 5 }}>by {book.author}</div>
                <div style={{ fontSize: 12, color: '#5B21B6', lineHeight: 1.5, fontStyle: 'italic' }}>{book.why}</div>
              </div>
              <div style={{ flexShrink: 0, background: '#7C3AED', color: '#fff', borderRadius: 50, padding: '6px 12px', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', fontFamily: 'Nunito, sans-serif' }}>Amazon →</div>
            </div>
          </div>
        )}

        {/* Spice ups */}
        {spiceUps.length > 0 && (
          <div style={{ background: '#fff', border: '1.5px solid #FFE4B5', borderRadius: 14, padding: '16px 18px', marginBottom: 10 }}>
            <div style={sectionLabel}>Spice up playtime</div>
            {spiceUps.map((sp, i) => (
              <div key={i} onClick={() => window.open(AMZN(sp.search), '_blank')}
                style={{ background: '#F8F5F0', border: '1.5px solid #EEE', borderRadius: 11, padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', cursor: 'pointer', marginBottom: i < spiceUps.length - 1 ? 8 : 0, transition: 'all .2s' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2, fontFamily: 'Nunito, sans-serif' }}>{sp.name}</div>
                  <div style={{ fontSize: 12, color: '#8C6E3F', lineHeight: 1.4 }}>{sp.why}</div>
                </div>
                <div style={{ background: '#FF9900', color: '#2C2416', borderRadius: 50, padding: '6px 12px', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'Nunito, sans-serif' }}>Amazon →</div>
              </div>
            ))}
          </div>
        )}

        {/* KiwiCo */}
        {act.kiwico_angle && (
          <div style={{ background: '#FFF5F5', border: '1.5px solid #FECACA', borderRadius: 13, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ ...sectionLabel, color: '#DC2626' }}>Want a kit like this every month?</div>
              <p style={{ margin: 0, fontSize: 12, color: '#7F1D1D', lineHeight: 1.5 }}>{act.kiwico_angle}</p>
            </div>
            <a href={KIWICO} target="_blank" rel="noopener" style={{ background: '#DC2626', color: '#fff', borderRadius: 50, padding: '7px 12px', fontSize: 12, fontWeight: 800, flexShrink: 0, textDecoration: 'none', fontFamily: 'Nunito, sans-serif' }}>Try KiwiCo →</a>
          </div>
        )}

        <div style={{ height: 1, background: '#FFE4B5', margin: '16px 0 14px' }} />

        {/* Community share */}
        <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 11, padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <div>
            <div style={{ ...sectionLabel, color: '#15803D' }}>Shared to community</div>
            <p style={{ margin: 0, fontSize: 12, color: '#166534' }}>Other parents can see and upvote this.</p>
          </div>
          <button onClick={() => currentPostId && onUpvote(currentPostId)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: voted ? '#FFF0DC' : '#F5F5F5', border: `1.5px solid ${voted ? '#FF8C42' : '#ddd'}`, borderRadius: 10, padding: '7px 11px', cursor: voted ? 'default' : 'pointer', flexShrink: 0 }}>
            <span style={{ fontSize: 19 }}>{voted ? '🧡' : '🤍'}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: voted ? '#FF8C42' : '#888', fontFamily: 'Nunito, sans-serif' }}>{voted ? 'Liked!' : 'Like it'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <button onClick={onShare} style={{ flex: 1, minWidth: 90, background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: 50, padding: '9px 14px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>Share 🎉</button>
          <button onClick={onEmail} style={{ flex: 1, minWidth: 90, background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 50, padding: '9px 14px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>{emailSent ? '✓ Sent' : 'Email me'}</button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {!profileSaved
            ? <button onClick={onSave} style={btnOutline}>💾 Save profile</button>
            : <span style={{ background: '#E8F5E9', color: '#2D6A4F', borderRadius: 50, padding: '5px 12px', fontSize: 12, fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}>✓ Profile saved</span>}
          <button onClick={onNew} style={btnOutline}>New activity →</button>
          {savedProfile && <button onClick={onNewSaved} style={{ ...btnOutline, color: '#888', borderColor: '#ddd' }}>Quick new</button>}
        </div>

        <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
          No child data collected · parents fill everything out · whatshouldmykiddo.com
        </p>
      </div>
    </div>
  )
}

// ── COMMUNITY ──────────────────────────────────────────────────────────────────

function CommunityView({ posts, loading, votedIds, onUpvote, onRefresh, onBuild }) {
  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: '22px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 900, margin: '0 0 3px', fontFamily: 'Nunito, sans-serif' }}>🌍 Community Activities</h2>
          <p style={{ margin: 0, fontSize: 12, color: '#8C6E3F' }}>Real activities from parents — upvote your favorites</p>
        </div>
        <button onClick={onRefresh} style={{ ...btnOutline, fontSize: 12, padding: '6px 13px' }}>↻ Refresh</button>
      </div>
      {loading
        ? <Spinner />
        : posts.length === 0
          ? <EmptyState icon="🌱" title="No activities yet" sub="Generate the first one — it'll appear here automatically."><button onClick={onBuild} style={btnOrange}>Build an activity →</button></EmptyState>
          : posts.map(p => <ActivityCard key={p.key} post={p} voted={votedIds.has(p.key)} onUpvote={onUpvote} />)}
    </div>
  )
}

// ── BEST OF ────────────────────────────────────────────────────────────────────

function BestOfView({ posts, loading, filter, setFilter, votedIds, onUpvote, onRefresh }) {
  const filtered = filter === 'all' ? posts : posts.filter(p => p.age === filter)
  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: '22px 16px' }}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 17, fontWeight: 900, margin: '0 0 3px', fontFamily: 'Nunito, sans-serif' }}>⭐ Best Of</h2>
        <p style={{ margin: 0, fontSize: 12, color: '#8C6E3F' }}>Top-voted activities — these become the book</p>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {['all', ...AGE_GROUPS.map(a => a.v)].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ background: filter === f ? '#FF8C42' : '#F5F0E8', color: filter === f ? '#fff' : '#8C6E3F', border: 'none', borderRadius: 50, padding: '5px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
            {f === 'all' ? 'All ages' : AGE_GROUPS.find(a => a.v === f)?.l || f}
          </button>
        ))}
      </div>
      {loading
        ? <Spinner />
        : filtered.length === 0
          ? <EmptyState icon="🤍" title="Nothing upvoted yet" sub="Generate activities and heart the ones you love!" />
          : filtered.map((p, i) => (
              <div key={p.key} style={{ position: 'relative' }}>
                {i < 3 && <div style={{ position: 'absolute', top: -5, left: -5, background: ['#FFD700', '#C0C0C0', '#CD7F32'][i], color: '#2C2416', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, zIndex: 1 }}>#{i + 1}</div>}
                <ActivityCard post={p} voted={votedIds.has(p.key)} onUpvote={onUpvote} />
              </div>
            ))}
      <button onClick={onRefresh} style={{ width: '100%', background: 'transparent', border: '1.5px solid #FFE4B5', borderRadius: 50, padding: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#8C6E3F', marginTop: 8, fontFamily: 'Nunito, sans-serif' }}>↻ Refresh</button>
    </div>
  )
}

// ── ADMIN ──────────────────────────────────────────────────────────────────────

function AdminView({ adminUnlocked, setAdminUnlocked, adminData, adminLoading, adminAge, setAdminAge, loadAdminData, exportCSV, onExit }) {
  const byAge = {}
  adminData.forEach(p => { const k = p.age || 'unknown'; if (!byAge[k]) byAge[k] = []; byAge[k].push(p) })
  const filtered = adminAge === 'all' ? adminData : (byAge[adminAge] || [])
  const sorted = [...filtered].sort((a, b) => (b.votes || 0) - (a.votes || 0))

  return (
    <div style={{ fontFamily: "'Nunito Sans','Trebuchet MS',system-ui,sans-serif", minHeight: '100vh', background: '#FFFCF5' }}>
      <div style={{ background: '#1a1a1a', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#FFCF77', fontSize: 13, fontWeight: 900, fontFamily: 'Nunito, sans-serif' }}>📚 Book Data — Admin</span>
        <button onClick={onExit} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.2)', borderRadius: 50, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>← Exit</button>
      </div>

      {!adminUnlocked ? (
        <div style={{ maxWidth: 400, margin: '60px auto', padding: '0 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 38, marginBottom: 12 }}>📚</div>
          <h2 style={{ fontSize: 17, fontWeight: 900, margin: '0 0 6px', fontFamily: 'Nunito, sans-serif' }}>Book Data</h2>
          <p style={{ fontSize: 13, color: '#8C6E3F', marginBottom: 18 }}>Enter your key to access activity data.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input id="admin-key" type="password" placeholder="Admin key"
              style={{ flex: 1, border: '2px solid #FFE4B5', borderRadius: 50, padding: '9px 15px', fontSize: 13, outline: 'none', background: '#fff', color: '#2C2416', fontFamily: 'Nunito Sans, sans-serif' }}
              onKeyDown={e => { if (e.key === 'Enter' && e.target.value === ADMIN_KEY) setAdminUnlocked(true) }} />
            <button onClick={() => { const el = document.getElementById('admin-key'); if (el?.value === ADMIN_KEY) { setAdminUnlocked(true); loadAdminData(); } }}
              style={{ ...btnOrange, padding: '9px 18px' }}>Enter</button>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#8C6E3F' }}>{adminData.length} activities · sorted by votes</p>
            <div style={{ display: 'flex', gap: 7 }}>
              <button onClick={loadAdminData} style={{ ...btnOutline, fontSize: 12, padding: '6px 12px' }}>↻ Reload</button>
              <button onClick={exportCSV} style={{ background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: 50, padding: '6px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>⬇ Export CSV</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(80px,1fr))', gap: 7, marginBottom: 14 }}>
            {[['Total', adminData.length, '#FF8C42'], ['Upvoted', adminData.filter(p => (p.votes || 0) > 0).length, '#2D6A4F'], ['2–3', (byAge['2-3'] || []).length, '#7C3AED'], ['4–5', (byAge['4-5'] || []).length, '#0369A1'], ['6–8', (byAge['6-8'] || []).length, '#0D9488'], ['9–12', (byAge['9-12'] || []).length, '#D97706']].map(([l, n, c]) => (
              <div key={l} style={{ background: '#F5F0E8', borderRadius: 9, padding: '9px 7px', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: c, fontFamily: 'Nunito, sans-serif' }}>{n}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#8C6E3F' }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
            {['all', ...AGE_GROUPS.map(a => a.v)].map(f => (
              <button key={f} onClick={() => setAdminAge(f)}
                style={{ background: adminAge === f ? '#FF8C42' : '#F5F0E8', color: adminAge === f ? '#fff' : '#8C6E3F', border: 'none', borderRadius: 50, padding: '5px 11px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                {f === 'all' ? 'All' : AGE_GROUPS.find(a => a.v === f)?.l || f}
              </button>
            ))}
          </div>

          {adminLoading ? <Spinner /> : sorted.length === 0
            ? <div style={{ textAlign: 'center', padding: 36 }}><button onClick={loadAdminData} style={btnOrange}>Load data →</button></div>
            : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 480 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #FFE4B5' }}>
                      {['❤️', 'Activity', 'Age', 'Energy', 'Diff', 'Book'].map(h => (
                        <th key={h} style={{ padding: '7px 9px', textAlign: 'left', fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#8C6E3F', fontFamily: 'Nunito, sans-serif' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((p, i) => (
                      <tr key={p.key} style={{ borderBottom: '1px solid #FFE4B5', background: i % 2 === 0 ? 'transparent' : '#FFF8F0' }}>
                        <td style={{ padding: 9, fontWeight: 900, color: (p.votes || 0) > 0 ? '#FF8C42' : '#aaa' }}>{p.votes || 0}</td>
                        <td style={{ padding: 9 }}>
                          <div style={{ fontWeight: 700, lineHeight: 1.3, marginBottom: 1, fontFamily: 'Nunito, sans-serif' }}>{p.activity_name}</div>
                          <div style={{ fontSize: 11, color: '#8C6E3F' }}>{(p.tagline || '').slice(0, 55)}{(p.tagline?.length || 0) > 55 ? '…' : ''}</div>
                        </td>
                        <td style={{ padding: 9 }}>{AGE_GROUPS.find(a => a.v === p.age)?.e || ''} {p.age || '?'}</td>
                        <td style={{ padding: 9, color: '#8C6E3F' }}>{p.energy || ''}</td>
                        <td style={{ padding: 9, color: '#8C6E3F' }}>{p.difficulty || ''}</td>
                        <td style={{ padding: 9, color: '#8C6E3F', fontSize: 11, fontStyle: 'italic' }}>{p.book?.title ? `"${p.book.title}"` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 10 }}>Export CSV → sort by votes → curate your book chapters by age group.</p>
              </div>
            )}
        </div>
      )}
    </div>
  )
}

// ── SHARED COMPONENTS ──────────────────────────────────────────────────────────

function ActivityCard({ post, voted, onUpvote }) {
  const ag = AGE_GROUPS.find(a => a.v === post.age)
  return (
    <div style={{ background: '#fff', border: '1.5px solid #FFE4B5', borderRadius: 15, padding: 18, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 7 }}>
            {ag && <span style={{ background: '#FFF0DC', color: '#A05A00', borderRadius: 50, padding: '2px 9px', fontSize: 11, fontWeight: 800 }}>{ag.e} {ag.l}</span>}
            <span style={{ background: '#F0F9FF', color: '#0369A1', borderRadius: 50, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>{post.energy || ''}</span>
            <span style={{ background: '#F0FDF4', color: '#15803D', borderRadius: 50, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>{post.duration || ''}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 3, lineHeight: 1.25, fontFamily: 'Nunito, sans-serif' }}>{post.activity_name}</div>
          <div style={{ fontSize: 12, color: '#8C6E3F', lineHeight: 1.5 }}>{post.tagline}</div>
          {post.why_kids_love_it && <div style={{ fontSize: 11, color: '#A07040', marginTop: 6, fontStyle: 'italic' }}>"{post.why_kids_love_it}"</div>}
        </div>
        <button onClick={() => onUpvote(post.key)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: voted ? '#FFF0DC' : '#F8F5F0', border: `1.5px solid ${voted ? '#FF8C42' : '#ddd'}`, borderRadius: 11, padding: '8px 12px', cursor: voted ? 'default' : 'pointer', minWidth: 48, flexShrink: 0 }}>
          <span style={{ fontSize: 17 }}>{voted ? '🧡' : '🤍'}</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: voted ? '#FF8C42' : '#aaa', fontFamily: 'Nunito, sans-serif' }}>{post.votes || 0}</span>
        </button>
      </div>
      <details style={{ marginTop: 10 }}>
        <summary style={{ fontSize: 12, fontWeight: 700, color: '#FF8C42', cursor: 'pointer', userSelect: 'none', fontFamily: 'Nunito, sans-serif' }}>▸ See steps & book</summary>
        <ol style={{ margin: '8px 0 0 16px', padding: 0 }}>
          {(post.steps || []).map((s, i) => <li key={i} style={{ fontSize: 12, color: '#8C6E3F', marginBottom: 5, lineHeight: 1.5 }}>{s}</li>)}
        </ol>
        {post.book && <div style={{ marginTop: 8, background: '#F5F3FF', borderRadius: 9, padding: '9px 12px', fontSize: 12, color: '#5B21B6' }}><strong>📖 Read after:</strong> <em>{post.book.title}</em> by {post.book.author}</div>}
        {post.parent_tip && <div style={{ marginTop: 6, background: '#F0F9FF', borderRadius: 9, padding: '9px 12px', fontSize: 12, color: '#0C4A6E' }}><strong>Tip:</strong> {post.parent_tip}</div>}
      </details>
    </div>
  )
}

function InfoBox({ color, label, labelColor, text, textColor, border }) {
  return (
    <div style={{ background: color, margin: '4px 16px 12px', borderRadius: 10, padding: '11px 14px', border: border || 'none' }}>
      <div style={{ ...sectionLabel, color: labelColor }}>{label}</div>
      <p style={{ margin: 0, fontSize: 12, color: textColor, lineHeight: 1.6 }}>{text}</p>
    </div>
  )
}

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 12px' }}>
      <div style={{ flex: 1, height: 1, background: '#FFE4B5' }} />
      <div style={{ background: '#FFFCF5', border: '1.5px solid #FFE4B5', borderRadius: 50, padding: '5px 12px', fontSize: 11, fontWeight: 800, color: '#A05A00', whiteSpace: 'nowrap', fontFamily: 'Nunito, sans-serif' }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: '#FFE4B5' }} />
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ width: 34, height: 34, border: '3px solid #FFE4B5', borderTop: '3px solid #FF8C42', borderRadius: '50%', margin: '0 auto 10px', animation: 'spin .85s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color: '#8C6E3F', fontSize: 13 }}>Loading...</p>
    </div>
  )
}

function EmptyState({ icon, title, sub, children }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 18px', background: '#FFF8F0', borderRadius: 14 }}>
      <div style={{ fontSize: 34, marginBottom: 10 }}>{icon}</div>
      <p style={{ fontWeight: 800, margin: '0 0 5px', fontFamily: 'Nunito, sans-serif' }}>{title}</p>
      <p style={{ fontSize: 13, color: '#8C6E3F', margin: '0 0 16px' }}>{sub}</p>
      {children}
    </div>
  )
}

// ── STYLE TOKENS ───────────────────────────────────────────────────────────────

const qStyle = { fontSize: 'clamp(17px,5vw,24px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.3, fontFamily: 'Nunito, sans-serif', color: '#2C2416' }
const sectionLabel = { fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: '#FF8C42', marginBottom: 4, fontFamily: 'Nunito, sans-serif', display: 'block' }
const btnOrange = { background: '#FF8C42', color: '#fff', border: 'none', borderRadius: 50, padding: '12px 28px', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }
const btnDark = { background: '#2C2416', color: '#FFCF77', border: 'none', borderRadius: 50, padding: '13px 28px', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }
const btnGhost = { background: 'rgba(255,255,255,.15)', color: '#fff', border: '2px solid rgba(255,255,255,.4)', borderRadius: 50, padding: '11px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }
const btnOutline = { background: 'transparent', color: '#FF8C42', border: '2px solid #FF8C42', borderRadius: 50, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }
