import { useEffect, useRef, useState } from 'react'
import { OWNER, PROJECTS, SECTIONS, SKILLS } from '../data/content.js'
import { scrollState, useStore } from '../state.js'

const Icon = {
  arrow: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  mail: <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>,
  github: <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" /></svg>,
  linkedin: <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" /></svg>,
  soundOff: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" /><path d="m16 9 5 6M21 9l-5 6" /></svg>,
  soundOn: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></svg>,
}

/** Scroll to a section's stop and move keyboard focus to its heading. */
function goTo(id) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: el.offsetTop + 2, behavior: reduce ? 'auto' : 'smooth' })
  el.querySelector('h1, h2')?.focus({ preventScroll: true })
}

/**
 * The Skills chart for phones: the same five figures as the 3D chart, stacked in one column
 * with every name beside its star (there is no hover on a touch screen). Drawn as SVG, in its
 * own units: CHART_W across, and as tall as the figures need.
 */
const CHART_W = 500
const CHART_FONT = 20
const SKY_CHART = (() => {
  let top = 0
  const groups = SKILLS.map((g) => {
    const stars = g.stars.map(([label, x, y, side = 'right']) => {
      const sy = y * 0.8 // slightly flattened, so five figures fit a phone screen
      const w = (label?.length ?? 0) * CHART_FONT * 0.53 // estimated text width
      // where the name sits: right of the star by default, or centred below it
      const text = side === 'below' ? { x, y: sy + 26, anchor: 'middle', min: x - w / 2, max: x + w / 2 } : { x: x + 12, y: sy, anchor: 'start', min: x, max: x + 12 + w }
      return { label, x, y: sy, text }
    })
    const minX = Math.min(...stars.map((s) => Math.min(s.x, s.text.min)))
    const maxX = Math.max(...stars.map((s) => Math.max(s.x, s.text.max)))
    const minY = Math.min(...stars.map((s) => s.y))
    const maxY = Math.max(...stars.map((s) => Math.max(s.y, s.label ? s.text.y : s.y)))
    const dx = (CHART_W - (maxX - minX)) / 2 - minX // centre the figure, names included
    const dy = top + 38 - minY // the group's title sits above the figure
    const group = { name: g.name, titleY: top + 16, dx, dy, stars, path: g.lines.map(([a, b]) => `M${stars[a].x} ${stars[a].y}L${stars[b].x} ${stars[b].y}`).join('') }
    top += 38 + (maxY - minY) + 30
    return group
  })
  return { groups, height: top - 16 }
})()

function SkyChart() {
  return (
    <svg className="sky-chart" aria-hidden="true" viewBox={`0 0 ${CHART_W} ${SKY_CHART.height}`} preserveAspectRatio="xMidYMin meet">
      {SKY_CHART.groups.map((g) => (
        <g key={g.name}>
          <text className="sky-chart__title" x={0} y={g.titleY}>
            {g.name}
          </text>
          <g transform={`translate(${g.dx} ${g.dy})`}>
            <path d={g.path} />
            {g.stars.map((s) => (
              <circle key={`${s.x} ${s.y}`} cx={s.x} cy={s.y} r={s.label ? 4 : 2.6} />
            ))}
            {g.stars.map((s) => s.label && (
              <text key={s.label} x={s.text.x} y={s.text.y} textAnchor={s.text.anchor} dominantBaseline="central">
                {s.label}
              </text>
            ))}
          </g>
        </g>
      ))}
    </svg>
  )
}

/** Full-screen loading screen with a progress bar; fades out when textures are ready. */
export function Loader() {
  const { progress, done } = useStore((s) => s.loading)
  const [gone, setGone] = useState(false)
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setGone(true), 900)
    return () => clearTimeout(t)
  }, [done])
  if (gone) return null
  const pct = Math.round(progress)
  return (
    <div className={`loader ${done ? 'loader--done' : ''}`} role="status" aria-live="polite">
      <div className="loader__mark" aria-hidden="true" />
      <div className="loader__name">{OWNER.name}</div>
      <div className="loader__label">Preparing for launch</div>
      <div className="loader__bar" role="progressbar" aria-label="Loading" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <div style={{ width: `${pct}%` }} />
      </div>
      <div className="loader__row">
        <span>Loading star charts</span>
        <span>{pct}%</span>
      </div>
      <a href="#content" onClick={() => setGone(true)}>
        Skip to plain content
      </a>
    </div>
  )
}

/** Top bar: section links, the journey progress rail and the ambient sound toggle. */
export function Nav() {
  const audioOn = useStore((s) => s.audioOn)
  const toggleAudio = useStore((s) => s.toggleAudio)
  const [current, setCurrent] = useState(0)

  // Highlight the section we are closest to (cheap poll of the shared scroll value).
  useEffect(() => {
    const onScroll = () => {
      const tops = SECTIONS.map((s) => document.getElementById(s.id)?.offsetTop ?? 0)
      const y = window.scrollY + window.innerHeight * 0.4
      setCurrent(Math.max(0, tops.findLastIndex((t) => y >= t)))
    }
    // measure after the first layout too (section offsets are all 0 before styles apply), and on resize
    const frame = requestAnimationFrame(onScroll)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    window.addEventListener('load', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('load', onScroll)
    }
  }, [])

  return (
    <>
      <header className="nav">
        <a className="nav__brand" href="#hero" onClick={(e) => (e.preventDefault(), goTo('hero'))}>
          Cedayaxo
        </a>
        <nav aria-label="Sections">
          {SECTIONS.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} aria-current={i === current ? 'true' : undefined} onClick={(e) => (e.preventDefault(), goTo(s.id))}>
              {s.label}
            </a>
          ))}
        </nav>
        <button type="button" className="nav__sound" aria-pressed={audioOn} onClick={toggleAudio}>
          {audioOn ? Icon.soundOn : Icon.soundOff}
          <span>{audioOn ? 'Sound on' : 'Sound off'}</span>
        </button>
      </header>
      <div className="rail" aria-hidden="true">
        {SECTIONS.map((s, i) => (
          <span key={s.id} className={i === current ? 'is-current' : ''} />
        ))}
      </div>
    </>
  )
}

