import React, { useState, useEffect, useCallback, useRef } from 'react'

// ── CONSTANTS ──────────────────────────────────────────────────────────────────

const ACTIVITY_TYPES = `watercolor painting, collage making, origami, papier-mache construction, printing and stamping art, finger weaving, handmade bookmaking, comic strip creation, fashion design and costume making, jewelry and accessory making, shadow silhouette art, nature printing, bubble painting, blow painting, splatter painting, salt painting, coffee filter art, tape resist painting, leaf rubbings and nature art, recycled sculpture, paper mosaic, string art, baking soda volcano, color mixing lab, sink or float experiment, magnet exploration station, shadow and light play, ice melting experiment, static electricity experiment, homemade slime, density rainbow jar, seed planting and mini garden, ramp and rolling race, paper bridge weight challenge, kite making and flying, paper airplane design lab, boat building and water testing, tallest tower challenge, puppet theater construction, marble maze design, obstacle course design and race, dance choreography show, yoga adventure story, freeze dance, indoor bowling alley, balloon keep-up challenge, hopscotch with twists, relay race setup, mirror movement game, sock ball basketball, baking and decorating treats, fruit and veggie sculpture, smoothie invention lab, sandwich or pizza art, homemade play dough from scratch, ice cube painting, texture collage, edible art project, shadow puppet theater, sock puppet show, newspaper reporter project, mystery detective setup, fort building and adventure roleplay, dress-up performance show, story cube game, movie trailer storyboard, homemade instrument making, rhythm and percussion patterns, lip sync music video, sound experiment lab, body percussion routine, musical freeze game, scavenger hunt with clues, treasure map adventure, friendship bracelet making, greeting card workshop, gift wrapping art, paper doll fashion show, dream catcher weaving, catapult building and launching, stop motion animation setup, kaleidoscope making, rock painting, pressed flower art, tie dye with household items, vegetable stamping, cloud dough sensory play, oobleck science experiment, balloon rocket race, straw bridge challenge`

const SYSTEM_PROMPT = `You are a creative at-home activity generator for parents. Generate ONE specific, highly personalized activity.

STRICT RULES:
1. Use ONLY the materials listed. Do not require anything else.
2. Make it deeply specific to the child's interests. If they love dinosaurs, dinosaurs are central. If they love Disney, Disney characters appear throughout. Generic activities are not acceptable.
3. Completable in under 2 hours.
4. Difficulty: simple=3 to 4 steps, minimal mess. medium=some setup. crafty=multi-step real project.
5. Energy: calm=fully seated the whole time. medium=light movement ok. wild=physically active the entire time.
6. Age-appropriate for the age provided.
7. Pick ONE activity type from this list: ${ACTIVITY_TYPES}. Rotate variety widely. Never repeat the same format as recently used.
8. Every material listed in the steps must have a clear stated purpose. No filler.
9. The activity is either a THING TO MAKE or a GAME TO PLAY. Not both muddled together. Make it clear from step one.
10. If an occasion is provided, theme the activity to it specifically.
11. Book must be a REAL published children's book that actually exists and is age-appropriate for the age given. No adult books, no coffee table books, no encyclopedias for young children. AVOID the most commonly known default books (no Chicka Chicka Boom Boom, no Very Hungry Caterpillar, no Goodnight Moon unless they are genuinely the single best fit). Choose something specific, surprising, and closely tied to this exact child's interests.
12. Spice-up products must be specific items under $25 that directly enhance this exact activity.
13. Parent tip must end with: Think of this as your spark — change it, add your own twist, make it completely yours!
14. For books: provide 5 DIFFERENT books covering a range from the obvious well-known choice (like Chicka Chicka Boom Boom for alphabet) to more specific and surprising picks tied to the child's exact interests. Label the first one clearly — parents who know it can skip to the next.
15. For spice_ups: provide 4 alternatives per product so parents always have options.

Respond with ONLY a JSON object. No text before or after the JSON. No markdown code fences:
{"activity_name":"Creative fun name","tagline":"One sentence making a kid say YES","duration":"e.g. 20-30 min","activity_type":"the type you chose","steps":["Step 1","Step 2","Step 3","Step 4"],"why_kids_love_it":"Brief reason tied to their specific interests","parent_tip":"One practical tip. End with: Think of this as your spark — change it, add your own twist, make it completely yours!","materials_used":["item1","item2"],"books":[{"title":"Book 1 title","author":"Author","why":"Why it fits"},{"title":"Book 2 title","author":"Author","why":"Why it fits"},{"title":"Book 3 title","author":"Author","why":"Why it fits"},{"title":"Book 4 title","author":"Author","why":"Why it fits"},{"title":"Book 5 title","author":"Author","why":"Why it fits"}],"spice_ups":[{"name":"Product 1","why":"How it enhances the activity","search":"Amazon search","alternatives":[{"name":"Alt 1","why":"Why also great","search":"search term"},{"name":"Alt 2","why":"Why also great","search":"search term"},{"name":"Alt 3","why":"Why also great","search":"search term"},{"name":"Alt 4","why":"Why also great","search":"search term"}]},{"name":"Product 2","why":"How it enhances the activity","search":"Amazon search","alternatives":[{"name":"Alt 1","why":"Why also great","search":"search term"},{"name":"Alt 2","why":"Why also great","search":"search term"},{"name":"Alt 3","why":"Why also great","search":"search term"},{"name":"Alt 4","why":"Why also great","search":"search term"}]}],"kiwico_angle":"One sentence about KiwiCo relevance"}`

const GIFT_PROMPT = `You are a children's gift recommendation expert. Recommend the single best gift for this child.

Respond with ONLY a JSON object. No text before or after:
{"gift_name":"Specific product name","tagline":"Why this gift is perfect for this child","why_theyll_love_it":"2 to 3 sentences specific to this child's interests and age","price_range":"e.g. $25 to 40","amazon_search":"Best Amazon search term for this exact product","what_parents_say":"A 2-3 sentence summary of what parents generally report about this type of product — things like how kids react, how long the interest lasts, common praise. Write as a genuine summary not a fake quote. Label this clearly as general parent feedback about this product category.","age_appropriateness":"One sentence on why this is right for this age","alternatives":[{"name":"Alt gift 1","reason":"Why also a great fit","search":"Amazon search term"},{"name":"Alt gift 2","reason":"Why also a great fit","search":"Amazon search term"},{"name":"Alt gift 3","reason":"Why also a great fit","search":"Amazon search term"},{"name":"Alt gift 4","reason":"Why also a great fit","search":"Amazon search term"}]}`

const AGE_GROUPS = [
  { v: '0-1', l: '0-1 yrs', e: '🍼', d: 'Infant' },
  { v: '2-3', l: '2-3 yrs', e: '🐣', d: 'Toddler' },
  { v: '4-5', l: '4-5 yrs', e: '🌱', d: 'Preschool' },
  { v: '6-8', l: '6-8 yrs', e: '⭐', d: 'Elementary' },
  { v: '9-12', l: '9-12 yrs', e: '🚀', d: 'Tween' },
  { v: '13+', l: '13+ yrs', e: '🎓', d: 'Teen' },
]

const OCCASIONS = [
  { v: 'regular', l: 'Just a regular day', e: '😊' },
  { v: 'after-school', l: 'After school', e: '🎒' },
  { v: 'weekend', l: 'Weekend fun', e: '☀️' },
  { v: 'vacation', l: "We're on vacation", e: '✈️' },
  { v: 'holiday', l: 'Holiday time', e: '🎉' },
  { v: 'birthday', l: 'Birthday party', e: '🎂' },
  { v: 'sick-day', l: 'Sick day / quiet day', e: '🛋️' },
  { v: 'rainy-day', l: 'Rainy day', e: '🌧️' },
]

const HOLIDAYS = ['Christmas', 'Halloween', 'Thanksgiving', 'Easter', 'Hanukkah', "Valentine's Day", '4th of July', 'Other']

const ENERGY = [
  { v: 'calm', l: 'Calm & cozy', e: '☁️', d: 'Low-key, fully seated' },
  { v: 'medium', l: 'Playful', e: '🌤️', d: 'Some movement ok' },
  { v: 'wild', l: 'Full energy', e: '⚡', d: 'Needs to move and run!' },
]

const DIFFICULTY = [
  { v: 'simple', l: 'Keep it simple', e: '😊', d: 'Minimal mess, few steps' },
  { v: 'medium', l: 'We can do this', e: '🛠️', d: 'Some setup is fine' },
  { v: 'crafty', l: "I'm crafty!", e: '🎨', d: 'Bring on the real project' },
]

const MATERIAL_CATS = [
  { id: 'plain-paper', l: 'Plain paper', desc: 'plain white or colored paper', e: '📄' },
  { id: 'crayons-markers', l: 'Crayons & markers', desc: 'crayons, markers, colored pencils', e: '🖍️' },
  { id: 'paint', l: 'Paint & brushes', desc: 'paint (watercolor, acrylic, or finger paint) and paintbrushes', e: '🎨' },
  { id: 'cardboard', l: 'Cardboard & boxes', desc: 'cardboard boxes, toilet paper rolls, paper towel rolls, egg cartons', e: '📦' },
  { id: 'tape', l: 'Tape', desc: 'scotch tape, masking tape, or duct tape', e: '🩹' },
  { id: 'glue-scissors', l: 'Glue & scissors', desc: 'glue stick, white glue, and scissors', e: '✂️' },
  { id: 'aluminum-foil', l: 'Aluminum foil', desc: 'aluminum foil', e: '✨' },
  { id: 'dried-food', l: 'Dried pantry items', desc: 'dried pasta, dried beans, rice, flour, salt, sugar', e: '🫙' },
  { id: 'baking', l: 'Baking supplies', desc: 'baking soda, vinegar, food coloring, cornstarch', e: '🧪' },
  { id: 'fabric-yarn', l: 'Fabric & yarn', desc: 'fabric scraps, yarn, string, ribbon, old socks', e: '🧵' },
  { id: 'lego', l: 'LEGO bricks', desc: 'LEGO bricks and baseplates', e: '🧱' },
  { id: 'blocks', l: 'Wooden blocks', desc: 'wooden building blocks', e: '🪵' },
  { id: 'outdoor', l: 'Outdoor & nature', desc: 'sticks, leaves, rocks, pebbles, pinecones, flowers, dirt', e: '🌿' },
  { id: 'pipe-cleaners', l: 'Pipe cleaners', desc: 'pipe cleaners (chenille stems)', e: '🌀' },
  { id: 'pom-poms', l: 'Pom poms & googly eyes', desc: 'pom poms, googly eyes, feathers, cotton balls', e: '👀' },
  { id: 'stickers', l: 'Stickers & foam', desc: 'stickers, foam sheets, foam stickers', e: '⭐' },
  { id: 'rubber-bands', l: 'Rubber bands & string', desc: 'rubber bands, string, twine, yarn', e: '🪢' },
  { id: 'balloons', l: 'Balloons', desc: 'balloons', e: '🎈' },
  { id: 'old-magazines', l: 'Old magazines & newspapers', desc: 'old magazines, newspapers, catalogs for cutting up', e: '📰' },
  { id: 'plastic-cups', l: 'Cups & containers', desc: 'plastic cups, bowls, containers, plastic bottles', e: '🥤' },
]

