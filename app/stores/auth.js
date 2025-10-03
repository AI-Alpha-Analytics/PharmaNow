import { defineStore } from 'pinia'
import { useCookie } from '#app'

const sanitizeCookieValue = (value) => {
  if (!value) return null
  if (value === 'null' || value === 'undefined') return null
  return value
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
  }),
  actions: {
    async login(email, password) {
      const api = useApi()
      const apiResponse = await api('/auth/login', {
        method: 'POST',
        body: { email, password },
      })

      const response = apiResponse.auth ?? apiResponse

      if (!response?.token) throw new Error('Login fallido')

      this.user = response
      this.token = response.token

      useCookie('token').value = response.token
      useCookie('user').value = response

      if (import.meta.client) {
        const { $socketInventario } = useNuxtApp()
        if ($socketInventario && !$socketInventario.connected) {
          $socketInventario.connect()
        }
      }

      return response
    },

    loadFromCookie() {
      const tokenCookie = useCookie('token')
      const userCookie = useCookie('user')

      const token = sanitizeCookieValue(tokenCookie.value)
      const user = sanitizeCookieValue(userCookie.value)

      this.token = token
      this.user = user
    },

    logout() {
      this.user = null
      this.token = null

      useCookie('token').value = null
      useCookie('user').value = null

      if (import.meta.client) {
        const { $socketInventario } = useNuxtApp()
        if ($socketInventario?.connected) {
          $socketInventario.disconnect()
        }
      }
    },
  },
})

