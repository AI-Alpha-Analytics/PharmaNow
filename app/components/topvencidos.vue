<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps<{
  medicamentos: Array<{
    id: number
    nombre: string
    lotes: Array<{ id: string; vencimiento: string }>
  }>
  configMeses: {
    optimo: number
    seguro: number
    alerta: number
    critico: number
  }
}>()

const hoy = new Date()

const isVencido = (lote: { vencimiento: string }) => {
  const fechaVto = new Date(lote.vencimiento)
  const diffMeses =
    (fechaVto.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24 * 30)
  return diffMeses <= props.configMeses.critico
}

const ranking = computed(() => {
  const counts: Record<string, number> = {}

  props.medicamentos.forEach((med) => {
    const vencidos = med.lotes.filter((l) => isVencido(l)).length
    if (vencidos > 0) {
      counts[med.nombre] = (counts[med.nombre] || 0) + vencidos
    }
  })

  const total = Object.values(counts).reduce((acc, v) => acc + v, 0) || 1

  return Object.entries(counts)
    .map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
      porcentaje: Math.round((cantidad / total) * 100),
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
})
</script>

<template>
  <div class="bg-white shadow rounded-xl p-6">
    <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
      <Icon icon="mdi:chart-bar" class="text-indigo-600 text-2xl" />
      Medicamentos con más lotes vencidos
    </h2>

    <div v-if="!ranking.length" class="text-gray-500 text-sm">
      ✅ No hay lotes vencidos registrados.
    </div>

    <ul v-else class="space-y-3">
      <li
        v-for="item in ranking"
        :key="item.nombre"
        class="flex items-center gap-3"
      >
        <div class="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
          <div
            class="h-4 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-end pr-2"
            :style="{ width: item.porcentaje + '%' }"
          >
            {{ item.porcentaje }}%
          </div>
        </div>
        <span class="w-40 truncate text-sm font-medium text-gray-700">
          {{ item.nombre }}
        </span>
        <span class="text-xs text-gray-500">({{ item.cantidad }})</span>
      </li>
    </ul>
  </div>
</template>
