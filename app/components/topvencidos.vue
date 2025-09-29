<script setup lang="ts">
import { computed } from "vue"
import { Icon } from "@iconify/vue"

type Lote = { id: string; vencimiento: string; cantidad?: number }
type Medicamento = { id: number; nombre: string; lotes: Lote[] }

const props = defineProps<{
  medicamentos: Medicamento[]
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

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n))
const fmt = (n: number) => new Intl.NumberFormat("es-CL").format(n)

const ranking = computed(() => {
  const stats: Record<
    string,
    { lotes: number; totalCantidad: number; detalle: { id: string; cantidad: number; vencimiento: string }[] }
  > = {}

  const meds = props.medicamentos ?? []
  for (const med of meds) {
    const lotes = med?.lotes ?? []
    for (const lote of lotes) {
      if (!isVencido(lote)) continue

      const key: string = med.nombre
      const entry =
        (stats[key] ??= { lotes: 0, totalCantidad: 0, detalle: [] })

      entry.lotes += 1
      entry.totalCantidad += lote.cantidad ?? 0
      entry.detalle.push({
        id: lote.id,
        cantidad: lote.cantidad ?? 0,
        vencimiento: lote.vencimiento,
      })
    }
  }

  const totalLotes =
    Object.values(stats).reduce((acc, s) => acc + s.lotes, 0) || 1

  return Object.entries(stats)
    .map(([nombre, s]) => ({
      nombre,
      lotes: s.lotes,
      totalCantidad: s.totalCantidad,
      porcentaje: clamp(Math.round((s.lotes / totalLotes) * 100)),
      detalle: s.detalle.sort((a, b) => a.vencimiento.localeCompare(b.vencimiento)),
    }))
    .sort((a, b) => b.lotes - a.lotes)
})
</script>

<template>
  <div class="bg-white shadow rounded-xl p-6">
    <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
      <Icon icon="mdi:chart-bar" class="text-indigo-600 text-2xl" />
      Medicamentos con más lotes vencidos
    </h2>

    <div v-if="!ranking.length" class="text-gray-500 text-sm">
      No hay lotes vencidos registrados.
    </div>

    <ul v-else class="space-y-3">
      <li
        v-for="item in ranking"
        :key="item.nombre"
        class="flex items-center gap-3"
      >
        <div class="relative flex-1 group">
          <div class="bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              class="h-4 rounded-full bg-indigo-600 text-white text-[10px] leading-4 flex items-center justify-end pr-2"
              :style="{ width: `${item.porcentaje}%` }"
            >
              {{ item.porcentaje }}%
            </div>
          </div>

          <button
            class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center
                  opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition"
            tabindex="0"
            aria-label="Ver detalle de lotes vencidos"
          >
            <Icon icon="mdi:information-outline" class="text-gray-700 text-[16px]" />
          </button>

          <div
            class="absolute left-0 top-full mt-2 z-50
                  pointer-events-none opacity-0 scale-95 transition
                  group-hover:opacity-100 group-hover:scale-100
                  group-focus-within:opacity-100 group-focus-within:scale-100
                  group-hover:pointer-events-auto group-focus-within:pointer-events-auto"
          >
            <div class="w-max max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs text-gray-700">
              <div class="font-semibold mb-1">
                {{ item.nombre }} — Total: {{ fmt(item.totalCantidad) }} | Lotes: {{ item.lotes }}
              </div>
              <ul class="list-disc pl-4 space-y-0.5 max-h-48 overflow-auto">
                <li v-for="d in item.detalle" :key="d.id">
                  Lote {{ d.id }}:
                  <strong>{{ fmt(d.cantidad) }}</strong>
                  <span class="text-gray-500"> (vence {{ d.vencimiento }})</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <span class="w-44 truncate text-sm font-medium text-gray-700">
          {{ item.nombre }}
        </span>
      </li>
    </ul>
  </div>
</template>
