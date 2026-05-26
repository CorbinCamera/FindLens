<template>
  <div class="focal-panel">
    <div class="field-row">
      <label>计算模式</label>
      <select v-model="store.calculateMode">
        <option value="forward">正向计算</option>
        <option value="reverse-full">反算: 完整入镜</option>
        <option value="reverse-proportion">反算: 指定占比</option>
      </select>
    </div>

    <div v-if="store.calculateMode === 'forward'" class="field-row">
      <label>焦距 (mm)</label>
      <input type="number" v-model.number="store.focalLength" min="1" max="300" step="0.5" />
    </div>

    <div v-if="store.calculateMode !== 'forward'" class="reverse-result">
      <div v-if="store.calculateMode === 'reverse-proportion'" class="field-row">
        <label>期望占比</label>
        <input type="number" v-model.number="store.reverseProportion" min="0.1" max="1" step="0.01" />
      </div>
      <div class="result-highlight">
        <div class="result-line">理论焦距: <strong>{{ store.reverseTheoryFL.toFixed(1) }} mm</strong></div>
        <div class="result-line">推荐: <strong class="accent">{{ store.recommendation.recommendedFocalLength }} mm</strong></div>
        <div :class="['result-status', store.recommendation.canFitFully ? 'ok' : 'warn']">
          {{ store.recommendation.canFitFully ? '✓ 人物可完整入镜' : '✗ 人物可能超出画面' }}
        </div>
      </div>
      <table class="compact-table">
        <thead>
          <tr><th>焦距</th><th>水平</th><th>垂直</th><th>占比</th><th>入镜</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in store.allStandardResults" :key="r.focalLength"
              :class="{ highlight: r.focalLength === store.recommendation.recommendedFocalLength }">
            <td>{{ r.focalLength }}</td>
            <td>{{ r.coverage.horizontalRange.toFixed(2) }}</td>
            <td>{{ r.coverage.verticalRange.toFixed(2) }}</td>
            <td>{{ (r.proportion.heightProportion * 100).toFixed(0) }}%</td>
            <td>{{ r.canFitFully ? '✓' : '✗' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLensStore } from '~/stores/lens'
const store = useLensStore()
</script>

<style scoped>
.focal-panel {
  font-size: 13px;
}
.field-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 4px 0;
}
.field-row label {
  color: #666;
}
.field-row select, .field-row input[type="number"] {
  width: 120px;
  padding: 3px 5px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 12px;
}
.reverse-result {
  margin-top: 6px;
}
.result-highlight {
  background: #f0f7f0;
  border-radius: 4px;
  padding: 6px 8px;
  margin-bottom: 6px;
}
.result-line {
  font-size: 12px;
  margin: 2px 0;
}
.accent {
  color: #1565C0;
  font-size: 13px;
}
.ok { color: #2e7d32; font-weight: 600; font-size: 12px; margin-top: 2px; }
.warn { color: #c62828; font-weight: 600; font-size: 12px; margin-top: 2px; }
.compact-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.compact-table th, .compact-table td {
  border: 1px solid #e0e0e0;
  padding: 2px 4px;
  text-align: center;
}
.compact-table th {
  background: #f5f5f5;
  font-weight: 600;
  font-size: 11px;
}
.highlight {
  background: #e3f2fd;
  font-weight: 600;
}
</style>