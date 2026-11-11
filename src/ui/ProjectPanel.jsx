import { useEffect, useRef, useState } from 'react'
import { PROJECTS } from '../data/content.js'
import { useStore } from '../state.js'

const githubMark = <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" /></svg>
const openArrow = <svg aria-hidden="true" className="repo__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M9 7h8v8" /></svg>

const Close = (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

/** One gallery item on the main stage. Videos start muted and looping; a click reveals the controls. */
function Stage({ item, onZoom }) {
  const [controls, setControls] = useState(false)
  useEffect(() => setControls(false), [item])
  if (item.type === 'video') {
    return (
      <video
        key={item.src}
        src={item.src}
        poster={item.poster || undefined}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        controls={controls}
        onClick={() => setControls(true)}
        aria-label={item.caption || 'Project video'}
      />
    )
  }
  return (
    <button type="button" className="gallery__zoom" onClick={onZoom} aria-label="Open image full size">
      <img src={item.src} alt={item.caption || ''} loading="lazy" />
    </button>
  )
}

/** Full-screen viewer: images toggle between fit and 2x zoom, videos get full controls. */
function Lightbox({ item, onClose }) {
  const [zoomed, setZoomed] = useState(false)
  const closeRef = useRef()
  useEffect(() => closeRef.current?.focus(), [])
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={item.caption || 'Media viewer'} onClick={onClose}>
      <button ref={closeRef} type="button" className="icon-btn lightbox__close" onClick={onClose} aria-label="Close viewer">
        {Close}
      </button>
      {item.type === 'video' ? (
        <video src={item.src} poster={item.poster || undefined} controls autoPlay loop playsInline onClick={(e) => e.stopPropagation()} />
      ) : (
        <img
          src={item.src}
          alt={item.caption || ''}
          className={zoomed ? 'is-zoomed' : ''}
          onClick={(e) => (e.stopPropagation(), setZoomed((z) => !z))}
        />
      )}
      {item.caption && <p onClick={(e) => e.stopPropagation()}>{item.caption}</p>}
    </div>
  )
}

/**
 * Detail panel for the selected project. It only exists while a project is selected, so its
 * images and videos are not requested until then. Works with any number of media items,
 * including none.
 */
export default function ProjectPanel({ media }) {
  const selected = useStore((s) => s.selected)
  const select = useStore((s) => s.select)
  const index = useStore((s) => s.mediaIndex)
  const setIndex = useStore((s) => s.setMediaIndex)
  const [lightbox, setLightbox] = useState(false)
  const closeRef = useRef()
  const returnFocus = useRef(null)

  const position = PROJECTS.findIndex((p) => p.id === selected)
  const project = PROJECTS[position]
  const items = project ? media[project.id] || [] : []
  const item = items[Math.min(index, items.length - 1)]

  // Open: remember focus, lock page scroll, focus the close button. Close: undo all three.
  useEffect(() => {
    if (!selected) return
    returnFocus.current = document.activeElement
    document.documentElement.classList.add('is-locked')
    closeRef.current?.focus()
    setLightbox(false)
    return () => {
      document.documentElement.classList.remove('is-locked')
      returnFocus.current?.focus?.()
    }
  }, [selected])

  useEffect(() => {
    if (!selected) return
    const onKey = (e) => {
      if (e.key === 'Escape') lightbox ? setLightbox(false) : select(null)
      if (lightbox || items.length < 2) return
      if (e.key === 'ArrowRight') setIndex((index + 1) % items.length)
      if (e.key === 'ArrowLeft') setIndex((index - 1 + items.length) % items.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, lightbox, index, items.length, select, setIndex])

  if (!project) return null
  const step = (d) => select(PROJECTS[(position + d + PROJECTS.length) % PROJECTS.length].id)

  return (
    <>
      <button type="button" className="panel-back" onClick={() => select(null)}>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        Zoom out to all projects
      </button>

      <aside className="panel" role="dialog" aria-modal="false" aria-labelledby="panel-title">
        <div className="panel__head">
          <p className="eyebrow">
            Planet {String(position + 1).padStart(2, '0')} of {String(PROJECTS.length).padStart(2, '0')}
          </p>
          <button ref={closeRef} type="button" className="icon-btn" onClick={() => select(null)} aria-label="Close and zoom out">
            {Close}
          </button>
        </div>
        <h2 id="panel-title">{project.name}</h2>
        <p>{project.description}</p>
        {project.note && <p className="note">{project.note}</p>}
        <ul className="chips chips--small">
          {project.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>

        <div className="gallery">
          {item ? (
            <>
              <div className="gallery__stage">
                <Stage item={item} onZoom={() => setLightbox(true)} />
                <span className="gallery__count">
                  {Math.min(index, items.length - 1) + 1} / {items.length}
                </span>
              </div>
              <p className="gallery__caption">{item.caption || ' '}</p>
              {items.length > 1 && (
                <ul className="gallery__thumbs">
                  {items.map((it, i) => (
                    <li key={it.src}>
                      <button type="button" aria-label={`Show ${it.type} ${i + 1}${it.caption ? `: ${it.caption}` : ''}`} aria-pressed={i === index} onClick={() => setIndex(i)}>
                        {(it.type === 'video' ? it.poster : it.src) ? <img src={it.type === 'video' ? it.poster : it.src} alt="" loading="lazy" /> : null}
                        {it.type === 'video' && <span aria-hidden="true">▶</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="gallery__empty">
              No media for this project yet. Add files to <code>public/media/{project.media}/</code> and list them in <code>media.json</code>.
            </p>
          )}
        </div>

        <div className="panel__links">
          {project.links.map((l) => (
            <a key={l.url} className="repo" href={l.url} target="_blank" rel="noopener noreferrer">
              {githubMark}
              <span className="repo__text">
                <small>{l.label}</small>
                {/* owner/name, straight from the URL */}
                <strong>{l.url.replace('https://github.com/', '')}</strong>
              </span>
              {openArrow}
            </a>
          ))}
        </div>
        <div className="panel__pager">
          <button type="button" onClick={() => step(-1)}>
            Previous planet
          </button>
          <button type="button" onClick={() => step(1)}>
            Next planet
          </button>
        </div>
      </aside>

      {lightbox && item && <Lightbox item={item} onClose={() => setLightbox(false)} />}
    </>
  )
}