const BUDGETS = [
  { v: '10-20', l: 'Up to $20', e: '💚' },
  { v: '20-40', l: '$20 to $40', e: '💛' },
  { v: '40-75', l: '$40 to $75', e: '🧡' },
  { v: '75+', l: '$75 and up', e: '💜' },
]

const LOAD_STAGES = [
  { label: 'Reading your answers...', pct: 15 },
  { label: 'Matching materials to your kid...', pct: 35 },
  { label: 'Crafting the perfect activity...', pct: 58 },
  { label: 'Finding the right book...', pct: 75 },
  { label: 'Picking product suggestions...', pct: 90 },
  { label: 'Almost ready...', pct: 98 },
]

const ADMIN_KEY = 'zsadmin2026'
const KIWICO = 'https://www.kiwico.com/?ref=YOURAFFILIATEID'
const AMZN = q => `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=zenmonkeystud-20`

// ── HELPERS ────────────────────────────────────────────────────────────────────

function extractJSON(text) {
  // Strip unicode smart quotes and dashes that break JSON
  const cleaned = text
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2013|\u2014/g, '-')

  if (!cleaned.includes('{')) {
    const preview = text.slice(0, 200)
    throw new Error(`No JSON found. Response started with: "${preview}"`)
  }

  // Try full match first
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch {}
    // Fix trailing commas
    try {
      const fixed = match[0].replace(/,\s*([}\]])/g, '$1')
      return JSON.parse(fixed)
    } catch {}
  }

  // If JSON was truncated (hit token limit), try to salvage required fields
  // by finding partial content and filling in defaults for optional fields
  const start = cleaned.indexOf('{')
  const partial = cleaned.slice(start)
  const nameMatch = partial.match(/"activity_name"\s*:\s*"([^"]+)"/)
  const taglineMatch = partial.match(/"tagline"\s*:\s*"([^"]+)"/)
  const durationMatch = partial.match(/"duration"\s*:\s*"([^"]+)"/)

  // Extract steps array even if partial
  const stepsMatch = partial.match(/"steps"\s*:\s*\[([^\]]+)\]/)
  let steps = ['Get your materials ready', 'Follow along with the activity', 'Have fun and make it your own!']
  if (stepsMatch) {
    try {
      steps = JSON.parse('[' + stepsMatch[1] + ']').filter(s => typeof s === 'string')
    } catch {}
  }

  if (nameMatch && taglineMatch) {
    return {
      activity_name: nameMatch[1],
      tagline: taglineMatch[1],
      duration: durationMatch?.[1] || '20-30 min',
      steps,
      why_kids_love_it: '',
      parent_tip: 'This is just a springboard. Add your own imagination, personal touches, and make it completely yours!',
      materials_used: [],
      books: [],
      spice_ups: [],
      kiwico_angle: ''
    }
  }

  throw new Error('Response was incomplete. Please try again.')
}

async function callAPI(body) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Server error ${res.status}: ${t.slice(0, 120)}`)
  }
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'API error')
  const txt = data.content?.find(b => b.type === 'text')?.text || ''
  if (!txt) throw new Error('Empty response from API')
  return extractJSON(txt)
}

async function communityFetch(method = 'GET', body = null) {
  const res = await fetch('/api/community', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error('Community request failed')
  return res.json()
}

function buildActivityMsg(a) {
  const occ = a.occasion
    ? `Occasion: ${a.occasion}${a.holiday ? ` (${a.holiday})` : ''}${a.vacationWhere ? ` (location: ${a.vacationWhere})` : ''}${a.birthdayDetails ? `, details: ${a.birthdayDetails}` : ''}`
    : ''
  const catItems = (a.materialCategories || [])
    .map(id => MATERIAL_CATS.find(c => c.id === id)?.desc || '')
    .filter(Boolean)
  const extras = (a.materialsExtra || '').trim()
  const matLines = [
    ...catItems.map(d => `- ${d}`),
    ...(extras ? [`- ${extras}`] : [])
  ].join('\n')
  return `Child age: ${a.age}
${occ}
Child's interests: ${a.interests}
Energy level: ${a.energy}
Difficulty: ${a.difficulty}
Materials the parent confirmed they have (use ONLY items from this list, do not assume anything else):
${matLines}

IMPORTANT: Each category above lists example items. The parent has SOME of those items, not necessarily all. Pick the most basic and common items from each category. When in doubt, use the simplest option (e.g. plain paper, not cardstock).

Generate a personalized activity using ONLY materials from the list above.`
}

function buildGiftMsg(g) {
  return `Child age: ${g.age}
Child's interests: ${g.interests}
Gift budget: ${g.budget}
Occasion: ${g.occasion || 'general gift'}

