import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor, useProgress, useTexture } from '@react-three/drei'
import { Bloom, EffectComposer, GodRays, Noise, Vignette } from '@react-three/postprocessing'
import { PROJECTS, PROJECT_VIEW, SUN_DIRECTION, WAYPOINTS } from '../data/content.js'
import { scrollState, useStore } from '../state.js'
import { HeroPlanet, Landing, Moons, Station } from './Bodies.jsx'
import ProjectPlanet from './ProjectPlanet.jsx'
import Constellations from './Constellations.jsx'

const SUN = new THREE.Vector3(...SUN_DIRECTION).normalize()
const lookTarget = new THREE.Vector3(...WAYPOINTS[0].look)

/** Milky Way backdrop: one image on a huge inside-out sphere that follows the camera. */
function Sky() {
  const ref = useRef()
  const map = useTexture('/textures/sky.jpg', (t) => {
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = THREE.MirroredRepeatWrapping // mirror so the image has no visible seam
    t.repeat.set(2, 1)
  })
  useFrame(({ camera }) => ref.current.position.copy(camera.position))
  return (
    <mesh ref={ref} rotation={[0.3, 1.2, 0.2]} renderOrder={-10}>
      <sphereGeometry args={[2400, 48, 32]} />
      <meshBasicMaterial map={map} side={THREE.BackSide} depthWrite={false} toneMapped={false} color="#c8ccd6" />
    </mesh>
  )
}

/** Foreground stars scattered along the route; they give parallax as the camera travels. */
function Stars({ count }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const warm = new THREE.Color('#ffd9b0')
    const cool = new THREE.Color('#bcd4ff')
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      // a wide tube around the flight path, hollow in the middle so stars never hit the camera
      const angle = Math.random() * Math.PI * 2
      const radius = 40 + Math.random() ** 0.7 * 420
      positions.set([Math.cos(angle) * radius, Math.sin(angle) * radius, 150 - Math.random() * 700], i * 3)
      c.copy(warm).lerp(cool, Math.random()).multiplyScalar(0.35 + Math.random() ** 3 * 1.6)
      colors.set([c.r, c.g, c.b], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return g
  }, [count])
  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial size={1.6} sizeAttenuation={false} vertexColors transparent depthWrite={false} toneMapped={false} />
    </points>
  )
}

/** The visible sun disc. It is "infinitely" far, so it follows the camera; god rays radiate from it. */
function Sun({ onReady }) {
  const ref = useRef()
  useEffect(() => onReady(ref.current), [onReady])
  useFrame(({ camera }) => ref.current.position.copy(camera.position).addScaledVector(SUN, 1500))
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[20, 24, 24]} />
      {/* god rays need a transparent material that does not write depth */}
      <meshBasicMaterial color={[6, 5.4, 4.6]} toneMapped={false} transparent depthWrite={false} />
    </mesh>
  )
}

const positionCurve = new THREE.CatmullRomCurve3(WAYPOINTS.map((w) => new THREE.Vector3(...w.pos)), false, 'catmullrom', 0.35)
const lookCurve = new THREE.CatmullRomCurve3(WAYPOINTS.map((w) => new THREE.Vector3(...w.look)), false, 'catmullrom', 0.35)
const UP = new THREE.Vector3(0, 1, 0)
const view = new THREE.Vector3(...PROJECT_VIEW)

/**
 * Camera rig. Scroll progress picks a point on the route; the camera eases toward it
 * every frame, so movement is always smooth. Selecting a project overrides the route
 * and flies in until the planet's media fills most of the view.
 */