/**
 * The page content. These are ordinary HTML sections in normal document flow, so they are
 * what search engines, screen readers and keyboard users get. The 3D scene sits behind them.
 */
export function Sections({ media }) {
  const select = useStore((s) => s.select)
  return (
    <>
      <section id="hero" data-section className="stop stop--hero">
        <div className="stop__inner">
          <p className="eyebrow">{OWNER.title}</p>
          <h1 tabIndex={-1}>
            César
            <br />
            Yamada
          </h1>
          <p className="lead">{OWNER.tagline}</p>
          <div className="actions">
            <a className="btn btn--primary" href="#about" onClick={(e) => (e.preventDefault(), goTo('about'))}>
              Begin the journey {Icon.arrow}
            </a>
            <a className="btn" href="#projects" onClick={(e) => (e.preventDefault(), goTo('projects'))}>
              Jump to projects
            </a>
          </div>
          <p className="scroll-hint">Scroll to travel</p>
        </div>
      </section>

      <section id="about" data-section className="stop stop--about">
        <div className="stop__inner">
          <div className="card">
            <p className="eyebrow">Station 01 · About</p>
            <h2 tabIndex={-1}>Data scientist, building agents that act.</h2>
            {OWNER.bio.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <h3 className="label">Interests</h3>
            <ul className="chips">
              {OWNER.interests.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="projects" data-section className="stop stop--projects">
        <div className="stop__inner">
          <div>
            <p className="eyebrow">System 02 · Projects</p>
            <h2 tabIndex={-1}>Each world is its project</h2>
            <p className="muted">Choose a planet to zoom in and open its project.</p>
          </div>
          {/* Same panels as clicking a planet. Hidden until a button gets keyboard focus, so nothing covers
              the planets; always visible in the static (reduced motion) page, which has no planets. */}
          <div className="project-list">
            <ul>
              {PROJECTS.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => select(p.id)}>
                    <strong>{p.name}</strong>
                    <span>{p.subtitle}</span>
                    <small>{(media[p.id] || []).length ? `${media[p.id].length} media` : 'No media yet'}</small>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="skills" data-section className="stop stop--skills">
        <div className="stop__inner">
          <div>
            <p className="eyebrow">Sky chart 03 · Skills</p>
            <h2 tabIndex={-1}>Five constellations</h2>
            <p className="muted skills-hint">Hover a constellation to see its skills.</p>
          </div>
          {/* phones get the chart as a flat drawing; the 3D one would not fit a narrow screen */}
          <SkyChart />
          {/* Visible as a list with reduced motion; otherwise the chart labels show the same
              text, so this list is kept for assistive tech only (see .skill-list in styles.css). */}
          <div className="skill-list">
            {SKILLS.map((g) => (
              <div key={g.name}>
                <h3>{g.name}</h3>
                <ul>
                  {g.stars.map(([label]) => label && <li key={label}>{label}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" data-section className="stop stop--contact">
        <div className="stop__inner">
          <p className="eyebrow">Touchdown · Contact</p>
          <h2 tabIndex={-1}>
            You've landed.
            <br />
            Let's talk.
          </h2>
          <p className="lead">Open to conversations about AI agents, machine learning on real-world data, and optimization for decision support.</p>
          <div className="socials">
            <a href={`mailto:${OWNER.links.email}`} aria-label={`Email ${OWNER.links.email}`} title={OWNER.links.email}>
              {Icon.mail}
            </a>
            <a href={OWNER.links.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">
              {Icon.github}
            </a>
            <a href={OWNER.links.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn">
              {Icon.linkedin}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

/** Follows the pointer and describes the hovered planet. */
export function Tooltip() {
  const hovered = useStore((s) => s.hovered)
  const selected = useStore((s) => s.selected)
  const ref = useRef()
  const pointer = useRef({ x: 0, y: 0 })

  // Sits beside the pointer on whichever side has room, so it never runs off the screen.
  const place = () => {
    const el = ref.current
    if (!el) return
    const { x, y } = pointer.current
    const gap = 18
    const edge = 12
    const w = el.offsetWidth
    const h = el.offsetHeight
    const left = x + gap + w > window.innerWidth - edge ? x - gap - w : x + gap
    const top = y + gap + h > window.innerHeight - edge ? y - gap - h : y + gap
    el.style.transform = `translate(${Math.max(edge, left)}px, ${Math.max(edge, top)}px)`
  }

  useEffect(() => {
    const move = (e) => {
      pointer.current = { x: e.clientX, y: e.clientY }
      place()
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : ''
    place()
  }, [hovered])

  if (!hovered || selected || scrollState.progress < 0.3) return null
  const project = PROJECTS.find((p) => p.id === hovered)
  if (!project) return null
  return (
    <div ref={ref} className="tooltip" role="tooltip">
      <strong>{project.name}</strong>
      <span>{project.short}</span>
      <em>Click to zoom in</em>
    </div>
  )
}
