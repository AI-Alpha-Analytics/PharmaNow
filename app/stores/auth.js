import { defineStore } from 'pinia'
import { useCookie } from '#app'

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

        if ($socketInventario) {
          $socketInventario.io.opts.auth = { token: response.token }

          if ($socketInventario.connected) {
            $socketInventario.disconnect()
          }

          $socketInventario.connect()
        } else {
          console.warn('⚠️ Socket no inicializado aún en login')
        }
      }

      return response
    },

    loadFromCookie() {
      const tokenCookie = useCookie('token')
      const userCookie = useCookie('user')

      if (
        tokenCookie.value &&
        tokenCookie.value !== 'null' &&
        tokenCookie.value !== 'undefined'
      ) {
        this.token = tokenCookie.value
      } else {
        this.token = null
      }

      if (
        userCookie.value &&
        userCookie.value !== 'null' &&
        userCookie.value !== 'undefined'
      ) {
        this.user = userCookie.value
      } else {
        this.user = null
      }

      if (userCookie.value) this.user = userCookie.value

      if (this.token && import.meta.client) {
        const nuxtApp = useNuxtApp()

        if (nuxtApp.$socketInventario) {
          nuxtApp.$socketInventario.io.opts.auth = { token: this.token }

          if (!nuxtApp.$socketInventario.connected) {
            nuxtApp.$socketInventario.connect()
          }
        } else {
          console.warn('⚠️ Socket aún no está inicializado en loadFromCookie')
        }
      }
    },

    logout() {
      this.user = null
      this.token = null

      useCookie('token', { sameSite: 'strict' }).value = undefined
      useCookie('user', { sameSite: 'strict' }).value = undefined

      if (import.meta.client) {
        const { $socketInventario } = useNuxtApp()
        if ($socketInventario?.connected) {
          $socketInventario.disconnect()
        }
      }
    },
  },
})
