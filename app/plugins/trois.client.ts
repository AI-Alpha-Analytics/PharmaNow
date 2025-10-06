import { defineNuxtPlugin } from '#app'
import Tres from '@tresjs/core'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Tres)
})
