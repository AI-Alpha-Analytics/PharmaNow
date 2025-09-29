<script setup>
import { reactive, computed, ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import AddMedicamento from '~/components/addMedicamento.vue'
const medicamentos = ref([
  {
    id: 1,
    nombre: 'Paracetamol 500mg',
    fechaEmision: '2023-01-01',
    fechaVencimiento: '2026-05-10',
    cantidadTotal: 350,
    lotes: [
      {
        id: 'L-12345',
        emision: '2023-01-01',
        vencimiento: '2025-01-01',
        cantidad: 150,
      },
      {
        id: 'L-12346',
        emision: '2023-06-01',
        vencimiento: '2026-05-10',
        cantidad: 200,
      },
    ],
  },
])
const modalAnalisis = ref(false)
const seleccionado = ref(null)

const abrirAnalisis = (med) => {
  seleccionado.value = med
  modalAnalisis.value = true
}

const daysToMonths = (d) => Math.round(d / 30)
const daysUntil = (isoDate) => {
  const today = new Date()
  const target = new Date(isoDate)
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const t1 = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.ceil((t1 - t0) / (1000 * 60 * 60 * 24))
}

const config = reactive({
  optimo: 24 * 30,
  seguro: 12 * 30,
  alerta: 6 * 30,
  critico: 0,
})

onMounted(() => {
  const saved = localStorage.getItem('inventarioConfig')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      const toNum = (v, fallback) =>
        Number.isFinite(Number(v)) ? Number(v) : fallback
      Object.assign(config, {
        optimo: toNum(parsed.optimo, config.optimo),
        seguro: toNum(parsed.seguro, config.seguro),
        alerta: toNum(parsed.alerta, config.alerta),
        critico: toNum(parsed.critico, config.critico),
      })
    } catch (e) {
      console.warn('inventarioConfig inválido, usando fallback', e)
    }
  }
})

const legend = computed(() => {
  const mCrit = daysToMonths(config.critico ?? 0)
  const mAlert = daysToMonths(config.alerta ?? 0)
  const mSeg = daysToMonths(config.seguro ?? 0)

  return [
    { key: 'optimo', color: 'rgb(34,197,94)', text: `Óptimo: > ${mSeg} meses` },
    {
      key: 'seguro',
      color: 'rgb(59,130,246)',
      text: `Seguro: ${mAlert}–${mSeg} meses`,
    },
    {
      key: 'alerta',
      color: 'rgb(234,179,8)',
      text: `Alerta: ${mCrit}–${mAlert} meses`,
    },
    {
      key: 'critico',
      color: 'rgb(239,68,68)',
      text: 'Crítico: vencido o ≤ 0 días',
    },
  ]
})

const isExpired = (lote) => daysUntil(lote.vencimiento) <= config.critico

const getColorByDiff = (diffDays) => {
  if (diffDays <= config.critico) return 'rgb(239,68,68)'
  if (diffDays <= config.alerta) return 'rgb(234,179,8)'
  if (diffDays <= config.seguro) return 'rgb(59,130,246)'
  return 'rgb(34,197,94)'
}

const getLoteStyle = (lote) => {
  const diffDays = daysUntil(lote.vencimiento)
  const max = config.optimo
  const porcentaje = Math.max(0, Math.min(100, (diffDays / max) * 100))
  return {
    width: porcentaje + '%',
    backgroundColor: getColorByDiff(diffDays),
  }
}

const expanded = ref([])
const mostrarModal = ref(false)

const toggleExpand = (id) => {
  expanded.value = expanded.value.includes(id)
    ? expanded.value.filter((x) => x !== id)
    : [...expanded.value, id]
}

const guardarMedicamento = (payload) => {
  if (payload.tipo === 'medicamento') {
    medicamentos.value.push(payload.data)
  }
  if (payload.tipo === 'lote') {
    const med = medicamentos.value.find((m) => m.id === payload.id)
    if (med) {
      med.lotes.push(payload.lote)
      med.cantidadTotal = med.lotes.reduce((acc, l) => acc + l.cantidad, 0)
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-7xl mx-auto bg-white shadow-lg rounded-2xl p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-3xl font-bold text-indigo-700">
            Inventario de Medicamentos
          </h2>
          <p class="text-gray-600 mt-1">
            Gestione stock, vencimientos y lotes fácilmente
          </p>
        </div>

        <div class="flex gap-3">
          <NuxtLink
            to="/retiroMedicamento"
            class="inline-flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
          >
            <Icon icon="mdi:package-variant-minus" class="text-xl" />
            Retirar Medicamentos
          </NuxtLink>

          <button
            @click="mostrarModal = true"
            class="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
          >
            <Icon icon="mdi:plus-circle" class="text-xl" />
            Agregar Medicamento o Lote
          </button>
        </div>
      </div>

      <div
        class="mb-8 bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex flex-wrap gap-4 items-center"
      >
        <span class="font-semibold text-indigo-900"
          >Rangos de vencimiento:</span
        >
        <template v-for="item in legend" :key="item.key">
          <span
            class="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full"
            :style="{ backgroundColor: item.color + '22', color: item.color }"
          >
            <span
              class="w-2 h-2 rounded-full"
              :style="{ backgroundColor: item.color }"
            ></span>
            {{ item.text }}
          </span>
        </template>
      </div>

      <div class="overflow-hidden rounded-lg border border-gray-200">
        <table class="min-w-full text-sm text-left">
          <thead class="bg-indigo-600 text-white">
            <tr>
              <th class="px-4 py-3">Medicamento</th>
              <th class="px-4 py-3">Fecha Emisión</th>
              <th class="px-4 py-3">Fecha Vencimiento</th>
              <th class="px-4 py-3">Cantidad Total</th>
              <th class="px-4 py-3">Analizar</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <template v-for="med in medicamentos" :key="med.id">
              <tr
                class="hover:bg-indigo-50 cursor-pointer"
                @click="toggleExpand(med.id)"
              >
                <td class="px-4 py-3 font-medium text-indigo-800">
                  {{ med.nombre }}
                  <span class="ml-2 text-xs text-gray-500">
                    ({{ expanded.includes(med.id) ? '▲' : '▼' }})
                  </span>
                </td>
                <td class="px-4 py-3">{{ med.fechaEmision }}</td>
                <td class="px-4 py-3">{{ med.fechaVencimiento }}</td>
                <td class="px-4 py-3">{{ med.cantidadTotal }}</td>
                <td class="px-4 py-3">
                  <button
                    @click.stop="abrirAnalisis(med)"
                    class="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs"
                  >
                    <Icon icon="mdi:chart-pie" />
                  </button>
                </td>
              </tr>

              <tr v-if="expanded.includes(med.id)" class="bg-gray-50">
                <td colspan="5" class="px-6 py-4">
                  <div class="grid md:grid-cols-2 gap-4">
                    <LoteDetalleVue
                      v-for="lote in med.lotes"
                      :key="lote.id"
                      :lote="lote"
                      :config="config"
                      :total="med.cantidadTotal"
                    />
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <AnalisisMedicamentoVue
          v-if="modalAnalisis"
          :medicamento="seleccionado"
          :config="config"
          @cerrar="modalAnalisis = false"
        />

      <AddMedicamento
        v-if="mostrarModal"
        :medicamentos="medicamentos"
        :medicamentos-existentes="medicamentos"
        @cerrar="mostrarModal = false"
        @guardar="guardarMedicamento"
      />
    </div>
  </div>
</template>
