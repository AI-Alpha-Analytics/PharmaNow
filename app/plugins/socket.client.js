import { io } from 'socket.io-client'
import { watch } from 'vue'
import { useAuthStore } from '~/stores/auth'

const sanitizeToken = (value) => {
  if (!value) return null
  if (value === 'null' || value === 'undefined') return null
  return value
}

export default defineNuxtPlugin((nuxtApp) => {
  if (!process.client) {
    return
  }

  const config = useRuntimeConfig()
  const auth = useAuthStore(nuxtApp.$pinia)
  const tokenCookie = useCookie('token')

  const socket = io(`${config.public.apiWsUrl}/inventario`, {
    transports: ['websocket'],
    autoConnect: false,
  })

  const syncSocket = () => {
    const token = sanitizeToken(auth.token) ?? sanitizeToken(tokenCookie.value)
    socket.auth = token ? { token } : {}

    if (token) {
      if (!socket.connected) {
        socket.connect()
      }
    } else if (socket.connected) {
      socket.disconnect()
    }
  }

  watch(
    () => [auth.token, tokenCookie.value],
    syncSocket,
    { immediate: true }
  )

  socket.on('connect', () => {
    console.log('Socket conectado con id:', socket.id)
  })

  socket.on('disconnect', (reason) => {
    console.warn('Socket desconectado:', reason)
  })

  socket.on('connect_error', (err) => {
    console.error('Error de conexion:', err.message)
  })

  nuxtApp.provide('socketInventario', socket)
})

