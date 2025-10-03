<template>
  <header
    class="fixed top-0 left-0 w-full z-50 bg-indigo-700 text-white shadow-md"
  >
    <div class="container mx-auto flex justify-between items-center py-4 px-6">
      <NuxtLink
        to="/"
        class="flex items-center gap-2 text-2xl font-extrabold tracking-wide hover:text-indigo-200 transition"
      >
        <img
          src="/PharmaNow.png"
          alt="PharmaNow logo"
          class="h-12 w-12 object-contain rounded-full border-2 border-white shadow-md"
        />
        <span>PharmaNow</span>
      </NuxtLink>

      <!-- 🔹 Menú de navegación -->
      <nav class="flex gap-6 items-center">
        <!-- 🔹 Si hay sesión -->
        <template v-if="auth.user">
          <NuxtLink
            to="/home"
            class="px-3 py-2 font-medium rounded-md transition hover:text-gray-200"
            active-class="bg-indigo-800 shadow-lg scale-105"
          >
            Inicio
          </NuxtLink>
          <NuxtLink
            to="/inventario"
            class="px-3 py-2 font-medium rounded-md transition hover:text-gray-200"
            active-class="bg-indigo-800 shadow-lg scale-105"
          >
            Inventario
          </NuxtLink>

          <NuxtLink
            to="/bodega"
            class="px-3 py-2 font-medium rounded-md transition hover:text-gray-200"
            active-class="bg-indigo-800 shadow-lg scale-105"
          >
            Bodegas
          </NuxtLink>

          <NuxtLink
            to="/configuration"
            class="px-3 py-2 font-medium rounded-md transition hover:text-gray-200"
            active-class="bg-indigo-800 shadow-lg scale-105"
          >
            Configuración
          </NuxtLink>

          <button
            @click="logout"
            class="px-3 py-2 font-medium rounded-md transition hover:text-red-200"
          >
            Cerrar sesión
          </button>
        </template>

        <!-- 🔹 Si NO hay sesión -->
        <template v-else>
          <NuxtLink
            to="/login"
            class="px-4 py-2 font-medium rounded-md bg-blue text-white-700 hover:bg-blue-900 transition"
          >
            Iniciar sesión
          </NuxtLink>
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const logout = () => {
  auth.logout()
  router.push('/') // Después del logout vuelve al landing
}
</script>
