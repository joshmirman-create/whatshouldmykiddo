import React, { useState, useEffect, useCallback, useRef } from 'react'

// ── DESIGN TOKENS ──────────────────────────────────────────────────────────────
const T = {
  green:'#2D6A4F', greenDark:'#1B4332', greenMid:'#40916C', greenLight:'#D8F3DC', greenPale:'#F0FAF4',
  gold:'#F4A261', goldLight:'#FFF3E0', cream:'#FAFAF5', white:'#FFFFFF', charcoal:'#1A2E1A',
  gray:'#4A5568', grayLight:'#718096', grayPale:'#F7F8F5', border:'#E2E8E0',
  shadow:'0 2px 12px rgba(45,106,79,0.08)', r:'16px', rSm:'10px',
}
const F = "'Montserrat','Trebuchet MS',system-ui,sans-serif"
const F2 = "'DM Sans','Trebuchet MS',system-ui,sans-serif"

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const ACTIVITY_TYPES = `watercolor painting, collage making, origami, papier-mache construction, printing and stamping art, finger weaving, handmade bookmaking, comic strip creation, fashion design and costume making, jewelry and accessory making, shadow silhouette art, nature printing, bubble painting, blow painting, splatter painting, salt painting, coffee filter art, tape resist painting, leaf rubbings and nature art, recycled sculpture, paper mosaic, string art, baking soda volcano, color mixing lab, sink or float experiment, magnet exploration station, shadow and light play, ice melting experiment, static electricity experiment, homemade slime, density rainbow jar, seed planting and mini garden, ramp and rolling race, paper bridge weight challenge, kite making and flying, paper airplane design lab, boat building and water testing, tallest tower challenge, puppet theater construction, marble maze design, obstacle course design and race, dance choreography show, yoga adventure story, freeze dance, indoor bowling alley, balloon keep-up challenge, hopscotch with twists, relay race setup, mirror movement game, sock ball basketball, baking and decorating treats, fruit and veggie sculpture, smoothie invention lab, sandwich or pizza art, homemade play dough from scratch, ice cube painting, texture collage, edible art project, shadow puppet theater, sock puppet show, newspaper reporter project, mystery detective setup, fort building and adventure roleplay, dress-up performance show, story cube game, movie trailer storyboard, homemade instrument making, rhythm and percussion patterns, lip sync music video, sound experiment lab, body percussion routine, musical freeze game, scavenger hunt with clues, treasure map adventure, friendship bracelet making, greeting card workshop, gift wrapping art, paper doll fashion show, dream catcher weaving, catapult building and launching, stop motion animation setup, kaleidoscope making, rock painting, pressed flower art, tie dye with household items, vegetable stamping, cloud dough sensory play, oobleck science experiment, balloon rocket race, straw bridge challenge`

const SYSTEM_PROMPT = `You are a creative at-home activity generator for parents. Generate ONE specific, highly personalized activity.

STRICT RULES:
1. Use ONLY the materials listed. Do not require anything else.
2. Make it deeply specific to the child's interests. Generic activities are not acceptable.
3. Completable in under 2 hours.
4. Difficulty: simple=3 to 4 steps, minimal mess. medium=some setup. crafty=multi-step real project.
5. Energy: calm=fully seated. medium=light movement ok. wild=physically active the entire time.
6b. Screens are allowed when they genuinely enhance the activity (e.g. playing music, a dance tutorial, stop motion animation, lip sync video). Do not force screen-free if the child's interests or activity type naturally involve a screen.
6. Age-appropriate.
7. Pick ONE activity type from this list: ${ACTIVITY_TYPES}. Rotate variety widely. Never repeat the same format.
8. Every material in the steps must have a clear stated purpose. No filler.
8b. Steps must each do something DIFFERENT. Never write 4 steps that are all the same action with a different color, ingredient, or character. Each step should advance the activity — setup, execution, discovery, extension. A step that repeats the previous step with minor variation is a failed step.
9. The activity is either a THING TO MAKE or a GAME TO PLAY. Not both muddled together.
10. If an occasion is provided, theme the activity to it specifically.
11. Books: ONLY include books if they genuinely enhance this specific activity — a story that connects to the theme, a reference that deepens the experience, or a read-aloud that fits naturally. Skip entirely for purely physical activities (freeze dance, obstacle course, sports games, active movement). When you do include books, provide 2-3 maximum — not 5. Every book must have a clear specific reason it belongs with this exact activity. A wrong author name is worse than no book at all.
12. Spice-up products: specific items under $25. Provide 4 alternatives per product.
13. Parent tip must end with: Think of this as your spark — change it, add your own twist, make it completely yours!
14. Include variations: easier, more_active, quieter, sibling.
15. Include materials_checklist as a simple list of items needed.
16. Include setup_time (e.g. "5 min") and cleanup_level (Low/Medium/High).

Respond with ONLY a JSON object. No text before or after. No markdown:
{"activity_name":"Name","tagline":"One sentence YES","duration":"20-30 min","setup_time":"5 min","cleanup_level":"Low","activity_type":"type","steps":["Step 1","Step 2","Step 3","Step 4"],"why_kids_love_it":"reason","parent_tip":"tip ending with: Think of this as your spark — change it, add your own twist, make it completely yours!","materials_used":["item1"],"materials_checklist":["item1","item2"],"variations":{"easier":"how","more_active":"how","quieter":"how","sibling":"how"},"books":[] or [{"title":"Real title","author":"Real author — verify this is correct","why":"specific reason this book fits this exact activity"}] — omit books array entirely if no genuine fit exists,"spice_ups":[{"name":"Product","why":"how it helps","search":"Amazon search","alternatives":[{"name":"Alt","why":"why","search":"search"},{"name":"Alt","why":"why","search":"search"},{"name":"Alt","why":"why","search":"search"},{"name":"Alt","why":"why","search":"search"}]},{"name":"Product","why":"how it helps","search":"Amazon search","alternatives":[{"name":"Alt","why":"why","search":"search"},{"name":"Alt","why":"why","search":"search"},{"name":"Alt","why":"why","search":"search"},{"name":"Alt","why":"why","search":"search"}]}],"kiwico_angle":"one sentence"}`

const GIFT_PROMPT = `You are a children's gift recommendation expert. Recommend the single best gift for this child.

RULES:
1. The main gift should be a specific, tangible product (toy, kit, game, art supply, etc.)
2. Include a book recommendation ONLY when it genuinely connects to the recipient's specific interests and the gift theme. If the child loves Minecraft, a Minecraft guide or novel fits naturally. If the child loves soccer, a book feels forced. When in doubt, omit it. Never include a book just to include one.
3. Include 4 alternatives — varied directions, not just versions of the same thing.
4. Be specific. "Minecraft Handbook" is better than "a gaming book."

Respond with ONLY a JSON object. No text before or after:
{"gift_name":"Specific product","tagline":"Why perfect","why_theyll_love_it":"2-3 sentences specific to interests and age","price_range":"$25-40","amazon_search":"search term","amazon_asin":"real Amazon ASIN like B08XYZ123 — search Amazon to find the actual product, or null if unsure","what_parents_say":"2-3 sentence summary of what parents generally report. Write as genuine summary not fake quote.","age_appropriateness":"one sentence","book":{"title":"Real book title","author":"Real author name","why":"one sentence why this book fits this child","type":"picture book / graphic novel / activity book / etc"},"alternatives":[{"name":"Alt","reason":"why fit","search":"search"},{"name":"Alt","reason":"why fit","search":"search"},{"name":"Alt","reason":"why fit","search":"search"},{"name":"Alt","reason":"why fit","search":"search"}]}`

const AGE_GROUPS = [
  {v:'0-1',l:'0-1',e:'🍼',d:'Infant'},{v:'2-3',l:'2-3',e:'🐣',d:'Toddler'},
  {v:'4-5',l:'4-5',e:'🌱',d:'Preschool'},{v:'6-8',l:'6-8',e:'⭐',d:'Elementary'},
  {v:'9-12',l:'9-12',e:'🚀',d:'Tween'},{v:'13+',l:'13+',e:'🎓',d:'Teen'},
]
const OCCASIONS = [
  {v:'regular',l:'Just a regular day',e:'😊'},{v:'after-school',l:'After school',e:'🎒'},
  {v:'weekend',l:'Weekend fun',e:'☀️'},{v:'vacation',l:'On vacation',e:'✈️'},
  {v:'holiday',l:'Holiday time',e:'🎉'},{v:'birthday',l:'Birthday party',e:'🎂'},
  {v:'sick-day',l:'Sick/quiet day',e:'🛋️'},{v:'rainy-day',l:'Rainy day',e:'🌧️'},
]
const HOLIDAYS = ['Christmas','Halloween','Thanksgiving','Easter','Hanukkah',"Valentine's Day",'4th of July','Other']
const ENERGY = [
  {v:'calm',l:'Calm & cozy',e:'☁️',d:'Seated, focused, low-key'},
  {v:'medium',l:'Playful',e:'🌤️',d:'Some movement, engaged'},
  {v:'wild',l:'Full energy',e:'⚡',d:'Needs to move and run!'},
]
const DIFFICULTY = [
  {v:'simple',l:'Keep it simple',e:'😊',d:'Low mess · fast · few steps'},
  {v:'medium',l:'We can do this',e:'🛠️',d:'Moderate setup · better payoff'},
  {v:'crafty',l:"I'm crafty!",e:'🎨',d:'Bigger build · more wow factor'},
]
const MATERIAL_CATS = [
  {id:'plain-paper',l:'Plain paper',desc:'plain white or colored paper',e:'📄'},
  {id:'crayons-markers',l:'Crayons & markers',desc:'crayons, markers, colored pencils',e:'🖍️'},
  {id:'paint',l:'Paint & brushes',desc:'paint and paintbrushes',e:'🎨'},
  {id:'cardboard',l:'Cardboard & boxes',desc:'cardboard boxes, toilet paper rolls, egg cartons',e:'📦'},
  {id:'tape',l:'Tape',desc:'scotch tape, masking tape, or duct tape',e:'🩹'},
  {id:'glue-scissors',l:'Glue & scissors',desc:'glue stick, white glue, and scissors',e:'✂️'},
  {id:'aluminum-foil',l:'Aluminum foil',desc:'aluminum foil',e:'🛠️'},
  {id:'dried-food',l:'Pantry items',desc:'dried pasta, beans, rice, flour, salt, sugar',e:'🫙'},
  {id:'baking',l:'Baking supplies',desc:'baking soda, vinegar, food coloring, cornstarch',e:'🧪'},
  {id:'fabric-yarn',l:'Fabric & yarn',desc:'fabric scraps, yarn, string, ribbon, old socks',e:'🧵'},
  {id:'lego',l:'LEGO bricks',desc:'LEGO bricks and baseplates',e:'🧱'},
  {id:'blocks',l:'Wooden blocks',desc:'wooden building blocks',e:'🪵'},
  {id:'outdoor',l:'Outdoor & nature',desc:'sticks, leaves, rocks, pebbles, pinecones',e:'🌿'},
  {id:'pipe-cleaners',l:'Pipe cleaners',desc:'pipe cleaners (chenille stems)',e:'🌀'},
  {id:'pom-poms',l:'Pom poms & eyes',desc:'pom poms, googly eyes, feathers, cotton balls',e:'👀'},
  {id:'stickers',l:'Stickers & foam',desc:'stickers, foam sheets, foam stickers',e:'⭐'},
  {id:'rubber-bands',l:'Rubber bands',desc:'rubber bands, string, twine',e:'🪢'},
  {id:'balloons',l:'Balloons',desc:'balloons',e:'🎈'},
  {id:'old-magazines',l:'Magazines',desc:'old magazines, newspapers, catalogs',e:'📰'},
  {id:'plastic-cups',l:'Cups & containers',desc:'plastic cups, bowls, containers, bottles',e:'🥤'},
]
const INTEREST_CHIPS = ['Dinosaurs','Drawing','Music','Animals','Vehicles','Math & counting','Pretend play','Sensory play','Building','Dancing','Science','Space','Cooking','Sports','Reading','Art']
const BUDGETS = [{v:'10-20',l:'Up to $20',e:'💚'},{v:'20-40',l:'$20-$40',e:'💛'},{v:'40-75',l:'$40-$75',e:'🧡'},{v:'75+',l:'$75+',e:'💜'}]
const LOAD_STAGES = [
  {label:"Reading your kid's profile...",pct:15},{label:"Matching age and attention span...",pct:28},
  {label:"Looking at your available materials...",pct:45},{label:"Tuning for energy level...",pct:62},
  {label:"Adding the finishing touches...",pct:78},{label:"Building your activity...",pct:92},
  {label:"Almost ready!",pct:98},
]
const ADMIN_KEY = 'zsadmin2026'
const KIWICO = 'https://www.kiwico.com/?ref=YOURAFFILIATEID'
const AMZN = q => `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=zenmonkeystud-20`
const BOOKSHOP = (title) => `https://bookshop.org/search?keywords=${encodeURIComponent(title)}&affiliate=122560`
const BAM = (title) => `https://www.booksamillion.com/search?query=${encodeURIComponent(title)}&id=101712536-11173806`
const SAMPLE_ACTIVITIES = [
  {title:'Shape-Shifting Dance Floor',age:'4-5 yrs',time:'30 min',energy:'Wild',summary:'Create geometric dance zones from cardboard and challenge each other to move only inside them.'},
  {title:'Dino Fossil Dig Lab',age:'6-8 yrs',time:'45 min',energy:'Calm',summary:'Mix flour and salt dough, hide small toys inside, let it dry, then excavate with craft sticks.'},
  {title:'Sock Puppet Theater Show',age:'4-5 yrs',time:'35 min',energy:'Medium',summary:'Turn old socks into characters and perform an original story for the family.'},
]

// ── HELPERS ────────────────────────────────────────────────────────────────────
function extractJSON(text) {
  const cleaned = text.replace(/\u2018|\u2019/g,"'").replace(/\u201C|\u201D/g,'"').replace(/\u2013|\u2014/g,'-')
  if (!cleaned.includes('{')) throw new Error(`No JSON found. Response started with: "${text.slice(0,150)}"`)
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch {}
    try { return JSON.parse(match[0].replace(/,\s*([}\]])/g,'$1')) } catch {}
  }
  const nm = cleaned.match(/"activity_name"\s*:\s*"([^"]+)"/)
  const tm = cleaned.match(/"tagline"\s*:\s*"([^"]+)"/)
  if (nm && tm) throw new Error('The response was cut short. Please try again.')
  throw new Error('Response was incomplete. Please try again.')
}

