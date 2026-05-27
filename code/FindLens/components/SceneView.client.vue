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
let personDragProxy: any = null
let cameraModelGroup: any = null
let orbitControls: any = null
let animFrameId: number = 0
let THREE: any = null
let resizeObserver: ResizeObserver | null = null

async function createScene() {
  if (!containerRef.value) return

  try {
  THREE = await import('three')
  const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
  const { DragControls } = await import('three/examples/jsm/controls/DragControls.js')

  const {
    Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry,
    MeshLambertMaterial, Mesh, LineSegments, LineBasicMaterial, Group,
    BufferGeometry, Float32BufferAttribute, PlaneGeometry, MeshBasicMaterial,
    AmbientLight, DirectionalLight, SphereGeometry, GridHelper, DoubleSide, Color
  } = THREE

  const container = containerRef.value

  let width = container.clientWidth
  let height = container.clientHeight
  if (width === 0 || height === 0) {
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

  // Camera model group (will be updated dynamically)
  cameraModelGroup = new Group()
  const lensBody = new Mesh(new BoxGeometry(0.2, 0.15, 0.35), new MeshLambertMaterial({ color: 0x333366 }))
  lensBody.position.z = 0.15
  const lensFront = new Mesh(new BoxGeometry(0.12, 0.12, 0.1), new MeshLambertMaterial({ color: 0x222255 }))
  lensFront.position.z = 0.35
  cameraModelGroup.add(lensBody)
  cameraModelGroup.add(lensFront)
  scene.add(cameraModelGroup)

  personGroup = buildPerson()
  scene.add(personGroup)

  personDragProxy = new Mesh(
    new BoxGeometry(0.6, 1.8, 0.4),
    new MeshBasicMaterial({ visible: false })
  )
  personDragProxy.position.set(0, 0.9, store.distance)
  scene.add(personDragProxy)

  distanceMarkersGroup = new Group()
  scene.add(distanceMarkersGroup)

  refreshScene()

  const dragControls = new DragControls([personDragProxy], camera, renderer.domElement)
  dragControls.addEventListener('dragstart', () => { orbitControls.enabled = false })
  dragControls.addEventListener('drag', (event: any) => {
    const obj = event.object
    obj.position.x = 0
    obj.position.y = store.target.height / 2
    const newDist = Math.max(0.5, Math.min(50, obj.position.z))
    obj.position.z = newDist
    store.setDistance(Math.round(newDist * 10) / 10)
    refreshScene()
  })
  dragControls.addEventListener('dragend', () => { orbitControls.enabled = true })

  resizeObserver = new ResizeObserver(() => { onResize() })
  resizeObserver.observe(container)

  function animate() {
    animFrameId = requestAnimationFrame(animate)
    orbitControls.update()
    renderer.render(scene, camera)
  }
  animate()
  } catch (e) {
    console.error('[SceneView] createScene error:', e)
  }
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
  const camH = store.cameraHeight
  const pitchDeg = store.cameraPitch
  const pitchRad = deg2rad(pitchDeg)

  const hFOV = deg2rad(computeHorizontalFOV(s.width, fl))
  const vFOV = deg2rad(computeVerticalFOV(s.height, fl))
  const halfH = Math.tan(hFOV / 2) * d
  const halfV = Math.tan(vFOV / 2) * d

  // Update camera model position and rotation
  if (cameraModelGroup) {
    cameraModelGroup.position.set(0, camH, 0)
    cameraModelGroup.rotation.x = -pitchRad
  }

  // Frustum vertices: from camera origin at (0, camH, 0), looking along +Z with pitch
  // The frustum center direction is (0, sin(pitch), cos(pitch))
  // At distance d, the center point is (0, camH + d*sin(pitch), d*cos(pitch))
  // But we draw in a simplified way: the frustum is rotated around the camera point

  // Frustum: camera at (0, camH, 0), center ray goes at pitch angle
  // We build the frustum by rotating the endpoints
  const sinP = Math.sin(pitchRad)
  const cosP = Math.cos(pitchRad)

  // Top and bottom of FOV at distance d (in camera-local coords, before pitch rotation):
  // Local up direction at the far plane: the vertical extent is halfV
  // The center of the far plane in world coords:
  const cx = 0
  const cy = camH + d * sinP
  const cz = d * cosP

  // The up direction of the camera (rotated by pitch): (0, cosP, -sinP)
  // The right direction: (1, 0, 0)
  // Far plane corners in world coords:
  // top-center: center + halfV * up = (cx, cy + halfV*cosP, cz - halfV*sinP)
  // bottom-center: center - halfV * up = (cx, cy - halfV*cosP, cz + halfV*sinP)
  const topY = cy + halfV * cosP
  const topZ = cz - halfV * sinP
  const bottomY = cy - halfV * cosP
  const bottomZ = cz + halfV * sinP

  const vertices = [
    // 4 edges from camera to far plane corners
    0, camH, 0,   halfH, topY, topZ,
    0, camH, 0,  -halfH, topY, topZ,
    0, camH, 0,   halfH, bottomY, bottomZ,
    0, camH, 0,  -halfH, bottomY, bottomZ,
    // Top rectangle
    halfH, topY, topZ,  -halfH, topY, topZ,
    -halfH, topY, topZ, -halfH, bottomY, bottomZ,
    -halfH, bottomY, bottomZ, halfH, bottomY, bottomZ,
    halfH, bottomY, bottomZ, halfH, topY, topZ,
  ]

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  const mat = new THREE.LineBasicMaterial({ color: 0xff6600 })
  frustumMesh = new THREE.LineSegments(geom, mat)
  scene.add(frustumMesh)

  // Cross-section rectangle: shows the visible vertical range at the person's distance
  // View center at distance d: camH + d*sin(pitch)
  // View top: viewCenterY + halfV*cos(pitch)
  // View bottom: viewCenterY - halfV*cos(pitch)
  const viewCenterY = camH + d * sinP
  const csTop = viewCenterY + halfV * cosP
  const csBottom = viewCenterY - halfV * cosP
  const simpleCsVerts = new Float32Array([
    -halfH, csTop, d,  halfH, csTop, d,
    halfH, csTop, d,  halfH, csBottom, d,
    halfH, csBottom, d, -halfH, csBottom, d,
    -halfH, csBottom, d, -halfH, csTop, d,
  ])
  const csGeom = new THREE.BufferGeometry()
  csGeom.setAttribute('position', new THREE.Float32BufferAttribute(simpleCsVerts, 3))
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

  if (personDragProxy) {
    personDragProxy.position.set(0, store.target.height / 2, d)
    personDragProxy.scale.set(store.target.width / 0.45, store.target.height / 1.70, 1)
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
  orbitControls.target.set(0, store.cameraHeight, 3)
  orbitControls.update()
}

onMounted(() => {
  nextTick(() => { createScene() })
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
  store.target.depth,
  store.cameraHeight,
  store.cameraPitch
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