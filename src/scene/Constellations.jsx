import { useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import { SKILLS, SKILLS_PLANE_Z } from '../data/content.js'
import { scrollState } from '../state.js'

// Layout space (1440x900, y down) -> world units on the constellation plane.
const toWorld = (px, py, depth = 0) => [(px - 720) / 45, (450 - py) / 45, SKILLS_PLANE_Z + depth]

/** One constellation per skill group; each star is a technology. */
export default function Constellations({ mobile }) {
  // HTML labels are only mounted while the camera is around the Skills stop.
  const [labels, setLabels] = useState(false)
  useFrame(() => {
    const show = scrollState.progress > 0.6 && scrollState.progress < 0.9
    if (show !== labels) setLabels(show)
  })

  const groups = useMemo(
    () =>
      SKILLS.map((g, gi) => {
        const stars = g.stars.map(([label, x, y], i) => ({
          label,
          position: toWorld(g.origin[0] + x, g.origin[1] + y, Math.sin(gi * 7 + i * 3) * 1.5),
          size: 0.07 + ((i * 37 + gi * 11) % 5) * 0.012,
        }))
        const points = stars.map((s) => s.position)
        if (g.closed) points.push(points[0])
        return { name: g.name, stars, points, title: toWorld(g.origin[0] + g.title[0], g.origin[1] + g.title[1]) }
      }),
    [],
  )

  return groups.map((g) => (
    <group key={g.name}>
      <Line points={g.points} color="#bed7f5" transparent opacity={0.28} lineWidth={1} />
      {g.stars.map((s) => (
        <mesh key={s.label} position={s.position}>
          <sphereGeometry args={[s.size, 12, 12]} />
          {/* values above 1 so bloom picks the stars up */}
          <meshBasicMaterial color={[2.2, 2.4, 3]} toneMapped={false} />
          {labels && !mobile && (
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
  ))
}
