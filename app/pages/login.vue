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

        <!-- Botón con loader -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="!loading">Iniciar sesión</span>
          <span v-else class="flex items-center gap-2">
            <svg
              class="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            Procesando...
          </span>
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
import { useAuthStore } from '~/stores/auth'

const email = ref('')
const password = ref('')
const loading = ref(false) // 👉 esto lo usamos solo para el botón
const router = useRouter()

definePageMeta({ layout: 'empty' })

const auth = useAuthStore()

const submit = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const response = await auth.login(email.value, password.value)
    await router.push('/')
  } catch (err) {
    console.error('❌ Error en login:', err)
    alert('Credenciales inválidas')
  } finally {
    loading.value = false
  }
}
</script>
