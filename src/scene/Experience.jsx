import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor, useProgress, useTexture } from '@react-three/drei'
import { Bloom, EffectComposer, GodRays, Noise, Vignette } from '@react-three/postprocessing'
import { PROJECT_VIEW, SUN_DIRECTION, WAYPOINTS, projectsFor } from '../data/content.js'
import { scrollState, useStore } from '../state.js'
import { HeroPlanet, Landing, Station } from './Bodies.jsx'
import ProjectPlanet from './ProjectPlanet.jsx'
import Constellations from './Constellations.jsx'

const SUN = new THREE.Vector3(...SUN_DIRECTION).normalize()
const lookTarget = new THREE.Vector3(...WAYPOINTS[0].look)

// Orientation of the whole sky (image + far stars). The inner turn brings the galactic core
// ahead of the flight path, slightly to the right; the outer one tilts the band across the view.
const SKY_TILT = [0.2, 0, -0.5]
const SKY_TURN = [0, Math.PI / 2 - 0.62, 0]

/** Backdrop: black space with only a faint, colourless trace of the galactic band, on a sphere that follows the camera. */
function Sky() {
  const ref = useRef()
  const map = useTexture(`${import.meta.env.BASE_URL}textures/sky.jpg`, (t) => {
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = THREE.RepeatWrapping
    t.anisotropy = 8
  })
  useFrame(({ camera }) => ref.current.position.copy(camera.position))
  return (
    <group ref={ref} rotation={SKY_TILT}>
      <mesh rotation={SKY_TURN} renderOrder={-10}>
        <sphereGeometry args={[2400, 64, 40]} />
        <meshBasicMaterial map={map} side={THREE.BackSide} depthWrite={false} toneMapped={false} color="#5c5c5c" />
      </mesh>
    </group>
  )
}

// Star colours by temperature, from cool red dwarfs to hot blue-white stars (most stars sit in the middle).
const STAR_TINTS = ['#ffb38a', '#ffd2a1', '#fff1dc', '#ffffff', '#dbe7ff', '#b5ccff', '#9db8ff'].map((c) => new THREE.Color(c))

const starMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScale: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aSize; attribute float aPhase;
      uniform float uTime; uniform float uScale;
      varying vec3 vColor; varying float vSize;
      void main() {
        // gentle scintillation, stronger on the brighter stars
        float twinkle = 1.0 + 0.22 * sin(uTime * (0.6 + fract(aPhase * 7.3) * 1.8) + aPhase * 6.2831) * smoothstep(1.2, 3.0, aSize);
        vColor = color * twinkle;
        vSize = aSize;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(aSize * uScale, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor; varying float vSize;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float d = length(p) * 2.0;
        // tight bright core with a soft halo; big stars also get faint diffraction spikes
        float core = exp(-d * d * 9.0);
        float halo = pow(max(1.0 - d, 0.0), 3.0) * 0.35;
        float spikes = (exp(-abs(p.x) * 60.0) + exp(-abs(p.y) * 60.0)) * max(1.0 - d, 0.0) * smoothstep(5.0, 9.0, vSize) * 0.6;
        float a = core + halo + spikes;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor * a, 1.0);
      }`,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  })

/**
 * Stars. Two layers share one draw call:
 * - a far shell that follows the camera, denser along the Milky Way band of the sky image;
 * - nearer stars along the route, which drift past and give parallax as the camera travels.
 * Sizes follow a steep power law (thousands of faint points, a handful of bright ones with halos).
 */
function Stars({ far, near }) {
  const shell = useRef()
  const material = useMemo(starMaterial, [])
  const build = (count, place, sizeBoost) => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      positions.set(place(), i * 3)
      const m = Math.random() ** 12 // "magnitude": almost always near 0, rarely near 1
      sizes[i] = (1.0 + m * 7 + Math.random() * 0.8) * sizeBoost
      // bell-shaped pick, so white and pale yellow dominate
      const t = (Math.random() + Math.random() + Math.random()) / 3
      c.copy(STAR_TINTS[Math.min(STAR_TINTS.length - 1, Math.floor(t * STAR_TINTS.length))])
      c.multiplyScalar(0.3 + Math.random() * 0.55 + m * 2.4) // the brightest go above 1 and bloom
      colors.set([c.r, c.g, c.b], i * 3)
      phases[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    g.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    return g
  }
  const farGeometry = useMemo(
    () =>
      build(
        far,
        () => {
          // 60% hug the galactic plane (the sky sphere's equator), the rest are spread evenly
          const band = Math.random() < 0.6
          const y = band ? THREE.MathUtils.clamp((Math.random() + Math.random() + Math.random() - 1.5) * 0.33, -1, 1) : Math.random() * 2 - 1
          const a = Math.random() * Math.PI * 2
          const r = Math.sqrt(1 - y * y) * 2000
          return [Math.cos(a) * r, y * 2000, Math.sin(a) * r]
        },
        1,
      ),
    [far],
  )
  const nearGeometry = useMemo(
    () =>
      build(
        near,
        () => {
          // a wide tube around the flight path, hollow in the middle so stars never hit the camera
          const a = Math.random() * Math.PI * 2
          const r = 60 + Math.random() ** 0.7 * 420
          return [Math.cos(a) * r, Math.sin(a) * r, 150 - Math.random() * 700]
        },
        1.15,
      ),
    [near],
  )
  useFrame(({ camera, clock, gl }) => {
    shell.current.position.copy(camera.position)
    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uScale.value = gl.getPixelRatio()
  })
  return (
    <>
      <group ref={shell} rotation={SKY_TILT}>
        <points geometry={farGeometry} material={material} rotation={SKY_TURN} frustumCulled={false} renderOrder={-9} />
      </group>
      <points geometry={nearGeometry} material={material} frustumCulled={false} />
    </>
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
 * and flies in until the planet fills most of the view.
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

    const project = selected && projectsFor(mobile).find((x) => x.id === selected)
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

export default function Experience({ mobile }) {
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
      <color attach="background" args={["#010204"]} />
      {/* drop resolution if the frame rate cannot hold, to stay near 60 fps */}
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(mobile ? 1.5 : 2)} />
      <LoadingBridge />

      <ambientLight intensity={0.22} />
      <directionalLight position={SUN.clone().multiplyScalar(100)} intensity={3.4} color="#fff3e2" />
      {/* faint cool fill, standing in for light scattered by the nebula */}
      <directionalLight position={[40, 15, 80]} intensity={1.0} color="#8fb4ff" />

      {/* soft local fill at the About stop, so the back-lit station keeps some detail */}
      <pointLight position={[6, -3, -48]} intensity={1.3} decay={0} distance={55} color="#cfe0ff" />

      <Suspense fallback={null}>
        <Sky />
        <Stars far={mobile ? 3500 : 9000} near={mobile ? 500 : 1400} />
        <Sun onReady={onSun} />
        <HeroPlanet segments={segments} />
        <Station />
        {projectsFor(mobile).map((p) => (
          <ProjectPlanet key={p.id} project={p} segments={segments} />
        ))}
        {/* on phones the skills are an HTML list; the 3D chart would sit right under the text */}
        {!mobile && <Constellations mobile={mobile} />}
        <Landing mobile={mobile} />
        <Effects mobile={mobile} sun={sun} />
      </Suspense>
      <CameraRig mobile={mobile} />
    </Canvas>
  )
}