async function callAPI(body) {
  const res = await fetch('/api/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
  if (!res.ok) { const t = await res.text(); throw new Error(`Server error ${res.status}: ${t.slice(0,120)}`) }
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'API error')
  const txt = data.content?.find(b => b.type === 'text')?.text || ''
  if (!txt) throw new Error('Empty response from API')
  return extractJSON(txt)
}

async function communityFetch(method='GET', body=null) {
  const res = await fetch('/api/community', { method, headers:body?{'Content-Type':'application/json'}:{}, body:body?JSON.stringify(body):undefined })
  if (!res.ok) throw new Error('Community request failed')
  return res.json()
}

function buildActivityMsg(a) {
  const occ = a.occasion ? `Occasion: ${a.occasion}${a.holiday?` (${a.holiday})`:''}${a.vacationWhere?` at ${a.vacationWhere}`:''}${a.birthdayDetails?`, ${a.birthdayDetails}`:''}` : ''
  const catItems = (a.materialCategories||[]).map(id => MATERIAL_CATS.find(c=>c.id===id)?.desc||'').filter(Boolean)
  const extras = (a.materialsExtra||'').trim()
  const matLines = [...catItems.map(d=>`- ${d}`), ...(extras?[`- ${extras}`]:[])].join('\n')
  return `Child age: ${a.age}\n${occ}\nChild's interests: ${a.interests}\nEnergy level: ${a.energy}\nDifficulty: ${a.difficulty}\nMaterials (use ONLY items from this list, pick the most basic/common from each category):\n${matLines}\n\nGenerate a personalized activity.`
}

function buildGiftMsg(g) {
  return `Child age: ${g.age}\nInterests: ${g.interests}\nBudget: ${g.budget}\nOccasion: ${g.occasion||'general gift'}\n\nRecommend the single best gift.`
}

function inferActivityStyle(a) {
  const int = (a.interests||'').toLowerCase()
  const en = a.energy
  if (!int && !en) return null
  if (en === 'wild') return int.includes('music')||int.includes('danc') ? '💃 Active + Performance' : '🏃 Movement + Play'
  if (en === 'calm') return int.includes('draw')||int.includes('art') ? '🎨 Creative + Art' : int.includes('build') ? '🧱 Calm + Building' : '☁️ Calm + Sensory'
  return int.includes('math')||int.includes('count') ? '🔢 Playful + Learning' : int.includes('build') ? '🛠️ Creative + Building' : '🌟 Playful + Creative'
}

// ── UI ATOMS ──────────────────────────────────────────────────────────────────
function Pill({ children, color=T.green, bg=T.greenLight }) {
  return <span style={{display:'inline-block',background:bg,color,borderRadius:50,padding:'3px 10px',fontSize:11,fontWeight:700,fontFamily:F,whiteSpace:'nowrap'}}>{children}</span>
}

function Btn({ children, onClick, variant='primary', size='md', style:sx={}, disabled, href, target }) {
  const base = {display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:F,fontWeight:800,borderRadius:10,border:'none',cursor:disabled?'not-allowed':'pointer',textDecoration:'none',transition:'all .15s',...sx}
  const sizes = {sm:{padding:'7px 16px',fontSize:13},md:{padding:'11px 24px',fontSize:15},lg:{padding:'14px 32px',fontSize:16}}
  const variants = {
    primary:{background:T.green,color:'#fff'},dark:{background:T.charcoal,color:T.gold},
    outline:{background:'transparent',color:T.green,border:`2px solid ${T.green}`},
    ghost:{background:'rgba(255,255,255,.15)',color:'#fff',border:'2px solid rgba(255,255,255,.35)'},
    gold:{background:T.gold,color:T.charcoal},purple:{background:'#7C3AED',color:'#fff'},
    danger:{background:'#FEF2F2',color:'#DC2626',border:'none'},success:{background:'#E8F5E9',color:'#2D6A4F',border:'none'},
    subtleGray:{background:T.grayPale,color:T.gray,border:`1.5px solid ${T.border}`},
  }
  const s = {...base,...sizes[size],...variants[variant],opacity:disabled?.4:1}
  if (href) return <a href={href} target={target} style={s}>{children}</a>
  return <button onClick={disabled?undefined:onClick} style={s}>{children}</button>
}

function Card({ children, style:sx={}, shadow=true }) {
  return <div style={{background:T.white,borderRadius:T.r,border:`1.5px solid ${T.border}`,boxShadow:shadow?T.shadow:'none',...sx}}>{children}</div>
}

function SLabel({ children, color=T.green }) {
  return <div style={{fontSize:11,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color,fontFamily:F,marginBottom:6}}>{children}</div>
}

function AdUnit({ style:sx={} }) {
  return <div style={{background:T.greenPale,border:`1.5px dashed ${T.greenLight}`,borderRadius:T.rSm,padding:16,textAlign:'center',minHeight:80,display:'flex',alignItems:'center',justifyContent:'center',...sx}}><span style={{fontSize:11,color:'#A5D6A7',fontWeight:700,letterSpacing:1}}>ADVERTISEMENT</span></div>
}

function Spinner() {
  return <div style={{textAlign:'center',padding:40}}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><div style={{width:34,height:34,border:`3px solid ${T.greenLight}`,borderTop:`3px solid ${T.green}`,borderRadius:'50%',margin:'0 auto 10px',animation:'spin .85s linear infinite'}}/><p style={{color:T.gray,fontSize:13,margin:0}}>Loading...</p></div>
}

function EmptyState({ icon, title, sub, children }) {
  return <div style={{textAlign:'center',padding:'48px 18px',background:T.greenPale,borderRadius:T.r}}><div style={{fontSize:36,marginBottom:10}}>{icon}</div><p style={{fontWeight:800,margin:'0 0 5px',fontFamily:F,color:T.charcoal}}>{title}</p><p style={{fontSize:13,color:T.gray,margin:'0 0 16px',lineHeight:1.5}}>{sub}</p>{children}</div>
}

function useIsMobile() {
  const [mobile, setMobile] = React.useState(window.innerWidth < 900)
  React.useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 900)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return mobile
}

function SiteFooter() {
  return (
    <footer style={{background:T.charcoal,padding:'20px 24px',marginTop:20}}>
      <div style={{maxWidth:1100,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
        <div style={{fontSize:13,color:'rgba(255,255,255,.5)',fontFamily:F}}>© Zen Monkey Studios · whatshouldmykiddo.com</div>
        <div style={{fontSize:12,color:'rgba(255,255,255,.3)',fontFamily:F}}>COPPA compliant · No children's data collected</div>
      </div>
    </footer>
  )
}


// ── HEADER ────────────────────────────────────────────────────────────────────
function SiteHeader({ activeNav, onSwitch, onGeneratorClick }) {
  return (
    <>
      <header style={{background:T.white,borderBottom:`1.5px solid ${T.border}`,position:'sticky',top:0,zIndex:100,boxShadow:'0 1px 8px rgba(0,0,0,0.04)'}}>
        <style>{`
          .kNav{display:none}
          @media(min-width:600px){.kNav{display:block}}
          .kBottomNav button,.kBottomNav a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:none;border:none;cursor:pointer;font-family:'Montserrat',sans-serif;font-weight:700;font-size:10px;padding:8px 4px;text-decoration:none;line-height:1.2}
          @media(max-width:599px){body{padding-bottom:68px}}
          @media(max-width:599px){.kHeader{flex-direction:column;align-items:flex-start;height:auto;padding:10px 14px;gap:6px}}
          @media(max-width:599px){.kHeaderNav{width:100%;justify-content:flex-start}}
        `}</style>
        <div className="kHeader" style={{maxWidth:1200,margin:'0 auto',padding:'0 14px',display:'flex',alignItems:'center',justifyContent:'space-between',height:52}}>
          <button onClick={()=>{onSwitch('generator');onGeneratorClick()}} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
            <span style={{fontSize:18}}>🎨</span>
            <span style={{fontSize:13,fontWeight:900,color:T.charcoal,fontFamily:F,whiteSpace:'nowrap'}}>what should my kid do?</span>
          </button>
          <nav className="kHeaderNav" style={{display:'flex',gap:2,alignItems:'center',flexShrink:0}}>
            <a href="/activities" className="kNav" style={{background:'none',border:'none',cursor:'pointer',padding:'6px 10px',fontSize:13,fontWeight:700,color:'#718096',fontFamily:"'Montserrat',sans-serif",whiteSpace:'nowrap',textDecoration:'none'}}>Activities</a>
            <a href="https://www.whatgiftshouldibuy.com" className="kNav" style={{background:'none',border:'none',cursor:'pointer',padding:'6px 10px',fontSize:13,fontWeight:700,color:'#718096',fontFamily:"'Montserrat',sans-serif",whiteSpace:'nowrap',textDecoration:'none'}}>🎁 Gifts</a>
            <Btn size="sm" onClick={onGeneratorClick} style={{marginLeft:8,whiteSpace:'nowrap'}}>🛠️ Build</Btn>
          </nav>
        </div>
      </header>
      <nav className="kBottomNav" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:200,background:T.white,borderTop:`1.5px solid ${T.border}`,boxShadow:'0 -2px 12px rgba(0,0,0,0.08)',display:'flex',paddingBottom:'env(safe-area-inset-bottom)'}}>
          <a href="/activities" className="kBottomNavBtn"><span style={{fontSize:20}}>⚡</span>Activities</a>
          <a href="/saved" className="kBottomNavBtn"><span style={{fontSize:20}}>❤️</span>Saved</a>
          <a href="https://www.whatgiftshouldibuy.com" className="kBottomNavBtn"><span style={{fontSize:20}}>🎁</span>Gifts</a>
          <button onClick={onGeneratorClick} className="kBottomNavBtn" style={{color:T.green,fontWeight:900,flex:1}}><span style={{fontSize:20}}>🛠️</span>Build</button>
      </nav>
    </>
  )
}