function CameraRig({ mobile }) {
  const selected = useStore((s) => s.selected)
  const started = useRef(false)
  const goal = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), dir: new THREE.Vector3(), side: new THREE.Vector3() }), [])

  useFrame(({ camera, clock }, dt) => {
    const p = THREE.MathUtils.clamp(scrollState.progress, 0, 1)
    positionCurve.getPoint(p, goal.pos)
    lookCurve.getPoint(p, goal.look)
    // slow idle drift so the scene never feels frozen
    goal.pos.x += Math.sin(clock.elapsedTime * 0.13) * 0.35
    goal.pos.y += Math.cos(clock.elapsedTime * 0.11) * 0.25

    const project = selected && PROJECTS.find((x) => x.id === selected)
    if (project) {
      const r = project.radius
      goal.look.set(...project.position)
      goal.dir.copy(view).sub(goal.look).normalize() // from the planet toward its media side
      goal.side.crossVectors(UP, goal.dir).normalize()
      if (mobile) {
        // planet in the upper part of the screen, details sheet below
        goal.look.addScaledVector(UP, -r * 0.9)
        goal.pos.copy(goal.look).addScaledVector(goal.dir, r * 3.8)
      } else {
        // planet on the left, details panel on the right
        goal.look.addScaledVector(goal.side, r * 0.85)
        goal.pos.copy(goal.look).addScaledVector(goal.dir, r * 3.0)
      }
    }

    const k = started.current ? 1 - Math.exp(-dt * (project ? 2.4 : 3)) : 1
    started.current = true
    camera.position.lerp(goal.pos, k)
    lookTarget.lerp(goal.look, k)
    camera.lookAt(lookTarget)
  })
  return null
}

/** Bloom, film grain, vignette everywhere; god rays on desktop only. */
function Effects({ mobile, sun }) {
  if (mobile) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.6} luminanceThreshold={0.8} mipmapBlur />
        <Noise opacity={0.04} />
        <Vignette offset={0.25} darkness={0.7} />
      </EffectComposer>
    )
  }
  return (
    <EffectComposer multisampling={0}>
      {sun && <GodRays sun={sun} samples={48} density={0.94} decay={0.93} weight={0.5} exposure={0.4} clampMax={1} blur />}
      <Bloom intensity={0.8} luminanceThreshold={0.78} luminanceSmoothing={0.15} mipmapBlur />
      <Noise opacity={0.045} />
      <Vignette offset={0.25} darkness={0.75} />
    </EffectComposer>
  )
}

/** Reports texture loading to the HTML loading screen. */
function LoadingBridge() {
  const { progress, active } = useProgress()
  const setLoading = useStore((s) => s.setLoading)
  useEffect(() => {
    setLoading({ progress, done: !active && progress >= 100 })
  }, [progress, active, setLoading])
  return null
}

export default function Experience({ mobile, media }) {
  const [dpr, setDpr] = useState(mobile ? 1.5 : 2)
  const [sun, setSun] = useState(null)
  const onSun = useCallback((m) => setSun(m), [])
  const segments = mobile ? 48 : 96
  const hover = useStore((s) => s.hover)

  return (
    <Canvas
      dpr={[1, dpr]}
      camera={{ fov: 45, near: 0.1, far: 5000, position: WAYPOINTS[0].pos }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onPointerMissed={() => hover(null)}
    >
      <color attach="background" args={['#03060d']} />
      {/* drop resolution if the frame rate cannot hold, to stay near 60 fps */}
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(mobile ? 1.5 : 2)} />
      <LoadingBridge />

      <ambientLight intensity={0.07} />
      <directionalLight position={SUN.clone().multiplyScalar(100)} intensity={3.4} color="#fff3e2" />
      {/* faint cool fill, standing in for light scattered by the nebula */}
      <directionalLight position={[40, 15, 80]} intensity={0.45} color="#8fb4ff" />

      {/* soft local fill at the About stop, so the back-lit station keeps some detail */}
      <pointLight position={[6, -3, -48]} intensity={1.3} decay={0} distance={55} color="#cfe0ff" />

      <Suspense fallback={null}>
        <Sky />
        <Stars count={mobile ? 1500 : 6000} />
        <Sun onReady={onSun} />
        <HeroPlanet segments={segments} />
        <Station />
        {PROJECTS.map((p) => (
          <ProjectPlanet key={p.id} project={p} items={media[p.id] || []} mobile={mobile} segments={segments} />
        ))}
        <Moons />
        {/* on phones the skills are an HTML list; the 3D chart would sit right under the text */}
        {!mobile && <Constellations mobile={mobile} />}
        <Landing mobile={mobile} />
        <Effects mobile={mobile} sun={sun} />
      </Suspense>
      <CameraRig mobile={mobile} />
    </Canvas>
  )
}
