<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>

<template>
  <div class="bg-gray-50 flex items-center justify-center min-h-screen px-4">
    <div class="px-6 py-10 bg-white shadow-lg rounded-2xl max-w-5xl w-full">
      <div class="text-center mb-10">
        <h2 class="text-4xl font-extrabold text-indigo-700">
          Bienvenido a <span class="text-indigo-900">PharmaNow</span>
        </h2>
        <div class="mt-6 flex justify-center">
          <img
            src="/PharmaNow.png"
            alt="PharmaNow logo"
            class="h-32 w-32 object-contain rounded-full border-4 border-white"
          />
        </div>

        <p class="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
          Plataforma integral para la gestión de inventarios y trazabilidad en
          clínicas y farmacias.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <NuxtLink
          to="/inventario"
          class="p-6 bg-indigo-50 rounded-xl shadow-sm hover:shadow-md transition block"
        >
          <div class="mb-4">
            <span
              class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 shadow-inner"
            >
              <Icon icon="mdi:pill" class="text-3xl" />
            </span>
          </div>
          <h3 class="text-lg font-semibold text-gray-800">
            Gestión de Medicamentos
          </h3>
          <p class="mt-2 text-gray-600 text-sm leading-relaxed">
            Controle vencimientos, lotes y existencias en tiempo real.
          </p>
        </NuxtLink>

        <div
          class="p-6 bg-indigo-50 rounded-xl shadow-sm hover:shadow-md transition"
        >
          <div class="mb-4">
            <span
              class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 shadow-inner"
            >
              <Icon icon="mdi:chart-bar" class="text-3xl" />
            </span>
          </div>
          <h3 class="text-lg font-semibold text-gray-800">
            Reportes Inteligentes
          </h3>
          <p class="mt-2 text-gray-600 text-sm leading-relaxed">
            Genere informes detallados sobre consumo y stock.
          </p>
        </div>
        <div
          class="p-6 bg-indigo-50 rounded-xl shadow-sm hover:shadow-md transition"
        >
          <div class="mb-4">
            <span
              class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 shadow-inner"
            >
              <Icon icon="mdi:shield-check" class="text-3xl" />
            </span>
          </div>
          <h3 class="text-lg font-semibold text-gray-800">
            Seguridad Garantizada
          </h3>
          <p class="mt-2 text-gray-600 text-sm leading-relaxed">
            Procesos protegidos con altos estándares de ciberseguridad.
          </p>
        </div>
      </div>

      <div class="mt-10 text-center">
        <NuxtLink
          to="/test"
          class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow hover:bg-indigo-700 transition"
        >
          <Icon icon="mdi:arrow-right-circle" class="text-xl" />
          Ver más
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
