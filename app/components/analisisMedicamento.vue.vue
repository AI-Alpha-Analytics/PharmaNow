<script setup>
import { computed, watchEffect } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  medicamento: { type: Object, required: true },
  config: { type: Object, required: true },
})

const emit = defineEmits(['cerrar'])

// Helpers
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
  vencido: '#dc2626',   // rojo más oscuro (red-600)
  critico: '#fb923c',   // naranjo brillante (orange-400)
  alerta: '#facc15',    // amarillo más puro (yellow-400)
  seguro: '#16a34a',    // verde oscuro (green-600)
  optimo: '#3b82f6',    // azul (blue-500)
}


const lotes = computed(() => props.medicamento?.lotes ?? [])

// Agrupar por estado
const lotesPorEstado = computed(() => {
  const grupos = { optimo: [], seguro: [], alerta: [], critico: [] }
  lotes.value.forEach((l) => grupos[getEstado(l)].push(l))
  return grupos
})

// Porcentajes
const porcentajes = computed(() => {
  const total = lotes.value.length || 0
  if (total === 0) return { optimo: 0, seguro: 0, alerta: 0, critico: 0 }
  return {
    optimo: Math.round((lotesPorEstado.value.optimo.length / total) * 100),
    seguro: Math.round((lotesPorEstado.value.seguro.length / total) * 100),
    alerta: Math.round((lotesPorEstado.value.alerta.length / total) * 100),
    critico: Math.round((lotesPorEstado.value.critico.length / total) * 100),
  }
})

// Total unidades
const totalUnidades = computed(() =>
  lotes.value.reduce((acc, l) => acc + (l.cantidad || 0), 0)
)

// Vencimiento más próximo y promedio
const masProximo = computed(() => {
  if (!lotes.value.length) return null
  const ordenados = [...lotes.value].sort(
    (a, b) => new Date(a.vencimiento) - new Date(b.vencimiento)
  )
  return ordenados[0]
})

const promedioVencimientoDias = computed(() => {
  if (!lotes.value.length) return 0
  const totalDias = lotes.value.reduce(
    (acc, l) => acc + daysUntil(l.vencimiento),
    0
  )
  return Math.round(totalDias / lotes.value.length)
})

// Últimas tandas agregadas (simulamos que tienen fecha de creación)
const ultimasTandas = computed(() =>
  [...lotes.value]
    .sort((a, b) => new Date(b.emision) - new Date(a.emision))
    .slice(0, 3)
)

// Recomendaciones
const recomendacion = computed(() => {
  if (porcentajes.value.critico > 0) {
    return '⚠️ Hay lotes críticos: planificar reposición urgente.'
  }
  if (porcentajes.value.alerta >= 30) {
    return '⚠️ Más del 30% en estado de alerta: considerar compra anticipada.'
  }
  if (promedioVencimientoDias.value < 180) {
    return '📅 Los lotes en promedio vencen en menos de 6 meses.'
  }
  return '✅ Stock en buen estado, no se requieren compras inmediatas.'
})

