<template>
  <div class="preview-container">
    <div class="preview-header">
      <h3>镜头画面预览</h3>
      <span class="preview-info">焦距 {{ store.focalLength }} mm</span>
    </div>
    <div ref="canvasContainer" class="preview-canvas"></div>
    <div class="preview-overlay">
      <div class="proportion-bar">
        <div class="proportion-fill" :style="{ height: heightPercent + '%', width: widthPercent + '%' }">
        </div>
      </div>
      <div class="proportion-labels">
        <span>高度占比: {{ (store.proportion.heightProportion * 100).toFixed(1) }}%</span>
        <span>宽度占比: {{ (store.proportion.widthProportion * 100).toFixed(1) }}%</span>
        <span :class="isFullyInView ? 'fit-yes' : 'fit-no'">
          {{ isFullyInView ? '人物可完整入镜' : '人物超出画面' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLensStore } from '~/stores/lens'
import { computeVerticalFOV, computeHorizontalFOV, deg2rad } from '~/core/optics'

const store = useLensStore()
const canvasContainer = ref<HTMLDivElement | null>(null)

const heightPercent = computed(() => Math.min(store.proportion.heightProportion * 100, 100))
const widthPercent = computed(() => Math.min(store.proportion.widthProportion * 100, 100))

const isFullyInView = computed(() => {
  const camH = store.cameraHeight
  const d = store.distance
  const vFOV = deg2rad(computeVerticalFOV(store.effectiveSensor.height, store.focalLength))
  const hh = Math.tan(vFOV / 2) * d
  const viewBottom = camH - hh
  const viewTop = camH + hh
  return 0 >= viewBottom && store.target.height <= viewTop
})

let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null

function drawPreview() {
  if (!canvas || !ctx) return

  const w = canvas.width
  const h = canvas.height
  const camH = store.cameraHeight
  const d = store.distance
  const targetH = store.target.height
  const targetW = store.target.width
  const vFOV = deg2rad(computeVerticalFOV(store.effectiveSensor.height, store.focalLength))
  const hFOV = deg2rad(computeHorizontalFOV(store.effectiveSensor.width, store.focalLength))
  const hh = Math.tan(vFOV / 2) * d
  const hw = Math.tan(hFOV / 2) * d

  // The camera view covers vertical range [camH - hh, camH + hh] in real world
  const viewBottom = camH - hh
  const viewTop = camH + hh
  const viewRange = 2 * hh

  // Map real Y to canvas Y:
  // canvas_y = h * (1 - (realY - viewBottom) / viewRange)
  // canvas_y = h * (viewTop - realY) / viewRange

  ctx.clearRect(0, 0, w, h)

  // Sky fills entire background first
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h)
  skyGrad.addColorStop(0, '#a8d4ff')
  skyGrad.addColorStop(1, '#d4e8ff')
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, w, h)

  // Ground: ground starts at real Y = 0 (ground level)
  // If ground level is visible, draw ground from its position to canvas bottom
  if (viewBottom < 0) {
    // Ground (Y=0) is above the bottom of frame — part of ground is visible
    const groundY = h * (1 - (0 - viewBottom) / viewRange)
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, h)
    groundGrad.addColorStop(0, '#c8d8c0')
    groundGrad.addColorStop(1, '#90a880')
    ctx.fillStyle = groundGrad
    ctx.fillRect(0, groundY, w, h - groundY)

    // Horizon line
    ctx.strokeStyle = 'rgba(80,100,60,0.4)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, groundY)
    ctx.lineTo(w, groundY)
    ctx.stroke()

    // Ground grid lines
    for (let i = 1; i <= 8; i++) {
      const realY = -i * 0.3 // lines below ground (further away)
      const lineCanvasY = h * (1 - (realY + viewBottom - viewBottom) / viewRange)
      // Actually grid lines going into distance at ground level
    }
  } else {
    // viewBottom >= 0: even the bottom of the frame is above ground
    // This means camera is pointing at sky/above ground level only
    // No ground visible
  }

  // Draw the person at their actual position
  // Person feet at real Y = 0, head at real Y = targetH
  // Person horizontal center at center (real X = 0)
  // Visible width at distance d = 2 * hw

  // Person position in canvas coordinates
  const feetCanvasY = h * (viewTop - 0) / viewRange
  const headCanvasY = h * (viewTop - targetH) / viewRange
  const personCanvasH = feetCanvasY - headCanvasY

  // Person width in canvas: proportion of the frame width
  const personCanvasW = (targetW / (2 * hw)) * w

  const personLeft = (w - personCanvasW) / 2

  // Determine visibility
  const feetVisible = viewBottom <= 0
  const headVisible = viewTop >= targetH

  // Person color based on whether fully visible
  const fullyVisible = feetVisible && headVisible
  ctx.fillStyle = fullyVisible ? 'rgba(33, 150, 243, 0.7)' : 'rgba(244, 67, 54, 0.7)'
  ctx.strokeStyle = fullyVisible ? '#1565C0' : '#C62828'

  // Draw person rectangle (clipped to canvas)
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, w, h)
  ctx.clip()

  ctx.fillRect(personLeft, headCanvasY, personCanvasW, personCanvasH)
  ctx.lineWidth = 2
  ctx.strokeRect(personLeft, headCanvasY, personCanvasW, personCanvasH)

  // Draw a simple person indicator (head circle at top)
  if (personCanvasH > 10 && personCanvasW > 5) {
    const headRadius = Math.min(personCanvasW * 0.2, personCanvasH * 0.06, 8)
    const headCenterY = headCanvasY + headRadius + 2
    const headCenterX = w / 2
    ctx.beginPath()
    ctx.arc(headCenterX, headCenterY, headRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  ctx.restore()

  // Frame border
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 3
  ctx.strokeRect(0, 0, w, h)

  // Crosshair center
  ctx.strokeStyle = 'rgba(255,0,0,0.3)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(w / 2, 0)
  ctx.lineTo(w / 2, h)
  ctx.moveTo(0, h / 2)
  ctx.lineTo(w, h / 2)
  ctx.stroke()
  ctx.setLineDash([])

  // Draw camera height indicator line (optical axis)
  const optAxisY = h * (viewTop - camH) / viewRange
  ctx.strokeStyle = 'rgba(255,165,0,0.4)'
  ctx.lineWidth = 1
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(0, optAxisY)
  ctx.lineTo(w, optAxisY)
  ctx.stroke()
  ctx.setLineDash([])

  // Labels
  ctx.fillStyle = '#333'
  ctx.font = '11px monospace'
  ctx.textAlign = 'left'
  ctx.fillText(`焦距: ${store.focalLength} mm`, 8, 16)
  ctx.fillText(`距离: ${store.distance} m`, 8, 30)
  ctx.fillText(`相机高: ${(store.cameraHeight * 1000).toFixed(0)} mm`, 8, 44)
  ctx.fillText(`H FOV: ${store.fov.horizontalFOV.toFixed(1)}°`, 8, 58)
  ctx.fillText(`V FOV: ${store.fov.verticalFOV.toFixed(1)}°`, 8, 72)

  // Status label
  if (!feetVisible) {
    ctx.fillStyle = '#C62828'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText('▼ 人物下半身被裁切', 8, h - 30)
  }
  if (!headVisible) {
    ctx.fillStyle = '#C62828'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText('▲ 人物头部被裁切', 8, h - 16)
  }
  if (fullyVisible) {
    ctx.fillStyle = '#2e7d32'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText('✓ 人物完整入镜', 8, h - 16)
  }

  // Scale indicator: what the optical axis line means
  ctx.fillStyle = 'rgba(255,165,0,0.6)'
  ctx.font = '9px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('光轴线', w - 6, optAxisY - 3)
}

function initCanvas() {
  if (!canvasContainer.value) return

  // Wait for layout
  nextTick(() => {
    if (!canvasContainer.value) return
    const rect = canvasContainer.value.getBoundingClientRect()
    canvas = document.createElement('canvas')
    canvas.width = Math.max(rect.width - 16, 200) || 340
    canvas.height = Math.max(rect.height - 16, 150) || 260
    canvas.style.width = '100%'
    canvas.style.borderRadius = '4px'
    ctx = canvas.getContext('2d')
    canvasContainer.value.appendChild(canvas)
    drawPreview()
  })
}

watch(() => [
  store.proportion.heightProportion,
  store.proportion.widthProportion,
  store.focalLength,
  store.distance,
  store.fov.horizontalFOV,
  store.fov.verticalFOV,
  store.cameraHeight,
  store.effectiveSensor.width,
  store.effectiveSensor.height
], () => {
  drawPreview()
}, { deep: true })

onMounted(() => {
  initCanvas()
})

onBeforeUnmount(() => {
  if (canvas && canvasContainer.value && canvas.parentNode === canvasContainer.value) {
    canvasContainer.value.removeChild(canvas)
  }
  ctx = null
  canvas = null
})
</script>

<style scoped>
.preview-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a2e;
}
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #2a2a4e;
  color: #fff;
}
.preview-header h3 {
  margin: 0;
  font-size: 14px;
}
.preview-info {
  font-size: 12px;
  color: #aaa;
}
.preview-canvas {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}
.preview-overlay {
  padding: 8px 12px;
  background: #2a2a4e;
}
.proportion-bar {
  width: 100%;
  height: 80px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  position: relative;
  border-radius: 4px;
}
.proportion-fill {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(33, 150, 243, 0.5);
  border: 2px solid rgba(33, 150, 243, 0.8);
  border-radius: 2px;
}
.proportion-labels {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 6px;
  font-size: 12px;
  color: #ccc;
}
.fit-yes { color: #4CAF50; font-weight: 600; }
.fit-no { color: #f44336; font-weight: 600; }
</style>