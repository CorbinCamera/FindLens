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

const store = useLensStore()
const canvasContainer = ref<HTMLDivElement | null>(null)

const heightPercent = computed(() => Math.min(store.proportion.heightProportion * 100, 100))
const widthPercent = computed(() => Math.min(store.proportion.widthProportion * 100, 100))
const isFullyInView = computed(() =>
  store.proportion.heightProportion <= 1 && store.proportion.widthProportion <= 1
)

let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null

function drawPreview() {
  if (!canvas || !ctx) return

  const w = canvas.width
  const h = canvas.height
  const proportion = store.proportion

  ctx.clearRect(0, 0, w, h)

  // Background - simulates what camera sees (sky/ground)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6)
  skyGrad.addColorStop(0, '#b3d9ff')
  skyGrad.addColorStop(1, '#e6f2ff')
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, w, h)

  // Ground
  const groundGrad = ctx.createLinearGradient(0, h * 0.6, 0, h)
  groundGrad.addColorStop(0, '#c8d8c0')
  groundGrad.addColorStop(1, '#90a880')
  ctx.fillStyle = groundGrad
  ctx.fillRect(0, h * 0.6, w, h * 0.4)

  // Grid lines on ground
  ctx.strokeStyle = 'rgba(100,120,80,0.2)'
  ctx.lineWidth = 1
  for (let i = 0; i < 10; i++) {
    const y = h * 0.6 + i * (h * 0.04)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  // Calculate person position in frame
  const personH = proportion.heightProportion * h
  const personW = proportion.widthProportion * w

  // Person drawn from bottom center
  const personBottom = h * 0.85 // Person stands on ground line
  const personTop = personBottom - personH
  const personLeft = (w - personW) / 2

  // Person fill
  const inFrame = proportion.heightProportion <= 1 && proportion.widthProportion <= 1
  ctx.fillStyle = inFrame ? 'rgba(33, 150, 243, 0.7)' : 'rgba(244, 67, 54, 0.7)'
  ctx.fillRect(personLeft, personTop, personW, personH)

  // Person outline
  ctx.strokeStyle = inFrame ? '#1565C0' : '#C62828'
  ctx.lineWidth = 2
  ctx.strokeRect(personLeft, personTop, personW, personH)

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

  // Labels
  ctx.fillStyle = '#333'
  ctx.font = '12px monospace'
  ctx.textAlign = 'left'
  ctx.fillText(`焦距: ${store.focalLength} mm`, 8, 18)
  ctx.fillText(`距离: ${store.distance} m`, 8, 34)
  ctx.fillText(`H FOV: ${store.fov.horizontalFOV.toFixed(1)}°`, 8, 50)
  ctx.fillText(`V FOV: ${store.fov.verticalFOV.toFixed(1)}°`, 8, 66)
}

function initCanvas() {
  if (!canvasContainer.value) return
  canvas = document.createElement('canvas')
  canvas.width = 340
  canvas.height = 260
  canvas.style.width = '100%'
  canvas.style.borderRadius = '4px'
  ctx = canvas.getContext('2d')
  canvasContainer.value.appendChild(canvas)
  drawPreview()
}

watch(() => [
  store.proportion.heightProportion,
  store.proportion.widthProportion,
  store.focalLength,
  store.distance,
  store.fov.horizontalFOV,
  store.fov.verticalFOV
], () => {
  drawPreview()
})

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