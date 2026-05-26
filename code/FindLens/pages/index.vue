<template>
  <div class="workspace">
    <header class="workspace-header">
      <h1>FindLens: 镜头选型与视场模拟</h1>
    </header>
    <div class="workspace-body">
      <aside class="panel-left">
        <SensorPanel />
        <FocalPanel />
        <TargetPanel />
        <ResultPanel />
      </aside>
      <main class="panel-center">
        <SceneView />
      </main>
      <aside class="panel-right">
        <CameraPreview />
      </aside>
    </div>
    <footer class="workspace-footer">
      <SharePanel />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useLensStore } from '~/stores/lens'

const store = useLensStore()
onMounted(() => {
  store.loadFromUrl()
})
</script>

<style scoped>
.workspace {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
.workspace-header {
  padding: 8px 16px;
  background: #1a1a2e;
  color: #fff;
  flex-shrink: 0;
}
.workspace-header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.workspace-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.panel-left {
  width: 340px;
  flex-shrink: 0;
  overflow-y: auto;
  background: #f5f5f5;
  border-right: 1px solid #ddd;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.panel-center {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
  overflow: hidden;
}
.panel-right {
  width: 360px;
  flex-shrink: 0;
  border-left: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.workspace-footer {
  padding: 8px 16px;
  background: #f0f0f0;
  border-top: 1px solid #ddd;
  flex-shrink: 0;
}
</style>