// Chart
const chartOptions = computed(() => ({
  chart: { type: 'pie' },
  labels: ['Óptimo', 'Seguro', 'Alerta', 'Crítico'],
  colors: [colores.optimo, colores.seguro, colores.alerta, colores.critico],
  legend: { position: 'right', fontSize: '14px', labels: { colors: '#374151' } },
  tooltip: { y: { formatter: (val) => `${val}%` } },
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
      class="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col"
    >
      <!-- HEADER -->
      <div
        class="flex items-center justify-between px-6 py-4 border-b bg-white sticky top-0 z-10 rounded-t-2xl"
      >
        <div>
          <h3 class="text-2xl font-bold text-indigo-700 flex items-center gap-2">
            <Icon icon="lucide:pie-chart" class="w-6 h-6 text-indigo-500" />
            Análisis de {{ medicamento.nombre }}
          </h3>
          <p class="text-sm text-gray-500">
            Estado de stock, vencimientos y recomendaciones de compra
          </p>
        </div>
        <button
          class="text-gray-400 hover:text-gray-600 transition"
          @click="emit('cerrar')"
        >
          <Icon icon="lucide:x" class="w-6 h-6" />
        </button>
      </div>

      <!-- BODY -->
      <div class="p-6 overflow-y-auto">
        <!-- KPIs -->
        <div class="grid md:grid-cols-3 gap-6 mb-10">
          <div
            class="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-xl border border-indigo-100 shadow-sm"
          >
            <p class="text-sm text-gray-500">Unidades Totales</p>
            <p class="text-3xl font-extrabold text-indigo-700">
              {{ totalUnidades }}
            </p>
          </div>
          <div
            class="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-xl border border-emerald-100 shadow-sm"
          >
            <p class="text-sm text-gray-500">Próximo Vencimiento</p>
            <p class="text-lg font-semibold text-gray-800 mt-1">
              <span v-if="masProximo">
                {{ new Date(masProximo.vencimiento).toLocaleDateString() }}
                <span class="text-gray-500">
                  ({{ daysUntil(masProximo.vencimiento) }} días)
                </span>
              </span>
              <span v-else>-</span>
            </p>
          </div>
          <div
            class="bg-gradient-to-br from-amber-50 to-white p-5 rounded-xl border border-amber-100 shadow-sm"
          >
            <p class="text-sm text-gray-500">Promedio de Vencimiento</p>
            <p class="text-lg font-semibold text-gray-800 mt-1">
              ~{{ promedioVencimientoDias }} días
            </p>
          </div>
        </div>

        <!-- Distribución -->
        <div class="grid md:grid-cols-2 gap-8 mb-12">
          <VueApexCharts
            type="pie"
            height="320"
            :options="chartOptions"
            :series="chartSeries"
          />
          <div class="flex flex-col justify-center space-y-4">
            <template v-for="(valor, estado) in porcentajes" :key="estado">
              <div class="flex items-center gap-3">
                <span
                  class="w-4 h-4 rounded-full border"
                  :style="{ backgroundColor: colores[estado] }"
                ></span>
                <span class="capitalize text-gray-600 w-24">{{ estado }}</span>
                <span class="font-semibold text-gray-900">
                  {{ valor }}% ({{ lotesPorEstado[estado].length }} lotes)
                </span>
              </div>
            </template>
          </div>
        </div>

        <!-- Últimas tandas -->
        <div class="mb-10">
          <h4
            class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"
          >
            <Icon icon="lucide:package" class="w-5 h-5 text-indigo-600" />
            Últimas tandas añadidas
          </h4>
          <ul class="space-y-3">
            <li
              v-for="l in ultimasTandas"
              :key="l.id"
              class="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border border-gray-200"
            >
              <div>
                <p class="font-medium text-gray-800">Lote {{ l.id }}</p>
                <p class="text-xs text-gray-500">
                  Emitido: {{ new Date(l.fechaLlegada).toLocaleDateString() }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-700">{{ l.cantidad }} unidades</p>
                <p class="text-xs text-gray-500">
                  Vence: {{ new Date(l.vencimiento).toLocaleDateString() }}
                </p>
              </div>
            </li>
            <li v-if="!ultimasTandas.length" class="text-gray-500 italic">
              No hay tandas registradas
            </li>
          </ul>
        </div>

        <!-- Recomendación -->
        <div
          class="p-5 rounded-xl border shadow-sm"
          :class="{
            'bg-red-50 border-red-200 text-red-800': recomendacion.includes('urgente'),
            'bg-amber-50 border-amber-200 text-amber-800': recomendacion.includes('anticipada'),
            'bg-emerald-50 border-emerald-200 text-emerald-800': recomendacion.includes('Stock en buen estado'),
          }"
        >
          <div class="flex items-center gap-2 mb-2">
            <Icon icon="lucide:lightbulb" class="w-5 h-5" />
            <p class="font-semibold">Recomendación</p>
          </div>
          <p>{{ recomendacion }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
