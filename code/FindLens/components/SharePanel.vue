<template>
  <div class="share-bar">
    <button @click="copyUrl" class="share-btn">复制分享链接</button>
    <span v-if="copied" class="copied-msg">已复制!</span>
  </div>
</template>

<script setup lang="ts">
import { useLensStore } from '~/stores/lens'
const store = useLensStore()
const copied = ref(false)

const copyUrl = async () => {
  const url = window.location.origin + window.location.pathname + store.shareUrl
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    const input = document.createElement('input')
    input.value = url
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>

<style scoped>
.share-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}
.share-btn {
  padding: 6px 16px;
  background: #1a1a2e;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}
.share-btn:hover {
  background: #2a2a4e;
}
.copied-msg {
  color: #2e7d32;
  font-size: 13px;
}
</style>