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

/**
 * Optional ambient sound, synthesised with the Web Audio API so there is no audio file to load.
 * Nothing is created until the visitor turns sound on.
 */
export function useAmbientAudio() {
  const audioOn = useStore((s) => s.audioOn)
  useEffect(() => {
    if (!audioOn) return
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)
    master.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 2.5)

    // two slow, slightly detuned drones
    const oscs = [55, 82.6, 110.4].map((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = f
      g.gain.value = [0.5, 0.3, 0.12][i]
      o.connect(g).connect(master)
      o.start()
      return o
    })
    // soft filtered noise, like distant air
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < data.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
      data[i] = last * 3.5
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 420
    noise.connect(filter).connect(master)
    noise.start()

    return () => {
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4)
      setTimeout(() => {
        oscs.forEach((o) => o.stop())
        noise.stop()
        ctx.close()
      }, 500)
    }
  }, [audioOn])
}