// ── HOMEPAGE ──────────────────────────────────────────────────────────────────
function HeroPreview() {
  return (
    <div style={{position:'relative',padding:'0 0 20px 20px'}}>
      <Card style={{padding:18,marginBottom:12,background:T.greenDark,border:'none',color:'#fff',boxShadow:'none'}}>
        <div style={{fontSize:10,color:'rgba(255,255,255,.6)',fontWeight:700,letterSpacing:1,marginBottom:8,fontFamily:F}}>YOUR KID'S ACTIVITY</div>
        <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
          <div style={{width:36,height:36,background:T.gold,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🎨</div>
          <div>
            <div style={{fontSize:14,fontWeight:900,fontFamily:F,marginBottom:4}}>Shape-Shifting Dance Floor Challenge</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{['45-60 min','Ages 6-8','Weekend fun'].map(t=><span key={t} style={{background:'rgba(255,255,255,.15)',borderRadius:50,padding:'2px 8px',fontSize:10,fontWeight:700}}>{t}</span>)}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.75)',marginTop:5,lineHeight:1.5}}>Build geometric dance zones and boogie to earn shape points!</div>
          </div>
        </div>
      </Card>
      <Card style={{padding:14,marginBottom:10}}>
        <SLabel color={T.grayLight}>EXAMPLE PROFILE</SLabel>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,borderRadius:'50%',background:T.greenLight,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>👦</div>
          <div>
            <div style={{fontWeight:800,fontSize:13,fontFamily:F,color:T.charcoal}}>Age 6-8 · Elementary</div>
            <div style={{fontSize:11,color:T.gray}}>💚 Loves shapes, math, and dancing</div>
            <div style={{fontSize:11,color:T.gray}}>📦 Cardboard, markers, and tape</div>
          </div>
        </div>
      </Card>
      <Card style={{padding:14,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:32,height:40,background:'linear-gradient(135deg,#7C3AED,#A855F7)',borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>📖</div>
          <div>
            <div style={{fontSize:12,fontWeight:800,color:T.charcoal,fontFamily:F}}>The Greedy Triangle</div>
            <div style={{fontSize:11,color:T.gray}}>Perfect read-together</div>
          </div>
        </div>
        <Btn size="sm" style={{background:'#7C3AED',fontSize:11}}>Amazon</Btn>
      </Card>
      <div style={{position:'absolute',top:-15,right:10,fontSize:26}}>⭐</div>
    </div>
  )
}

function HomePage({ onStart, onStartSaved, savedProfile, onGift }) {
  return (
    <div>
      {/* Hero */}
      <section style={{background:T.cream,padding:'40px 16px 36px'}}>
        <div style={{maxWidth:600,margin:'0 auto',textAlign:'center'}}>
          <h1 style={{fontSize:'clamp(26px,6vw,48px)',fontWeight:900,color:T.charcoal,margin:'0 0 12px',lineHeight:1.15,fontFamily:F}}>
            Turn <em style={{color:T.green,fontStyle:'normal'}}>"I'm bored!"</em> into their new favorite activity
          </h1>
          <p style={{fontSize:'clamp(14px,2vw,16px)',color:T.gray,margin:'0 0 24px',lineHeight:1.6,maxWidth:440,marginLeft:'auto',marginRight:'auto'}}>
            Tell us your kid's age, what they love, and what you have at home. We build something they can start right now.
          </p>
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap',marginBottom:20}}>
            <Btn size="lg" onClick={onStart}>🛠️ Build an activity for my kid</Btn>
            {savedProfile && <Btn size="lg" onClick={onStartSaved} style={{background:T.greenLight,color:T.green,border:'none'}}>Use saved profile</Btn>}
          </div>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'#FFF8F0',border:`1.5px solid ${T.gold}`,borderRadius:50,padding:'8px 18px',cursor:'pointer'}} onClick={onGift}>
            <span style={{fontSize:16}}>🎁</span>
            <span style={{fontSize:13,fontWeight:700,color:'#C05621',fontFamily:F}}>Need to figure out a personal gift instead?</span>
            <span style={{fontSize:12,color:'#C05621',fontWeight:700}}>→</span>
          </div>
        </div>
      </section>

      {/* Quick jump */}
      <section style={{padding:'14px 20px',background:T.white,borderBottom:`1px solid ${T.border}`}}>
        <div style={{maxWidth:700,margin:'0 auto',display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',justifyContent:'center'}}>
          {[
            {e:'⚡',l:'15 min',href:'/quick-15-minute-activities-for-kids'},
            {e:'🌧️',l:'Rainy day',href:'/rainy-day-activities-for-kids'},
            {e:'😴',l:'Tired parents',href:'/low-prep-activities-for-tired-parents'},
            {e:'📵',l:'Screen free',href:'/screen-free-activities-for-kids'},
            {e:'🔢',l:'By age',href:'/activities'},
          ].map(c=>(
            <a key={c.l} href={c.href} style={{display:'flex',alignItems:'center',gap:5,background:T.grayPale,border:`1.5px solid ${T.border}`,borderRadius:50,padding:'6px 14px',textDecoration:'none',fontSize:13,fontWeight:700,color:T.gray,fontFamily:F,whiteSpace:'nowrap'}}
              onMouseOver={e=>{e.currentTarget.style.background=T.greenPale;e.currentTarget.style.borderColor=T.green;e.currentTarget.style.color=T.green}}
              onMouseOut={e=>{e.currentTarget.style.background=T.grayPale;e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.gray}}>
              <span>{c.e}</span>{c.l}
            </a>
          ))}
        </div>
      </section>

      {/* Collections */}
      <section style={{padding:'40px 20px 48px',background:T.white}}>
        <div style={{maxWidth:900,margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:20}}>
            <div>
              <h2 style={{fontSize:'clamp(18px,4vw,24px)',fontWeight:900,color:T.charcoal,margin:'0 0 2px',fontFamily:F}}>Ready-made collections</h2>
              <p style={{fontSize:13,color:T.gray,margin:0}}>No quiz needed. Pick one and go.</p>
            </div>
            <a href="/activities" style={{fontSize:13,fontWeight:700,color:T.green,textDecoration:'none',fontFamily:F}}>Browse all →</a>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:28}}>
            {[
              {e:'⚡',title:'15-Minute Activities',desc:'Start in under a minute. Full steps, no shopping.',href:'/quick-15-minute-activities-for-kids',tag:'8 activities'},
              {e:'🌧️',title:'Rainy Day',desc:'Stuck inside? Activities that work with what you have.',href:'/rainy-day-activities-for-kids',tag:'All ages'},
              {e:'😴',title:'Tired Parent Approved',desc:'You lie down. They stay busy. Everyone wins.',href:'/low-prep-activities-for-tired-parents',tag:'Low prep'},
              {e:'☁️',title:'Quiet Time',desc:'Low energy, genuinely absorbing, no mess.',href:'/quiet-activities-for-kids',tag:'No mess'},
              {e:'🎒',title:'After School',desc:'That hard hour between school and dinner.',href:'/after-school-activities-for-kids',tag:'Ages 4-12'},
              {e:'📵',title:'Screen Free',desc:'Activities worth putting the tablet down for.',href:'/screen-free-activities-for-kids',tag:'Any age'},
            ].map(c=>(
              <a key={c.title} href={c.href} style={{background:T.grayPale,borderRadius:T.r,padding:'18px',textDecoration:'none',color:T.charcoal,display:'block',border:`1.5px solid ${T.border}`,transition:'all .15s'}}
                onMouseOver={e=>{e.currentTarget.style.background=T.greenPale;e.currentTarget.style.borderColor=T.green}}
                onMouseOut={e=>{e.currentTarget.style.background=T.grayPale;e.currentTarget.style.borderColor=T.border}}>
                <div style={{fontSize:26,marginBottom:8}}>{c.e}</div>
                <div style={{fontSize:11,fontWeight:700,color:T.green,marginBottom:5,fontFamily:F,letterSpacing:.5}}>{c.tag}</div>
                <div style={{fontSize:14,fontWeight:800,color:T.charcoal,marginBottom:5,fontFamily:F,lineHeight:1.3}}>{c.title}</div>
                <div style={{fontSize:12,color:T.gray,lineHeight:1.5}}>{c.desc}</div>
              </a>
            ))}
          </div>
          <div style={{textAlign:'center'}}>
            <Btn size="lg" onClick={onStart}>🛠️ Build a personalized activity →</Btn>
          </div>
        </div>
      </section>

    </div>
  )
}


function PreviewSidebar({ answers:a }) {
  const ag = AGE_GROUPS.find(x=>x.v===a.age)
  const occ = OCCASIONS.find(x=>x.v===a.occasion)
  const en = ENERGY.find(x=>x.v===a.energy)
  const df = DIFFICULTY.find(x=>x.v===a.difficulty)
  const mc = (a.materialCategories||[]).length
  const style = inferActivityStyle(a)
  const hasAny = a.age||a.occasion||a.interests||a.energy||mc>0
  return (
    <div style={{background:T.grayPale,borderRadius:T.r,padding:20,border:`1.5px solid ${T.border}`,position:'sticky',top:80}}>
      <div style={{fontSize:13,fontWeight:800,color:T.green,fontFamily:F,marginBottom:14}}>Your kid's activity is coming together!</div>
      {!hasAny
        ? <p style={{fontSize:13,color:T.grayLight,lineHeight:1.6}}>Fill in the steps on the left and watch this panel update.</p>
        : <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {ag && <div><SLabel color={T.grayLight}>CHILD PROFILE</SLabel><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:30,height:30,borderRadius:'50%',background:T.greenLight,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>{ag.e}</div><div style={{fontSize:13,fontWeight:700,color:T.charcoal,fontFamily:F}}>Age {ag.l} · {ag.d}</div></div></div>}
            {occ && <div><SLabel color={T.grayLight}>OCCASION</SLabel><div style={{fontSize:13,color:T.charcoal,fontWeight:600}}>{occ.e} {occ.l}</div></div>}
            {a.interests && a.interests.trim().length > 3 && <div><SLabel color={T.grayLight}>INTERESTS</SLabel><div style={{fontSize:12,color:T.gray,lineHeight:1.5,fontStyle:'italic'}}>"{a.interests.slice(0,70)}{a.interests.length>70?'...':''}"</div></div>}
            {en && <div><SLabel color={T.grayLight}>ENERGY</SLabel><div style={{fontSize:13,color:T.charcoal,fontWeight:600}}>{en.e} {en.l}</div></div>}
            {mc > 0 && <div><SLabel color={T.grayLight}>FROM YOUR HOME</SLabel><div style={{display:'flex',flexWrap:'wrap',gap:5}}>{(a.materialCategories||[]).map(id=>{const c=MATERIAL_CATS.find(m=>m.id===id);return c?<span key={id} style={{background:T.greenLight,color:T.green,borderRadius:50,padding:'3px 9px',fontSize:11,fontWeight:700}}>{c.e} {c.l}</span>:null})}</div></div>}
            {df && <div><SLabel color={T.grayLight}>AMBITION</SLabel><div style={{fontSize:13,color:T.charcoal,fontWeight:600}}>{df.e} {df.l}</div></div>}
            {style && <div style={{background:T.greenLight,borderRadius:T.rSm,padding:'10px 12px'}}><SLabel color={T.green}>MAKING IT PERSONAL</SLabel><div style={{fontSize:12,color:T.greenDark,fontWeight:600}}>Got it! Creating something that combines these interests with the materials you have.</div><div style={{fontSize:12,color:T.green,marginTop:6,fontWeight:700}}>{style}</div></div>}
          </div>
      }
    </div>
  )
}

// ── QUIZ STEPS ─────────────────────────────────────────────────────────────────
const QQ = ({c}) => <p style={{fontSize:'clamp(18px,4vw,22px)',fontWeight:900,margin:'0 0 6px',lineHeight:1.25,fontFamily:F,color:T.charcoal}}>{c}</p>
const QS = ({c}) => <p style={{fontSize:13,color:T.gray,margin:'0 0 18px',lineHeight:1.6,fontWeight:500}}>{c}</p>

function OTile({ selected, onClick, emoji, label, desc, wide }) {
  return (
    <button onClick={onClick} style={{border:`2px solid ${selected?T.green:T.border}`,borderRadius:T.r,padding:wide?'13px 14px':'15px 8px',cursor:'pointer',background:selected?T.green:T.white,color:selected?'#fff':T.charcoal,display:'flex',flexDirection:wide?'row':'column',alignItems:'center',gap:wide?10:3,transition:'all .15s',fontFamily:F,width:'100%',textAlign:wide?'left':'center'}}>
      <span style={{fontSize:wide?18:20,flexShrink:0}}>{emoji}</span>
      <div><div style={{fontWeight:800,fontSize:13}}>{label}</div>{desc&&<div style={{fontSize:11,opacity:.75,fontWeight:500,marginTop:1}}>{desc}</div>}</div>
    </button>
  )
}

function AgeStep({ a, set }) {
  return (<><QQ c="How old is your child?" /><QS c="Age helps us tune difficulty, attention span, and activity complexity." /><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>{AGE_GROUPS.map(ag=><OTile key={ag.v} selected={a.age===ag.v} onClick={()=>set(x=>({...x,age:ag.v}))} emoji={ag.e} label={ag.l} desc={ag.d}/>)}</div></>)
}

function OccasionStep({ a, set }) {
  return (<>
    <QQ c="What's the occasion?" /><QS c="This helps us theme the activity and match the vibe of the day." />
    <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:a.occasion==='holiday'||a.occasion==='vacation'||a.occasion==='birthday'?16:0}}>
      {OCCASIONS.map(o=><OTile key={o.v} selected={a.occasion===o.v} onClick={()=>set(x=>({...x,occasion:o.v,holiday:'',vacationWhere:'',birthdayDetails:''}))} emoji={o.e} label={o.l} wide/>)}
    </div>
    {a.occasion==='holiday'&&<div style={{background:T.greenPale,borderRadius:T.rSm,padding:'14px 16px'}}><div style={{fontSize:12,fontWeight:800,color:T.green,marginBottom:8,fontFamily:F}}>Which holiday?</div><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{HOLIDAYS.map(h=><button key={h} onClick={()=>set(x=>({...x,holiday:h}))} style={{background:a.holiday===h?T.green:T.white,color:a.holiday===h?'#fff':T.gray,border:`1.5px solid ${a.holiday===h?T.green:T.border}`,borderRadius:50,padding:'5px 12px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:F}}>{h}</button>)}</div></div>}
    {a.occasion==='vacation'&&<div style={{background:T.greenPale,borderRadius:T.rSm,padding:'14px 16px'}}><div style={{fontSize:12,fontWeight:800,color:T.green,marginBottom:8,fontFamily:F}}>Where are you?</div><div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>{['Beach','Theme park','City trip','Visiting family','Camping','Hotel stay','Road trip','Other'].map(v=><button key={v} onClick={()=>set(x=>({...x,vacationWhere:v}))} style={{background:a.vacationWhere===v?T.green:T.white,color:a.vacationWhere===v?'#fff':T.gray,border:`1.5px solid ${a.vacationWhere===v?T.green:T.border}`,borderRadius:50,padding:'5px 12px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:F}}>{v}</button>)}</div><p style={{margin:0,fontSize:11,color:T.grayLight,fontStyle:'italic'}}>Note: materials you selected are from home. Add what you actually brought in the special items field.</p></div>}
    {a.occasion==='birthday'&&<div style={{background:T.greenPale,borderRadius:T.rSm,padding:'14px 16px'}}><div style={{fontSize:12,fontWeight:800,color:T.green,marginBottom:8,fontFamily:F}}>Tell us more</div><input type="text" placeholder="e.g. My daughter's 5th birthday, about 8 kids" defaultValue={a.birthdayDetails} onBlur={e=>set(x=>({...x,birthdayDetails:e.target.value}))} style={{width:'100%',border:`1.5px solid ${T.border}`,borderRadius:T.rSm,padding:'9px 12px',fontSize:13,fontFamily:F2,outline:'none',boxSizing:'border-box',color:T.charcoal}}/></div>}
  </>)
}

function InterestsStep({ a, set }) {
  const addChip = chip => {
    const el = document.getElementById('interests-ta')
    const cur = el ? el.value : a.interests
    const nv = cur ? `${cur}, ${chip.toLowerCase()}` : chip.toLowerCase()
    if (el) { el.value = nv; el.style.borderColor = T.green }
    set(x => ({...x, interests:nv}))
  }
  return (<>
    <QQ c="What is your child into right now?" />
    <QS c={<>The more specific, the better. Tell us what they love, obsess over, or talk about non-stop.<br/><em style={{color:T.grayLight}}>e.g. "She loves shapes, counting, building tall towers"</em></>} />
    <textarea id="interests-ta" defaultValue={a.interests} placeholder="Tell us about your kid's interests, passions, and current obsessions..."
      style={{width:'100%',border:`2px solid ${a.interests.trim().length>3?T.green:T.border}`,borderRadius:T.rSm,padding:'13px 15px',fontSize:14,fontFamily:F2,resize:'vertical',minHeight:110,color:T.charcoal,background:T.white,outline:'none',boxSizing:'border-box',lineHeight:1.7}}
      onFocus={e=>e.target.style.borderColor=T.green}
      onChange={e=>{set(x=>({...x,interests:e.target.value}));const nb=document.getElementById('next-btn');if(nb)nb.style.opacity=e.target.value.trim().length>3?'1':'0.38'}}
    />
    <div style={{marginTop:10}}><div style={{fontSize:11,fontWeight:700,color:T.grayLight,marginBottom:6,fontFamily:F}}>QUICK SUGGESTIONS — TAP TO ADD:</div><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{INTEREST_CHIPS.map(c=><button key={c} onClick={()=>addChip(c)} style={{background:T.grayPale,color:T.gray,border:`1px solid ${T.border}`,borderRadius:50,padding:'5px 12px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:F}}>{c}</button>)}</div></div>
    <div style={{marginTop:10,background:T.greenPale,borderRadius:T.rSm,padding:'10px 13px'}}><p style={{margin:0,fontSize:11,color:T.gray,lineHeight:1.7,fontWeight:600}}>💡 Tips: include specific things ("not just art, but drawing animals"), current obsessions, shows they watch, or characters they love.</p></div>
  </>)
}

function EnergyStep({ a, set }) {
  return (<><QQ c="What's their energy level right now?" /><QS c="This shapes whether the activity is seated and focused, or gets them moving." /><div style={{display:'flex',flexDirection:'column',gap:10}}>{ENERGY.map(e=><OTile key={e.v} selected={a.energy===e.v} onClick={()=>set(x=>({...x,energy:e.v}))} emoji={e.e} label={e.l} desc={e.d} wide/>)}</div></>)
}

function MaterialsStep({ a, set }) {
  const toggle = id => set(x => { const cats=x.materialCategories||[]; return {...x,materialCategories:cats.includes(id)?cats.filter(c=>c!==id):[...cats,id]} })
  const sel = a.materialCategories || []
  return (<>
    <QQ c="What do you have at home?" /><QS c="Check each item you actually have. The more specific, the better the activity." />
    <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:14}}>
      {MATERIAL_CATS.map(c=>{
        const s = sel.includes(c.id)
        return <button key={c.id} onClick={()=>toggle(c.id)} style={{border:`2px solid ${s?T.green:T.border}`,borderRadius:T.rSm,padding:'10px 10px',cursor:'pointer',background:s?T.green:T.white,color:s?'#fff':T.charcoal,display:'flex',alignItems:'center',gap:7,transition:'all .15s',fontFamily:F,fontSize:12,fontWeight:700,textAlign:'left'}}>
          <span style={{fontSize:15,flexShrink:0}}>{c.e}</span>
          <div><div style={{fontWeight:800}}>{c.l}</div><div style={{fontSize:10,opacity:.7,fontWeight:500}}>{c.desc.slice(0,26)}...</div></div>
        </button>
      })}
    </div>
    {sel.length > 0 && <div style={{background:T.greenPale,borderRadius:T.rSm,padding:'10px 14px',marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:T.green,marginBottom:6,fontFamily:F}}>SELECTED ({sel.length}):</div><div style={{display:'flex',flexWrap:'wrap',gap:5}}>{sel.map(id=>{const c=MATERIAL_CATS.find(m=>m.id===id);return c?<span key={id} style={{background:T.green,color:'#fff',borderRadius:50,padding:'3px 9px',fontSize:11,fontWeight:700}}>{c.e} {c.l}</span>:null})}</div></div>}
    <div style={{fontSize:11,fontWeight:800,color:T.grayLight,marginBottom:6,fontFamily:F}}>ANYTHING SPECIAL TO ADD?</div>
    <textarea id="mats-extra-ta" defaultValue={a.materialsExtra} placeholder="Favorite toys, holiday decorations, unique items... anything goes!"
      style={{width:'100%',border:`1.5px solid ${T.border}`,borderRadius:T.rSm,padding:'11px 14px',fontSize:13,fontFamily:F2,resize:'vertical',minHeight:70,color:T.charcoal,background:T.white,outline:'none',boxSizing:'border-box',lineHeight:1.6}}
      onFocus={e=>e.target.style.borderColor=T.green}
      onChange={e=>set(x=>({...x,materialsExtra:e.target.value}))}
    />
  </>)
}

function DifficultyStep({ a, set }) {
  return (<><QQ c="How ambitious are we feeling?" /><QS c="This affects the complexity, setup time, and wow factor of the activity." /><div style={{display:'flex',flexDirection:'column',gap:10}}>{DIFFICULTY.map(d=><OTile key={d.v} selected={a.difficulty===d.v} onClick={()=>set(x=>({...x,difficulty:d.v}))} emoji={d.e} label={d.l} desc={d.d} wide/>)}</div></>)
}

// ── GENERATOR SHELL ────────────────────────────────────────────────────────────
function GeneratorShell({ step, setStep, answers, setAnswers, totalSteps, onGenerate }) {
  const sNames = ['Age','Occasion','Interests','Energy','Materials','Ambition']
  const pct = ((step+1)/totalSteps)*100
  const canAdvance = (a=answers) => {
    if(step===0) return !!a.age
    if(step===1) return !!a.occasion
    if(step===2) return a.interests.trim().length>3
    if(step===3) return !!a.energy
    if(step===4) return (a.materialCategories||[]).length>0||(a.materialsExtra||'').trim().length>3
    if(step===5) return !!a.difficulty
    return false
  }
  const flush = () => {
    const e1=document.getElementById('interests-ta'); const e2=document.getElementById('mats-extra-ta')
    const u={...answers}; if(e1)u.interests=e1.value; if(e2)u.materialsExtra=e2.value
    setAnswers(u); return u
  }
  const handleNext = () => { const c=flush(); if(!canAdvance(c))return; if(step<totalSteps-1)setStep(step+1); else onGenerate(c) }
  const handlePrev = () => { flush(); if(step>0)setStep(step-1) }
  return (
    <div style={{background:T.cream,minHeight:'100vh'}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}.fade-up{animation:fadeUp .3s ease forwards}`}</style>
      <div style={{background:T.white,borderBottom:`1.5px solid ${T.border}`,padding:'10px 16px'}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <span style={{fontSize:14,fontWeight:800,color:T.charcoal,fontFamily:F}}>Activity Builder</span>
            <span style={{fontSize:12,fontWeight:700,color:T.gray,fontFamily:F}}>Step {step+1} of {totalSteps} — {sNames[step]}</span>
          </div>
          <div style={{background:T.greenLight,borderRadius:50,height:8,overflow:'hidden'}}><div style={{background:`linear-gradient(90deg,${T.green},${T.greenMid})`,height:'100%',width:`${pct}%`,borderRadius:50,transition:'width .4s ease'}}/></div>
        </div>
      </div>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'20px 14px',display:'grid',gridTemplateColumns:window.innerWidth>=900?'1fr 360px':'1fr',gap:20}}>
        <div>
          <Card style={{padding:'22px 18px'}} className="fade-up">
            {step===0&&<AgeStep a={answers} set={setAnswers}/>}
            {step===1&&<OccasionStep a={answers} set={setAnswers}/>}
            {step===2&&<InterestsStep a={answers} set={setAnswers}/>}
            {step===3&&<EnergyStep a={answers} set={setAnswers}/>}
            {step===4&&<MaterialsStep a={answers} set={setAnswers}/>}
            {step===5&&<DifficultyStep a={answers} set={setAnswers}/>}
            <div style={{display:'flex',gap:10,marginTop:24,borderTop:`1px solid ${T.border}`,paddingTop:20}}>
              {step>0&&<Btn variant="subtleGray" onClick={handlePrev}>← Back</Btn>}
              <Btn id="next-btn" onClick={handleNext} style={{flex:1,opacity:canAdvance()?1:0.38,cursor:canAdvance()?'pointer':'default'}}>
                {step<totalSteps-1?'Next →':'Build my activity'}
              </Btn>
            </div>
            <p style={{fontSize:11,color:T.grayLight,textAlign:'center',marginTop:12,lineHeight:1.6}}>Parents fill this out about their child · No children's data collected</p>
            {step===0 && <p style={{fontSize:12,color:T.grayLight,textAlign:'center',marginTop:6}}>In a rush? <a href="/ready-made-ideas" style={{color:T.green,fontWeight:700,textDecoration:'none'}}>Browse ready-made ideas instead →</a></p>}
          </Card>
        </div>
        {window.innerWidth >= 900 && <PreviewSidebar answers={answers}/>}
      </div>

    </div>
  )
}

// ── LOADING STATE ──────────────────────────────────────────────────────────────
function LoadingView({ stage, interests }) {
  const s = LOAD_STAGES[Math.min(stage, LOAD_STAGES.length-1)]
  return (
    <div style={{fontFamily:F2,minHeight:'100vh',background:T.cream,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{maxWidth:480,width:'100%',padding:'40px 24px',textAlign:'center'}}>
        <div style={{width:64,height:64,borderRadius:'50%',background:T.greenLight,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:28}}>🎨</div>
        <h2 style={{fontSize:22,fontWeight:900,color:T.charcoal,margin:'0 0 6px',fontFamily:F}}>Building your activity...</h2>
        <p style={{color:T.gray,fontSize:14,margin:'0 0 28px',minHeight:20}}>{s.label}</p>
        <div style={{background:T.greenLight,borderRadius:50,height:10,overflow:'hidden',marginBottom:10}}>
          <div style={{background:`linear-gradient(90deg,${T.green},${T.greenMid})`,height:'100%',width:`${s.pct}%`,borderRadius:50,transition:'width .8s ease'}}/>
        </div>
        <p style={{fontSize:11,color:T.grayLight,marginBottom:28}}>{s.pct}% complete</p>
        {interests && <Card style={{padding:'14px 18px',textAlign:'left',background:T.greenPale,border:'none',boxShadow:'none'}}><SLabel>BASED ON YOUR ANSWERS</SLabel><p style={{margin:0,fontSize:13,color:T.gray,lineHeight:1.6}}>Creating something specific to: <strong style={{color:T.charcoal}}>{interests.slice(0,60)}{interests.length>60?'...':''}</strong></p></Card>}
      </div>
    </div>
  )
}

// ── ERROR VIEW ─────────────────────────────────────────────────────────────────
function ErrorView({ msg, onRetry, onBack }) {
  return (
    <div style={{maxWidth:500,margin:'0 auto',padding:'60px 24px',textAlign:'center'}}>
      <div style={{fontSize:48,marginBottom:14}}>😬</div>
      <h2 style={{fontSize:22,fontWeight:900,margin:'0 0 10px',fontFamily:F,color:T.charcoal}}>Something went wrong</h2>
      <p style={{fontSize:14,color:T.gray,margin:'0 0 10px',lineHeight:1.6}}>Your answers are saved. Give it another try.</p>
      {msg && <p style={{fontSize:11,color:T.grayLight,background:T.grayPale,borderRadius:T.rSm,padding:'8px 12px',margin:'0 0 24px',wordBreak:'break-word',fontFamily:'monospace',textAlign:'left'}}>{msg}</p>}
      {!msg && <div style={{marginBottom:24}}/>}
      <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
        <Btn onClick={onRetry}>↻ Try again</Btn>
        <Btn variant="outline" onClick={onBack}>← Edit answers</Btn>
      </div>
    </div>
  )
}


// ── SHARE SHEET ───────────────────────────────────────────────────────────────
function ShareSheet({ activity, onCopy, onClose }) {
  const name = activity?.activity_name || 'this activity'
  const tagline = activity?.tagline || ''
  const duration = activity?.duration || ''
  const steps = (activity?.steps||[]).slice(0,3).map((s,i)=>`${i+1}. ${s}`).join('\n')
  const materials = (activity?.materials_checklist||activity?.materials_used||[]).slice(0,4).join(', ')
  const url = 'https://whatshouldmykiddo.com'

  const richMsg = `🎨 ${name}\n${tagline}\n\n⏱ ${duration}${materials?`\n📦 You'll need: ${materials}`:''}\n\nSteps:\n${steps}${(activity?.steps||[]).length>3?'\n...and more':''}` +
    `\n\nGenerated free at whatshouldmykiddo.com — it builds personalized activities around what your kid loves, using only what you have at home.`

  const shortMsg = `🎨 "${name}" — ${tagline} (${duration}, using stuff you already have)\n\nGet your own at whatshouldmykiddo.com`

  const shareLinks = [
    { label: 'Send on WhatsApp', icon: '💬', href: `https://wa.me/?text=${encodeURIComponent(richMsg)}`, color: '#25D366' },
    { label: 'Send via text message', icon: '📱', href: `sms:?body=${encodeURIComponent(richMsg)}` , color: '#000' },
    { label: 'Share on Facebook', icon: '📘', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shortMsg)}`, color: '#1877F2' },
    { label: 'Share on X / Twitter', icon: '🐦', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shortMsg)}`, color: '#000' },
    { label: 'Copy full activity text', icon: '📋', href: null, color: T.green, action: onCopy },
  ]
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.white,borderRadius:'20px 20px 0 0',padding:'24px 20px 32px',width:'100%',maxWidth:480}}>
        <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:'0 auto 20px'}}/>
        <div style={{fontSize:15,fontWeight:800,color:T.charcoal,fontFamily:F,marginBottom:16}}>Share this activity</div>
        <div style={{display:'grid',gap:10,marginBottom:16}}>
          {shareLinks.map(s=>(
            s.href
              ? <a key={s.label} href={s.href} target="_blank" rel="noopener" style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',border:`1.5px solid ${T.border}`,borderRadius:12,textDecoration:'none',color:T.charcoal,fontFamily:F,fontWeight:700,fontSize:14}}>
                  <span style={{fontSize:20,width:28,textAlign:'center'}}>{s.icon}</span>
                  <span>{s.label}</span>
                </a>
              : <button key={s.label} onClick={s.action} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',border:`1.5px solid ${T.border}`,borderRadius:12,background:'transparent',cursor:'pointer',fontFamily:F,fontWeight:700,fontSize:14,color:T.charcoal,width:'100%',textAlign:'left'}}>
                  <span style={{fontSize:20,width:28,textAlign:'center'}}>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
          ))}
          <button onClick={onCopy} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',border:`1.5px solid ${T.border}`,borderRadius:12,background:T.greenPale,cursor:'pointer',fontFamily:F,fontWeight:700,fontSize:14,color:T.green,width:'100%',textAlign:'left'}}>
            <span style={{fontSize:20,width:28,textAlign:'center'}}>📋</span>
            <span>Copy activity text</span>
          </button>
        </div>
        <button onClick={onClose} style={{width:'100%',background:T.grayPale,border:'none',borderRadius:12,padding:'12px',fontSize:14,fontWeight:700,cursor:'pointer',color:T.gray,fontFamily:F}}>Cancel</button>
      </div>
    </div>
  )
}


// ── RESULT PAGE ────────────────────────────────────────────────────────────────
function ResultView({ activity:act, answers:a, currentPostId, votedIds, profileSaved, emailSent, savedProfile, shareMsg, hiddenProducts, setHiddenProducts, sharedToCommunity, showShareSheet, onUpvote, onSave, onEmail, onShare, onShareToCommunity, copyActivity, closeShareSheet, onNew, onNewSaved, onTweakAnswers }) {
  const [bookIndex, setBookIndex] = useState(0)
  const [spiceIndexes, setSpiceIndexes] = useState({})
  const [showVar, setShowVar] = useState(false)
  const [checked, setChecked] = useState(new Set())
  const [swapMsg, setSwapMsg] = useState('')
  const voted = votedIds.has(currentPostId||'')
  const books = act.books||(act.book?[act.book]:[])
  const book = books[bookIndex]||null
  const ag = AGE_GROUPS.find(x=>x.v===a.age)
  const occ = OCCASIONS.find(x=>x.v===a.occasion)

  return (
    <div style={{background:T.cream,minHeight:'100vh'}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}.fade-up{animation:fadeUp .35s ease forwards}`}</style>

      {/* Hero */}
      <div style={{background:`linear-gradient(135deg,${T.greenDark},${T.green})`,padding:'28px 16px 24px',textAlign:'center'}}>
        <div style={{maxWidth:700,margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'center',gap:6,flexWrap:'wrap',marginBottom:10}}>
            {ag&&<Pill bg='rgba(255,255,255,.2)' color='#fff'>{ag.e} Age {ag.l}</Pill>}
            {occ&&<Pill bg='rgba(255,255,255,.2)' color='#fff'>{occ.e} {occ.l}</Pill>}
            {act.duration&&<Pill bg='rgba(255,255,255,.2)' color='#fff'>⏱ {act.duration}</Pill>}
            {act.setup_time&&<Pill bg='rgba(255,255,255,.2)' color='#fff'>⚡ {act.setup_time} setup</Pill>}
            {act.cleanup_level&&<Pill bg='rgba(255,255,255,.2)' color='#fff'>🧹 {act.cleanup_level} cleanup</Pill>}
          </div>
          <h1 style={{fontSize:'clamp(22px,5vw,40px)',fontWeight:900,color:'#fff',margin:'0 0 10px',lineHeight:1.15,fontFamily:F}}>{act.activity_name}</h1>
          <p style={{color:'rgba(255,255,255,.9)',fontSize:'clamp(14px,2vw,17px)',margin:'0 0 20px',lineHeight:1.5}}>{act.tagline}</p>
          <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
            <Btn variant="gold" size="sm">▶ Start now</Btn>
            <Btn variant="ghost" size="sm" onClick={onEmail}>{emailSent?'✓ Emailed!':'✉ Email to myself'}</Btn>
            <Btn variant="ghost" size="sm" onClick={onNew}>+ New activity</Btn>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{maxWidth:1100,margin:'0 auto',padding:'20px 14px',display:'grid',gridTemplateColumns:window.innerWidth>=900?'1fr 340px':'1fr',gap:16}}>

        {/* LEFT col */}
        <div className="fade-up">
          <AdUnit style={{marginBottom:20}}/>

          <Card id="activity-steps" style={{padding:'22px 22px 16px',marginBottom:16}}>
            <SLabel>STEPS</SLabel>
            {act.steps.map((s,i)=>(
              <div key={i} style={{display:'flex',gap:12,marginBottom:13,alignItems:'flex-start'}}>
                <div style={{width:26,height:26,borderRadius:'50%',background:T.green,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0,marginTop:1,fontFamily:F}}>{i+1}</div>
                <p style={{margin:0,fontSize:14,lineHeight:1.65,color:T.charcoal,fontWeight:500}}>{s}</p>
              </div>
            ))}
          </Card>

          {act.parent_tip && <Card style={{padding:'16px 18px',marginBottom:16,background:T.greenPale,border:`1.5px solid ${T.greenLight}`,boxShadow:'none'}}><SLabel color={T.green}>💡 PARENT TIP</SLabel><p style={{margin:0,fontSize:13,color:T.greenDark,lineHeight:1.7}}>{act.parent_tip}</p></Card>}

          {act.variations && Object.keys(act.variations).length > 0 && (
            <Card style={{padding:'16px 18px',marginBottom:16}}>
              <button onClick={()=>setShowVar(!showVar)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',background:'none',border:'none',cursor:'pointer',fontFamily:F,padding:0}}>
                <SLabel style={{margin:0}}>🔄 VARIATIONS & TWISTS</SLabel>
                <span style={{fontSize:13,color:T.green,fontWeight:700}}>{showVar?'▲ Hide':'▼ Show'}</span>
              </button>
              {showVar && <div style={{marginTop:12,display:'grid',gap:8}}>{[['easier','😊 Make it easier'],['more_active','🏃 More active'],['quieter','🤫 Make it quieter'],['sibling','👫 Sibling version']].map(([k,l])=>act.variations[k]&&<div key={k} style={{background:T.grayPale,borderRadius:T.rSm,padding:'10px 14px'}}><div style={{fontSize:12,fontWeight:800,color:T.gray,marginBottom:3,fontFamily:F}}>{l}</div><div style={{fontSize:13,color:T.charcoal,lineHeight:1.5}}>{act.variations[k]}</div></div>)}</div>}
            </Card>
          )}


          <Card style={{padding:'16px 18px',marginBottom:16}}>
            <SLabel>NOT QUITE RIGHT? SWAP ONE THING</SLabel>
            <p style={{margin:'2px 0 12px',fontSize:12,color:T.gray,lineHeight:1.5}}>Keep your kid's profile. Just nudge the activity.</p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {[
                {l:'Too messy',e:'🧹',t:'quieter'},
                {l:'Too active',e:'🪑',t:'quieter'},
                {l:'Less setup',e:'⚡',t:'easier'},
                {l:'Make it sillier',e:'🤪',t:'more_active'},
                {l:'Make it calmer',e:'🌿',t:'quieter'},
                {l:'Add a sibling',e:'👫',t:'sibling'},
              ].map(sw=>(
                <button key={sw.l} onClick={()=>{
                  if(act.variations&&act.variations[sw.t]){setSwapMsg(act.variations[sw.t])}
                  else{onTweakAnswers()}
                }} style={{display:'flex',alignItems:'center',gap:5,background:swapMsg&&act.variations?.[sw.t]===swapMsg?T.greenLight:T.grayPale,border:`1.5px solid ${swapMsg&&act.variations?.[sw.t]===swapMsg?T.green:T.border}`,borderRadius:50,padding:'6px 12px',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:F,color:swapMsg&&act.variations?.[sw.t]===swapMsg?T.green:T.charcoal}}>
                  <span>{sw.e}</span>{sw.l}
                </button>
              ))}
            </div>
            {swapMsg && (
              <div style={{marginTop:12,background:T.greenPale,border:`1.5px solid ${T.greenLight}`,borderRadius:T.rSm,padding:'12px 14px'}}>
                <div style={{fontSize:11,fontWeight:800,color:T.green,marginBottom:4,fontFamily:F,letterSpacing:.5}}>TRY THIS INSTEAD</div>
                <p style={{margin:'0 0 8px',fontSize:13,color:T.greenDark,lineHeight:1.6}}>{swapMsg}</p>
                <button onClick={onNew} style={{fontSize:11,fontWeight:700,color:T.green,background:'none',border:'none',cursor:'pointer',fontFamily:F,padding:0,textDecoration:'underline'}}>Need something totally different? Build a new one →</button>
              </div>
            )}
          </Card>

          <Card style={{padding:'16px 18px',marginBottom:16}}>
            <SLabel>ADD TO THE COMMUNITY VOTE BOARD?</SLabel>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginTop:4}}>
              {!sharedToCommunity
                ? <Btn size="sm" onClick={onShareToCommunity}>Add to community board</Btn>
                : <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                    <span style={{background:T.greenLight,color:T.green,borderRadius:50,padding:'5px 12px',fontSize:12,fontWeight:700,fontFamily:F}}>✓ Added!</span>
                    <button onClick={()=>currentPostId&&onUpvote(currentPostId)} style={{display:'flex',alignItems:'center',gap:5,background:voted?T.greenLight:T.grayPale,border:`1.5px solid ${voted?T.green:T.border}`,borderRadius:50,padding:'5px 12px',cursor:voted?'default':'pointer',fontSize:12,fontWeight:700,fontFamily:F,color:voted?T.green:T.gray}}>{voted?'🧡 Upvoted!':'🤍 Upvote it'}</button>
                  </div>
              }
              <Btn size="sm" variant="outline" onClick={onShare}>↗ Share with friends</Btn>
            </div>
            {shareMsg && <div style={{marginTop:8,fontSize:12,color:T.green,fontWeight:700}}>{shareMsg}</div>}
          </Card>

          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
            {!profileSaved ? <Btn size="sm" variant="outline" onClick={onSave}>💾 Save profile</Btn> : <span style={{background:T.greenLight,color:T.green,borderRadius:50,padding:'5px 12px',fontSize:12,fontWeight:700,fontFamily:F}}>✓ Profile saved</span>}
            <Btn size="sm" variant="subtleGray" onClick={onTweakAnswers}>Tweak my answers</Btn>
            {savedProfile && <Btn size="sm" variant="subtleGray" onClick={onNewSaved}>Quick new</Btn>}
          </div>
        </div>

        {/* RIGHT sidebar */}
        <div className="resultSidebar">
          {(act.materials_checklist||act.materials_used||[]).length > 0 && (
            <Card style={{padding:'16px 18px',marginBottom:14}}>
              <SLabel>✅ MATERIALS CHECKLIST</SLabel>
              <p style={{fontSize:12,color:T.grayLight,margin:'0 0 10px'}}>Use what you have at home:</p>
              {(act.materials_checklist||act.materials_used||[]).map((m,i)=>(
                <div key={i} onClick={()=>{const s=new Set(checked);s.has(i)?s.delete(i):s.add(i);setChecked(s)}} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',cursor:'pointer',borderBottom:`1px solid ${T.border}`}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${checked.has(i)?T.green:T.border}`,background:checked.has(i)?T.green:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:11,color:'#fff',fontWeight:900}}>{checked.has(i)?'✓':''}</div>
                  <span style={{fontSize:13,color:checked.has(i)?T.grayLight:T.charcoal,textDecoration:checked.has(i)?'line-through':'none',lineHeight:1.4}}>{m}</span>
                </div>
              ))}
            </Card>
          )}

          <div style={{display:'flex',alignItems:'center',gap:10,margin:'4px 0 14px'}}>
            <div style={{flex:1,height:1,background:T.border}}/><span style={{fontSize:10,fontWeight:800,color:T.grayLight,whiteSpace:'nowrap',fontFamily:F}}>OPTIONAL EXTRAS</span><div style={{flex:1,height:1,background:T.border}}/>
          </div>


          {books.length > 0 && bookIndex < books.length && book && (
            <Card style={{padding:'16px 18px',marginBottom:12,border:'1.5px solid #E8D5FF'}}>
              <SLabel color='#7C3AED'>{bookIndex===0?'READ TOGETHER AFTER':`ANOTHER OPTION (${bookIndex+1}/${books.length})`}</SLabel>
              <div style={{display:'flex',gap:12,marginBottom:10,alignItems:'flex-start'}}>
                <img
                  src={`https://covers.openlibrary.org/b/title/${encodeURIComponent(book.title)}-M.jpg`}
                  alt={book.title}
                  onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}}
                  onLoad={e=>{if(e.target.naturalWidth<=1){e.target.style.display='none';e.target.nextSibling.style.display='flex'}}}
                  style={{width:52,height:72,objectFit:'cover',borderRadius:6,flexShrink:0,boxShadow:'0 2px 8px rgba(0,0,0,.15)'}}
                />
                <div style={{width:52,height:72,background:'linear-gradient(135deg,#7C3AED,#A855F7)',borderRadius:6,display:'none',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>📖</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:900,fontFamily:F,color:T.charcoal,lineHeight:1.3,marginBottom:2}}>{book.title}</div>
                  <div style={{fontSize:11,color:T.grayLight,marginBottom:5}}>by {book.author}</div>
                  <div style={{fontSize:12,color:'#5B21B6',lineHeight:1.5,fontStyle:'italic'}}>{book.why}</div>
                </div>
              </div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <Btn size="sm" href={AMZN(`${book.title} children book`)} target="_blank" style={{background:'#7C3AED',fontSize:12}}>Amazon</Btn>
                <Btn size="sm" href={BOOKSHOP(book.title)} target="_blank" style={{background:'#1A1A2E',fontSize:12}}>Bookshop.org</Btn>
                <Btn size="sm" href={BAM(book.title)} target="_blank" style={{background:'#CC0000',fontSize:12}}>Books-A-Million</Btn>
                {bookIndex < books.length-1 && <>
                  <Btn size="sm" variant="success" onClick={()=>setBookIndex(i=>i+1)} style={{fontSize:11}}>{bookIndex===0?'Already read it and loved it?':'Have it — show another'}</Btn>
                  <Btn size="sm" variant="danger" onClick={()=>setBookIndex(i=>i+1)} style={{fontSize:11}}>Not for us</Btn>
                </>}
                {bookIndex === books.length-1 && <span style={{fontSize:11,color:T.grayLight,fontStyle:'italic',padding:'5px 0'}}>These are all our reading suggestions for this activity!</span>}
              </div>
            </Card>
          )}

          {(act.spice_ups||[]).length > 0 && (
            <Card style={{padding:'16px 18px',marginBottom:12}}>
              <SLabel>SPICE UP PLAYTIME</SLabel>
              {(act.spice_ups||[]).map((sp,i)=>{
                const idx = spiceIndexes[i]||0
                if (idx===-1) return null
                const cur = idx===0 ? sp : (sp.alternatives?.[idx-1]||null)
                if (!cur) return null
                const hasMore = idx < (sp.alternatives?.length||0)
                return (
                  <div key={i} style={{background:T.grayPale,borderRadius:T.rSm,padding:'12px 14px',marginBottom:10}}>
                    {idx>0 && <div style={{fontSize:9,color:T.grayLight,fontWeight:700,marginBottom:4,fontFamily:F,letterSpacing:1}}>ALTERNATIVE</div>}
                    <div style={{fontSize:13,fontWeight:900,fontFamily:F,color:T.charcoal,marginBottom:3,lineHeight:1.3}}>{cur.name}</div>
                    <div style={{fontSize:11,color:T.gray,lineHeight:1.4,marginBottom:8}}>{cur.why}</div>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      <Btn size="sm" href={AMZN(cur.search)} target="_blank" style={{background:'#FF9900',color:T.charcoal,fontSize:11}}>Love it! Buy it</Btn>
                      {hasMore ? <>
                        <Btn size="sm" variant="success" onClick={()=>setSpiceIndexes(p=>({...p,[i]:idx+1}))} style={{fontSize:11}}>Already have it</Btn>
                        <Btn size="sm" variant="danger" onClick={()=>setSpiceIndexes(p=>({...p,[i]:idx+1}))} style={{fontSize:11}}>Not for us</Btn>
                      </> : (idx===0 ? <>
                        <Btn size="sm" variant="success" onClick={()=>setSpiceIndexes(p=>({...p,[i]:-1}))} style={{fontSize:11}}>Already have it</Btn>
                        <Btn size="sm" variant="danger" onClick={()=>setSpiceIndexes(p=>({...p,[i]:-1}))} style={{fontSize:11}}>Not for us</Btn>
                      </> : <span style={{fontSize:11,color:T.grayLight,fontStyle:'italic'}}>No more suggestions!</span>)}
                    </div>
                  </div>
                )
              })}
            </Card>
          )}

          {act.kiwico_angle && <Card style={{padding:'14px 16px',marginBottom:12,background:'#FFF5F5',border:'1.5px solid #FECACA',boxShadow:'none'}}><SLabel color='#DC2626'>WANT A KIT LIKE THIS EVERY MONTH?</SLabel><p style={{margin:'0 0 10px',fontSize:12,color:'#7F1D1D',lineHeight:1.5}}>{act.kiwico_angle}</p><Btn size="sm" href={KIWICO} target="_blank" style={{background:'#DC2626',fontSize:12}}>Try KiwiCo</Btn></Card>}
          <AdUnit style={{marginBottom:12}}/>
        </div>
      </div>

      {showShareSheet && <ShareSheet activity={act} onCopy={copyActivity} onClose={closeShareSheet}/>}
      <SiteFooter />

    </div>
  )
}

