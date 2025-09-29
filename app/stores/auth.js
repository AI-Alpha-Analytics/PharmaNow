import { defineStore } from 'pinia'
import { useCookie } from '#app'
import { useApi } from '~/composables/useApi'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
  }),
  actions: {
    async login(email, password) {
      const api = useApi()
      try {
        const response = await api('/auth/login', {
          method: 'POST',
          body: { email, password },
        })

        this.user = response
        this.token = response.token

        const tokenCookie = useCookie('token')
        tokenCookie.value = response.token

        const userCookie = useCookie('user')
        userCookie.value = response
      } catch (error) {
        console.error('❌ Error al iniciar sesión', error)
        throw error
      }
    },
    logout() {
      this.user = null
      this.token = null
      useCookie('token').value = null
      useCookie('user').value = null
    },
    loadFromCookie() {
      const tokenCookie = useCookie('token')
      const userCookie = useCookie('user')
      if (tokenCookie.value) {
        this.token = tokenCookie.value
      }
      if (userCookie.value) {
        this.user = userCookie.value
      }
    },
  },
})
