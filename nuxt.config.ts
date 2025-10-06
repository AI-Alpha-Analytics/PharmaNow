import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@tresjs/nuxt'],
  devtools: { enabled: false },
  tres: {
    // No custom options; remove unknown property
  },
  vite: {
    resolve: {
      alias: {
        three: 'three',
      },
    },
    optimizeDeps: {
      include: ['three'],
    },
  },
  runtimeConfig: {
    public: {
      apiRestUrl: process.env.NUXT_PUBLIC_API_REST_URL,
      apiWsUrl: process.env.NUXT_PUBLIC_API_WS_URL,
    },
  },
})
