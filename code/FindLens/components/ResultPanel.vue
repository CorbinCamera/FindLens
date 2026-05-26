<template>
  <div class="card">
    <h3>计算结果</h3>
    <div class="result-section">
      <h4>视场角</h4>
      <div class="result-row">
        <span>水平视场角</span>
        <span>{{ store.fov.horizontalFOV.toFixed(2) }}°</span>
      </div>
      <div class="result-row">
        <span>垂直视场角</span>
        <span>{{ store.fov.verticalFOV.toFixed(2) }}°</span>
      </div>
      <div class="result-row">
        <span>对角视场角</span>
        <span>{{ store.fov.diagonalFOV.toFixed(2) }}°</span>
      </div>
    </div>

    <div class="result-section">
      <h4>{{ store.distance }} m 处覆盖范围</h4>
      <div class="result-row">
        <span>水平覆盖</span>
        <span>{{ store.coverage.horizontalRange.toFixed(3) }} m</span>
      </div>
      <div class="result-row">
        <span>垂直覆盖</span>
        <span>{{ store.coverage.verticalRange.toFixed(3) }} m</span>
      </div>
    </div>

    <div class="result-section">
      <h4>人物画面占比</h4>
      <div class="result-row">
        <span>宽度占比</span>
        <span>{{ (store.proportion.widthProportion * 100).toFixed(1) }}%</span>
      </div>
      <div class="result-row">
        <span>高度占比</span>
        <span>{{ (store.proportion.heightProportion * 100).toFixed(1) }}%</span>
      </div>
    </div>

    <div class="result-section" v-if="store.pixelCoverage.widthPixels !== null">
      <h4>像素覆盖</h4>
      <div class="result-row">
        <span>宽度像素</span>
        <span>{{ store.pixelCoverage.widthPixels }} px</span>
      </div>
      <div class="result-row">
        <span>高度像素</span>
        <span>{{ store.pixelCoverage.heightPixels }} px</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLensStore } from '~/stores/lens'
const store = useLensStore()
</script>

<style scoped>
.card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.card h3 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #333;
}
.result-section {
  margin: 8px 0;
  padding: 6px 0;
  border-top: 1px solid #eee;
}
.result-section h4 {
  margin: 0 0 4px;
  font-size: 12px;
  color: #666;
}
.result-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin: 2px 0;
}
.result-row span:first-child { color: #555; }
.result-row span:last-child { font-weight: 600; color: #1a1a2e; }
</style>