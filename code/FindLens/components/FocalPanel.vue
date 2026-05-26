<template>
  <div class="card">
    <h3>焦距与计算模式</h3>
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

    <div v-if="store.calculateMode === 'reverse-full'" class="reverse-result">
      <div class="reverse-info">
        要求人物在 {{ store.distance }} m 处完整入镜
      </div>
      <div class="theory-fl">
        理论焦距: <strong>{{ store.reverseTheoryFL.toFixed(1) }} mm</strong>
      </div>
      <div class="recommended-fl">
        推荐标准焦距: <strong>{{ store.recommendation.recommendedFocalLength }} mm</strong>
      </div>
      <div class="fit-status" :class="store.recommendation.canFitFully ? 'fit-yes' : 'fit-no'">
        {{ store.recommendation.canFitFully ? '人物可完整入镜' : '人物可能超出画面' }}
      </div>
    </div>

    <div v-if="store.calculateMode === 'reverse-proportion'" class="reverse-result">
      <div class="field-row">
        <label>期望画面高度占比</label>
        <input type="number" v-model.number="store.reverseProportion" min="0.1" max="1" step="0.01" />
      </div>
      <div class="theory-fl">
        理论焦距: <strong>{{ store.reverseTheoryFL.toFixed(1) }} mm</strong>
      </div>
      <div class="recommended-fl">
        推荐标准焦距: <strong>{{ store.recommendation.recommendedFocalLength }} mm</strong>
      </div>
    </div>

    <div v-if="store.calculateMode !== 'forward'" class="recommendation-detail">
      <table>
        <thead>
          <tr>
            <th>焦距</th>
            <th>水平覆盖</th>
            <th>垂直覆盖</th>
            <th>高度占比</th>
            <th>可完整入镜</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in store.allStandardResults" :key="r.focalLength"
              :class="{ recommended: r.focalLength === store.recommendation.recommendedFocalLength }">
            <td>{{ r.focalLength }} mm</td>
            <td>{{ r.coverage.horizontalRange.toFixed(2) }} m</td>
            <td>{{ r.coverage.verticalRange.toFixed(2) }} m</td>
            <td>{{ (r.proportion.heightProportion * 100).toFixed(1) }}%</td>
            <td>{{ r.canFitFully ? '是' : '否' }}</td>
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
.field-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 6px 0;
  font-size: 13px;
}
.field-row label {
  flex: 0 0 auto;
  margin-right: 8px;
  color: #555;
}
.field-row input, .field-row select {
  width: 120px;
  padding: 4px 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
}
.reverse-result {
  margin-top: 8px;
  padding: 8px;
  background: #f0f7f0;
  border-radius: 4px;
}
.reverse-info, .theory-fl, .recommended-fl {
  font-size: 13px;
  margin: 4px 0;
  color: #333;
}
.fit-status {
  font-size: 13px;
  font-weight: 600;
  margin-top: 4px;
}
.fit-yes { color: #2e7d32; }
.fit-no { color: #c62828; }
.recommendation-detail {
  margin-top: 8px;
  overflow-x: auto;
}
.recommendation-detail table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.recommendation-detail th, .recommendation-detail td {
  border: 1px solid #ddd;
  padding: 3px 6px;
  text-align: center;
}
.recommendation-detail th {
  background: #f5f5f5;
  font-weight: 600;
}
.recommendation-detail tr.recommended {
  background: #e3f2fd;
  font-weight: 600;
}
</style>