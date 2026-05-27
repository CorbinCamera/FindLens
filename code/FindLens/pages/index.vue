<template>
  <div class="workspace">
    <header class="workspace-header">
      <h1>FindLens 镜头选型与视场模拟</h1>
    </header>
    <div class="workspace-body">
      <aside class="panel-left">
        <section class="panel-section">
          <div class="section-header" @click="toggle('sensor')">
            <h3>传感器</h3>
            <span class="toggle">{{expanded.sensor ? '▾' : '▸'}}</span>
          </div>
          <div v-show="expanded.sensor" class="section-body">
            <SensorPanel />
          </div>
        </section>

        <section class="panel-section">
          <div class="section-header" @click="toggle('focal')">
            <h3>焦距计算</h3>
            <span class="toggle">{{expanded.focal ? '▾' : '▸'}}</span>
          </div>
          <div v-show="expanded.focal" class="section-body">
            <FocalPanel />
          </div>
        </section>

        <section class="panel-section">
          <div class="section-header" @click="toggle('target')">
            <h3>目标与距离</h3>
            <span class="toggle">{{expanded.target ? '▾' : '▸'}}</span>
          </div>
          <div v-show="expanded.target" class="section-body">
            <TargetPanel />
          </div>
        </section>

        <section class="panel-section">
          <div class="section-header" @click="toggle('result')">
            <h3>计算结果</h3>
            <span class="toggle">{{expanded.result ? '▾' : '▸'}}</span>
          </div>
          <div v-show="expanded.result" class="section-body">
            <ResultPanel />
          </div>
        </section>
      </aside>
      <main class="panel-center">
        <SceneView />
      </main>
      <aside class="panel-right">
        <CameraPreview />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLensStore } from '~/stores/lens'

const store = useLensStore()
onMounted(() => {
  store.loadFromUrl()
})

const expanded = reactive({
  sensor: true,
  focal: true,
  target: true,
  result: true
})

function toggle(key: keyof typeof expanded) {
  expanded[key] = !expanded[key]
}
</script>

<style scoped>
.workspace {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  color: #333;
}
.workspace-header {
  padding: 10px 20px;
  background: #1a1a2e;
  color: #fff;
  flex-shrink: 0;
}
.workspace-header h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.workspace-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.panel-left {
  width: 320px;
  flex-shrink: 0;
  overflow-y: auto;
  background: #fafafa;
  border-right: 1px solid #e0e0e0;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.panel-section {
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}
.section-header:hover {
  background: #f0f0f0;
}
.section-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #444;
}
.toggle {
  font-size: 11px;
  color: #999;
}
.section-body {
  padding: 0 8px 8px;
}
.panel-center {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
  overflow: hidden;
}
.panel-right {
  width: 340px;
  flex-shrink: 0;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
</style>