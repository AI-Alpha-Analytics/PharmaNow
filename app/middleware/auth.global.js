import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuthStore()

  // Si NO hay token y NO estás en /login → redirige
  if (!auth.token && to.path !== '/login') {
    return navigateTo('/login')
  }

  // Si YA tienes token y estás en /login → mándalo al home
  if (auth.token && to.path === '/login') {
    return navigateTo('/')
  }
})