// ── GIFT QUIZ ──────────────────────────────────────────────────────────────────
function GiftQuizView({ step, setStep, answers, setAnswers, onGenerate, onCancel }) {
  const sNames = ['Age','Interests','Budget','Occasion']
  const pct = ((step+1)/4)*100
  const canAdv = () => { if(step===0)return!!answers.age; if(step===1)return answers.interests.trim().length>3; if(step===2)return!!answers.budget; return true }
  const flush = () => { const el=document.getElementById('gift-ta'); const u={...answers,interests:el?el.value:answers.interests}; setAnswers(u); return u }
  const next = () => { const c=flush(); if(!canAdv())return; if(step<3)setStep(step+1); else onGenerate(c) }
  return (
    <div style={{fontFamily:F2,minHeight:'100vh',background:T.cream}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}.fade-up{animation:fadeUp .3s ease forwards}`}</style>
      <div style={{background:T.white,borderBottom:`1.5px solid ${T.border}`,padding:'12px 20px'}}>
        <div style={{maxWidth:700,margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <span style={{fontSize:14,fontWeight:800,color:'#7C3AED',fontFamily:F}}>🎁 Gift Finder</span>
            <span style={{fontSize:12,fontWeight:700,color:T.gray,fontFamily:F}}>Step {step+1} of 4 — {sNames[step]}</span>
          </div>
          <div style={{background:'#EDE9FE',borderRadius:50,height:8,overflow:'hidden'}}><div style={{background:'#7C3AED',height:'100%',width:`${pct}%`,borderRadius:50,transition:'width .4s ease'}}/></div>
        </div>
      </div>
      <div style={{maxWidth:600,margin:'0 auto',padding:'32px 20px'}} className="fade-up">
        <Card style={{padding:28}}>
          {step===0&&<><QQ c="How old is the child?"/><QS c="We'll tune the gift recommendation to their age."/><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>{AGE_GROUPS.map(ag=><OTile key={ag.v} selected={answers.age===ag.v} onClick={()=>setAnswers(x=>({...x,age:ag.v}))} emoji={ag.e} label={ag.l} desc={ag.d}/>)}</div></>}
          {step===1&&<><QQ c="What are they into?"/><QS c="The more specific, the better the gift recommendation."/><textarea id="gift-ta" defaultValue={answers.interests} placeholder="e.g. obsessed with dinosaurs, loves building things, really into art..." style={{width:'100%',border:`2px solid #EDE9FE`,borderRadius:T.rSm,padding:'13px 15px',fontSize:14,fontFamily:F2,resize:'vertical',minHeight:100,color:T.charcoal,background:T.white,outline:'none',boxSizing:'border-box',lineHeight:1.7}} onFocus={e=>e.target.style.borderColor='#7C3AED'}/></>}
          {step===2&&<><QQ c="What's your budget?"/><QS c="We'll find the best gift for this price range."/><div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>{BUDGETS.map(b=><OTile key={b.v} selected={answers.budget===b.v} onClick={()=>setAnswers(x=>({...x,budget:b.v}))} emoji={b.e} label={b.l}/>)}</div></>}
          {step===3&&<><QQ c="What's the occasion?"/><QS c="This helps us frame the recommendation."/><div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>{[{v:'birthday',l:'Birthday',e:'🎂'},{v:'holiday',l:'Holiday',e:'🎁'},{v:'just-because',l:'Just because',e:'💜'},{v:'achievement',l:'Achievement',e:'🌟'}].map(o=><OTile key={o.v} selected={answers.occasion===o.v} onClick={()=>setAnswers(x=>({...x,occasion:o.v}))} emoji={o.e} label={o.l} wide/>)}</div></>}
          <div style={{display:'flex',gap:10,marginTop:24,paddingTop:20,borderTop:`1px solid ${T.border}`}}>
            {step>0&&<Btn variant="subtleGray" onClick={()=>{flush();setStep(step-1)}}>← Back</Btn>}
            <Btn onClick={next} style={{flex:1,background:'#7C3AED',opacity:canAdv()?1:0.38}}>{step<3?'Next →':'🎁 Find the perfect gift'}</Btn>
          </div>
          <div style={{textAlign:'center',marginTop:12}}><button onClick={onCancel} style={{background:'none',border:'none',color:T.grayLight,fontSize:12,cursor:'pointer',fontFamily:F}}>Back to activity generator</button></div>
        </Card>
      </div>
    </div>
  )
}

