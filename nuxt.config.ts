import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  typescript: {
    tsConfig: {
      compilerOptions: {
        types: ['node'],
      },
    },
  },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  runtimeConfig: {
    public: {
      apiRestUrl: process.env.NUXT_PUBLIC_API_REST_URL,
      apiWsUrl: process.env.NUXT_PUBLIC_API_WS_URL,
    },
  },
})
