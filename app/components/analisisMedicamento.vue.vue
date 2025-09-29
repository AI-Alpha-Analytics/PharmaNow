<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps({
  medicamento: { type: Object, required: true },
  config: { type: Object, required: true },
})

const emit = defineEmits(['cerrar'])

const daysUntil = (isoDate) => {
  if (!isoDate) return 0
  const today = new Date()
  const target = new Date(isoDate)
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const t1 = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.ceil((t1 - t0) / (1000 * 60 * 60 * 24))
}

const getEstado = (lote) => {
  const d = daysUntil(lote?.vencimiento)
  if (d <= props.config.critico) return 'critico'
  if (d <= props.config.alerta) return 'alerta'
  if (d <= props.config.seguro) return 'seguro'
  return 'optimo'
}

const colores = {
  optimo: '#22c55e', // verde
  seguro: '#3b82f6', // azul
  alerta: '#eab308', // amarillo
  critico: '#ef4444', // rojo
}

const lotesPorEstado = computed(() => {
  const grupos = { optimo: [], seguro: [], alerta: [], critico: [] }
  const lotes = props.medicamento?.lotes ?? []
  lotes.forEach((l) => {
    grupos[getEstado(l)].push(l)
  })
  return grupos
})

const porcentajes = computed(() => {
  const total = props.medicamento?.lotes?.length || 0
  if (total === 0) return { optimo: 0, seguro: 0, alerta: 0, critico: 0 }
  return {
    optimo: Math.round((lotesPorEstado.value.optimo.length / total) * 100),
    seguro: Math.round((lotesPorEstado.value.seguro.length / total) * 100),
    alerta: Math.round((lotesPorEstado.value.alerta.length / total) * 100),
    critico: Math.round((lotesPorEstado.value.critico.length / total) * 100),
  }
})

// 🔹 Configuración ApexCharts
const chartOptions = computed(() => ({
  chart: { type: 'pie' },
  labels: ['Óptimo', 'Seguro', 'Alerta', 'Crítico'],
  colors: [colores.optimo, colores.seguro, colores.alerta, colores.critico],
  legend: {
    position: 'right',
    fontSize: '14px',
    labels: { colors: '#374151' },
  },
  tooltip: {
    y: { formatter: (val) => `${val}%` },
  },
}))

const chartSeries = computed(() => [
  porcentajes.value.optimo,
  porcentajes.value.seguro,
  porcentajes.value.alerta,
  porcentajes.value.critico,
])
</script>

<template>
  <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div
      class="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-8 relative"
    >
      <!-- Botón cerrar -->
      <button
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        @click="emit('cerrar')"
      >
        <Icon icon="mdi:close" class="text-2xl" />
      </button>

      <!-- Header -->
      <div class="mb-6 border-b pb-4">
        <h3 class="text-3xl font-bold text-indigo-700 flex items-center gap-2">
          <Icon icon="mdi:chart-pie" class="text-indigo-500 text-3xl" />
          Análisis de:
          <span class="text-gray-800">{{ medicamento.nombre }}</span>
        </h3>
        <p class="text-gray-500 mt-1">
          Distribución de estados de vencimiento de los lotes
        </p>
      </div>

      <!-- Gráfico -->
      <div class="grid md:grid-cols-2 gap-6 mb-10">
        <VueApexCharts
          type="pie"
          height="320"
          :options="chartOptions"
          :series="chartSeries"
        />

        <div class="flex flex-col justify-center space-y-3">
          <template v-for="(valor, estado) in porcentajes" :key="estado">
            <div class="flex items-center gap-3">
              <span
                class="w-4 h-4 rounded-full"
                :style="{ backgroundColor: colores[estado] }"
              ></span>
              <span class="capitalize w-20">{{ estado }}</span>
              <span class="font-semibold text-gray-800">
                {{ valor }}% ({{ lotesPorEstado[estado].length }} lotes)
              </span>
            </div>
          </template>
        </div>
      </div>

      <!-- Listado de lotes -->
      <div>
        <h4 class="text-lg font-bold text-gray-800 mb-3">
          Detalle de lotes por estado
        </h4>
        <div class="grid md:grid-cols-2 gap-6">
          <template v-for="(lotes, estado) in lotesPorEstado" :key="estado">
            <div
              v-if="lotes.length"
              class="p-4 rounded-lg border shadow-sm"
              :style="{ borderColor: colores[estado] + '55' }"
            >
              <h5
                class="font-semibold mb-2 flex items-center gap-2 capitalize"
                :style="{ color: colores[estado] }"
              >
                <Icon icon="mdi:circle" :style="{ color: colores[estado] }" />
                {{ estado }} ({{ lotes.length }})
              </h5>
              <ul class="pl-6 list-disc text-sm text-gray-700 space-y-1">
                <li v-for="l in lotes" :key="l.id">
                  Lote <strong>{{ l.id }}</strong> — vence
                  <span class="font-medium">{{ l.vencimiento }}</span> —
                  {{ l.cantidad }} unidades
                  <span
                    v-if="estado === 'critico'"
                    class="text-red-600 font-medium"
                  >
                    → Mandar a merma
                  </span>
                </li>
              </ul>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
