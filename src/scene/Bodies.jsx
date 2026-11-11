import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { HERO_PLANET, LANDING, MOONS, PROJECTS, STATION_POSITION, SUN_DIRECTION } from '../data/content.js'
import { useStore } from '../state.js'

const SUN = new THREE.Vector3(...SUN_DIRECTION).normalize()
const srgb = (t) => {
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
}

const fadeCenter = new THREE.Vector3()

/**
 * Fades an object in as the camera approaches: invisible beyond `start`, fully there
 * within `full` (world units). The route is one long corridor, so without this every
 * later stop would already be visible, stacked up behind the current one.
 */
export function useDistanceFade(ref, start, full, center) {
  const last = useRef(-1)
  useFrame(({ camera }) => {
    const obj = ref.current
    if (!obj) return
    if (center) fadeCenter.set(...center)
    else obj.getWorldPosition(fadeCenter)
    const o = THREE.MathUtils.smoothstep(start - camera.position.distanceTo(fadeCenter), 0, start - full)
    obj.visible = o > 0.005
    if (!obj.visible) return (last.current = o)
    // re-apply every visible frame: children (media patch, labels) can mount at any time
    obj.traverse((child) => {
      const m = child.material
      if (!m) return
      if (m.uniforms?.uOpacity) m.uniforms.uOpacity.value = o
      else {
        if (m.userData.baseOpacity === undefined) m.userData.baseOpacity = m.opacity
        if (!m.transparent) {
          m.transparent = true
          m.needsUpdate = true
        }
        m.opacity = m.userData.baseOpacity * o
      }
    })
    last.current = o
  })
}

/**
 * Thin atmosphere: a slightly larger back-faced shell that glows at the limb and
 * only on the sun-facing side. `active` brightens it (used for hover / selection).
 */
