<template>
  <div class="sensor-panel">
    <div class="field-row">
      <label>输入方式</label>
      <select v-model="store.inputMode">
        <option value="pixel">按像元计算</option>
        <option value="manual">手动输入</option>
      </select>
    </div>

    <div v-if="store.inputMode === 'pixel'" class="field-row">
      <label>预设</label>
      <select v-model="presetIndex" @change="store.selectPreset(presetIndex)">
        <option v-for="(p, i) in presets" :key="i" :value="i">{{ p.name }}</option>
        <option :value="-1">自定义</option>
      </select>
    </div>

    <div v-if="store.inputMode === 'pixel'" class="field-group">
      <div class="compact-row">
        <label>分辨率</label>
        <span class="inline-inputs">
          <input type="number" v-model.number="store.resolutionX" min="1" placeholder="宽" />
          ×
          <input type="number" v-model.number="store.resolutionY" min="1" placeholder="高" />
          px
        </span>
      </div>
      <div class="compact-row">
        <label>像元尺寸</label>
        <span class="inline-inputs">
          <input type="number" v-model.number="store.pixelSize" min="0.1" step="0.01" />
          μm
        </span>
      </div>
    </div>

    <div v-if="store.inputMode === 'manual'" class="field-group">
      <div class="compact-row">
        <label>传感器</label>
        <span class="inline-inputs">
          <input type="number" v-model.number="store.sensorWidth" min="0.1" step="0.01" />
          ×
          <input type="number" v-model.number="store.sensorHeight" min="0.1" step="0.01" />
          mm
        </span>
      </div>
    </div>

    <div class="computed-info">
      {{ store.effectiveSensor.width.toFixed(2) }} × {{ store.effectiveSensor.height.toFixed(2) }} mm
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
.sensor-panel {
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
.field-row select {
  width: 140px;
  padding: 3px 5px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 12px;
}
.field-group {
  margin-top: 4px;
}
.compact-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 3px 0;
}
.compact-row label {
  color: #666;
  font-size: 12px;
  flex-shrink: 0;
  margin-right: 6px;
}
.inline-inputs {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #888;
}
.inline-inputs input[type="number"] {
  width: 55px;
  padding: 2px 4px;
  border: 1px solid #d0d0d0;
  border-radius: 3px;
  font-size: 12px;
  text-align: center;
}
.computed-info {
  margin-top: 6px;
  padding: 4px 8px;
  background: #e8f0f8;
  border-radius: 4px;
  font-size: 12px;
  color: #0277bd;
  text-align: center;
}
</style>