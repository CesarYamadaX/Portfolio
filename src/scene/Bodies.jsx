import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import { HERO_PLANET, LANDING, STATION_POSITION, SUN_DIRECTION } from '../data/content.js'

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

/**
 * Orbiting station for the About stop: a textured 3D model (public/models/station.glb)
 * that turns slowly so its solar wings catch the sun.
 */
export function Station() {
  const whole = useRef()
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}models/station.glb`)
  useMemo(() => {
    scene.traverse((child) => {
      if (!child.isMesh) return
      // the scene has no environment map, and fully metallic surfaces would render black without one
      child.material.metalness = 0.3
      child.material.roughness = 0.7
      child.material.metalnessMap = null
      child.material.envMapIntensity = 0
    })
  }, [scene])
  useDistanceFade(whole, 62, 34)
  useFrame((_, dt) => (whole.current.rotation.y += dt * 0.03))
  return (
    <group position={STATION_POSITION} rotation={[0.35, 0, -0.2]}>
      <group ref={whole} rotation={[0, 0.7, 0]}>
        <primitive object={scene} scale={10} />
      </group>
    </group>
  )
}

/** The world we land on at the end: a large sphere seen from low orbit. */
export function Landing({ mobile }) {
  const map = useTexture(`${import.meta.env.BASE_URL}textures/${mobile ? 'planet-pricing' : 'planet-landing'}.jpg`, srgb)
  const ref = useRef()
  const group = useRef()
  useDistanceFade(group, 136, 100)
  useFrame((_, dt) => (ref.current.rotation.y += dt * 0.004))
  return (
    <group ref={group} position={LANDING.position}>
      {/* tip the planet on its side: otherwise its white polar cap is exactly what the camera lands over */}
      <group rotation={[0, 0, Math.PI / 2]}>
        <mesh ref={ref}>
          <sphereGeometry args={[LANDING.radius, mobile ? 64 : 128, mobile ? 64 : 128]} />
          <meshStandardMaterial map={map} roughness={0.9} />
        </mesh>
      </group>
      <Atmosphere radius={LANDING.radius} color="#7fb6e8" scale={1.014} />
    </group>
  )
}
