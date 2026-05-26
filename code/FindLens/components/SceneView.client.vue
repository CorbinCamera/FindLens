<template>
  <div ref="containerRef" class="scene-container">
    <div class="scene-controls">
      <button @click="resetCamera" title="复位视角">复位</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLensStore } from '~/stores/lens'
import { computeHorizontalFOV, computeVerticalFOV, deg2rad } from '~/core/optics'

const store = useLensStore()
const containerRef = ref<HTMLDivElement | null>(null)

let scene: any = null
let camera: any = null
let renderer: any = null
let frustumMesh: any = null
let crossSectionHelper: any = null
let distanceMarkersGroup: any = null
let personGroup: any = null
let orbitControls: any = null
let animFrameId: number = 0
let THREE: any = null
let resizeObserver: ResizeObserver | null = null

async function createScene() {
  if (!containerRef.value) return

  THREE = await import('three')
  const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
  const { DragControls } = await import('three/examples/jsm/controls/DragControls.js')

  const {
    Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshLambertMaterial,
    Mesh, LineSegments, LineBasicMaterial, Group,
    BufferGeometry, Float32BufferAttribute, PlaneGeometry, MeshBasicMaterial,
    AmbientLight, DirectionalLight, SphereGeometry, GridHelper, DoubleSide, Color
  } = THREE

  const container = containerRef.value

  // Ensure container has dimensions before creating renderer
  let width = container.clientWidth
  let height = container.clientHeight
  if (width === 0 || height === 0) {
    // Fallback: use parent dimensions
    const rect = container.parentElement?.getBoundingClientRect()
    if (rect) {
      width = rect.width
      height = rect.height
    } else {
      width = 800
      height = 400
    }
  }

  scene = new Scene()
  scene.background = new Color(0xfafafa)

  camera = new PerspectiveCamera(50, width / height, 0.1, 200)
  camera.position.set(6, 5, 8)
  camera.lookAt(0, 0, 3)

  renderer = new WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)

  orbitControls = new OrbitControls(camera, renderer.domElement)
  orbitControls.enableDamping = true
  orbitControls.dampingFactor = 0.05
  orbitControls.target.set(0, 1, 3)

  scene.add(new AmbientLight(0xffffff, 0.6))
  const dirLight = new DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(5, 10, 5)
  scene.add(dirLight)

  scene.add(new GridHelper(30, 30, 0xcccccc, 0xe8e8e8))

  const groundMesh = new Mesh(
    new PlaneGeometry(30, 30),
    new MeshBasicMaterial({ visible: false, side: DoubleSide })
  )
  groundMesh.rotation.x = -Math.PI / 2
  scene.add(groundMesh)

  // Camera model
  const camGroup = new Group()
  const lensMesh = new Mesh(new BoxGeometry(0.3, 0.25, 0.5), new MeshLambertMaterial({ color: 0x333366 }))
  lensMesh.position.y = 0.125
  camGroup.add(lensMesh)
  scene.add(camGroup)

  // Person
  personGroup = buildPerson()
  scene.add(personGroup)

  // Distance markers group
  distanceMarkersGroup = new Group()
  scene.add(distanceMarkersGroup)

  refreshScene()

  // Drag controls
  const dragControls = new DragControls([personGroup], camera, renderer.domElement)
  dragControls.addEventListener('dragstart', () => { orbitControls.enabled = false })
  dragControls.addEventListener('drag', (event: any) => {
    const obj = event.object
    obj.position.x = 0
    obj.position.y = 0
    const newDist = Math.max(0.5, Math.min(50, obj.position.z))
    obj.position.z = newDist
    store.setDistance(Math.round(newDist * 10) / 10)
    refreshScene()
  })
  dragControls.addEventListener('dragend', () => { orbitControls.enabled = true })

  // Use ResizeObserver for more reliable container resize detection
  resizeObserver = new ResizeObserver(() => {
    onResize()
  })
  resizeObserver.observe(container)

  function animate() {
    animFrameId = requestAnimationFrame(animate)
    orbitControls.update()
    renderer.render(scene, camera)
  }
  animate()
}

function buildPerson(): any {
  const T = THREE
  const group = new T.Group()
  const bodyMat = new T.MeshLambertMaterial({ color: 0x2196F3 })
  const legMat = new T.MeshLambertMaterial({ color: 0x1565C0 })
  const armMat = new T.MeshLambertMaterial({ color: 0x1976D2 })

  const head = new T.Mesh(new T.SphereGeometry(0.12, 8, 8), bodyMat)
  head.position.y = 1.58
  group.add(head)

  const body = new T.Mesh(new T.BoxGeometry(0.35, 0.55, 0.22), bodyMat)
  body.position.y = 1.15
  group.add(body)

  const leftLeg = new T.Mesh(new T.BoxGeometry(0.14, 0.75, 0.18), legMat)
  leftLeg.position.set(-0.1, 0.375, 0)
  group.add(leftLeg)

  const rightLeg = new T.Mesh(new T.BoxGeometry(0.14, 0.75, 0.18), legMat)
  rightLeg.position.set(0.1, 0.375, 0)
  group.add(rightLeg)

  const leftArm = new T.Mesh(new T.BoxGeometry(0.1, 0.5, 0.1), armMat)
  leftArm.position.set(-0.24, 1.1, 0)
  group.add(leftArm)

  const rightArm = new T.Mesh(new T.BoxGeometry(0.1, 0.5, 0.1), armMat)
  rightArm.position.set(0.24, 1.1, 0)
  group.add(rightArm)

  return group
}

