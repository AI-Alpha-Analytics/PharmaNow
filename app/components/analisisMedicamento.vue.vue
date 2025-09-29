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
  optimo: '#22c55e',
  seguro: '#3b82f6',
  alerta: '#eab308',
  critico: '#ef4444', 
}

const lotes = computed(() => props.medicamento?.lotes ?? [])

const lotesPorEstado = computed(() => {
  const grupos = { optimo: [], seguro: [], alerta: [], critico: [] }
  lotes.value.forEach((l) => {
    grupos[getEstado(l)].push(l)
  })
  return grupos
})

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

const totalUnidades = computed(() =>
  lotes.value.reduce((acc, l) => acc + (l.cantidad || 0), 0)
)

const usoPromedioMensual = computed(() => {
  const consumos = lotes.value.flatMap((l) => l.consumos || [])
  if (!consumos.length) return 0
  const total = consumos.reduce((acc, c) => acc + c.cantidad, 0)
  const meses = new Set(consumos.map((c) => c.mes)).size
  return Math.round(total / (meses || 1))
})

const usoUltimos3Meses = computed(() => {
  const ahora = new Date()
  const ultimos3 = lotes.value.flatMap((l) => l.consumos || [])
    .filter((c) => {
      const [year, month] = c.mes.split('-').map(Number)
      const fecha = new Date(year, month - 1)
      const diffMeses =
        (ahora.getFullYear() - fecha.getFullYear()) * 12 +
        (ahora.getMonth() - fecha.getMonth())
      return diffMeses <= 2
    })

  if (!ultimos3.length) return 0
  const total = ultimos3.reduce((acc, c) => acc + c.cantidad, 0)
  const meses = new Set(ultimos3.map((c) => c.mes)).size
  return Math.round(total / (meses || 1))
})

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
      class="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-8 relative"
    >
      <button
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        @click="emit('cerrar')"
      >
        <Icon icon="mdi:close" class="text-2xl" />
      </button>

      <div class="mb-6 border-b pb-4">
        <h3 class="text-3xl font-bold text-indigo-700 flex items-center gap-2">
          <Icon icon="mdi:chart-pie" class="text-indigo-500 text-3xl" />
          Análisis de:
          <span class="text-gray-800">{{ medicamento.nombre }}</span>
        </h3>
        <p class="text-gray-500 mt-1">
          Distribución de estados de vencimiento y consumos recientes
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-6 mb-10">
        <div class="p-4 bg-gray-50 rounded-xl shadow-sm text-center">
          <p class="text-sm text-gray-500">Unidades Totales</p>
          <p class="text-2xl font-bold text-indigo-700">
            {{ totalUnidades }}
          </p>
        </div>
        <div class="p-4 bg-gray-50 rounded-xl shadow-sm text-center">
          <p class="text-sm text-gray-500">Promedio Mensual</p>
          <p class="text-2xl font-bold text-indigo-700">
            {{ usoPromedioMensual }} u.
          </p>
        </div>
        <div class="p-4 bg-gray-50 rounded-xl shadow-sm text-center">
          <p class="text-sm text-gray-500">Últimos 3 meses</p>
          <p class="text-2xl font-bold text-indigo-700">
            {{ usoUltimos3Meses }} u.
          </p>
        </div>
      </div>

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
