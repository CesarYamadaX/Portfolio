import { lazy, Suspense } from 'react'
import { useEffect } from 'react'
import { useStore } from './state.js'
import { useAmbientAudio, useManifests, useProfile, useScrollJourney } from './hooks.js'
import { Loader, Nav, Sections, Tooltip } from './ui/Overlay.jsx'
import ProjectPanel from './ui/ProjectPanel.jsx'

// three.js and the whole scene load as a separate chunk, so the text content is
// on screen (and usable) before any 3D code arrives.
const Experience = lazy(() => import('./scene/Experience.jsx'))

export default function App() {
  const profile = useProfile()
  const media = useManifests()
  const animated = !profile.reducedMotion
  useScrollJourney(animated)
  useAmbientAudio()
  // while a project is zoomed in, the section copy and brand step aside (see styles.css)
  const zoomed = useStore((s) => Boolean(s.selected))
  useEffect(() => void document.body.classList.toggle('is-zoomed', zoomed), [zoomed])

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>

      {animated ? (
        <div className="stage" aria-hidden="true">
          <Suspense fallback={null}>
            <Experience mobile={profile.mobile} media={media} />
          </Suspense>
        </div>
      ) : (
        // prefers-reduced-motion: no WebGL at all, just a still backdrop behind normal page flow
        <div className="stage stage--static" aria-hidden="true">
          <img src="/img/planet-hero.webp" alt="" />
        </div>
      )}

      {animated && <Loader />}
      <Nav />
      <main id="content" className={animated ? 'journey' : 'journey journey--static'}>
        <Sections media={media} />
      </main>
      {animated && <Tooltip />}
      <ProjectPanel media={media} />
    </>
  )
}
