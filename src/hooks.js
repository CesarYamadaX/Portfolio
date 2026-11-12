import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PROJECTS } from './data/content.js'
import { scrollState, useStore } from './state.js'

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/** Device profile: decides how much of the scene to render. */
export function useProfile() {
  const mobile = useMediaQuery('(max-width: 820px), (pointer: coarse)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  return { mobile, reducedMotion }
}

/**
 * Loads every project's media.json once.
 * Returns { [projectId]: [{ src, type, caption, poster }] } with paths resolved to /media/<folder>/.
 * A missing or broken manifest simply yields an empty list.
 */
export function useManifests() {
  const [media, setMedia] = useState(() => Object.fromEntries(PROJECTS.map((p) => [p.id, []])))
  useEffect(() => {
    let alive = true
    const resolve = (folder, path) => (!path || /^(https?:)?\//.test(path) ? path : `${import.meta.env.BASE_URL}media/${folder}/${path}`)
    Promise.all(
      PROJECTS.map((p) =>
        fetch(`${import.meta.env.BASE_URL}media/${p.media}/media.json`)
          .then((r) => (r.ok ? r.json() : { items: [] }))
          .catch(() => ({ items: [] }))
          .then((json) => [
            p.id,
            (json.items || [])
              .filter((it) => it && it.src)
              .map((it) => ({
                type: it.type === 'video' ? 'video' : 'image',
                src: resolve(p.media, it.src),
                poster: resolve(p.media, it.poster),
                caption: it.caption || '',
              })),
          ]),
      ),
    ).then((entries) => alive && setMedia(Object.fromEntries(entries)))
    return () => {
      alive = false
    }
  }, [])
  return media
}

/**
 * Ties the journey to page scroll with GSAP ScrollTrigger.
 * `scrub` eases the progress value, and the same callback fades each section's HTML in and out.
 */
export function useScrollJourney(enabled) {
  useEffect(() => {
    const sections = [...document.querySelectorAll('[data-section]')]
    if (!enabled) {
      scrollState.progress = 0
      sections.forEach((el) => {
        el.style.removeProperty('--o')
        el.classList.remove('is-hidden')
      })
      return
    }
    gsap.registerPlugin(ScrollTrigger)
    // phones resize the window whenever the address bar slides away; re-measuring the journey then makes the scroll stutter
    ScrollTrigger.config({ ignoreMobileResize: true })
    const clamp = (v) => Math.max(0, Math.min(1, v))
    const apply = () => {
      const p = scrollState.progress * (sections.length - 1)
      sections.forEach((el, i) => {
        const local = p - i // 0 when the camera is exactly at this section's stop
        const fadeIn = i === 0 ? 1 : clamp((local + 0.3) / 0.2)
        const fadeOut = i === sections.length - 1 ? 1 : clamp((0.45 - local) / 0.2)
        const o = Math.min(fadeIn, fadeOut)
        el.style.setProperty('--o', o.toFixed(3))
        el.classList.toggle('is-hidden', o < 0.02)
      })
    }
    const tween = gsap.to(scrollState, {
      progress: 1,
      ease: 'none',
      onUpdate: apply,
      scrollTrigger: { trigger: '#content', start: 'top top', end: 'bottom bottom', scrub: 1.1 },
    })
    apply()
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [enabled])
}

const MUSIC_VOLUME = 0.16 // background level: present, but well under any other audio on the visitor's machine

/**
 * Optional background music (public/audio/space-ambient.mp3), looped at a low volume.
 * The file is not requested until the visitor turns sound on; it fades in and out
 * rather than cutting, and the same element is reused if sound is toggled again.
 */
export function useAmbientAudio() {
  const audioOn = useStore((s) => s.audioOn)
  useEffect(() => {
    if (!audioOn) return
    const el = (useAmbientAudio.el ??= Object.assign(new Audio(`${import.meta.env.BASE_URL}audio/space-ambient.mp3`), { loop: true, preload: 'auto' }))
    let frame
    const fadeTo = (target, ms, then) => {
      cancelAnimationFrame(frame)
      const from = el.volume
      const start = performance.now()
      const step = (now) => {
        const t = Math.min(1, (now - start) / ms)
        el.volume = from + (target - from) * t
        if (t < 1) frame = requestAnimationFrame(step)
        else then?.()
      }
      frame = requestAnimationFrame(step)
    }
    let on = true
    el.volume = 0
    el.play().then(() => on && fadeTo(MUSIC_VOLUME, 1800)).catch(() => {}) // playback can be refused; the page works the same without it
    return () => {
      on = false
      fadeTo(0, 500, () => el.pause())
    }
  }, [audioOn])
}
