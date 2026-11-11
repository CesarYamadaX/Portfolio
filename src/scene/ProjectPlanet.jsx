import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { PROJECT_VIEW } from '../data/content.js'
import { useStore } from '../state.js'
import { Atmosphere, useDistanceFade } from './Bodies.jsx'

/** A project planet: its own surface only. The project's media lives in the detail panel. */
export default function ProjectPlanet({ project, segments }) {
  const group = useRef()
  const selected = useStore((s) => s.selected === project.id)
  const hovered = useStore((s) => s.hovered === project.id)
  const hover = useStore((s) => s.hover)
  const select = useStore((s) => s.select)
  useDistanceFade(group, 92, 56)

  const base = useTexture(project.texture, (t) => {
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
  })
  const r = project.radius

  // Keep the same face toward the Projects camera stop.
  useLayoutEffect(() => group.current.lookAt(...PROJECT_VIEW), [])

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
      <Atmosphere radius={r} color={project.atmosphere} active={hovered || selected} />
    </group>
  )
}
