<template>
  <div class="card">
    <h3>目标物体与距离</h3>
    <div class="field-row">
      <label>距离 (m)</label>
      <div class="slider-group">
        <input type="range" :min="0.5" :max="50" step="0.1" :value="store.distance"
               @input="store.setDistance(parseFloat(($event.target as HTMLInputElement).value))" />
        <input type="number" :value="store.distance" min="0.5" max="50" step="0.1"
               @input="store.setDistance(parseFloat(($event.target as HTMLInputElement).value))" />
      </div>
    </div>
    <div class="field-row">
      <label>相机高度 (m)</label>
      <input type="number" v-model.number="store.cameraHeight" min="0.1" max="10" step="0.01" />
    </div>
    <div class="field-row">
      <label>身高 (m)</label>
      <input type="number" v-model.number="store.target.height" min="0.1" step="0.01" />
    </div>
    <div class="field-row">
      <label>宽度 (m)</label>
      <input type="number" v-model.number="store.target.width" min="0.1" step="0.01" />
    </div>
    <div class="field-row">
      <label>厚度 (m)</label>
      <input type="number" v-model.number="store.target.depth" min="0.1" step="0.01" />
    </div>
    <button class="reset-btn" @click="store.setTargetFromPreset()">重置为默认成年人</button>
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
.field-row input[type="number"] {
  width: 80px;
  padding: 4px 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
}
.slider-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.slider-group input[type="range"] {
  width: 100px;
}
.reset-btn {
  margin-top: 8px;
  padding: 4px 12px;
  background: #e0e0e0;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}
.reset-btn:hover {
  background: #d0d0d0;
}
</style>