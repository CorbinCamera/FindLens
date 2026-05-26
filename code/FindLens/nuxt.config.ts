import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-26',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  typescript: {
    strict: true,
    typeCheck: false
  },
  vite: {
    ssr: {
      noExternal: ['three']
    }
  }
})