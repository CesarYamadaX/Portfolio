import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { PROJECT_VIEW } from '../data/content.js'
import { useStore } from '../state.js'
import { Atmosphere, useDistanceFade } from './Bodies.jsx'

// The media area is a patch of sphere just above the surface, so the image or video
// curves with the planet. Sized close to 16:10.
const PATCH_W = 2.3 // radians of longitude
const PATCH_H = 1.44 // radians of latitude
const NEAR_DISTANCE = 75 // camera distance under which media is loaded / video plays

// Soft edge for the media patch, so the image melts into the planet instead of ending in a hard rectangle.
const feather = (() => {
  const n = 64
  const data = new Uint8Array(n * n * 4)
  const edge = (t, w) => THREE.MathUtils.smoothstep(Math.min(t, 1 - t), 0, w)
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const a = Math.round(255 * edge((x + 0.5) / n, 0.09) * edge((y + 0.5) / n, 0.14))
      data.set([a, a, a, 255], (y * n + x) * 4)
    }
  const t = new THREE.DataTexture(data, n, n)
  t.magFilter = t.minFilter = THREE.LinearFilter
  t.needsUpdate = true
  return t
})()

/**
 * Lazy media for a planet's face.
 * - The poster (or image) loads the first time the camera gets near.
 * - A video is only created while the camera is near AND video textures are allowed
 *   (desktop); it is paused and released as soon as the planet is left behind.
 */
function useMediaTexture(item, near, allowVideo) {
  const [poster, setPoster] = useState(null)
  const [video, setVideo] = useState(null)
  const still = item ? (item.type === 'video' ? item.poster : item.src) : null

  useEffect(() => {
    if (!still || !near) return
    let alive = true
    new THREE.TextureLoader().load(still, (t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      if (alive) setPoster(t)
      else t.dispose()
    })
    return () => {
      alive = false
    }
  }, [still, near])
  useEffect(() => () => poster?.dispose(), [poster])

  useEffect(() => {
    if (!item || item.type !== 'video' || !near || !allowVideo) return
    const el = document.createElement('video')
    Object.assign(el, { src: item.src, muted: true, loop: true, playsInline: true, preload: 'auto', crossOrigin: 'anonymous' })
    let texture
    const onPlaying = () => {
      texture = new THREE.VideoTexture(el)
      texture.colorSpace = THREE.SRGBColorSpace
      setVideo(texture)
    }
    el.addEventListener('playing', onPlaying, { once: true })
    el.play().catch(() => {}) // autoplay can be refused; the poster simply stays
    return () => {
      el.removeEventListener('playing', onPlaying)
      el.pause()
      el.removeAttribute('src')
      el.load()
      texture?.dispose()
      setVideo(null)
    }
  }, [item, near, allowVideo])

  return video || poster
}

export default function ProjectPlanet({ project, items, mobile, segments }) {
  const group = useRef()
  const patchMaterial = useRef()
  const selected = useStore((s) => s.selected === project.id)
  const hovered = useStore((s) => s.hovered === project.id)
  const mediaIndex = useStore((s) => s.mediaIndex)
  const hover = useStore((s) => s.hover)
  const select = useStore((s) => s.select)
  const [near, setNear] = useState(false)
  useDistanceFade(group, 92, 56)

  const base = useTexture(project.texture, (t) => {
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
  })
  // At rest the planet shows the first item; with the panel open it follows the gallery.
  const item = items.length ? items[selected ? Math.min(mediaIndex, items.length - 1) : 0] : null
  const texture = useMediaTexture(item, near || selected, !mobile)
  const active = hovered || selected
  const r = project.radius

  // Turn the media side toward the Projects camera stop.
  useLayoutEffect(() => group.current.lookAt(...PROJECT_VIEW), [])

  useFrame(({ camera }, dt) => {
    const isNear = camera.position.distanceTo(group.current.position) < NEAR_DISTANCE
    if (isNear !== near) setNear(isNear)
    if (patchMaterial.current) {
      const c = patchMaterial.current.color
      c.setScalar(c.r + ((active ? 1.12 : 0.82) - c.r) * Math.min(1, dt * 5))
    }
  })

  return (
    <group
      ref={group}
      position={project.position}
      onPointerOver={(e) => (e.stopPropagation(), hover(project.id))}
      onPointerOut={() => hover(null)}
      onClick={(e) => (e.stopPropagation(), select(project.id))}
    >
      <mesh>
        <sphereGeometry args={[r, segments, segments]} />
        <meshStandardMaterial map={base} roughness={0.9} />
      </mesh>
      {texture && (
        <mesh>
          {/* +Z is phi = PI/2 on a three.js sphere, so the patch is centred there */}
          <sphereGeometry args={[r * 1.004, 48, 32, Math.PI / 2 - PATCH_W / 2, PATCH_W, Math.PI / 2 - PATCH_H / 2, PATCH_H]} />
          <meshBasicMaterial ref={patchMaterial} key={texture.uuid} map={texture} alphaMap={feather} transparent toneMapped={false} color={[0.82, 0.82, 0.82]} />
        </mesh>
      )}
      <Atmosphere radius={r} color={project.atmosphere} active={active} />
    </group>
  )
}
