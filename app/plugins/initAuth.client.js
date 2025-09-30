export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    const auth = useAuthStore()
    auth.loadFromCookie()
  })
})
