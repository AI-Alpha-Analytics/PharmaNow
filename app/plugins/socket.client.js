// app/plugins/socket.client.js
import { io } from 'socket.io-client'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  // 👇 aquí recuperamos el token guardado en cookie (si existe)
  const token = process.client ? useCookie('token').value : null

  const socket = io(`${config.public.apiWsUrl}/inventario`, {
    transports: ['websocket'],
    autoConnect: false,
    auth: { token },
  })

  socket.on('connect', () => {
    console.log('✅ Conectado al socket con id:', socket.id)
  })

  socket.on('disconnect', (reason) => {
    console.warn('⚠️ Socket desconectado:', reason)
  })

  socket.on('connect_error', (err) => {
    console.error('❌ Error de conexión:', err.message)
  })

  return {
    provide: {
      socketInventario: socket,
    },
  }
})