// ── GIFT RESULT ────────────────────────────────────────────────────────────────
function GiftResultView({ gift, answers, onNew, onActivity }) {
  const [copied, setCopied] = useState(false)
  const [productImage, setProductImage] = React.useState(null)
  const [productUrl, setProductUrl] = React.useState(null)
  const [altImages, setAltImages] = React.useState({})

  React.useEffect(() => {
    if (!gift?.amazon_search) return
    fetch('/api/amazon-image', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ keywords: gift.amazon_search })
    })
    .then(r => r.json())
    .then(d => {
      if (d.image_url) setProductImage(d.image_url)
      if (d.product_url) setProductUrl(d.product_url)
    })
    .catch(() => {})
  }, [gift?.amazon_search])

  React.useEffect(() => {
    if (!gift?.alternatives?.length) return
    gift.alternatives.forEach((alt, i) => {
      if (!alt.search) return
      fetch('/api/amazon-image', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ keywords: alt.search })
      })
      .then(r => r.json())
      .then(d => {
        if (d.image_url) setAltImages(prev => ({...prev, [i]: { image_url: d.image_url, product_url: d.product_url }}))
      })
      .catch(() => {})
    })
  }, [gift?.alternatives])
  const shareUrl = window.location.href
  const shareText = `🎁 Gift idea for a ${answers.age} year old who loves ${answers.interests}:\n\n${gift.gift_name} (${gift.price_range})\n${gift.tagline}\n\nSee full result + more ideas: ${shareUrl}`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  const smsUrl = `sms:?body=${encodeURIComponent(shareText)}`
  const copyGift = () => { navigator.clipboard.writeText(shareText).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000)}) }
  return (
    <div style={{background:T.cream,minHeight:'100vh'}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}.fade-up{animation:fadeUp .35s ease forwards}`}</style>
      <div style={{background:'linear-gradient(135deg,#5B21B6,#7C3AED)',padding:'32px 20px 28px',textAlign:'center'}}>
        <div style={{maxWidth:600,margin:'0 auto'}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:'rgba(255,255,255,.7)',marginBottom:6,fontFamily:F}}>Perfect gift for age {answers.age} · {answers.budget} budget</div>
          <h1 style={{fontSize:'clamp(22px,5vw,36px)',fontWeight:900,color:'#fff',margin:'0 0 8px',lineHeight:1.15,fontFamily:F}}>{gift.gift_name}</h1>
          <p style={{color:'rgba(255,255,255,.9)',fontSize:15,margin:'0 0 14px',lineHeight:1.5}}>{gift.tagline}</p>
          <Pill bg='rgba(255,255,255,.2)' color='#fff'>{gift.price_range}</Pill>
        </div>
      </div>
      <div style={{maxWidth:700,margin:'0 auto',padding:'24px 20px'}} className="fade-up">
        <Card style={{padding:'20px 22px',marginBottom:14}}>
          <SLabel color='#7C3AED'>WHY THEY'LL LOVE IT</SLabel>
          <p style={{margin:'0 0 10px',fontSize:14,color:T.charcoal,lineHeight:1.6}}>{gift.why_theyll_love_it}</p>
          {gift.age_appropriateness && <p style={{margin:'0 0 14px',fontSize:12,color:T.gray,lineHeight:1.4,fontStyle:'italic'}}>{gift.age_appropriateness}</p>}
          {gift.what_parents_say && <div style={{background:'#F5F3FF',borderRadius:T.rSm,padding:'12px 14px',marginBottom:14}}><SLabel color='#7C3AED'>WHAT PARENTS SAY</SLabel><p style={{margin:0,fontSize:13,color:'#5B21B6',lineHeight:1.6}}>{gift.what_parents_say}</p></div>}
          {productImage && <img src={productImage} alt={gift.gift_name} style={{width:'100%',maxHeight:200,objectFit:'contain',borderRadius:10,marginBottom:14,background:'#fff'}} onError={e=>e.target.style.display='none'}/>}
          <Btn href={productUrl || (gift.amazon_asin ? `https://www.amazon.com/dp/${gift.amazon_asin}?tag=zenmonkeystud-20` : AMZN(gift.amazon_search))} target="_blank" style={{background:'#FF9900',color:T.charcoal,display:'block',textAlign:'center'}}>Find on Amazon</Btn>
        </Card>
        {gift.alternatives?.length > 0 && (
          <Card style={{padding:'16px 18px',marginBottom:14}}>
            <SLabel color='#7C3AED'>MORE IDEAS</SLabel>
            <div style={{display:'grid',gap:10}}>
            {gift.alternatives.map((alt,i)=>(
              <div key={i} style={{background:'#F8F5FF',border:'1px solid #E8D5FF',borderRadius:T.rSm,padding:'12px 14px'}}>
                {altImages[i]?.image_url
                  ? <img src={altImages[i].image_url} alt={alt.name} style={{width:'100%',height:90,objectFit:'contain',borderRadius:6,marginBottom:8,background:'#fff'}} onError={e=>e.target.style.display='none'}/>
                  : null
                }
                <div style={{fontSize:13,fontWeight:900,fontFamily:F,color:'#5B21B6',marginBottom:3,lineHeight:1.3}}>{alt.name}</div>
                <div style={{fontSize:11,color:T.gray,lineHeight:1.4,marginBottom:8}}>{alt.reason}</div>
                <Btn size="sm" href={altImages[i]?.product_url || AMZN(alt.search)} target="_blank" style={{background:'#7C3AED',fontSize:11}}>See on Amazon</Btn>
              </div>
            ))}
            </div>
          </Card>
        )}
        {gift.book && (
          <Card style={{padding:'16px 18px',marginBottom:14,border:'1.5px solid #E8D5FF'}}>
            <SLabel color='#7C3AED'>📚 ALSO CONSIDER A BOOK</SLabel>
            <div style={{display:'flex',gap:12,marginTop:8,alignItems:'flex-start'}}>
              <img
                src={`https://covers.openlibrary.org/b/title/${encodeURIComponent(gift.book.title)}-M.jpg`}
                alt={gift.book.title}
                onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}}
                onLoad={e=>{if(e.target.naturalWidth<=1){e.target.style.display='none';e.target.nextSibling.style.display='flex'}}}
                style={{width:52,height:72,objectFit:'cover',borderRadius:6,flexShrink:0,boxShadow:'0 2px 8px rgba(0,0,0,.15)'}}
              />
              <div style={{width:52,height:72,background:'linear-gradient(135deg,#7C3AED,#A855F7)',borderRadius:6,display:'none',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>📖</div>
              <div style={{flex:1,minWidth:0}}>
                {gift.book.type && <div style={{fontSize:10,fontWeight:800,color:'#7C3AED',letterSpacing:.5,marginBottom:3,fontFamily:F,textTransform:'uppercase'}}>{gift.book.type}</div>}
                <div style={{fontSize:14,fontWeight:900,fontFamily:F,color:T.charcoal,lineHeight:1.3,marginBottom:2}}>{gift.book.title}</div>
                {gift.book.author && <div style={{fontSize:11,color:T.grayLight,marginBottom:5}}>by {gift.book.author}</div>}
                <div style={{fontSize:12,color:'#5B21B6',lineHeight:1.5,fontStyle:'italic',marginBottom:10}}>{gift.book.why}</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  <Btn size="sm" href={AMZN(`${gift.book.title} children book`)} target="_blank" style={{background:'#FF9900',color:T.charcoal,fontSize:11}}>Amazon</Btn>
                  <Btn size="sm" href={BOOKSHOP(gift.book.title)} target="_blank" style={{background:'#1A1A2E',fontSize:11}}>Bookshop.org</Btn>
                  <Btn size="sm" href={BAM(gift.book.title)} target="_blank" style={{background:'#CC0000',fontSize:11}}>Books-A-Million</Btn>
                </div>
              </div>
            </div>
          </Card>
        )}
        {/* Share gift ideas */}
        <Card style={{padding:'16px 18px',marginBottom:14}}>
          <SLabel color='#7C3AED'>SEND THESE IDEAS</SLabel>
          <p style={{margin:'2px 0 12px',fontSize:12,color:T.gray,lineHeight:1.5}}>Share with a co-parent, grandparent, or anyone who needs a nudge.</p>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <a href={waUrl} target="_blank" rel="noopener" style={{display:'flex',alignItems:'center',gap:6,background:'#25D366',color:'#fff',borderRadius:50,padding:'8px 14px',textDecoration:'none',fontSize:12,fontWeight:700,fontFamily:F}}>💬 WhatsApp</a>
            <a href={smsUrl} style={{display:'flex',alignItems:'center',gap:6,background:T.charcoal,color:'#fff',borderRadius:50,padding:'8px 14px',textDecoration:'none',fontSize:12,fontWeight:700,fontFamily:F}}>📱 Text message</a>
            <button onClick={copyGift} style={{display:'flex',alignItems:'center',gap:6,background:copied?T.greenLight:T.grayPale,color:copied?T.green:T.charcoal,border:`1.5px solid ${copied?T.green:T.border}`,borderRadius:50,padding:'8px 14px',fontSize:12,fontWeight:700,fontFamily:F,cursor:'pointer'}}>{copied?'✓ Copied!':'📋 Copy to clipboard'}</button>
          </div>
        </Card>

        {/* Cross-promo to activity generator */}
        <Card style={{padding:'16px 18px',marginBottom:14,background:T.greenPale,border:`1.5px solid ${T.greenLight}`,boxShadow:'none'}}>
          <SLabel color={T.green}>ALSO NEED SOMETHING TO DO TODAY?</SLabel>
          <p style={{margin:'4px 0 12px',fontSize:13,color:T.greenDark,lineHeight:1.5}}>Build a personalized activity based on their age, mood, and what you already have at home.</p>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
            <Btn size="sm" onClick={onActivity} style={{background:T.green}}>Build an activity</Btn>
            <a href="/ready-made-ideas" style={{fontSize:12,fontWeight:700,color:T.green,textDecoration:'none',fontFamily:F}}>Or browse ready-made ideas →</a>
          </div>
        </Card>

        <AdUnit style={{marginBottom:14}}/>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <Btn style={{flex:1,background:'#7C3AED'}} onClick={onNew}>Find another gift</Btn>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}

