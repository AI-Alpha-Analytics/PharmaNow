import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  if (!auth.token) {
    auth.loadFromCookie()
  }

  if (!auth.token && !['/', '/login', '/landing'].includes(to.path)) {
    return navigateTo('/')
  }

  if (auth.token && to.path === '/login') {
    return navigateTo('/home')
  }
})
