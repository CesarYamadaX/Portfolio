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
        return { name: g.name, stars, points, title: toWorld(g.origin[0] + g.title[0], g.origin[1] + g.title[1]) }
      }),
    [],
  )

  return (
    <group ref={root}>
      {groups.map((g) => (
    <group key={g.name}>
      <Line points={g.points} segments color="#bed7f5" transparent opacity={0.4} lineWidth={1.2} />
      {g.stars.map((s) => (
        <mesh key={s.position.join()} position={s.position}>
          <sphereGeometry args={[s.size, 12, 12]} />
          {/* values above 1 so bloom picks the stars up */}
          <meshBasicMaterial color={[2.2, 2.4, 3]} toneMapped={false} />
          {labels && !mobile && s.label && (
            <Html className="star-label" position={[0.25, 0, 0]} zIndexRange={[2, 0]}>
              {s.label}
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
