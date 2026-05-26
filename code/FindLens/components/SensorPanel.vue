<template>
  <div class="card">
    <h3>传感器参数</h3>
    <div class="field-row">
      <label>输入方式</label>
      <select v-model="store.inputMode">
        <option value="pixel">按像元计算</option>
        <option value="manual">手动输入</option>
      </select>
    </div>

    <div v-if="store.inputMode === 'pixel'" class="preset-section">
      <label>预设</label>
      <select v-model="presetIndex" @change="store.selectPreset(presetIndex)">
        <option v-for="(p, i) in presets" :key="i" :value="i">{{ p.name }}</option>
        <option :value="-1">自定义</option>
      </select>
    </div>

    <div v-if="store.inputMode === 'pixel'" class="field-row">
      <label>水平分辨率 (px)</label>
      <input type="number" v-model.number="store.resolutionX" min="1" />
    </div>
    <div v-if="store.inputMode === 'pixel'" class="field-row">
      <label>垂直分辨率 (px)</label>
      <input type="number" v-model.number="store.resolutionY" min="1" />
    </div>
    <div v-if="store.inputMode === 'pixel'" class="field-row">
      <label>像元尺寸 (μm)</label>
      <input type="number" v-model.number="store.pixelSize" min="0.1" step="0.01" />
    </div>

    <div v-if="store.inputMode === 'manual'" class="field-row">
      <label>传感器宽度 (mm)</label>
      <input type="number" v-model.number="store.sensorWidth" min="0.1" step="0.01" />
    </div>
    <div v-if="store.inputMode === 'manual'" class="field-row">
      <label>传感器高度 (mm)</label>
      <input type="number" v-model.number="store.sensorHeight" min="0.1" step="0.01" />
    </div>

    <div class="computed-sensor">
      <span>计算传感器: {{ store.effectiveSensor.width.toFixed(2) }} × {{ store.effectiveSensor.height.toFixed(2) }} mm</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLensStore } from '~/stores/lens'
import { SENSOR_PRESETS } from '~/core/optics'

const store = useLensStore()
const presets = SENSOR_PRESETS
const presetIndex = ref(store.selectedPresetIndex)
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
.preset-section {
  margin: 6px 0;
  font-size: 13px;
}
.preset-section label {
  display: block;
  margin-bottom: 4px;
  color: #555;
}
.preset-section select {
  width: 100%;
  padding: 4px 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
}
.computed-sensor {
  margin-top: 8px;
  padding: 6px 8px;
  background: #e8f4f8;
  border-radius: 4px;
  font-size: 12px;
  color: #0277bd;
}
</style>