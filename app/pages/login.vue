<template>
  <div
    class="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-blue-50 to-indigo-200 overflow-hidden"
  >
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
      <!-- Logo + Título -->
      <div class="text-center mb-6">
        <img
          src="/PharmaNow.png"
          alt="PharmaNow logo"
          class="h-20 w-20 mx-auto object-contain rounded-full border-4 border-indigo-200 shadow-md"
        />
        <h1 class="mt-4 text-2xl font-extrabold text-indigo-700">
          Bienvenido a PharmaNow
        </h1>
        <p class="text-gray-500 text-sm mt-1">
          Inicia sesión para gestionar tu inventario
        </p>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="submit" class="space-y-4">
        <input
          v-model="email"
          type="email"
          placeholder="Correo electrónico"
          class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-700"
        />
        <input
          v-model="password"
          type="password"
          placeholder="Contraseña"
          class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-700"
        />
        <button
          type="submit"
          class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow transition"
        >
          Iniciar sesión
        </button>
      </form>

      <!-- Footer -->
      <p class="mt-6 text-center text-xs text-gray-500">
        © 2025 <span class="font-semibold text-indigo-600">PharmaNow</span> ·
        Todos los derechos reservados
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const api = useApi()
const router = useRouter()
definePageMeta({
  layout: 'empty',
})

const submit = async () => {
  try {
    const response = await api('/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    if (response?.token) {
      const tokenCookie = useCookie('token')
      tokenCookie.value = response.token
      const userCookie = useCookie('user')
      userCookie.value = response
      window.location.href = '/inventario'
    } else {
      alert('Respuesta inesperada')
    }
  } catch (err) {
    alert('Credenciales inválidas')
  }
}
</script>