export function Atmosphere({ radius, color, scale = 1.07, active = false }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uSun: { value: SUN },
          uEdge: { value: Math.sqrt(1 - 1 / (scale * scale)) },
          uBoost: { value: 1 },
          uOpacity: { value: 1 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vViewNormal;
          varying vec3 vWorldNormal;
          void main() {
            vViewNormal = normalize(normalMatrix * normal);
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform vec3 uSun; uniform float uEdge; uniform float uBoost; uniform float uOpacity;
          varying vec3 vViewNormal; varying vec3 vWorldNormal;
          void main() {
            // 0 at the outer edge of the shell, 1 where it meets the planet's limb
            float d = clamp(-vViewNormal.z / uEdge, 0.0, 1.0);
            float sun = clamp(dot(vWorldNormal, uSun) * 0.9 + 0.5, 0.06, 1.0);
            gl_FragColor = vec4(uColor * pow(d, 2.4) * sun * uBoost * uOpacity, 1.0);
          }`,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    [color, scale],
  )
  useFrame((_, dt) => {
    const u = material.uniforms.uBoost
    u.value += ((active ? 2.4 : 1) - u.value) * Math.min(1, dt * 5)
  })
  return (
    <mesh scale={scale} material={material} raycast={() => null}>
      <sphereGeometry args={[radius, 48, 48]} />
    </mesh>
  )
}

/** The glowing planet the hero drifts toward. */
export function HeroPlanet({ segments }) {
  const ref = useRef()
  const map = useTexture(HERO_PLANET.texture, srgb)
  useFrame((_, dt) => (ref.current.rotation.y += dt * 0.012))
  return (
    <group position={HERO_PLANET.position} rotation={[0.25, 0, 0.12]}>
      <mesh ref={ref}>
        <sphereGeometry args={[HERO_PLANET.radius, segments, segments]} />
        <meshStandardMaterial map={map} roughness={0.95} metalness={0} />
      </mesh>
      <Atmosphere radius={HERO_PLANET.radius} color={HERO_PLANET.atmosphere} />
    </group>
  )
}

/** Orbiting station for the About stop: a slowly turning habitat ring on a truss with solar wings. */
export function Station() {
  const ring = useRef()
  const whole = useRef()
  useDistanceFade(whole, 62, 34)
  useFrame((_, dt) => {
    ring.current.rotation.z += dt * 0.12
    whole.current.rotation.y += dt * 0.02
  })
  const hull = <meshStandardMaterial color="#aeb4bd" roughness={0.55} metalness={0.35} />
  const panel = <meshStandardMaterial color="#12264d" roughness={0.35} metalness={0.5} emissive="#0a1630" emissiveIntensity={0.4} />
  return (
    <group ref={whole} position={STATION_POSITION} rotation={[0.35, 0.7, -0.2]} scale={1.15}>
      {/* truss */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 9, 8]} />
        {hull}
      </mesh>
      {/* solar wings */}
      {[-3.6, 3.6].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 1.25, 0]}>
            <boxGeometry args={[1.5, 2.1, 0.04]} />
            {panel}
          </mesh>
          <mesh position={[0, -1.25, 0]}>
            <boxGeometry args={[1.5, 2.1, 0.04]} />
            {panel}
          </mesh>
        </group>
      ))}
      {/* habitat ring with spokes */}
      <group ref={ring}>
        <mesh>
          <torusGeometry args={[1.7, 0.2, 14, 64]} />
          {hull}
        </mesh>
        {[0, Math.PI / 2].map((r) => (
          <mesh key={r} rotation={[0, 0, r]}>
            <cylinderGeometry args={[0.05, 0.05, 3.4, 6]} />
            {hull}
          </mesh>
        ))}
      </group>
      {/* core module and antenna */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 1.5, 24]} />
        {hull}
      </mesh>
      <mesh position={[0, 0, 1.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.2, 6]} />
        {hull}
      </mesh>
      <mesh position={[0, 0, 1.95]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial color={[1.5, 3.4, 4]} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Moon({ moon }) {
  const ref = useRef()
  const map = useTexture('/textures/moon.jpg', srgb)
  const hover = useStore((s) => s.hover)
  const center = PROJECTS.find((p) => p.id === moon.orbits).position
  useDistanceFade(ref, 92, 56, center)
  useFrame(({ clock }) => {
    const a = clock.elapsedTime * moon.speed + moon.phase
    ref.current.position.set(
      center[0] + Math.cos(a) * moon.distance,
      center[1] + Math.sin(a * 0.7) * moon.distance * 0.25,
      center[2] + Math.sin(a) * moon.distance,
    )
    ref.current.rotation.y = a * 0.6
  })
  return (
    <mesh
      ref={ref}
      onPointerOver={(e) => (e.stopPropagation(), hover(`moon:${moon.name}`))}
      onPointerOut={() => hover(null)}
      onClick={(e) => (e.stopPropagation(), window.open(moon.url, '_blank', 'noopener'))}
    >
      <sphereGeometry args={[moon.radius, 24, 24]} />
      <meshStandardMaterial map={map} roughness={1} />
    </mesh>
  )
}

export function Moons() {
  return MOONS.map((m) => <Moon key={m.name} moon={m} />)
}

/** The world we land on at the end: a large sphere seen from low orbit. */
export function Landing({ mobile }) {
  const map = useTexture(mobile ? '/textures/planet-pricing.jpg' : '/textures/planet-landing.jpg', srgb)
  const ref = useRef()
  const group = useRef()
  useDistanceFade(group, 136, 100)
  useFrame((_, dt) => (ref.current.rotation.y += dt * 0.004))
  return (
    <group ref={group} position={LANDING.position}>
      <mesh ref={ref} rotation={[0.4, 0, 0]}>
        <sphereGeometry args={[LANDING.radius, mobile ? 64 : 128, mobile ? 64 : 128]} />
        <meshStandardMaterial map={map} roughness={0.9} />
      </mesh>
      <Atmosphere radius={LANDING.radius} color={LANDING.atmosphere} scale={1.03} />
    </group>
  )
}
