<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
const props = defineProps({
  lote: { type: Object, required: true },
  total: { type: Number, required: true },
  config: { type: Object, required: true },
})

const showModal = ref(false)

const daysUntil = (isoDate) => {
  const today = new Date()
  const target = new Date(isoDate)
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const t1 = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.ceil((t1 - t0) / (1000 * 60 * 60 * 24))
}

const diffDays = computed(() => daysUntil(props.lote.vencimiento))

const vencido = computed(() => diffDays.value < 0)

const estadoTexto = computed(() => {
  if (vencido.value) return `Vencido hace ${Math.abs(diffDays.value)} días`
  if (diffDays.value === 0) return 'Vence hoy'
  return `${diffDays.value} días restantes`
})
const COLORS = {
  vencido: '#9333ea', // morado
  critico: '#ef4444', // rojo
  riesgo:  '#ee9452', // naranjo
  alerta:  '#facc15', // amarillo
  seguro:  '#16a34a', // verde
  optimo:  '#3b82f6', // azul
}
const getColor = (days) => {
  if (days < 0) return COLORS.vencido        // morado
  if (days <= props.config.critico) return COLORS.critico  // rojo
  if (days <= props.config.riesgo) return COLORS.riesgo    // naranjo
  if (days <= props.config.alerta) return COLORS.alerta    // amarillo
  if (days <= props.config.seguro) return COLORS.seguro    // verde
  return COLORS.optimo                                     // azul
}

const barStyle = computed(() => {
  const max = props.config.optimo
  const porcentaje = Math.max(0, Math.min(100, (diffDays.value / max) * 100))
  return { width: porcentaje + '%', backgroundColor: getColor(diffDays.value) }
})

const inconsistencia = computed(() => props.lote.cantidad > props.total)
</script>
<template>
  <div>
    <div
      class="p-4 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition relative"
      :class="vencido ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'"
      @click="showModal = true"
    >
      <div class="flex justify-between items-center mb-2">
        <h4 class="font-semibold text-gray-800">Lote {{ lote.id }}</h4>
        <span
          class="text-xs px-2 py-1 rounded-full flex items-center gap-1"
          :style="{
            backgroundColor: getColor(diffDays) + '22',
          }"
        >
          <Icon icon="mdi:calendar-clock" class="text-sm" />
          {{ estadoTexto }}
        </span>
      </div>

      <p class="text-sm text-gray-600 mb-2">
        <Icon icon="mdi:calendar-start" class="inline text-gray-500 mr-1" />
        {{ lote.emision }}
        ·
        <Icon icon="mdi:calendar-end" class="inline text-gray-500 mr-1" />
        {{ lote.vencimiento }}
      </p>

      <div class="w-full mb-3">
        <div v-if="!vencido" class="w-full bg-gray-200 rounded h-2 relative">
          <div class="h-2 rounded" :style="barStyle"></div>
        </div>

        <div
          v-else
          class="w-full h-2 flex items-center text-red-600 text-xs font-medium"
        >
          <Icon icon="mdi:alert-circle" class="text-sm mr-1" />
          Este lote ya venció
        </div>
      </div>

      <p class="text-sm font-medium text-gray-700">
        <Icon icon="mdi:package-variant" class="inline text-gray-500 mr-1" />
        Cantidad disponible:
        <span :class="inconsistencia ? 'text-red-600 font-bold' : ''">
          {{ lote.cantidad }}
        </span>
      </p>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
        <button
          class="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          @click="showModal = false"
        >
          <Icon icon="mdi:close" class="text-lg" />
        </button>

        <div class="mb-4">
          <h3
            class="text-2xl font-bold text-indigo-700 flex items-center gap-2"
          >
            <Icon icon="mdi:tag" class="text-indigo-500" />
            <span class="text-gray-800">Lote {{ lote.id }}</span>
          </h3>
          <p
            class="text-sm mt-1 font-medium inline-flex items-center gap-1 px-3 py-1 rounded-full"
            :style="{
              backgroundColor: getColor(diffDays) + '22',
              color: getColor(diffDays),
            }"
          >
            <Icon icon="mdi:calendar-clock" class="text-sm" />
            {{ estadoTexto }}
          </p>
        </div>

        <div class="space-y-3 text-sm text-gray-700">
          <p>
            <strong
              ><Icon icon="mdi:calendar-start" class="text-gray-500" />
              Emisión:</strong
            >
            {{ lote.emision }}
          </p>
          <p>
            <strong
              ><Icon icon="mdi:calendar-end" class="text-gray-500" />
              Vencimiento:</strong
            >
            {{ lote.vencimiento }}
          </p>
          <p>
            <strong
              ><Icon icon="mdi:package-variant" class="text-gray-500" />
              Cantidad:</strong
            >
            <span :class="inconsistencia ? 'text-red-600 font-bold' : ''">
              {{ lote.cantidad }}
            </span>
            / {{ total }}
          </p>

          <div>
            <p class="font-medium mb-1">Estado del lote</p>
            <div
              v-if="!vencido"
              class="w-full bg-gray-200 rounded h-3 relative"
            >
              <div class="h-3 rounded" :style="barStyle"></div>
            </div>
            <div
              v-else
              class="flex items-center gap-2 text-red-600 font-medium"
            >
              <Icon icon="mdi:alert-circle" class="text-lg" />
              Este lote venció hace {{ Math.abs(diffDays) }} días
            </div>
          </div>

          <p v-if="inconsistencia" class="text-red-600 text-xs mt-2">
            ⚠️ La cantidad de este lote supera el total registrado.
          </p>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            class="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-700 text-sm shadow flex items-center gap-1"
          >
            <Icon icon="mdi:tray-arrow-up" /> Ver ubicación
          </button>
          
        </div>
      </div>
    </div>
  </div>
</template>
