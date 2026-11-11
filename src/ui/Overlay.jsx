import { useEffect, useRef, useState } from 'react'
import { OWNER, PROJECTS, SECTIONS, SKILLS } from '../data/content.js'
import { scrollState, useStore } from '../state.js'

const Icon = {
  arrow: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  mail: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>,
  code: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 7-5 5 5 5M16 7l5 5-5 5" /></svg>,
  person: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg>,
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
          {OWNER.name}
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
            <p className="muted">Click a planet to zoom in and open the project.</p>
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
          </div>
          {/* Visible as a list on mobile / reduced motion; on desktop the 3D labels show the same
              text, so this list is kept for assistive tech only (see .skill-list in styles.css). */}
          <div className="skill-list">
            {SKILLS.map((g) => (
              <div key={g.name}>
                <h3>{g.name}</h3>
                <ul>
                  {g.stars.map(([label]) => (
                    <li key={label}>{label}</li>
                  ))}
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
          <div className="actions">
            <a className="btn btn--primary" href={`mailto:${OWNER.links.email}`}>
              {Icon.mail} {OWNER.links.email}
            </a>
            <a className="btn" href={OWNER.links.github} target="_blank" rel="noopener noreferrer">
              {Icon.code} GitHub
            </a>
            <a className="btn" href={OWNER.links.linkedin} target="_blank" rel="noopener noreferrer">
              {Icon.person} LinkedIn
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

  useEffect(() => {
    const move = (e) => {
      pointer.current = { x: e.clientX, y: e.clientY }
      if (ref.current) ref.current.style.transform = `translate(${e.clientX + 18}px, ${e.clientY + 18}px)`
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : ''
    if (ref.current) ref.current.style.transform = `translate(${pointer.current.x + 18}px, ${pointer.current.y + 18}px)`
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