// ── COMMUNITY ──────────────────────────────────────────────────────────────────
function CommCard({ post, voted, onUpvote }) {
  const ag = AGE_GROUPS.find(a=>a.v===post.age)
  const occ = OCCASIONS.find(o=>o.v===post.occasion)
  return (
    <Card style={{padding:18,marginBottom:14}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:8}}>
            {ag&&<Pill bg={T.greenLight} color={T.green}>{ag.e} {ag.l}</Pill>}
            {occ&&<Pill bg={T.goldLight} color='#C05621'>{occ.e} {occ.l}</Pill>}
            {post.duration&&<Pill bg={T.grayPale} color={T.gray}>{post.duration}</Pill>}
          </div>
          <div style={{fontSize:16,fontWeight:900,marginBottom:4,lineHeight:1.25,fontFamily:F,color:T.charcoal}}>{post.activity_name}</div>
          <div style={{fontSize:13,color:T.gray,lineHeight:1.5,marginBottom:6}}>{post.tagline}</div>
          {post.why_kids_love_it&&<div style={{fontSize:12,color:T.grayLight,fontStyle:'italic'}}>"{post.why_kids_love_it}"</div>}
        </div>
        <button onClick={()=>onUpvote(post.id)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,background:voted?T.greenLight:T.grayPale,border:`1.5px solid ${voted?T.green:T.border}`,borderRadius:T.rSm,padding:'8px 12px',cursor:voted?'default':'pointer',minWidth:50,flexShrink:0}}>
          <span style={{fontSize:18}}>{voted?'🧡':'🤍'}</span>
          <span style={{fontSize:12,fontWeight:800,color:voted?T.green:T.grayLight,fontFamily:F}}>{post.votes||0}</span>
        </button>
      </div>
      <details style={{marginTop:10}}>
        <summary style={{fontSize:12,fontWeight:700,color:T.green,cursor:'pointer',userSelect:'none',fontFamily:F}}>▸ See steps & book</summary>
        <ol style={{margin:'8px 0 0 16px',padding:0}}>{(post.steps||[]).map((s,i)=><li key={i} style={{fontSize:12,color:T.gray,marginBottom:5,lineHeight:1.5}}>{s}</li>)}</ol>
        {(post.books||(post.book?[post.book]:[])).slice(0,1).map((b,i)=>(
          <div key={i} style={{marginTop:8,background:'#F5F3FF',borderRadius:T.rSm,padding:'9px 12px',fontSize:12,color:'#5B21B6',display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
            <span><strong>📖 Read after:</strong> <em>{b.title}</em> by {b.author}</span>
            <Btn size="sm" href={AMZN(`${b.title} children book`)} target="_blank" style={{background:'#7C3AED',fontSize:10,padding:'3px 9px'}}>Amazon</Btn>
            <Btn size="sm" href={BOOKSHOP(b.title)} target="_blank" style={{background:'#1A1A2E',fontSize:10,padding:'3px 9px'}}>Bookshop</Btn>
            <Btn size="sm" href={BAM(b.title)} target="_blank" style={{background:'#CC0000',fontSize:10,padding:'3px 9px'}}>BAM</Btn>
          </div>
        ))}
        {(post.spice_ups||[]).slice(0,2).map((sp,i)=>(
          <div key={i} style={{marginTop:6,background:T.greenPale,borderRadius:T.rSm,padding:'9px 12px',fontSize:12,color:T.green,display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
            <span><strong>Try:</strong> {sp.name}</span>
            <Btn size="sm" href={AMZN(sp.search)} target="_blank" style={{background:'#FF9900',color:T.charcoal,fontSize:10,padding:'3px 9px'}}>Amazon</Btn>
          </div>
        ))}
      </details>
    </Card>
  )
}

function CommunityView({ posts, loading, votedIds, onUpvote, onRefresh, onBuild }) {
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')

  const filt = filter==='all' ? posts : posts.filter(p=>p.age===filter||p.occasion===filter)

  const sorted = [...filt].sort((a,b)=>{
    if(sort==='most-loved') return (b.votes||0)-(a.votes||0)
    if(sort==='fastest') {
      const mins = p => parseInt((p.duration||'').match(/\d+/)?.[0]||999)
      return mins(a)-mins(b)
    }
    if(sort==='lowest-prep') {
      const prep = p => (p.setup_time||'').toLowerCase().includes('no')?0:parseInt((p.setup_time||'').match(/\d+/)?.[0]||10)
      return prep(a)-prep(b)
    }
    if(sort==='quietest') {
      const q = p => p.energy==='calm'?0:p.energy==='medium'?1:2
      return q(a)-q(b)
    }
    // newest (default)
    return (b.ts||0)-(a.ts||0)
  })

  return (
    <div style={{maxWidth:700,margin:'0 auto',padding:'28px 20px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
        <div><h2 style={{fontSize:20,fontWeight:900,margin:'0 0 4px',fontFamily:F,color:T.charcoal}}>🌍 Community Activities</h2><p style={{margin:0,fontSize:13,color:T.gray}}>Real activities from parents. Upvote your favorites.</p></div>
        <Btn size="sm" variant="subtleGray" onClick={onRefresh}>↻ Refresh</Btn>
      </div>

      {/* Age/occasion filter */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
        {[{v:'all',l:'All activities'},...AGE_GROUPS.map(a=>({v:a.v,l:a.l})),{v:'rainy-day',l:'🌧 Rainy day'},{v:'weekend',l:'☀️ Weekend'}].map(f=>(
          <button key={f.v} onClick={()=>setFilter(f.v)} style={{background:filter===f.v?T.green:T.grayPale,color:filter===f.v?'#fff':T.gray,border:'none',borderRadius:50,padding:'5px 13px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:F}}>{f.l}</button>
        ))}
      </div>

      {/* Sort tabs */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:20,paddingTop:10,borderTop:`1px solid ${T.border}`}}>
        <span style={{fontSize:11,fontWeight:700,color:T.grayLight,alignSelf:'center',fontFamily:F,marginRight:2}}>SORT:</span>
        {[
          {v:'newest',l:'Newest'},
          {v:'most-loved',l:'🧡 Most loved'},
          {v:'fastest',l:'⚡ Fastest'},
          {v:'lowest-prep',l:'📦 Lowest prep'},
          {v:'quietest',l:'🤫 Quietest'},
        ].map(s=>(
          <button key={s.v} onClick={()=>setSort(s.v)} style={{background:sort===s.v?T.goldLight:T.grayPale,color:sort===s.v?'#C05621':T.gray,border:`1.5px solid ${sort===s.v?T.gold:T.border}`,borderRadius:50,padding:'4px 11px',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:F}}>{s.l}</button>
        ))}
      </div>

      {loading ? <Spinner/> : sorted.length===0
        ? <EmptyState icon="🌱" title="No activities yet" sub="Generate an activity and add it to the community board using the button on your result page."><Btn onClick={onBuild} style={{marginTop:4}}>Build an activity</Btn></EmptyState>
        : sorted.map((p,i)=>(
          <React.Fragment key={p.id||p.ts}>
            <CommCard post={p} voted={votedIds.has(p.id)} onUpvote={onUpvote}/>
            {(i===2||i===5)&&<AdUnit style={{marginBottom:14}}/>}
          </React.Fragment>
        ))}
      <SiteFooter />
    </div>
  )
}

function BestOfView({ posts, loading, filter, setFilter, votedIds, onUpvote, onRefresh }) {
  const filt = filter==='all' ? posts : posts.filter(p=>p.age===filter)
  return (
    <div style={{maxWidth:700,margin:'0 auto',padding:'28px 20px'}}>
      <div style={{marginBottom:18}}><h2 style={{fontSize:20,fontWeight:900,margin:'0 0 4px',fontFamily:F,color:T.charcoal}}>⭐ Best Of</h2><p style={{margin:0,fontSize:13,color:T.gray}}>Top-voted activities from the community. These become the book.</p></div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
        {['all',...AGE_GROUPS.map(a=>a.v)].map(f=><button key={f} onClick={()=>setFilter(f)} style={{background:filter===f?T.green:T.grayPale,color:filter===f?'#fff':T.gray,border:'none',borderRadius:50,padding:'5px 13px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:F}}>{f==='all'?'All ages':AGE_GROUPS.find(a=>a.v===f)?.l||f}</button>)}
      </div>
      {loading ? <Spinner/> : filt.length===0
        ? <EmptyState icon="🤍" title="Nothing upvoted yet" sub="Generate activities and heart the great ones!"/>
        : filt.map((p,i)=>(
          <div key={p.id||p.ts} style={{position:'relative'}}>
            {i<3&&<div style={{position:'absolute',top:-5,left:-5,background:['#FFD700','#C0C0C0','#CD7F32'][i],color:T.charcoal,borderRadius:'50%',width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,zIndex:1,fontFamily:F}}>#{i+1}</div>}
            <CommCard post={p} voted={votedIds.has(p.id)} onUpvote={onUpvote}/>
          </div>
        ))}
      <AdUnit style={{marginBottom:14}}/>
      <button onClick={onRefresh} style={{width:'100%',background:'transparent',border:`1.5px solid ${T.border}`,borderRadius:50,padding:9,fontSize:12,fontWeight:700,cursor:'pointer',color:T.gray,fontFamily:F}}>↻ Refresh</button>
      <SiteFooter />
    </div>
  )
}

// ── ADMIN ──────────────────────────────────────────────────────────────────────
function AdminView({ unlocked, setUnlocked, data, loading, age, setAge, load, export:exportCSV, onExit }) {
  const byAge = {}
  data.forEach(p=>{const k=p.age||'unknown';if(!byAge[k])byAge[k]=[];byAge[k].push(p)})
  const filt = age==='all' ? data : (byAge[age]||[])
  const sorted = [...filt].sort((a,b)=>(b.votes||0)-(a.votes||0))
  return (
    <div style={{fontFamily:F2,minHeight:'100vh',background:T.cream}}>
      <div style={{background:T.charcoal,padding:'10px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{color:T.gold,fontSize:14,fontWeight:900,fontFamily:F}}>📚 Book Data — Admin</span>
        <button onClick={onExit} style={{background:'transparent',border:'1px solid rgba(255,255,255,.2)',borderRadius:50,padding:'4px 14px',fontSize:12,fontWeight:700,color:'rgba(255,255,255,.5)',cursor:'pointer',fontFamily:F}}>Exit</button>
      </div>
      {!unlocked ? (
        <div style={{maxWidth:400,margin:'60px auto',padding:'0 20px',textAlign:'center'}}>
          <div style={{fontSize:40,marginBottom:14}}>📚</div>
          <h2 style={{fontSize:18,fontWeight:900,margin:'0 0 8px',fontFamily:F,color:T.charcoal}}>Book Data</h2>
          <p style={{fontSize:13,color:T.gray,marginBottom:20}}>Enter your key to access activity data.</p>
          <div style={{display:'flex',gap:8}}>
            <input id="admin-key" type="password" placeholder="Admin key" style={{flex:1,border:`1.5px solid ${T.border}`,borderRadius:50,padding:'9px 16px',fontSize:13,outline:'none',background:T.white,color:T.charcoal,fontFamily:F2}} onKeyDown={e=>{if(e.key==='Enter'&&e.target.value===ADMIN_KEY){setUnlocked(true);load()}}}/>
            <Btn onClick={()=>{const el=document.getElementById('admin-key');if(el?.value===ADMIN_KEY){setUnlocked(true);load()}}} size="md">Enter</Btn>
          </div>
        </div>
      ) : (
        <div style={{maxWidth:900,margin:'0 auto',padding:'24px 20px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
            <p style={{margin:0,fontSize:12,color:T.gray}}>{data.length} activities · sorted by votes</p>
            <div style={{display:'flex',gap:8}}>
              <Btn size="sm" variant="subtleGray" onClick={load}>↻ Reload</Btn>
              <Btn size="sm" onClick={exportCSV} style={{background:T.greenDark}}>⬇ Export CSV</Btn>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(80px,1fr))',gap:8,marginBottom:16}}>
            {[['Total',data.length,T.green],['Upvoted',data.filter(p=>(p.votes||0)>0).length,T.greenDark],['2-3',(byAge['2-3']||[]).length,'#7C3AED'],['4-5',(byAge['4-5']||[]).length,'#0369A1'],['6-8',(byAge['6-8']||[]).length,'#0D9488'],['9-12',(byAge['9-12']||[]).length,'#D97706']].map(([l,n,c])=>(
              <div key={l} style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:T.rSm,padding:'10px 8px',textAlign:'center'}}>
                <div style={{fontSize:18,fontWeight:900,color:c,fontFamily:F}}>{n}</div>
                <div style={{fontSize:10,fontWeight:700,color:T.gray}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
            {['all',...AGE_GROUPS.map(a=>a.v)].map(f=><button key={f} onClick={()=>setAge(f)} style={{background:age===f?T.green:T.grayPale,color:age===f?'#fff':T.gray,border:'none',borderRadius:50,padding:'5px 12px',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:F}}>{f==='all'?'All':AGE_GROUPS.find(a=>a.v===f)?.l||f}</button>)}
          </div>
          {loading ? <Spinner/> : sorted.length===0
            ? <div style={{textAlign:'center',padding:36}}><Btn onClick={load}>Load data</Btn></div>
            : <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:480}}>
                  <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>{['Votes','Activity','Age','Occasion','Energy','Book'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:10,fontWeight:800,letterSpacing:1,textTransform:'uppercase',color:T.gray,fontFamily:F}}>{h}</th>)}</tr></thead>
                  <tbody>{sorted.map((p,i)=>(
                    <tr key={p.id||i} style={{borderBottom:`1px solid ${T.border}`,background:i%2===0?'transparent':T.grayPale}}>
                      <td style={{padding:9,fontWeight:900,color:(p.votes||0)>0?T.green:T.grayLight}}>{p.votes||0}</td>
                      <td style={{padding:9}}><div style={{fontWeight:700,lineHeight:1.3,fontFamily:F,color:T.charcoal}}>{p.activity_name}</div><div style={{fontSize:11,color:T.gray}}>{(p.tagline||'').slice(0,50)}{(p.tagline?.length||0)>50?'…':''}</div></td>
                      <td style={{padding:9}}>{AGE_GROUPS.find(a=>a.v===p.age)?.e||''} {p.age||'?'}</td>
                      <td style={{padding:9,color:T.gray}}>{OCCASIONS.find(o=>o.v===p.occasion)?.l||p.occasion||''}</td>
                      <td style={{padding:9,color:T.gray}}>{p.energy||''}</td>
                      <td style={{padding:9,color:T.gray,fontSize:11,fontStyle:'italic'}}>{(p.books||[])[0]?.title||p.book?.title||''}</td>
                    </tr>
                  ))}</tbody>
                </table>
                <p style={{fontSize:11,color:T.grayLight,textAlign:'center',marginTop:10}}>Export CSV → sort by votes → curate your book chapters.</p>
              </div>}
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
  const [answers, setAnswers] = useState({age:'',occasion:'',holiday:'',vacationWhere:'',birthdayDetails:'',interests:'',energy:'',materialCategories:[],materialsExtra:'',difficulty:''})
  const [giftAnswers, setGiftAnswers] = useState({age:'',interests:'',budget:'',occasion:''})
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
  const [showShareSheet, setShowShareSheet] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    try { const s=localStorage.getItem('kid_profile_v4'); if(s)setSavedProfile(JSON.parse(s)) } catch {}
    try { const v=localStorage.getItem('voted_ids'); if(v)setVotedIds(new Set(JSON.parse(v))) } catch {}
    if (window.location.hash==='#admin') setIsAdmin(true)
    if (window.location.hash==='#gift') { setMode('gift'); setStage('quiz'); setGiftStep(0); setActiveNav('generator') }
    // Support ?gift=1 from static pages (/#gift gets eaten by router)
    if (new URLSearchParams(window.location.search).get('gift') === '1') {
      setMode('gift'); setStage('quiz'); setGiftStep(0); setActiveNav('generator')
      if (history.replaceState) history.replaceState(null,'',location.pathname)
    }
    // Auto-generate gift from shared URL e.g. #gift?age=4-5&interests=dinosaurs&budget=$20-35
    if (window.location.hash.startsWith('#gift?')) {
      const params = new URLSearchParams(window.location.hash.slice(6))
      const a = params.get('age')||'', i = params.get('interests')||'', b = params.get('budget')||'', o = params.get('occasion')||''
      if (a && i && b) {
        const ans = {age:a, interests:i, budget:b, occasion:o}
        setGiftAnswers(ans); setMode('gift'); setActiveNav('generator')
        setTimeout(() => generateGift(ans), 100)
      }
    }
  }, [])

  const saveVoted = ids => { try { localStorage.setItem('voted_ids',JSON.stringify([...ids])) } catch {} }
  const saveProfileLocal = ans => { try { localStorage.setItem('kid_profile_v4',JSON.stringify(ans)) } catch {} }

  const startLoadAnim = () => {
    setLoadStage(0); let i=0
    timerRef.current = setInterval(()=>{ i++; if(i<LOAD_STAGES.length)setLoadStage(i); else clearInterval(timerRef.current) }, 1600)
  }

  const generate = useCallback(async (ans) => {
    setStage('loading'); setErrorMsg(''); setHiddenProducts(new Set()); setSharedToCommunity(false); startLoadAnim()
    try {
      const result = await callAPI({model:'claude-sonnet-4-20250514',max_tokens:3000,system:SYSTEM_PROMPT,messages:[{role:'user',content:buildActivityMsg(ans)}]})
      clearInterval(timerRef.current); setActivity(result); setStage('result'); setActiveNav('generator')
    } catch(e) { clearInterval(timerRef.current); setErrorMsg(e.message||'Something went wrong'); setStage('error') }
  }, [])

  const generateGift = useCallback(async (ans) => {
    setStage('loading'); setErrorMsg(''); startLoadAnim()
    try {
      const result = await callAPI({model:'claude-sonnet-4-20250514',max_tokens:1600,system:GIFT_PROMPT,messages:[{role:'user',content:buildGiftMsg(ans)}]})
      clearInterval(timerRef.current); setGift(result); setStage('gift-result')
      // Push shareable URL
      const p = new URLSearchParams({age:ans.age, interests:ans.interests, budget:ans.budget, ...(ans.occasion?{occasion:ans.occasion}:{})})
      if (history.pushState) history.pushState(null,'',`#gift?${p.toString()}`)
    } catch(e) { clearInterval(timerRef.current); setErrorMsg(e.message||'Something went wrong'); setStage('error') }
  }, [])

  const loadCommunity = async () => {
    setCommunityLoading(true)
    try { const posts=await communityFetch(); setCommunityPosts(posts.slice(0,40)) } catch {}
    setCommunityLoading(false)
  }

  const loadBestOf = async () => {
    setBestOfLoading(true)
    try { const posts=await communityFetch(); setBestOf(posts.filter(p=>(p.votes||0)>=1).sort((a,b)=>b.votes-a.votes).slice(0,20)) } catch {}
    setBestOfLoading(false)
  }

  const loadAdminData = async () => {
    setAdminLoading(true)
    try { setAdminData(await communityFetch()) } catch {}
    setAdminLoading(false)
  }

  const handleUpvote = async (id) => {
    if (!id||votedIds.has(id)) return
    try {
      await communityFetch('POST',{action:'upvote',id})
      const n=new Set(votedIds); n.add(id); setVotedIds(n); saveVoted(n)
      setCommunityPosts(prev=>prev.map(p=>p.id===id?{...p,votes:(p.votes||0)+1}:p))
      setBestOf(prev=>prev.map(p=>p.id===id?{...p,votes:(p.votes||0)+1}:p))
    } catch {}
  }

  const handleShareToCommunity = async () => {
    if (sharedToCommunity||!activity) return
    try {
      const postData = {activity_name:activity.activity_name,tagline:activity.tagline,duration:activity.duration,steps:activity.steps,why_kids_love_it:activity.why_kids_love_it,parent_tip:activity.parent_tip,books:activity.books||[],spice_ups:activity.spice_ups||[],age:answers.age,occasion:answers.occasion,holiday:answers.holiday,energy:answers.energy,difficulty:answers.difficulty,materials_used:activity.materials_used||[]}
      const res = await communityFetch('POST',{action:'add',post:postData})
      if (res.post?.id) setCurrentPostId(res.post.id)
    } catch {}
    setSharedToCommunity(true)
  }

  const switchNav = tab => {
    setActiveNav(tab)
    if (tab==='community') loadCommunity()
    if (tab==='bestof') loadBestOf()
  }

  const startFresh = () => { setMode('activity'); setStage('quiz'); setStep(0); setActivity(null); setErrorMsg(''); setAnswers({age:'',occasion:'',holiday:'',vacationWhere:'',birthdayDetails:'',interests:'',energy:'',materialCategories:[],materialsExtra:'',difficulty:''}); setProfileSaved(false); setEmailSent(false); setActiveNav('generator'); setHiddenProducts(new Set()); setSharedToCommunity(false) }
  const startGift = () => { setMode('gift'); setStage('quiz'); setGiftStep(0); setGift(null); setErrorMsg(''); setGiftAnswers({age:'',interests:'',budget:'',occasion:''}); setActiveNav('generator') }
  const startSaved = () => { if(!savedProfile)return; setMode('activity'); setAnswers({...savedProfile}); setStep(5); setStage('quiz'); setProfileSaved(true); setEmailSent(false); setActivity(null); setActiveNav('generator') }
  const doSaveProfile = () => { saveProfileLocal(answers); setSavedProfile({...answers}); setProfileSaved(true) }

  const handleShare = () => {
    const txt = `We just did "${activity?.activity_name}" with things we already had at home and my kid LOVED it. Try whatshouldmykiddo.com`
    const url = 'https://whatshouldmykiddo.com'
    if (navigator.share) {
      navigator.share({text:txt, url}).catch(()=>{})
    } else {
      setShowShareSheet(true)
    }
  }

  const closeShareSheet = () => setShowShareSheet(false)

  const copyActivity = () => {
    if (!activity) return
    const books = activity.books||(activity.book?[activity.book]:[])
    const bookLine = books.length>0 ? `\n\nRead after: ${books[0].title} by ${books[0].author}` : ''
    const steps = activity.steps.map((s,i)=>`${i+1}. ${s}`).join('\n')
    const txt = `${activity.activity_name}\n${activity.tagline}\n\nTime: ${activity.duration}\n\nSteps:\n${steps}\n\nParent tip: ${activity.parent_tip||''}${bookLine}\n\nGenerated at whatshouldmykiddo.com`
    navigator.clipboard?.writeText(txt).then(()=>{ setShareMsg('Activity copied! Paste it anywhere.'); setTimeout(()=>setShareMsg(''),3000) })
    closeShareSheet()
  }

  const handleEmail = () => {
    if (!activity) return
    const books = activity.books||(activity.book?[activity.book]:[])
    const bookLine = books.length>0 ? `\n\nRecommended reading: ${books[0].title} by ${books[0].author}` : ''
    const steps = activity.steps.map((s,i)=>`${i+1}. ${s}`).join('\n')
    const bodyText = [`${activity.activity_name}`,`${activity.tagline}`,'',`Time: ${activity.duration}`,'','Steps:',steps,'',`Parent tip: ${activity.parent_tip||''}`,bookLine,'','Generated at whatshouldmykiddo.com'].join('\n')
    const sub = encodeURIComponent(`Activity: ${activity.activity_name}`)
    const body = encodeURIComponent(bodyText)
    const a = document.createElement('a'); a.href=`mailto:?subject=${sub}&body=${body}`; a.style.display='none'; document.body.appendChild(a); a.click(); document.body.removeChild(a)
    // On desktop, mailto often silently fails — fall back to clipboard after short delay
    setTimeout(()=>{
      setEmailSent(true)
      // Also copy to clipboard as fallback
      navigator.clipboard?.writeText(bodyText).catch(()=>{})
    }, 400)
  }

  const exportCSV = () => {
    const data = adminAge==='all' ? adminData : adminData.filter(p=>p.age===adminAge)
    if (!data.length) { alert('No data to export.'); return }
    const sorted = [...data].sort((a,b)=>(b.votes||0)-(a.votes||0))
    const rows = [['Activity','Tagline','Age','Occasion','Holiday','Energy','Difficulty','Steps','Book Title','Book Author','Votes','Date']]
    sorted.forEach(p=>rows.push([`"${(p.activity_name||'').replace(/"/g,'""')}"`,`"${(p.tagline||'').replace(/"/g,'""')}"`,p.age||'',p.occasion||'',p.holiday||'',p.energy||'',p.difficulty||'',`"${(p.steps||[]).join(' | ').replace(/"/g,'""')}"`,`"${((p.books||[])[0]?.title||p.book?.title||'').replace(/"/g,'""')}"`,`"${((p.books||[])[0]?.author||p.book?.author||'').replace(/"/g,'""')}"`,p.votes||0,new Date(p.ts||0).toLocaleDateString()]))
    const csv = rows.map(r=>r.join(',')).join('\n')
    const a = document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download=`activities_${adminAge}_${Date.now()}.csv`; a.click()
  }

  // Admin route
  if (isAdmin) return <AdminView unlocked={adminUnlocked} setUnlocked={setAdminUnlocked} data={adminData} loading={adminLoading} age={adminAge} setAge={setAdminAge} load={loadAdminData} export={exportCSV} onExit={()=>{setIsAdmin(false);if(history.pushState)history.pushState('','',location.pathname)}}/>

  // Loading
  if (stage==='loading') return <LoadingView stage={loadStage} interests={mode==='gift'?giftAnswers.interests:answers.interests}/>

  // Quiz
  if (stage==='quiz') {
    if (mode==='gift') return <GiftQuizView step={giftStep} setStep={setGiftStep} answers={giftAnswers} setAnswers={setGiftAnswers} onGenerate={generateGift} onCancel={()=>{setMode('activity');setStage('landing')}}/>
    return <GeneratorShell step={step} setStep={setStep} answers={answers} setAnswers={setAnswers} totalSteps={6} onGenerate={generate}/>
  }

  // Main layout
  return (
    <div style={{fontFamily:F2,minHeight:'100vh',background:T.cream,color:T.charcoal}}>
      <SiteHeader activeNav={activeNav} onSwitch={switchNav} onGeneratorClick={startFresh}/>
      {stage==='error' && <ErrorView msg={errorMsg} onRetry={()=>mode==='gift'?generateGift(giftAnswers):generate(answers)} onBack={()=>setStage('quiz')}/>}
      {stage==='result' && activeNav==='generator' && <ResultView activity={activity} answers={answers} currentPostId={currentPostId} votedIds={votedIds} profileSaved={profileSaved} emailSent={emailSent} savedProfile={savedProfile} shareMsg={shareMsg} hiddenProducts={hiddenProducts} setHiddenProducts={setHiddenProducts} sharedToCommunity={sharedToCommunity} showShareSheet={showShareSheet} onUpvote={handleUpvote} onSave={doSaveProfile} onEmail={handleEmail} onShare={handleShare} onShareToCommunity={handleShareToCommunity} copyActivity={copyActivity} closeShareSheet={closeShareSheet} onNew={startFresh} onNewSaved={startSaved} onTweakAnswers={()=>setStage('quiz')}/>}
      {stage==='gift-result' && activeNav==='generator' && <GiftResultView gift={gift} answers={giftAnswers} onNew={startGift} onActivity={()=>{setMode('activity');setStage('landing')}}/>}
      {activeNav==='community' && <CommunityView posts={communityPosts} loading={communityLoading} votedIds={votedIds} onUpvote={handleUpvote} onRefresh={loadCommunity} onBuild={startFresh}/>}
      {activeNav==='bestof' && <BestOfView posts={bestOf} loading={bestOfLoading} filter={bestFilter} setFilter={setBestFilter} votedIds={votedIds} onUpvote={handleUpvote} onRefresh={loadBestOf}/>}
      {activeNav==='generator' && !['result','gift-result','error'].includes(stage) && <HomePage onStart={startFresh} onStartSaved={startSaved} savedProfile={savedProfile} onGift={startGift}/>}
    </div>
  )
}