function refreshScene() {
  if (!scene || !THREE) return

  // Remove old frustum
  if (frustumMesh) {
    scene.remove(frustumMesh)
    frustumMesh.geometry.dispose()
    frustumMesh.material.dispose()
  }
  if (crossSectionHelper) {
    scene.remove(crossSectionHelper)
    crossSectionHelper.geometry.dispose()
    crossSectionHelper.material.dispose()
  }

  const s = store.effectiveSensor
  const fl = store.focalLength
  const d = store.distance

  const hFOV = deg2rad(computeHorizontalFOV(s.width, fl))
  const vFOV = deg2rad(computeVerticalFOV(s.height, fl))
  const hw = Math.tan(hFOV / 2) * d
  const hh = Math.tan(vFOV / 2) * d

  const camY = 0.85

  const vertices = [
    0, camY, 0,  hw, camY + hh, d,
    0, camY, 0, -hw, camY + hh, d,
    0, camY, 0,  hw, camY - hh, d,
    0, camY, 0, -hw, camY - hh, d,
    hw,  camY + hh, d, -hw, camY + hh, d,
    -hw, camY + hh, d, -hw, camY - hh, d,
    -hw, camY - hh, d,  hw, camY - hh, d,
    hw,  camY - hh, d,  hw, camY + hh, d,
  ]

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  const mat = new THREE.LineBasicMaterial({ color: 0xff6600 })
  frustumMesh = new THREE.LineSegments(geom, mat)
  scene.add(frustumMesh)

  // Cross section at target distance
  const csVerts = [
    -hw, 0.01, d,  hw, 0.01, d,
    hw, 0.01, d,  hw, 0.01 + 2 * hh, d,
    hw, 0.01 + 2 * hh, d, -hw, 0.01 + 2 * hh, d,
    -hw, 0.01 + 2 * hh, d, -hw, 0.01, d,
  ]
  const csGeom = new THREE.BufferGeometry()
  csGeom.setAttribute('position', new THREE.Float32BufferAttribute(csVerts, 3))
  const csMat = new THREE.LineBasicMaterial({ color: 0xff9900, transparent: true, opacity: 0.5 })
  crossSectionHelper = new THREE.LineSegments(csGeom, csMat)
  scene.add(crossSectionHelper)

  // Update person
  if (personGroup) {
    const scaleY = store.target.height / 1.70
    const scaleX = store.target.width / 0.45
    const scaleZ = store.target.depth / 0.25
    personGroup.scale.set(scaleX, scaleY, scaleZ)
    personGroup.position.set(0, 0, d)
  }

  // Distance markers
  if (distanceMarkersGroup) {
    while (distanceMarkersGroup.children.length > 0) {
      const child = distanceMarkersGroup.children[0]
      distanceMarkersGroup.remove(child)
      if (child.geometry) child.geometry.dispose()
      if (child.material) child.material.dispose()
    }

    const markerGeom = new THREE.BoxGeometry(0.05, 0.02, 0.05)
    const markerMat = new THREE.MeshBasicMaterial({ color: 0x888888 })

    for (const dist of [1, 2, 3, 5, 10, 15, 20, 30, 50]) {
      if (dist > d * 2 + 5) continue
      const marker = new THREE.Mesh(markerGeom, markerMat)
      marker.position.set(0, 0, dist)
      distanceMarkersGroup.add(marker)

      const lineVerts = new Float32Array([-0.5, 0.005, dist, 0.5, 0.005, dist])
      const lineGeom = new THREE.BufferGeometry()
      lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts, 3))
      const lineMat = new THREE.LineBasicMaterial({ color: 0x999999 })
      distanceMarkersGroup.add(new THREE.LineSegments(lineGeom, lineMat))
    }
  }
}

function onResize() {
  if (!containerRef.value || !camera || !renderer) return
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  if (width === 0 || height === 0) return
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function resetCamera() {
  if (!camera || !orbitControls) return
  camera.position.set(6, 5, 8)
  orbitControls.target.set(0, 1, 3)
  orbitControls.update()
}

onMounted(() => {
  // Use nextTick to ensure DOM is laid out before creating 3D scene
  nextTick(() => {
    createScene()
  })
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  cancelAnimationFrame(animFrameId)
  if (renderer) {
    renderer.dispose()
    if (containerRef.value && renderer.domElement.parentNode === containerRef.value) {
      containerRef.value.removeChild(renderer.domElement)
    }
  }
})

watch(() => [
  store.effectiveSensor.width,
  store.effectiveSensor.height,
  store.focalLength,
  store.distance,
  store.target.height,
  store.target.width,
  store.target.depth
], () => {
  refreshScene()
}, { deep: true })
</script>

<style scoped>
.scene-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}
.scene-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}
.scene-controls button {
  padding: 4px 12px;
  background: rgba(255,255,255,0.9);
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.scene-controls button:hover {
  background: #e8e8e8;
}
</style>