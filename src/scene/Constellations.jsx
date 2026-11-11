import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import { SKILLS, SKILLS_PLANE_Z } from '../data/content.js'
import { scrollState } from '../state.js'
import { useDistanceFade } from './Bodies.jsx'

// Layout space (1440x900, y down) -> world units on the constellation plane.
const toWorld = (px, py, depth = 0) => [(px - 720) / 45, (450 - py) / 45, SKILLS_PLANE_Z + depth]

/** One constellation per skill group; each star is a technology. */
export default function Constellations({ mobile }) {
  // HTML labels are only mounted while the camera is around the Skills stop.
  const [labels, setLabels] = useState(false)
  // Star names only show for the constellation under the pointer, so the sky stays readable.
  const [hovered, setHovered] = useState(null)
  const root = useRef()
  useDistanceFade(root, 84, 46, [0, 0, SKILLS_PLANE_Z])
  useFrame(() => {
    const show = scrollState.progress > 0.6 && scrollState.progress < 0.9
    if (show !== labels) setLabels(show)
  })

  const groups = useMemo(
    () =>
      SKILLS.map((g, gi) => {
        const stars = g.stars.map(([label, x, y], i) => ({
          label,
          position: toWorld(g.origin[0] + x, g.origin[1] + y, Math.sin(gi * 7 + i * 3) * 0.5),
          // unnamed stars are smaller, so the labelled ones read as the bright ones
          size: label ? 0.07 + ((i * 37 + gi * 11) % 5) * 0.012 : 0.045,
        }))
        // drei's segmented Line takes a flat list of point pairs
        const points = g.lines.flatMap(([a, b]) => [stars[a].position, stars[b].position])
        // an invisible plate behind the figure, a little larger than it, to catch the pointer
        const xs = stars.map((s) => s.position[0])
        const ys = stars.map((s) => s.position[1])
        const pad = 1.1
        const plate = {
          position: [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, SKILLS_PLANE_Z - 1],
          size: [Math.max(...xs) - Math.min(...xs) + pad * 2, Math.max(...ys) - Math.min(...ys) + pad * 2],
        }
        return { name: g.name, stars, points, plate, title: toWorld(g.origin[0] + g.title[0], g.origin[1] + g.title[1]) }
      }),
    [],
  )

  return (
    <group ref={root}>
      {groups.map((g) => (
    <group key={g.name}>
      <mesh position={g.plate.position} onPointerOver={() => setHovered(g.name)} onPointerOut={() => setHovered((h) => (h === g.name ? null : h))}>
        <planeGeometry args={g.plate.size} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Line points={g.points} segments color="#bed7f5" transparent opacity={0.4} lineWidth={hovered === g.name ? 2.2 : 1.2} />
      {g.stars.map((s, i) => (
        <mesh key={s.position.join()} position={s.position}>
          <sphereGeometry args={[s.size, 12, 12]} />
          {/* values above 1 so bloom picks the stars up */}
          <meshBasicMaterial color={[2.2, 2.4, 3]} toneMapped={false} />
          {/* Always mounted near the stop; the inner span carries the animation (drei sets its own
              inline transform on the wrapper), fading each name in one after another (see styles.css). */}
          {labels && !mobile && s.label && (
            <Html className="star-label" position={[0.25, 0, 0]} zIndexRange={[2, 0]}>
              <span className={hovered === g.name ? 'is-on' : undefined} style={{ '--i': i }}>
                {s.label}
              </span>
            </Html>
          )}
        </mesh>
      ))}
      {labels && !mobile && (
        <Html className="constellation-title" position={g.title} center zIndexRange={[2, 0]}>
          {g.name}
        </Html>
      )}
    </group>
      ))}
    </group>
  )
}
