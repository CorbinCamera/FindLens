<template>
  <div class="result-panel">
    <div class="result-group">
      <h4>视场角</h4>
      <div class="result-grid">
        <div class="result-item">
          <span class="label">水平</span>
          <span class="value">{{ store.fov.horizontalFOV.toFixed(1) }}°</span>
        </div>
        <div class="result-item">
          <span class="label">垂直</span>
          <span class="value">{{ store.fov.verticalFOV.toFixed(1) }}°</span>
        </div>
        <div class="result-item">
          <span class="label">对角</span>
          <span class="value">{{ store.fov.diagonalFOV.toFixed(1) }}°</span>
        </div>
      </div>
    </div>

    <button class="detail-btn" @click="showDetail = !showDetail">
      {{ showDetail ? '收起' : '详细' }}
    </button>

    <template v-if="showDetail">
      <div class="result-group">
        <h4>{{ store.distance }}m 处覆盖</h4>
        <div class="result-grid">
          <div class="result-item">
            <span class="label">水平</span>
            <span class="value">{{ store.coverage.horizontalRange.toFixed(3) }} m</span>
          </div>
          <div class="result-item">
            <span class="label">垂直</span>
            <span class="value">{{ store.coverage.verticalRange.toFixed(3) }} m</span>
          </div>
        </div>
      </div>

      <div class="result-group">
        <h4>占比</h4>
        <div class="result-grid">
          <div class="result-item">
            <span class="label">宽度</span>
            <span class="value">{{ (store.proportion.widthProportion * 100).toFixed(1) }}%</span>
          </div>
          <div class="result-item">
            <span class="label">高度</span>
            <span :class="['value', store.proportion.heightProportion > 1 ? 'warn' : '']">
              {{ (store.proportion.heightProportion * 100).toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>

      <div v-if="store.pixelCoverage.widthPixels !== null" class="result-group">
        <h4>像素</h4>
        <div class="result-grid">
          <div class="result-item">
            <span class="label">宽</span>
            <span class="value">{{ store.pixelCoverage.widthPixels }} px</span>
          </div>
          <div class="result-item">
            <span class="label">高</span>
            <span class="value">{{ store.pixelCoverage.heightPixels }} px</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useLensStore } from '~/stores/lens'
const store = useLensStore()
const showDetail = ref(false)
</script>

<style scoped>
.result-panel {
  font-size: 13px;
}
.result-group {
  margin: 6px 0;
  padding: 4px 0;
  border-top: 1px solid #eee;
}
.result-group:first-child {
  border-top: none;
  margin-top: 0;
}
.result-group h4 {
  margin: 0 0 4px;
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.result-grid {
  display: flex;
  gap: 12px;
}
.result-item {
  display: flex;
  gap: 4px;
  align-items: baseline;
}
.result-item .label {
  color: #888;
  font-size: 12px;
}
.result-item .value {
  font-weight: 600;
  color: #1a1a2e;
  font-size: 13px;
}
.warn {
  color: #c62828 !important;
}
.detail-btn {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 4px 0;
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 11px;
  color: #666;
  cursor: pointer;
}
.detail-btn:hover {
  background: #f5f5f5;
}
</style>