Recommend the single best gift.`
}

// ── STYLE TOKENS ───────────────────────────────────────────────────────────────

const F = "'Nunito', 'Trebuchet MS', system-ui, sans-serif"
const F2 = "'Nunito Sans', 'Trebuchet MS', system-ui, sans-serif"

const btnBase = { border: 'none', borderRadius: 50, cursor: 'pointer', fontFamily: F, fontWeight: 900 }
const BtnOrange = (extra = {}) => ({ ...btnBase, background: '#2E7D4F', color: '#fff', padding: '12px 28px', fontSize: 15, ...extra })
const BtnDark = (extra = {}) => ({ ...btnBase, background: '#2C2416', color: '#F9C74F', padding: '13px 28px', fontSize: 15, ...extra })
const BtnGhost = (extra = {}) => ({ ...btnBase, background: 'rgba(255,255,255,.15)', color: '#fff', border: '2px solid rgba(255,255,255,.4)', padding: '11px 20px', fontSize: 13, ...extra })
const BtnOutline = (extra = {}) => ({ ...btnBase, background: 'transparent', color: '#2E7D4F', border: '2px solid #2E7D4F', padding: '9px 18px', fontSize: 13, ...extra })
const BtnPurple = (extra = {}) => ({ ...btnBase, background: '#7C3AED', color: '#fff', padding: '12px 28px', fontSize: 15, ...extra })
const SectionLabel = (color = '#2E7D4F') => ({ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', display: 'block', marginBottom: 4, fontFamily: F, color })
const QStyle = { fontSize: 'clamp(17px,5vw,24px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.3, fontFamily: F, color: '#2C2416' }

// ── REUSABLE UI ────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 34, height: 34, border: '3px solid #C8E6C9', borderTop: '3px solid #2E7D4F', borderRadius: '50%', margin: '0 auto 10px', animation: 'spin .85s linear infinite' }} />
      <p style={{ color: '#4A6741', fontSize: 13, margin: 0 }}>Loading...</p>
    </div>
  )
}

function EmptyState({ icon, title, sub, children }) {
  return (
    <div style={{ textAlign: 'center', padding: '44px 18px', background: '#F0FAF4', borderRadius: 14 }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
      <p style={{ fontWeight: 800, margin: '0 0 5px', fontFamily: F }}>{title}</p>
      <p style={{ fontSize: 13, color: '#4A6741', margin: '0 0 16px' }}>{sub}</p>
      {children}
    </div>
  )
}

function NavBar({ active, onSwitch }) {
  const tabs = [{ k: 'generator', l: '🎨 Generator' }, { k: 'community', l: '🌍 Community' }, { k: 'bestof', l: '⭐ Best Of' }]
  return (
    <div style={{ background: '#fff', borderBottom: '1.5px solid #C8E6C9', display: 'flex', overflowX: 'auto', padding: '0 8px', position: 'sticky', top: 0, zIndex: 10 }}>
      {tabs.map(t => (
        <button key={t.k} onClick={() => onSwitch(t.k)} style={{ cursor: 'pointer', padding: '10px 16px', fontSize: 13, fontWeight: 700, border: 'none', background: 'transparent', borderBottom: active === t.k ? '3px solid #2E7D4F' : '3px solid transparent', color: active === t.k ? '#2E7D4F' : '#888', whiteSpace: 'nowrap', fontFamily: F }}>
          {t.l}
        </button>
      ))}
    </div>
  )
}

function ActivityCard({ post, voted, onUpvote }) {
  const ag = AGE_GROUPS.find(a => a.v === post.age)
  const occ = OCCASIONS.find(o => o.v === post.occasion)
  return (
    <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 15, padding: 18, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 7 }}>
            {ag && <span style={{ background: '#E8F5E9', color: '#1B5E20', borderRadius: 50, padding: '2px 9px', fontSize: 11, fontWeight: 800 }}>{ag.e} {ag.l}</span>}
            {occ && <span style={{ background: '#F0F9FF', color: '#0369A1', borderRadius: 50, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>{occ.e} {occ.l}</span>}
            {post.duration && <span style={{ background: '#F0FDF4', color: '#15803D', borderRadius: 50, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>{post.duration}</span>}
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 3, lineHeight: 1.25, fontFamily: F }}>{post.activity_name}</div>
          <div style={{ fontSize: 12, color: '#4A6741', lineHeight: 1.5 }}>{post.tagline}</div>
          {post.why_kids_love_it && <div style={{ fontSize: 11, color: '#2E7D4F', marginTop: 6, fontStyle: 'italic' }}>"{post.why_kids_love_it}"</div>}
        </div>
        <button onClick={() => onUpvote(post.id)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: voted ? '#E8F5E9' : '#F8F5F0', border: `1.5px solid ${voted ? '#2E7D4F' : '#ddd'}`, borderRadius: 11, padding: '8px 12px', cursor: voted ? 'default' : 'pointer', minWidth: 48, flexShrink: 0 }}>
          <span style={{ fontSize: 17 }}>{voted ? '🧡' : '🤍'}</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: voted ? '#2E7D4F' : '#aaa', fontFamily: F }}>{post.votes || 0}</span>
        </button>
      </div>
      <details style={{ marginTop: 10 }}>
        <summary style={{ fontSize: 12, fontWeight: 700, color: '#2E7D4F', cursor: 'pointer', userSelect: 'none', fontFamily: F }}>See steps and book</summary>
        <ol style={{ margin: '8px 0 0 16px', padding: 0 }}>
          {(post.steps || []).map((s, i) => <li key={i} style={{ fontSize: 12, color: '#4A6741', marginBottom: 5, lineHeight: 1.5 }}>{s}</li>)}
        </ol>
        {(post.books || (post.book ? [post.book] : [])).slice(0,1).map((b,i) => (
        <div key={i} style={{ marginTop: 8, background: '#F5F3FF', borderRadius: 9, padding: '9px 12px', fontSize: 12, color: '#5B21B6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span><strong>Read after:</strong> <em>{b.title}</em> by {b.author}</span>
          <a href={AMZN(b.title + ' ' + b.author + ' children book')} target="_blank" rel="noopener" style={{ background: '#7C3AED', color: '#fff', borderRadius: 50, padding: '3px 10px', fontSize: 11, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: F }}>Amazon</a>
        </div>
      ))}
      {(post.spice_ups || []).slice(0,2).map((sp,i) => (
        <div key={i} style={{ marginTop: 6, background: '#FFF8F0', borderRadius: 9, padding: '9px 12px', fontSize: 12, color: '#4A6741', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span><strong>Try:</strong> {sp.name}</span>
          <a href={AMZN(sp.search)} target="_blank" rel="noopener" style={{ background: '#FF9900', color: '#2C2416', borderRadius: 50, padding: '3px 10px', fontSize: 11, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: F }}>Amazon</a>
        </div>
      ))}
        {post.parent_tip && <div style={{ marginTop: 6, background: '#F0F9FF', borderRadius: 9, padding: '9px 12px', fontSize: 12, color: '#0C4A6E' }}><strong>Parent tip:</strong> {post.parent_tip}</div>}
      </details>
    </div>
  )
}

// ── LANDING ────────────────────────────────────────────────────────────────────

function LandingView({ savedProfile, onStart, onStartSaved, onGift }) {
  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg,#2E7D4F,#F9C74F)', padding: '44px 24px 36px', textAlign: 'center' }}>
        <div style={{ fontSize: 42, marginBottom: 8 }}>🎨</div>
        <h1 style={{ fontSize: 'clamp(24px,6vw,46px)', fontWeight: 900, color: '#fff', margin: '0 0 10px', lineHeight: 1.1, textShadow: '0 2px 8px rgba(0,0,0,.15)', fontFamily: F }}>
          What should my kid do today?
        </h1>
        <p style={{ color: 'rgba(255,255,255,.92)', fontSize: 'clamp(13px,3vw,17px)', margin: '0 0 24px', lineHeight: 1.5 }}>
          Tell us what you have at home. We build the perfect activity, just for your kid.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <button onClick={onStart} style={BtnDark()}>Build an activity →</button>
          {savedProfile && <button onClick={onStartSaved} style={BtnGhost()}>Use saved profile</button>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button onClick={onGift} style={{ ...BtnGhost(), background: 'rgba(124,58,237,.2)', borderColor: 'rgba(255,255,255,.5)', fontSize: 13 }}>
            🎁 Find a gift for a kid instead
          </button>
        </div>
      </div>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
          {[['📦', 'Use what you have', 'No shopping required.'], ['🎯', 'Built for your kid', 'Tied to their specific interests.'], ['🌍', 'Community feed', 'See what others made. Upvote favorites.']].map(([e, t, d]) => (
            <div key={t} style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>{e}</div>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 3, fontFamily: F }}>{t}</div>
              <div style={{ fontSize: 12, color: '#4A6741', lineHeight: 1.4 }}>{d}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <button onClick={onStart} style={BtnOrange()}>Let's go →</button>
        </div>
        <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', lineHeight: 1.6 }}>
          COPPA compliant. Parents fill this out about their child. No children's data collected.
        </p>
      </div>
    </div>
  )
}

// ── LOADING ────────────────────────────────────────────────────────────────────

function LoadingView({ stage, interests }) {
  const s = LOAD_STAGES[Math.min(stage, LOAD_STAGES.length - 1)]
  return (
    <div style={{ fontFamily: F2, minHeight: '100vh', background: '#FAFDF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ maxWidth: 460, width: '100%', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>🎨</div>
        <h2 style={{ fontSize: 19, fontWeight: 900, color: '#2E7D4F', margin: '0 0 6px', fontFamily: F }}>Building your activity...</h2>
        <p style={{ color: '#4A6741', fontSize: 13, margin: '0 0 24px', minHeight: 18 }}>{s.label}</p>
        <div style={{ background: '#C8E6C9', borderRadius: 50, height: 10, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ background: 'linear-gradient(90deg,#2E7D4F,#F9C74F)', height: '100%', width: `${s.pct}%`, borderRadius: 50, transition: 'width .8s ease' }} />
        </div>
        <p style={{ fontSize: 11, color: '#bbb', marginBottom: 24 }}>{s.pct}% complete</p>
        {interests && (
          <div style={{ background: '#F0FAF4', borderRadius: 13, padding: '14px 18px', textAlign: 'left' }}>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 800, color: '#2E7D4F', letterSpacing: 1, textTransform: 'uppercase', fontFamily: F }}>Based on your answers</p>
            <p style={{ margin: 0, fontSize: 13, color: '#4A6741', lineHeight: 1.6 }}>
              Creating something for: <strong style={{ color: '#2C2416' }}>{interests.slice(0, 60)}{interests.length > 60 ? '...' : ''}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── ERROR ──────────────────────────────────────────────────────────────────────

function ErrorView({ msg, answers, onRetry, onBack }) {
  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 46, marginBottom: 14 }}>😬</div>
      <h2 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 10px', fontFamily: F }}>Something went wrong</h2>
      <p style={{ fontSize: 14, color: '#4A6741', margin: '0 0 8px', lineHeight: 1.6 }}>
        Your answers are saved. Give it another try.
      </p>
      {msg && <p style={{ fontSize: 11, color: '#888', background: '#F5F0E8', borderRadius: 8, padding: '8px 12px', margin: '0 0 24px', wordBreak: 'break-word', fontFamily: 'monospace', textAlign: 'left' }}>{msg}</p>}
      {!msg && <div style={{ marginBottom: 24 }} />}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onRetry} style={BtnOrange()}>Try again</button>
        <button onClick={onBack} style={BtnOutline()}>Edit answers</button>
      </div>
    </div>
  )
}

// ── QUIZ ────────────────────────────────────────────────────────────────────────

function QuizView({ step, setStep, answers, setAnswers, totalSteps, onGenerate }) {
  const stepNames = ['Age', 'Occasion', 'Interests', 'Energy', 'Materials', 'Difficulty']
  const pct = ((step + 1) / totalSteps) * 100

  const canAdvance = (a = answers) => {
    if (step === 0) return !!a.age
    if (step === 1) return !!a.occasion
    if (step === 2) return a.interests.trim().length > 3
    if (step === 3) return !!a.energy
    if (step === 4) return (a.materialCategories || []).length > 0 || (a.materialsExtra || '').trim().length > 3
    if (step === 5) return !!a.difficulty
    return false
  }

  const flush = () => {
    const el1 = document.getElementById('interests-ta')
    const el2 = document.getElementById('mats-extra-ta')
    const updated = { ...answers }
    if (el1) updated.interests = el1.value
    if (el2) updated.materialsExtra = el2.value
    setAnswers(updated)
    return updated
  }

  const handleNext = () => {
    const current = flush()
    if (!canAdvance(current)) return
    if (step < totalSteps - 1) setStep(step + 1)
    else onGenerate(current)
  }

  const handlePrev = () => { flush(); if (step > 0) setStep(step - 1) }

  return (
    <div style={{ fontFamily: F2, minHeight: '100vh', background: '#FAFDF7' }}>
      <style>{`
      @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      .fade-up{animation:fadeUp .3s ease forwards}
      @media(min-width:768px){
        h1{font-size:clamp(32px,4vw,54px) !important}
        h2{font-size:clamp(22px,3vw,32px) !important}
        p{font-size:15px !important}
        button{font-size:15px !important}
        .nav-tab{font-size:15px !important;padding:12px 20px !important}
      }
    `}</style>
      <div style={{ background: '#2E7D4F', padding: '11px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 13, fontFamily: F }}>Activity Generator</span>
        <span style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, fontWeight: 600 }}>{step + 1} / {totalSteps} — {stepNames[step]}</span>
      </div>
      <div style={{ height: 4, background: '#C8E6C9' }}>
        <div style={{ background: '#2E7D4F', height: '100%', width: `${pct}%`, transition: 'width .4s ease' }} />
      </div>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '26px 18px' }} className="fade-up">
        {step === 0 && <AgeStep a={answers} set={setAnswers} />}
        {step === 1 && <OccasionStep a={answers} set={setAnswers} />}
        {step === 2 && <InterestsStep a={answers} />}
        {step === 3 && <EnergyStep a={answers} set={setAnswers} />}
        {step === 4 && <MaterialsStep a={answers} set={setAnswers} />}
        {step === 5 && <DifficultyStep a={answers} set={setAnswers} />}
        <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
          {step > 0 && <button onClick={handlePrev} style={BtnOutline()}>Back</button>}
          <button id="next-btn" onClick={handleNext} style={{ flex: 1, ...BtnOrange(), opacity: canAdvance() ? 1 : 0.38, cursor: canAdvance() ? 'pointer' : 'default' }}>
            {step < totalSteps - 1 ? 'Next' : 'Build my activity'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>Parents fill this out. No children's data collected.</p>
      </div>
    </div>
  )
}

function OptionBtn({ selected, onClick, children }) {
  return (
    <button onClick={onClick} style={{ width: '100%', border: `2px solid ${selected ? '#2E7D4F' : '#C8E6C9'}`, borderRadius: 13, padding: '13px 16px', marginBottom: 8, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, background: selected ? '#2E7D4F' : '#fff', color: selected ? '#fff' : '#2C2416', transition: 'all .15s', fontFamily: F }}>
      {children}
    </button>
  )
}

function AgeStep({ a, set }) {
  return (
    <>
      <p style={QStyle}>How old is your child?</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {AGE_GROUPS.map(ag => (
          <button key={ag.v} onClick={() => set(x => ({ ...x, age: ag.v }))}
            style={{ border: `2px solid ${a.age === ag.v ? '#2E7D4F' : '#C8E6C9'}`, borderRadius: 13, padding: '16px 10px', cursor: 'pointer', background: a.age === ag.v ? '#2E7D4F' : '#fff', color: a.age === ag.v ? '#fff' : '#2C2416', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all .15s', fontFamily: F }}>
            <span style={{ fontSize: 22 }}>{ag.e}</span>
            <span style={{ fontWeight: 800, fontSize: 13 }}>{ag.l}</span>
            <span style={{ fontSize: 10, opacity: .7, fontWeight: 600 }}>{ag.d}</span>
          </button>
        ))}
      </div>
    </>
  )
}

function OccasionStep({ a, set }) {
  return (
    <>
      <p style={QStyle}>What is the occasion?</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {OCCASIONS.map(o => (
          <button key={o.v} onClick={() => set(x => ({ ...x, occasion: o.v, holiday: '', birthdayDetails: '' }))}
            style={{ border: `2px solid ${a.occasion === o.v ? '#2E7D4F' : '#C8E6C9'}`, borderRadius: 13, padding: '12px 10px', cursor: 'pointer', background: a.occasion === o.v ? '#2E7D4F' : '#fff', color: a.occasion === o.v ? '#fff' : '#2C2416', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .15s', fontFamily: F, fontSize: 13, fontWeight: 700 }}>
            <span style={{ fontSize: 18 }}>{o.e}</span>
            {o.l}
          </button>
        ))}
      </div>
      {a.occasion === 'holiday' && (
        <div style={{ background: '#F0FAF4', borderRadius: 13, padding: '16px 18px', marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#2E7D4F', margin: '0 0 10px', fontFamily: F }}>Which holiday?</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {HOLIDAYS.map(h => (
              <button key={h} onClick={() => set(x => ({ ...x, holiday: h }))}
                style={{ background: a.holiday === h ? '#2E7D4F' : '#fff', color: a.holiday === h ? '#fff' : '#4A6741', border: `1.5px solid ${a.holiday === h ? '#2E7D4F' : '#A5D6A7'}`, borderRadius: 50, padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
                {h}
              </button>
            ))}
          </div>
        </div>
      )}
      {a.occasion === 'vacation' && (
        <div style={{ background: '#F0FAF4', borderRadius: 13, padding: '16px 18px', marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#2E7D4F', margin: '0 0 10px', fontFamily: F }}>Where are you?</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Beach','Theme park','City trip','Visiting family','Camping','Hotel stay','Road trip','Other'].map(v => (
              <button key={v} onClick={() => set(x => ({ ...x, vacationWhere: v }))}
                style={{ background: a.vacationWhere === v ? '#2E7D4F' : '#fff', color: a.vacationWhere === v ? '#fff' : '#4A6741', border: `1.5px solid ${a.vacationWhere === v ? '#2E7D4F' : '#A5D6A7'}`, borderRadius: 50, padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
                {v}
              </button>
            ))}
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 11, color: '#4A6741', fontStyle: 'italic' }}>
            Note: materials you selected are what you have at home. For vacation, use the special items field to list what you actually brought.
          </p>
        </div>
      )}
      {a.occasion === 'birthday' && (
        <div style={{ background: '#F0FAF4', borderRadius: 13, padding: '16px 18px' }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#2E7D4F', margin: '0 0 8px', fontFamily: F }}>Tell us more</p>
          <input
            type="text" placeholder="e.g. My daughter's 5th birthday, about 8 kids"
            defaultValue={a.birthdayDetails}
            onBlur={e => set(x => ({ ...x, birthdayDetails: e.target.value }))}
            style={{ width: '100%', border: '2px solid #C8E6C9', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontFamily: F2, outline: 'none', boxSizing: 'border-box', color: '#2C2416', background: '#fff' }}
          />
        </div>
      )}
    </>
  )
}

function InterestsStep({ a }) {
  return (
    <>
      <p style={QStyle}>What is your child into right now?</p>
      <p style={{ color: '#4A6741', fontSize: 13, margin: '0 0 12px', lineHeight: 1.6, fontWeight: 500 }}>
        Write it in your own words. The more specific the better.<br />
        <em style={{ color: '#2E7D4F' }}>For example: "She loves shapes, counting, building tall towers" or "He is obsessed with dinosaurs and drawing maps"</em>
      </p>
      <textarea
        id="interests-ta"
        defaultValue={a.interests}
        placeholder="Tell us about your kid's interests, passions, and current obsessions..."
        style={{ width: '100%', border: '2px solid #C8E6C9', borderRadius: 13, padding: '13px 15px', fontSize: 14, fontFamily: F2, resize: 'vertical', minHeight: 110, color: '#2C2416', background: '#FAFDF7', outline: 'none', boxSizing: 'border-box', lineHeight: 1.7 }}
        onFocus={e => e.target.style.borderColor = '#2E7D4F'}
        onChange={e => {
          const el = document.getElementById('next-btn')
          if (el) el.style.opacity = e.target.value.trim().length > 3 ? '1' : '0.38'
        }}
        onBlur={e => e.target.style.borderColor = e.target.value.trim().length > 3 ? '#2E7D4F' : '#C8E6C9'}
      />
      <div style={{ marginTop: 10, background: '#F5F0E8', borderRadius: 11, padding: '10px 13px' }}>
        <p style={{ margin: 0, fontSize: 11, color: '#4A6741', lineHeight: 1.7, fontWeight: 600 }}>
          Tips: include specific things ("not just art, but drawing animals"), current obsessions, shows they watch, or characters they love.
        </p>
      </div>
    </>
  )
}

function EnergyStep({ a, set }) {
  return (
    <>
      <p style={QStyle}>What is their energy level right now?</p>
      {ENERGY.map(e => (
        <OptionBtn key={e.v} selected={a.energy === e.v} onClick={() => set(x => ({ ...x, energy: e.v }))}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{e.e}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{e.l}</div>
            <div style={{ fontSize: 11, opacity: .75, fontWeight: 600 }}>{e.d}</div>
          </div>
        </OptionBtn>
      ))}
    </>
  )
}

function MaterialsStep({ a, set }) {
  const toggle = id => {
    set(x => {
      const cats = x.materialCategories || []
      return { ...x, materialCategories: cats.includes(id) ? cats.filter(c => c !== id) : [...cats, id] }
    })
  }
  return (
    <>
      <p style={QStyle}>What do you have at home?</p>
      <p style={{ color: '#4A6741', fontSize: 13, margin: '0 0 14px', lineHeight: 1.5, fontWeight: 500 }}>
        Check everything that applies, then add anything unique below.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {MATERIAL_CATS.map(c => {
          const sel = (a.materialCategories || []).includes(c.id)
          return (
            <button key={c.id} onClick={() => toggle(c.id)}
              style={{ border: `2px solid ${sel ? '#2E7D4F' : '#C8E6C9'}`, borderRadius: 13, padding: '12px 10px', cursor: 'pointer', background: sel ? '#2E7D4F' : '#fff', color: sel ? '#fff' : '#2C2416', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .15s', fontFamily: F, fontSize: 12, fontWeight: 700 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{c.e}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800 }}>{c.l}</div>
                <div style={{ fontSize: 10, opacity: .75, fontWeight: 500 }}>{c.desc.slice(0, 30)}...</div>
              </div>
            </button>
          )
        })}
      </div>
      <label style={{ ...SectionLabel(), marginBottom: 6 }}>Anything special to add?</label>
      <textarea
        id="mats-extra-ta"
        defaultValue={a.materialsExtra}
        placeholder="Favorite toys, holiday decorations, unique items... anything goes!"
        style={{ width: '100%', border: '2px solid #C8E6C9', borderRadius: 12, padding: '11px 14px', fontSize: 13, fontFamily: F2, resize: 'vertical', minHeight: 70, color: '#2C2416', background: '#FAFDF7', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
        onFocus={e => e.target.style.borderColor = '#2E7D4F'}
        onChange={e => {
          const el = document.getElementById('next-btn')
          if (el) {
            const cats = document.querySelectorAll('[data-matcat]')
            const anyCat = [...cats].some(c => c.dataset.selected === 'true')
            if (anyCat || e.target.value.trim().length > 3) el.style.opacity = '1'
          }
        }}
      />
    </>
  )
}

function DifficultyStep({ a, set }) {
  return (
    <>
      <p style={QStyle}>How ambitious are we feeling?</p>
      {DIFFICULTY.map(d => (
        <OptionBtn key={d.v} selected={a.difficulty === d.v} onClick={() => set(x => ({ ...x, difficulty: d.v }))}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{d.e}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{d.l}</div>
            <div style={{ fontSize: 11, opacity: .75, fontWeight: 600 }}>{d.d}</div>
          </div>
        </OptionBtn>
      ))}
    </>
  )
}

// ── RESULT ─────────────────────────────────────────────────────────────────────

function ResultView({ activity: act, answers: a, currentPostId, votedIds, profileSaved, emailSent, savedProfile, shareMsg, hiddenProducts, setHiddenProducts, sharedToCommunity, onUpvote, onSave, onEmail, onShare, onShareToCommunity, onNew, onNewSaved, onTweakAnswers }) {
  const voted = votedIds.has(currentPostId || '')
  const [bookIndex, setBookIndex] = useState(0)
  const [spiceIndexes, setSpiceIndexes] = useState({})
  const books = act.books || (act.book ? [act.book] : [])
  const book = books[bookIndex] || null
  const spiceUps = (act.spice_ups || []).map((sp, i) => {
    const idx = spiceIndexes[i] || 0
    if (idx === -1) return null
    if (idx === 0) return sp
    const alt = sp.alternatives?.[idx - 1]
    return alt ? { ...alt, _baseIdx: i } : null
  }).filter(Boolean)
  const ag = AGE_GROUPS.find(x => x.v === a.age)
  const occ = OCCASIONS.find(x => x.v === a.occasion)

  return (
    <div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}.fade-up{animation:fadeUp .35s ease forwards}`}</style>
      <div style={{ background: 'linear-gradient(135deg,#2E7D4F,#F9C74F)', padding: '28px 20px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.8)', marginBottom: 5, fontFamily: F }}>
          Personalized activity {ag ? `for age ${ag.l}` : ''}{occ ? ` · ${occ.l}` : ''}
        </div>
        <h1 style={{ fontSize: 'clamp(20px,5vw,36px)', fontWeight: 900, color: '#fff', margin: '0 0 8px', lineHeight: 1.15, fontFamily: F }}>{act.activity_name}</h1>
        <p style={{ color: 'rgba(255,255,255,.95)', fontSize: 'clamp(12px,3vw,15px)', margin: '0 0 12px', lineHeight: 1.5 }}>{act.tagline}</p>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[`${act.duration}`, `${a.energy} energy`, `${a.difficulty}`].filter(Boolean).map(t => (
            <span key={t} style={{ background: 'rgba(255,255,255,.2)', borderRadius: 50, padding: '3px 11px', color: '#fff', fontSize: 11, fontWeight: 700 }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 660, margin: '0 auto', padding: '20px 16px' }} className="fade-up">
        <div style={{ background: '#fff', borderRadius: 18, border: '2px solid #A5D6A7', overflow: 'hidden', boxShadow: '0 4px 20px rgba(255,140,66,.1)', marginBottom: 14 }}>
          <div style={{ padding: '20px 20px 4px' }}>
            <span style={SectionLabel()}>Steps</span>
            {act.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 11, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#2E7D4F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#2C2416', fontWeight: 500 }}>{step}</p>
              </div>
            ))}
          </div>
          {act.why_kids_love_it && (
            <div style={{ background: '#F0FAF4', margin: '4px 16px 12px', borderRadius: 10, padding: '11px 14px' }}>
              <span style={SectionLabel()}>Why they will love it</span>
              <p style={{ margin: 0, fontSize: 12, color: '#4A6741', lineHeight: 1.6 }}>{act.why_kids_love_it}</p>
            </div>
          )}
          {act.parent_tip && (
            <div style={{ background: '#F0F9FF', margin: '0 16px 16px', borderRadius: 10, padding: '11px 14px', border: '1px solid #BAE6FD' }}>
              <span style={SectionLabel('#0369A1')}>Parent tip</span>
              <p style={{ margin: 0, fontSize: 12, color: '#0C4A6E', lineHeight: 1.6 }}>{act.parent_tip}</p>
            </div>
          )}
        </div>

        {/* AdSense placeholder — replace with real ad unit when approved */}
        <div id="ad-unit" style={{ background: '#F0FAF4', border: '1.5px dashed #A5D6A7', borderRadius: 10, padding: '16px', textAlign: 'center', margin: '16px 0', minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: '#A5D6A7', fontWeight: 700, letterSpacing: 1 }}>ADVERTISEMENT</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 12px' }}>
          <div style={{ flex: 1, height: 1, background: '#C8E6C9' }} />
          <div style={{ background: '#FAFDF7', border: '1.5px solid #C8E6C9', borderRadius: 50, padding: '5px 12px', fontSize: 11, fontWeight: 800, color: '#1B5E20', whiteSpace: 'nowrap', fontFamily: F }}>Make it even more special</div>
          <div style={{ flex: 1, height: 1, background: '#C8E6C9' }} />
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#4A6741', margin: '0 0 14px', lineHeight: 1.5 }}>
          Your kid can do this <strong>right now</strong> with what you have. These are totally optional extras.
        </p>

        {books.length > 0 && bookIndex < books.length && (
          <div style={{ background: '#fff', border: '1.5px solid #E8D5FF', borderRadius: 14, padding: '16px 18px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 40, height: 52, background: 'linear-gradient(135deg,#7C3AED,#A855F7)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📖</div>
              <div style={{ flex: 1 }}>
                <span style={SectionLabel('#7C3AED')}>{bookIndex === 0 ? 'Read together after — start here' : `Another great option (${bookIndex + 1} of ${books.length})`}</span>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 2, lineHeight: 1.3, fontFamily: F }}>{book.title}</div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 5 }}>by {book.author}</div>
                <div style={{ fontSize: 12, color: '#5B21B6', lineHeight: 1.5, fontStyle: 'italic' }}>{book.why}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <a href={AMZN(`${book.title} ${book.author} children book`)} target="_blank" rel="noopener"
                style={{ background: '#7C3AED', color: '#fff', borderRadius: 50, padding: '5px 14px', fontSize: 12, fontWeight: 800, textDecoration: 'none', fontFamily: F }}>
                Love it! Find on Amazon
              </a>
              {bookIndex < books.length - 1 && (
                <button onClick={() => setBookIndex(i => i + 1)}
                  style={{ background: '#E8F5E9', color: '#2D6A4F', border: 'none', borderRadius: 50, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
                  {bookIndex === 0 ? 'Already read it and loved it? Try this one too' : 'Already have it — show another'}
                </button>
              )}
              {bookIndex < books.length - 1 && (
                <button onClick={() => setBookIndex(i => i + 1)}
                  style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 50, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
                  Not for us — try another
                </button>
              )}
              {bookIndex === books.length - 1 && (
                <span style={{ fontSize: 11, color: '#4A6741', padding: '5px 0', fontStyle: 'italic' }}>These are all our suggestions for this activity!</span>
              )}
            </div>
          </div>
        )}

        {spiceUps.length > 0 && (
          <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 14, padding: '16px 18px', marginBottom: 10 }}>
            <span style={SectionLabel()}>Spice up playtime</span>
            {(act.spice_ups || []).map((sp, i) => {
              const idx = spiceIndexes[i] || 0
              if (idx === -1) return null
              const current = idx === 0 ? sp : (sp.alternatives?.[idx - 1] || null)
              if (!current) return null
              const hasMore = idx < (sp.alternatives?.length || 0)
              const isLast = !hasMore
              return (
                <div key={i} style={{ background: '#F8F5F0', border: '1.5px solid #EEE', borderRadius: 11, padding: '11px 13px', marginBottom: i < (act.spice_ups || []).length - 1 ? 8 : 0 }}>
                  {idx > 0 && <div style={{ fontSize: 10, color: '#4A6741', fontWeight: 700, marginBottom: 4, fontFamily: F }}>ALTERNATIVE SUGGESTION</div>}
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 3, fontFamily: F }}>{current.name}</div>
                  <div style={{ fontSize: 12, color: '#4A6741', lineHeight: 1.4, marginBottom: 10 }}>{current.why}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <a href={AMZN(current.search)} target="_blank" rel="noopener"
                      style={{ background: '#FF9900', color: '#2C2416', borderRadius: 50, padding: '5px 14px', fontSize: 12, fontWeight: 800, textDecoration: 'none', fontFamily: F }}>
                      Love it! Buy it
                    </a>
                    {hasMore && (
                      <button onClick={() => setSpiceIndexes(prev => ({ ...prev, [i]: idx + 1 }))}
                        style={{ background: '#E8F5E9', color: '#2D6A4F', border: 'none', borderRadius: 50, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
                        Already have it — show another
                      </button>
                    )}
                    {hasMore && (
                      <button onClick={() => setSpiceIndexes(prev => ({ ...prev, [i]: idx + 1 }))}
                        style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 50, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
                        Not for us — try another
                      </button>
                    )}
                    {isLast && idx > 0 && (
                      <span style={{ fontSize: 11, color: '#4A6741', padding: '5px 0', fontStyle: 'italic' }}>No more suggestions for this one!</span>
                    )}
                    {isLast && idx === 0 && (
                      <>
                        <button onClick={() => setSpiceIndexes(prev => ({ ...prev, [i]: -1 }))}
                          style={{ background: '#E8F5E9', color: '#2D6A4F', border: 'none', borderRadius: 50, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
                          Already have it
                        </button>
                        <button onClick={() => setSpiceIndexes(prev => ({ ...prev, [i]: -1 }))}
                          style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 50, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
                          Not for us
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {act.kiwico_angle && (
          <div style={{ background: '#FFF5F5', border: '1.5px solid #FECACA', borderRadius: 13, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <span style={SectionLabel('#DC2626')}>Want a kit like this every month?</span>
              <p style={{ margin: 0, fontSize: 12, color: '#7F1D1D', lineHeight: 1.5 }}>{act.kiwico_angle}</p>
            </div>
            <a href={KIWICO} target="_blank" rel="noopener"
              style={{ background: '#DC2626', color: '#fff', borderRadius: 50, padding: '7px 12px', fontSize: 12, fontWeight: 800, flexShrink: 0, textDecoration: 'none', fontFamily: F }}>
              Try KiwiCo
            </a>
          </div>
        )}

        <div style={{ height: 1, background: '#C8E6C9', margin: '16px 0 14px' }} />

        <div style={{ background: '#F0FAF4', border: '1.5px solid #A5D6A7', borderRadius: 11, padding: '14px 16px', marginBottom: 10 }}>
          <span style={SectionLabel('#15803D')}>Share with the community?</span>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#166534', lineHeight: 1.5 }}>Help other parents discover great activities. Your activity will appear anonymously in the community feed.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {!sharedToCommunity ? (
              <button onClick={onShareToCommunity}
                style={{ background: '#2E7D4F', color: '#fff', border: 'none', borderRadius: 50, padding: '8px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: F }}>
                Yes, share it!
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ background: '#E8F5E9', color: '#2D6A4F', borderRadius: 50, padding: '6px 14px', fontSize: 12, fontWeight: 700, fontFamily: F }}>Shared!</span>
                <button onClick={() => currentPostId && onUpvote(currentPostId)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: voted ? '#E8F5E9' : '#F5F5F5', border: `1.5px solid ${voted ? '#2E7D4F' : '#ddd'}`, borderRadius: 50, padding: '6px 14px', cursor: voted ? 'default' : 'pointer', fontSize: 12, fontWeight: 700, fontFamily: F, color: voted ? '#2E7D4F' : '#888' }}>
                  {voted ? '🧡 Liked!' : '🤍 Like it'}
                </button>
              </div>
            )}
          </div>
        </div>

        {shareMsg && (
          <div style={{ background: '#E8F5E9', borderRadius: 10, padding: '10px 16px', marginBottom: 10, fontSize: 13, color: '#2D6A4F', fontWeight: 700, textAlign: 'center' }}>
            {shareMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <button onClick={onShare} style={{ flex: 1, minWidth: 90, ...btnBase, background: '#2D6A4F', color: '#fff', padding: '9px 14px', fontSize: 13, fontWeight: 800 }}>Share</button>
          <button onClick={onEmail} style={{ flex: 1, minWidth: 90, ...btnBase, background: '#1D4ED8', color: '#fff', padding: '9px 14px', fontSize: 13, fontWeight: 800 }}>{emailSent ? 'Email sent!' : 'Email to myself'}</button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {!profileSaved
            ? <button onClick={onSave} style={BtnOutline()}>Save profile</button>
            : <span style={{ background: '#E8F5E9', color: '#2D6A4F', borderRadius: 50, padding: '5px 12px', fontSize: 12, fontWeight: 700, fontFamily: F }}>Profile saved</span>}
          <button onClick={onNew} style={BtnOutline()}>New activity</button>
          <button onClick={onTweakAnswers} style={{ ...BtnOutline(), fontSize: 12 }}>Tweak my answers</button>
          {savedProfile && <button onClick={onNewSaved} style={{ ...BtnOutline(), color: '#888', borderColor: '#ddd' }}>Quick new</button>}
        </div>

        <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
          No child data collected. Parents fill everything out. whatshouldmykiddo.com
        </p>
      </div>
    </div>
  )
}

// ── GIFT QUIZ ──────────────────────────────────────────────────────────────────

function GiftQuizView({ step, setStep, answers, setAnswers, onGenerate, onCancel }) {
  const steps = ['Age', 'Interests', 'Budget', 'Occasion']
  const pct = ((step + 1) / 4) * 100

  const canAdvance = () => {
    if (step === 0) return !!answers.age
    if (step === 1) return answers.interests.trim().length > 3
    if (step === 2) return !!answers.budget
    return true
  }

  const flush = () => {
    const el = document.getElementById('gift-interests-ta')
    if (el) setAnswers(a => ({ ...a, interests: el.value }))
    return { ...answers, interests: el ? el.value : answers.interests }
  }

  const handleNext = () => {
    const current = flush()
    if (!canAdvance()) return
    if (step < 3) setStep(step + 1)
    else onGenerate(current)
  }

  return (
    <div style={{ fontFamily: F2, minHeight: '100vh', background: '#FAFDF7' }}>
      <style>{`
      @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      .fade-up{animation:fadeUp .3s ease forwards}
    `}</style>
      <div style={{ background: '#7C3AED', padding: '11px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 13, fontFamily: F }}>Gift Finder</span>
        <span style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, fontWeight: 600 }}>{step + 1} / 4 — {steps[step]}</span>
      </div>
      <div style={{ height: 4, background: '#EDE9FE' }}>
        <div style={{ background: '#7C3AED', height: '100%', width: `${pct}%`, transition: 'width .4s ease' }} />
      </div>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '26px 18px' }} className="fade-up">
        {step === 0 && (
          <>
            <p style={{ ...QStyle, color: '#5B21B6' }}>How old is the child you're gifting?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {AGE_GROUPS.map(ag => (
                <button key={ag.v} onClick={() => setAnswers(x => ({ ...x, age: ag.v }))}
                  style={{ border: `2px solid ${answers.age === ag.v ? '#7C3AED' : '#EDE9FE'}`, borderRadius: 13, padding: '16px 10px', cursor: 'pointer', background: answers.age === ag.v ? '#7C3AED' : '#fff', color: answers.age === ag.v ? '#fff' : '#2C2416', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all .15s', fontFamily: F }}>
                  <span style={{ fontSize: 22 }}>{ag.e}</span>
                  <span style={{ fontWeight: 800, fontSize: 13 }}>{ag.l}</span>
                  <span style={{ fontSize: 10, opacity: .7, fontWeight: 600 }}>{ag.d}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <p style={{ ...QStyle, color: '#5B21B6' }}>What are they into?</p>
            <p style={{ color: '#4A6741', fontSize: 13, margin: '0 0 12px', lineHeight: 1.6 }}>
              The more specific you are, the better the gift recommendation.
            </p>
            <textarea
              id="gift-interests-ta"
              defaultValue={answers.interests}
              placeholder="e.g. obsessed with dinosaurs, loves building things, really into art and drawing animals..."
              style={{ width: '100%', border: '2px solid #EDE9FE', borderRadius: 13, padding: '13px 15px', fontSize: 14, fontFamily: F2, resize: 'vertical', minHeight: 100, color: '#2C2416', background: '#FAFDF7', outline: 'none', boxSizing: 'border-box', lineHeight: 1.7 }}
              onFocus={e => e.target.style.borderColor = '#7C3AED'}
            />
          </>
        )}
        {step === 2 && (
          <>
            <p style={{ ...QStyle, color: '#5B21B6' }}>What is your budget?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {BUDGETS.map(b => (
                <button key={b.v} onClick={() => setAnswers(x => ({ ...x, budget: b.v }))}
                  style={{ border: `2px solid ${answers.budget === b.v ? '#7C3AED' : '#EDE9FE'}`, borderRadius: 13, padding: '16px 10px', cursor: 'pointer', background: answers.budget === b.v ? '#7C3AED' : '#fff', color: answers.budget === b.v ? '#fff' : '#2C2416', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all .15s', fontFamily: F }}>
                  <span style={{ fontSize: 22 }}>{b.e}</span>
                  <span style={{ fontWeight: 800, fontSize: 13 }}>{b.l}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <p style={{ ...QStyle, color: '#5B21B6' }}>What is the occasion?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[{ v: 'birthday', l: 'Birthday', e: '🎂' }, { v: 'holiday', l: 'Holiday', e: '🎁' }, { v: 'just-because', l: 'Just because', e: '💜' }, { v: 'achievement', l: 'Achievement', e: '🌟' }].map(o => (
                <button key={o.v} onClick={() => setAnswers(x => ({ ...x, occasion: o.v }))}
                  style={{ border: `2px solid ${answers.occasion === o.v ? '#7C3AED' : '#EDE9FE'}`, borderRadius: 13, padding: '14px 10px', cursor: 'pointer', background: answers.occasion === o.v ? '#7C3AED' : '#fff', color: answers.occasion === o.v ? '#fff' : '#2C2416', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .15s', fontFamily: F, fontSize: 13, fontWeight: 700 }}>
                  <span style={{ fontSize: 20 }}>{o.e}</span>
                  {o.l}
                </button>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
          {step > 0 && <button onClick={() => { flush(); setStep(step - 1) }} style={BtnOutline({ color: '#7C3AED', borderColor: '#7C3AED' })}>Back</button>}
          <button onClick={handleNext} style={{ flex: 1, ...BtnPurple(), opacity: canAdvance() ? 1 : 0.38, cursor: canAdvance() ? 'pointer' : 'default' }}>
            {step < 3 ? 'Next' : 'Find the perfect gift'}
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#4A6741', fontSize: 12, cursor: 'pointer', fontFamily: F }}>
            Back to activity generator
          </button>
        </div>
      </div>
    </div>
  )
}

// ── GIFT RESULT ────────────────────────────────────────────────────────────────

function GiftResultView({ gift, answers, onNew, onActivity }) {
  return (
    <div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}.fade-up{animation:fadeUp .35s ease forwards}`}</style>
      <div style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', padding: '32px 20px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.8)', marginBottom: 5, fontFamily: F }}>
          Perfect gift for age {answers.age} · {answers.budget} budget
        </div>
        <h1 style={{ fontSize: 'clamp(20px,5vw,36px)', fontWeight: 900, color: '#fff', margin: '0 0 8px', lineHeight: 1.15, fontFamily: F }}>{gift.gift_name}</h1>
        <p style={{ color: 'rgba(255,255,255,.95)', fontSize: 'clamp(12px,3vw,15px)', margin: '0 0 14px', lineHeight: 1.5 }}>{gift.tagline}</p>
        <span style={{ background: 'rgba(255,255,255,.2)', borderRadius: 50, padding: '4px 14px', color: '#fff', fontSize: 12, fontWeight: 700 }}>{gift.price_range}</span>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '22px 16px' }} className="fade-up">
        <div style={{ background: '#fff', borderRadius: 18, border: '2px solid #EDE9FE', overflow: 'hidden', boxShadow: '0 4px 20px rgba(124,58,237,.1)', marginBottom: 14 }}>
          <div style={{ padding: '20px 20px 16px' }}>
            <span style={SectionLabel('#7C3AED')}>Why they will love it</span>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#2C2416', lineHeight: 1.7 }}>{gift.why_theyll_love_it}</p>

            {gift.what_parents_say && (
              <div style={{ background: '#F5F3FF', borderRadius: 11, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: '#7C3AED', marginBottom: 6, fontFamily: F }}>What parents say</div>
                <p style={{ margin: 0, fontSize: 13, color: '#5B21B6', lineHeight: 1.7 }}>{gift.what_parents_say}</p>
              </div>
            )}

            <span style={SectionLabel('#7C3AED')}>Age appropriateness</span>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#4A6741', lineHeight: 1.6 }}>{gift.age_appropriateness}</p>

            <a href={AMZN(gift.amazon_search)} target="_blank" rel="noopener"
              style={{ display: 'block', background: '#FF9900', color: '#2C2416', borderRadius: 50, padding: '13px 28px', fontSize: 15, fontWeight: 900, textDecoration: 'none', textAlign: 'center', fontFamily: F, marginBottom: 8 }}>
              Find on Amazon
            </a>
          </div>
        </div>

        {gift.alternatives?.length > 0 && (
          <div style={{ background: '#fff', border: '1.5px solid #EDE9FE', borderRadius: 14, padding: '16px 18px', marginBottom: 14 }}>
            <span style={SectionLabel('#7C3AED')}>Already have it? Not quite right? Here are more ideas.</span>
            {gift.alternatives.map((alt, i) => (
              <div key={i} style={{ background: '#F8F5FF', borderRadius: 11, padding: '12px 14px', marginBottom: i < gift.alternatives.length - 1 ? 8 : 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 3, fontFamily: F, color: '#5B21B6' }}>{alt.name}</div>
                <div style={{ fontSize: 12, color: '#4A6741', lineHeight: 1.4, marginBottom: 8 }}>{alt.reason}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <a href={AMZN(alt.search)} target="_blank" rel="noopener"
                    style={{ background: '#7C3AED', color: '#fff', borderRadius: 50, padding: '5px 14px', fontSize: 12, fontWeight: 800, textDecoration: 'none', fontFamily: F }}>
                    See on Amazon
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={onNew} style={{ flex: 1, ...BtnPurple({ padding: '10px 16px', fontSize: 13 }) }}>Find another gift</button>
          <button onClick={onActivity} style={BtnOutline({ color: '#7C3AED', borderColor: '#7C3AED' })}>Try activity generator</button>
        </div>
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
          <h2 style={{ fontSize: 17, fontWeight: 900, margin: '0 0 3px', fontFamily: F }}>Community Activities</h2>
          <p style={{ margin: 0, fontSize: 12, color: '#4A6741' }}>Real activities from parents. Upvote your favorites.</p>
        </div>
        <button onClick={onRefresh} style={BtnOutline({ fontSize: 12, padding: '6px 13px' })}>Refresh</button>
      </div>
      {loading
        ? <Spinner />
        : posts.length === 0
          ? <EmptyState icon="🌱" title="No activities yet" sub="Generate the first one and it will appear here automatically.">
              <button onClick={onBuild} style={BtnOrange()}>Build an activity</button>
            </EmptyState>
          : posts.map(p => <ActivityCard key={p.id || p.ts} post={p} voted={votedIds.has(p.id)} onUpvote={onUpvote} />)}
    </div>
  )
}

// ── BEST OF ────────────────────────────────────────────────────────────────────

function BestOfView({ posts, loading, filter, setFilter, votedIds, onUpvote, onRefresh }) {
  const filtered = filter === 'all' ? posts : posts.filter(p => p.age === filter)
  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: '22px 16px' }}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 17, fontWeight: 900, margin: '0 0 3px', fontFamily: F }}>Best Of</h2>
        <p style={{ margin: 0, fontSize: 12, color: '#4A6741' }}>Top-voted activities from the community. These become the book.</p>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {['all', ...AGE_GROUPS.map(a => a.v)].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ background: filter === f ? '#2E7D4F' : '#F5F0E8', color: filter === f ? '#fff' : '#4A6741', border: 'none', borderRadius: 50, padding: '5px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
            {f === 'all' ? 'All ages' : AGE_GROUPS.find(a => a.v === f)?.l || f}
          </button>
        ))}
      </div>
      {loading
        ? <Spinner />
        : filtered.length === 0
          ? <EmptyState icon="🤍" title="Nothing upvoted yet" sub="Generate activities and heart the great ones!" />
          : filtered.map((p, i) => (
              <div key={p.id || p.ts} style={{ position: 'relative' }}>
                {i < 3 && (
                  <div style={{ position: 'absolute', top: -5, left: -5, background: ['#FFD700', '#C0C0C0', '#CD7F32'][i], color: '#2C2416', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, zIndex: 1 }}>
                    #{i + 1}
                  </div>
                )}
                <ActivityCard post={p} voted={votedIds.has(p.id)} onUpvote={onUpvote} />
              </div>
            ))}
      <div style={{ background: '#F0FAF4', border: '1.5px dashed #A5D6A7', borderRadius: 10, padding: '16px', textAlign: 'center', margin: '16px 0 8px', minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, color: '#A5D6A7', fontWeight: 700, letterSpacing: 1 }}>ADVERTISEMENT</span>
      </div>
    <button onClick={onRefresh} style={{ width: '100%', background: 'transparent', border: '1.5px solid #C8E6C9', borderRadius: 50, padding: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#4A6741', marginTop: 0, fontFamily: F }}>
        Refresh
      </button>
    </div>
  )
}

// ── ADMIN ──────────────────────────────────────────────────────────────────────

function AdminView({ unlocked, setUnlocked, data, loading, age, setAge, load, export: exportCSV, onExit }) {
  const byAge = {}
  data.forEach(p => { const k = p.age || 'unknown'; if (!byAge[k]) byAge[k] = []; byAge[k].push(p) })
  const filtered = age === 'all' ? data : (byAge[age] || [])
  const sorted = [...filtered].sort((a, b) => (b.votes || 0) - (a.votes || 0))

  return (
    <div style={{ fontFamily: F2, minHeight: '100vh', background: '#FAFDF7' }}>
      <div style={{ background: '#1a1a1a', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#F9C74F', fontSize: 13, fontWeight: 900, fontFamily: F }}>Book Data — Admin</span>
        <button onClick={onExit} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.2)', borderRadius: 50, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontFamily: F }}>Exit</button>
      </div>

      {!unlocked ? (
        <div style={{ maxWidth: 400, margin: '60px auto', padding: '0 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 38, marginBottom: 12 }}>📚</div>
          <h2 style={{ fontSize: 17, fontWeight: 900, margin: '0 0 6px', fontFamily: F }}>Book Data</h2>
          <p style={{ fontSize: 13, color: '#4A6741', marginBottom: 18 }}>Enter your key to access activity data.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input id="admin-key" type="password" placeholder="Admin key"
              style={{ flex: 1, border: '2px solid #C8E6C9', borderRadius: 50, padding: '9px 15px', fontSize: 13, outline: 'none', background: '#fff', color: '#2C2416', fontFamily: F2 }}
              onKeyDown={e => { if (e.key === 'Enter' && e.target.value === ADMIN_KEY) { setUnlocked(true); load() } }}
            />
            <button onClick={() => { const el = document.getElementById('admin-key'); if (el?.value === ADMIN_KEY) { setUnlocked(true); load() } }}
              style={BtnOrange({ padding: '9px 18px', fontSize: 13 })}>Enter</button>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#4A6741' }}>{data.length} activities collected</p>
            <div style={{ display: 'flex', gap: 7 }}>
              <button onClick={load} style={BtnOutline({ fontSize: 12, padding: '6px 12px' })}>Reload</button>
              <button onClick={exportCSV} style={{ background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: 50, padding: '6px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: F }}>Export CSV</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(80px,1fr))', gap: 7, marginBottom: 14 }}>
            {[['Total', data.length, '#2E7D4F'], ['Upvoted', data.filter(p => (p.votes || 0) > 0).length, '#2D6A4F'], ['2-3', (byAge['2-3'] || []).length, '#7C3AED'], ['4-5', (byAge['4-5'] || []).length, '#0369A1'], ['6-8', (byAge['6-8'] || []).length, '#0D9488'], ['9-12', (byAge['9-12'] || []).length, '#D97706']].map(([l, n, c]) => (
              <div key={l} style={{ background: '#F5F0E8', borderRadius: 9, padding: '9px 7px', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: c, fontFamily: F }}>{n}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#4A6741' }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
            {['all', ...AGE_GROUPS.map(a => a.v)].map(f => (
              <button key={f} onClick={() => setAge(f)}
                style={{ background: age === f ? '#2E7D4F' : '#F5F0E8', color: age === f ? '#fff' : '#4A6741', border: 'none', borderRadius: 50, padding: '5px 11px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
                {f === 'all' ? 'All' : AGE_GROUPS.find(a => a.v === f)?.l || f}
              </button>
            ))}
          </div>

          {loading ? <Spinner /> : sorted.length === 0
            ? <div style={{ textAlign: 'center', padding: 36 }}><button onClick={load} style={BtnOrange()}>Load data</button></div>
            : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 480 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #C8E6C9' }}>
                      {['Votes', 'Activity', 'Age', 'Occasion', 'Energy', 'Book'].map(h => (
                        <th key={h} style={{ padding: '7px 9px', textAlign: 'left', fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#4A6741', fontFamily: F }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((p, i) => (
                      <tr key={p.id || i} style={{ borderBottom: '1px solid #C8E6C9', background: i % 2 === 0 ? 'transparent' : '#F0FAF4' }}>
                        <td style={{ padding: 9, fontWeight: 900, color: (p.votes || 0) > 0 ? '#2E7D4F' : '#aaa' }}>{p.votes || 0}</td>
                        <td style={{ padding: 9 }}>
                          <div style={{ fontWeight: 700, lineHeight: 1.3, marginBottom: 1, fontFamily: F }}>{p.activity_name}</div>
                          <div style={{ fontSize: 11, color: '#4A6741' }}>{(p.tagline || '').slice(0, 50)}{(p.tagline?.length || 0) > 50 ? '…' : ''}</div>
                        </td>
                        <td style={{ padding: 9 }}>{AGE_GROUPS.find(a => a.v === p.age)?.e || ''} {p.age || '?'}</td>
                        <td style={{ padding: 9, color: '#4A6741' }}>{OCCASIONS.find(o => o.v === p.occasion)?.l || p.occasion || ''}</td>
                        <td style={{ padding: 9, color: '#4A6741' }}>{p.energy || ''}</td>
                        <td style={{ padding: 9, color: '#4A6741', fontSize: 11, fontStyle: 'italic' }}>{p.book?.title ? `"${p.book.title}"` : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 10 }}>Export CSV to sort by votes and build your book chapters by age and occasion.</p>
              </div>
            )}
        </div>
      )}
    </div>
  )
}

// ── MAIN APP ───────────────────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode] = useState('activity')
  const [stage, setStage] = useState('landing')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({ age: '', occasion: '', holiday: '', birthdayDetails: '', interests: '', energy: '', materialCategories: [], materialsExtra: '', difficulty: '' })
  const [giftAnswers, setGiftAnswers] = useState({ age: '', interests: '', budget: '', occasion: '' })
  const [giftStep, setGiftStep] = useState(0)
  const [activity, setActivity] = useState(null)
  const [gift, setGift] = useState(null)
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
  const [shareMsg, setShareMsg] = useState('')
  const [hiddenProducts, setHiddenProducts] = useState(new Set())
  const [sharedToCommunity, setSharedToCommunity] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    try { const s = localStorage.getItem('kid_profile_v4'); if (s) setSavedProfile(JSON.parse(s)) } catch {}
    try { const v = localStorage.getItem('voted_ids'); if (v) setVotedIds(new Set(JSON.parse(v))) } catch {}
    if (window.location.hash === '#admin') setIsAdmin(true)
  }, [])

  const saveVoted = ids => { try { localStorage.setItem('voted_ids', JSON.stringify([...ids])) } catch {} }
  const saveProfileLocal = ans => { try { localStorage.setItem('kid_profile_v4', JSON.stringify(ans)) } catch {} }

  const startLoadAnim = () => {
    setLoadStage(0)
    let i = 0
    timerRef.current = setInterval(() => {
      i++
      if (i < LOAD_STAGES.length) setLoadStage(i)
      else clearInterval(timerRef.current)
    }, 1800)
  }

  const generate = useCallback(async (ans) => {
    setStage('loading'); setErrorMsg(''); setHiddenProducts(new Set()); startLoadAnim()
    try {
      const result = await callAPI({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: buildActivityMsg(ans) }] })
      clearInterval(timerRef.current)
      setActivity(result)
      // Community sharing is now opt-in — parent clicks 'Yes, share it!'
      setStage('result'); setActiveNav('generator')
    } catch (e) { clearInterval(timerRef.current); setErrorMsg(e.message || 'Something went wrong'); setStage('error') }
  }, [])

  const generateGift = useCallback(async (ans) => {
    setStage('loading'); setErrorMsg(''); startLoadAnim()
    try {
      const result = await callAPI({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: GIFT_PROMPT, messages: [{ role: 'user', content: buildGiftMsg(ans) }] })
      clearInterval(timerRef.current); setGift(result); setStage('gift-result')
    } catch (e) { clearInterval(timerRef.current); setErrorMsg(e.message || 'Something went wrong'); setStage('error') }
  }, [])

  const loadCommunity = async () => {
    setCommunityLoading(true)
    try { const posts = await communityFetch(); setCommunityPosts(posts.slice(0, 40)) } catch {}
    setCommunityLoading(false)
  }

  const loadBestOf = async () => {
    setBestOfLoading(true)
    try {
      const posts = await communityFetch()
      setBestOf(posts.filter(p => (p.votes || 0) >= 1).sort((a, b) => b.votes - a.votes).slice(0, 20))
    } catch {}
    setBestOfLoading(false)
  }

  const loadAdminData = async () => {
    setAdminLoading(true)
    try { setAdminData(await communityFetch()) } catch {}
    setAdminLoading(false)
  }

  const handleUpvote = async (id) => {
    if (!id || votedIds.has(id)) return
    try {
      await communityFetch('POST', { action: 'upvote', id })
      const newIds = new Set(votedIds); newIds.add(id); setVotedIds(newIds); saveVoted(newIds)
      setCommunityPosts(prev => prev.map(p => p.id === id ? { ...p, votes: (p.votes || 0) + 1 } : p))
      setBestOf(prev => prev.map(p => p.id === id ? { ...p, votes: (p.votes || 0) + 1 } : p))
    } catch {}
  }

  const switchNav = tab => { setActiveNav(tab); if (tab === 'community') loadCommunity(); if (tab === 'bestof') loadBestOf() }

  const startFresh = () => { setMode('activity'); setStage('quiz'); setStep(0); setActivity(null); setErrorMsg(''); setAnswers({ age: '', occasion: '', holiday: '', vacationWhere: '', birthdayDetails: '', interests: '', energy: '', materialCategories: [], materialsExtra: '', difficulty: '' }); setProfileSaved(false); setEmailSent(false); setActiveNav('generator'); setHiddenProducts(new Set()); setSharedToCommunity(false) }
  const startGift = () => { setMode('gift'); setStage('quiz'); setGiftStep(0); setGift(null); setErrorMsg(''); setGiftAnswers({ age: '', interests: '', budget: '', occasion: '' }); setActiveNav('generator') }
  const startSaved = () => { if (!savedProfile) return; setMode('activity'); setAnswers({ ...savedProfile }); setStep(5); setStage('quiz'); setProfileSaved(true); setEmailSent(false); setActivity(null); setActiveNav('generator') }
  const doSaveProfile = () => { saveProfileLocal(answers); setSavedProfile({ ...answers }); setProfileSaved(true) }

  const handleShareToCommunity = async () => {
    if (sharedToCommunity || !activity) return
    try {
      const postData = {
        activity_name: activity.activity_name, tagline: activity.tagline,
        duration: activity.duration, steps: activity.steps,
        why_kids_love_it: activity.why_kids_love_it, parent_tip: activity.parent_tip,
        books: activity.books || [], spice_ups: activity.spice_ups || [],
        age: answers.age, occasion: answers.occasion, holiday: answers.holiday,
        energy: answers.energy, difficulty: answers.difficulty,
        materials_used: activity.materials_used || []
      }
      const res = await communityFetch('POST', { action: 'add', post: postData })
      if (res.post?.id) setCurrentPostId(res.post.id)
      setSharedToCommunity(true)
    } catch (e) {
      console.warn('Community share failed:', e)
      setSharedToCommunity(true) // Still show success to user
    }
  }

  const handleShare = () => {
    const txt = `We just did "${activity.activity_name}" with things we already had at home and my kid LOVED it. Try whatshouldmykiddo.com`
    if (navigator.share) { navigator.share({ text: txt, url: 'https://whatshouldmykiddo.com' }).catch(() => {}) }
    else { navigator.clipboard?.writeText(txt).then(() => { setShareMsg('Copied! Paste it in your group chat.'); setTimeout(() => setShareMsg(''), 3000) }) }
  }

  const handleEmail = () => {
    if (!activity) return
    const books = activity.books || (activity.book ? [activity.book] : [])
    const bookLine = books.length > 0 ? `\n\nRecommended reading: ${books[0].title} by ${books[0].author}` : ''
    const steps = activity.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
    const sub = encodeURIComponent(`Activity: ${activity.activity_name}`)
    const bodyText = [
      activity.activity_name,
      activity.tagline,
      '',
      `Time: ${activity.duration}`,
      '',
      'Steps:',
      steps,
      '',
      `Parent tip: ${activity.parent_tip || ''}`,
      bookLine,
      '',
      'Generated at whatshouldmykiddo.com'
    ].join('\n')
    const body = encodeURIComponent(bodyText)
    // Create a temporary link and click it — most reliable cross-browser mailto trigger
    const a = document.createElement('a')
    a.href = `mailto:?subject=${sub}&body=${body}`
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => setEmailSent(true), 300)
  }

  const exportCSV = () => {
    const data = adminAge === 'all' ? adminData : adminData.filter(p => p.age === adminAge)
    if (!data.length) { alert('No data to export.'); return }
    const sorted = [...data].sort((a, b) => (b.votes || 0) - (a.votes || 0))
    const rows = [['Activity', 'Tagline', 'Age', 'Occasion', 'Holiday', 'Energy', 'Difficulty', 'Steps', 'Book Title', 'Book Author', 'Votes', 'Date']]
    sorted.forEach(p => rows.push([`"${(p.activity_name || '').replace(/"/g, '""')}"`, `"${(p.tagline || '').replace(/"/g, '""')}"`, p.age || '', p.occasion || '', p.holiday || '', p.energy || '', p.difficulty || '', `"${(p.steps || []).join(' | ').replace(/"/g, '""')}"`, `"${(p.book?.title || '').replace(/"/g, '""')}"`, `"${(p.book?.author || '').replace(/"/g, '""')}"`, p.votes || 0, new Date(p.ts || 0).toLocaleDateString()]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `activities_${adminAge}_${Date.now()}.csv`; a.click()
  }

  if (isAdmin) return <AdminView unlocked={adminUnlocked} setUnlocked={setAdminUnlocked} data={adminData} loading={adminLoading} age={adminAge} setAge={setAdminAge} load={loadAdminData} export={exportCSV} onExit={() => { setIsAdmin(false); if (history.pushState) history.pushState('', '', location.pathname) }} />

  if (stage === 'loading') return <LoadingView stage={loadStage} interests={mode === 'gift' ? giftAnswers.interests : answers.interests} />

  if (stage === 'quiz') {
    if (mode === 'gift') return <GiftQuizView step={giftStep} setStep={setGiftStep} answers={giftAnswers} setAnswers={setGiftAnswers} onGenerate={generateGift} onCancel={() => { setMode('activity'); setStage('landing') }} />
    return <QuizView step={step} setStep={setStep} answers={answers} setAnswers={setAnswers} totalSteps={6} onGenerate={generate} />
  }

  return (
    <div style={{ fontFamily: F2, minHeight: '100vh', background: '#FAFDF7', color: '#2C2416' }}>
      <NavBar active={activeNav} onSwitch={switchNav} />
      {stage === 'error' && <ErrorView msg={errorMsg} answers={mode === 'gift' ? giftAnswers : answers} onRetry={() => mode === 'gift' ? generateGift(giftAnswers) : generate(answers)} onBack={() => setStage('quiz')} />}
      {stage === 'result' && activeNav === 'generator' && <ResultView activity={activity} answers={answers} currentPostId={currentPostId} votedIds={votedIds} profileSaved={profileSaved} emailSent={emailSent} savedProfile={savedProfile} shareMsg={shareMsg} hiddenProducts={hiddenProducts} setHiddenProducts={setHiddenProducts} sharedToCommunity={sharedToCommunity} onUpvote={handleUpvote} onSave={doSaveProfile} onEmail={handleEmail} onShare={handleShare} onShareToCommunity={handleShareToCommunity} onNew={startFresh} onNewSaved={startSaved} onTweakAnswers={() => { setStage('quiz'); setStep(0) }} />}
      {stage === 'gift-result' && activeNav === 'generator' && <GiftResultView gift={gift} answers={giftAnswers} onNew={startGift} onActivity={() => { setMode('activity'); setStage('landing') }} />}
      {activeNav === 'community' && <CommunityView posts={communityPosts} loading={communityLoading} votedIds={votedIds} onUpvote={handleUpvote} onRefresh={loadCommunity} onBuild={startFresh} />}
      {activeNav === 'bestof' && <BestOfView posts={bestOf} loading={bestOfLoading} filter={bestFilter} setFilter={setBestFilter} votedIds={votedIds} onUpvote={handleUpvote} onRefresh={loadBestOf} />}
      {activeNav === 'generator' && !['result', 'gift-result', 'error'].includes(stage) && <LandingView savedProfile={savedProfile} onStart={startFresh} onStartSaved={startSaved} onGift={startGift} />}
    </div>
  )
}
