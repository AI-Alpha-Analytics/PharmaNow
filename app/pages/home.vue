<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useInventarioSocket } from '~/composables/useInventarioSocket'

interface Lote {
  id: number | string
  vencimiento: string
  fechaLlegada?: string
  cantidadIngresada?: number
  medicamento: string
  [key: string]: any
}

interface Producto {
  id: number | string
  nombre: string
  lotes: Lote[]
  [key: string]: any
}

const {
  productos,
  tandasRecientes,
  fetchProductos,
  fetchTandasRecientes,
  fetchTandasByProducto,
} = useInventarioSocket()

// ================================
// 🔹 Configuración
// ================================
const configMeses = ref({
  optimo: 24,
  seguro: 12,
  alerta: 6,
  riesgo: 2,
  critico: 0,
  vencido: -1,
})
const hoy = new Date()
const pagina = ref(0)
const porPagina = 5
const isLoading = ref(true)

// ================================
// 🔹 Tabs
// ================================
type ResumenTabKey = 'porVencer' | 'vencidos'
const resumenTab = ref<ResumenTabKey>('porVencer')
const resumenTabOptions: Array<{ key: ResumenTabKey; label: string }> = [
  { key: 'porVencer', label: 'Próximos a vencer' },
  { key: 'vencidos', label: 'Lotes vencidos' },
]

// ================================
// 🔹 Carga inicial optimizada
// ================================
onMounted(async () => {
  console.log("🔵 onMounted → Inicio carga de productos");
  const prods = await fetchProductos()
  console.log("🟢 Productos cargados:", prods);

  // 🔹 Cargar todas las tandas en paralelo
  const tandasPorProducto = await Promise.all(
    prods.map((p: Producto) => fetchTandasByProducto(p.id))
  )

  // 🔹 Asignar tandas a cada producto de una sola vez
  prods.forEach((p: Producto, i: number) => {
    p.lotes = tandasPorProducto[i]
  })
  console.log("✅ Todas las tandas cargadas:", prods);

  const recientes = await fetchTandasRecientes(10)
  console.log("🟡 Tandas recientes:", recientes);

  isLoading.value = false
})

// ================================
// 🔹 Computed
// ================================
const productosList = computed<Producto[]>(() =>
  Array.isArray(productos.value) ? (productos.value as Producto[]) : []
)

const todosLotes = computed<Lote[]>(() => {
  if (isLoading.value) return []
  const lotes = productosList.value.flatMap((producto) =>
    Array.isArray(producto.lotes)
      ? (producto.lotes as Lote[]).map((lote) => ({
          ...lote,
          medicamento: producto.nombre,
        }))
      : []
  )
  console.log("📦 todosLotes →", lotes)
  return lotes
})

const totalLotes = computed(() => {
  const total = todosLotes.value.length
  console.log("🔢 totalLotes →", total)
  return total
})

const distribucionPorcentual = computed(() => {
  const total = totalLotes.value
  const categorias = { vencido: 0, critico: 0, riesgo: 0, alerta: 0, seguro: 0, optimo: 0 }

  todosLotes.value.forEach((lote) => {
    const fechaVencimiento = new Date(lote.vencimiento)
    const diffMeses =
      (fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24 * 30)

    if (diffMeses < 0) categorias.vencido++
    else if (diffMeses <= 2) categorias.critico++
    else if (diffMeses <= 6) categorias.riesgo++
    else if (diffMeses <= 12) categorias.alerta++
    else if (diffMeses <= 24) categorias.seguro++
    else categorias.optimo++
  })

  const result = {
    vencido: (categorias.vencido / total) * 100 || 0,
    critico: (categorias.critico / total) * 100 || 0,
    riesgo: (categorias.riesgo / total) * 100 || 0,
    alerta: (categorias.alerta / total) * 100 || 0,
    seguro: (categorias.seguro / total) * 100 || 0,
    optimo: (categorias.optimo / total) * 100 || 0,
  }
  console.log("📊 distribucionPorcentual →", result)
  return result
})

const chartSeries = computed(() => [
  distribucionPorcentual.value.vencido,
  distribucionPorcentual.value.critico,
  distribucionPorcentual.value.riesgo,
  distribucionPorcentual.value.alerta,
  distribucionPorcentual.value.seguro,
  distribucionPorcentual.value.optimo,
])

const COLORS = {
  vencido: '#9333ea',
  critico: '#ef4444',
  riesgo: '#ee9452',
  alerta: '#facc15',
  seguro: '#16a34a',
  optimo: '#3b82f6',
}

const chartOptions = computed(() => ({
  chart: { type: 'donut' },
  labels: ['Vencido', 'Critico', 'Riesgo', 'Alerta', 'Seguro', 'Optimo'],
  colors: [
    COLORS.vencido,
    COLORS.critico,
    COLORS.riesgo,
    COLORS.alerta,
    COLORS.seguro,
    COLORS.optimo,
  ],
  legend: { position: 'bottom' },
  dataLabels: {
    formatter: (val: number) => `${val.toFixed(1)}%`,
  },
  tooltip: {
    y: {
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
  },
}))

const tandasRecientesList = computed<any[]>(() =>
  Array.isArray(tandasRecientes.value) ? (tandasRecientes.value as any[]) : []
)

const totalPaginas = computed(() =>
  Math.ceil(tandasRecientesList.value.length / porPagina) || 1
)

const ultimosPaginados = computed<any[]>(() => {
  const start = pagina.value * porPagina
  return tandasRecientesList.value.slice(start, start + porPagina)
})

const lotesVencidos = computed<Lote[]>(() => {
  const vencidos = todosLotes.value
    .filter((lote) => new Date(lote.vencimiento) < hoy)
    .sort((a, b) => new Date(b.vencimiento).getTime() - new Date(a.vencimiento).getTime())
  console.log("❌ lotesVencidos →", vencidos)
  return vencidos
})

const lotesPorVencer = computed<Lote[]>(() => {
  const porVencer = todosLotes.value
    .filter((lote) => {
      const fecha = new Date(lote.vencimiento)
      const diffMeses = (fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24 * 30)
      return diffMeses >= 0 && diffMeses <= configMeses.value.alerta
    })
    .sort((a, b) => new Date(a.vencimiento).getTime() - new Date(b.vencimiento).getTime())
  console.log("⚠️ lotesPorVencer →", porVencer)
  return porVencer
})

const displayedLotes = computed(() => {
  const res = resumenTab.value === 'porVencer' ? lotesPorVencer.value : lotesVencidos.value
  console.log("🖼️ displayedLotes (", resumenTab.value, ") →", res)
  return res
})

const totalPorVencer = computed(() => lotesPorVencer.value.length)
const totalVencidos = computed(() => lotesVencidos.value.length)

// ================================
// 🔹 Utilidades
// ================================
const formatDate = (value?: string) => {
  if (!value) return 'Sin fecha'
  const fecha = new Date(value)
  if (Number.isNaN(fecha.getTime())) return value
  return fecha.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const diasHastaVencimiento = (value?: string) => {
  if (!value) return null
  const fecha = new Date(value)
  if (Number.isNaN(fecha.getTime())) return null
  const diff = Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}
</script>

<template>
  <div class="bg-gray-50 min-h-screen px-4 py-10">
    <div class="max-w-6xl mx-auto space-y-12">
      <section class="grid gap-4 sm:grid-cols-3">
        <article class="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-6 flex items-center gap-4">
          <div class="rounded-full bg-indigo-50 p-3 text-indigo-600">
            <Icon icon="mdi:layers" class="text-2xl" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Total de lotes</p>
            <p class="text-2xl font-semibold text-gray-900">
              {{ totalLotes.toLocaleString() }}
            </p>
          </div>
        </article>

        <article class="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-6 flex items-center gap-4">
          <div class="rounded-full bg-amber-50 p-3 text-amber-600">
            <Icon icon="mdi:timer-sand" class="text-2xl" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Próximos a vencer</p>
            <p class="text-2xl font-semibold text-gray-900">
              {{ totalPorVencer.toLocaleString() }}
            </p>
          </div>
        </article>

        <article class="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-6 flex items-center gap-4">
          <div class="rounded-full bg-rose-50 p-3 text-rose-600">
            <Icon icon="mdi:alert-circle" class="text-2xl" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Lotes vencidos</p>
            <p class="text-2xl font-semibold text-gray-900">
              {{ totalVencidos.toLocaleString() }}
            </p>
          </div>
        </article>
      </section>

      <section class="grid gap-8 lg:grid-cols-[7fr_5fr]">
        <article class="bg-white shadow-sm rounded-3xl border border-gray-100 overflow-hidden">
          <header class="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div class="flex items-center gap-3">
              <Icon icon="mdi:clock-outline" class="text-indigo-600 text-2xl" />
              <div>
                <h2 class="text-xl font-semibold text-gray-900">Últimos lotes ingresados</h2>
                <p class="text-sm text-gray-500">Seguimiento de los ingresos más recientes registrados por el inventario.</p>
              </div>
            </div>
          </header>

          <div class="overflow-x-auto">
            <table class="w-full text-sm text-gray-600">
              <thead class="bg-gray-50/80 uppercase text-xs tracking-wide text-gray-500">
                <tr>
                  <th class="px-6 py-3 text-left font-medium">Medicamento</th>
                  <th class="px-6 py-3 text-left font-medium">Cantidad</th>
                  <th class="px-6 py-3 text-left font-medium">Ingreso</th>
                  <th class="px-6 py-3 text-left font-medium">Vencimiento</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="lote in ultimosPaginados"
                  :key="lote.id"
                  class="border-t border-gray-100 hover:bg-indigo-50/30 transition"
                >
                  <td class="px-6 py-4 font-medium text-gray-900">{{ lote.medicamento || lote.nombre }}</td>
                  <td class="px-6 py-4">{{ lote.cantidadIngresada?.toLocaleString?.() ?? lote.cantidadIngresada ?? '-' }}</td>
                  <td class="px-6 py-4">{{ formatDate(lote.fechaLlegada) }}</td>
                  <td class="px-6 py-4">{{ formatDate(lote.vencimiento) }}</td>
                </tr>
                <tr v-if="!ultimosPaginados.length">
                  <td colspan="4" class="px-6 py-10 text-center text-gray-500">
                    Aún no hay registros recientes disponibles.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <footer class="border-t border-gray-100 px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span class="text-sm text-gray-500">Página {{ pagina + 1 }} de {{ totalPaginas }}</span>
            <div class="flex items-center gap-2">
              <button
                @click="pagina = Math.max(0, pagina - 1)"
                :disabled="pagina === 0"
                class="px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Icon icon="mdi:chevron-left" class="text-xl" />
              </button>
              <button
                @click="pagina = Math.min(totalPaginas - 1, pagina + 1)"
                :disabled="pagina >= totalPaginas - 1"
                class="px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Icon icon="mdi:chevron-right" class="text-xl" />
              </button>
            </div>
          </footer>
        </article>

        <article class="bg-white shadow-sm rounded-3xl border border-gray-100 p-6 flex flex-col gap-6">
          <header class="space-y-2">
            <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Icon icon="mdi:chart-pie" class="text-indigo-600 text-2xl" />
              Distribución porcentual de lotes
            </h2>
            <p class="text-sm text-gray-500">
              Muestra el porcentaje de lotes según su estado de vencimiento respecto al total disponible.
            </p>
          </header>

          <div class="bg-indigo-50/60 border border-indigo-100 text-indigo-700 text-sm rounded-2xl px-4 py-3 flex items-center gap-2">
            <Icon icon="mdi:information-outline" class="text-lg" />
            <span>Cantidad total analizada: {{ totalLotes.toLocaleString() }}</span>
          </div>

          <client-only>
            <VueApexCharts
              type="donut"
              height="320"
              :options="chartOptions"
              :series="chartSeries"
            />
          </client-only>
        </article>
      </section>

      <section class="bg-white shadow-sm rounded-3xl border border-gray-100 p-6">
        <header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-3">
            <Icon icon="mdi:alert-decagram" class="text-rose-600 text-xl" />
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Vencidos y próximos a vencer</h2>
              <p class="text-xs text-gray-500">
                Gestiona el riesgo de inventario priorizando los lotes con fecha próxima o ya vencida.
              </p>
            </div>
          </div>

          <!-- Tabs -->
          <div class="bg-gray-100 rounded-full p-1 flex items-center gap-1 w-full md:w-auto">
            <button
              v-for="tab in resumenTabOptions"
              :key="tab.key"
              type="button"
              @click="resumenTab = tab.key"
              class="flex-1 md:flex-none px-3 py-1.5 text-xs font-medium rounded-full transition"
              :class="
                resumenTab === tab.key
                  ? 'bg-white shadow text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              "
            >
              {{ tab.label }}
              <span class="ml-1 text-[10px] font-semibold text-gray-400">
                {{ tab.key === 'porVencer' ? totalPorVencer : totalVencidos }}
              </span>
            </button>
          </div>
        </header>

        <div class="mt-6">
          <!-- 📌 Lista en una sola columna horizontal compacta -->
          <transition-group name="list" tag="ul" class="space-y-2">
            <li
              v-for="lote in displayedLotes"
              :key="`${resumenTab}-${lote.id}`"
              class="flex items-center justify-between gap-4 border border-gray-100 rounded-lg px-3 py-2 shadow-sm hover:border-indigo-200 hover:shadow transition text-xs"
            >
              <!-- Estado + ID -->
              <div class="flex items-center gap-2 min-w-[120px]">
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  :class="
                    resumenTab === 'vencidos'
                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                  "
                >
                  <Icon
                    :icon="resumenTab === 'vencidos' ? 'mdi:close-circle' : 'mdi:alert'"
                    class="text-sm"
                  />
                  {{ resumenTab === 'vencidos' ? 'Vencido' : 'Próximo' }}
                </span>
                <span class="text-[10px] text-gray-400">#{{ lote.id }}</span>
              </div>

              <!-- Medicamento -->
              <div class="flex-1 font-medium text-gray-800 truncate">
                {{ lote.medicamento }}
              </div>

              <!-- Fecha vencimiento -->
              <div class="flex items-center gap-1 text-gray-600">
                <Icon icon="mdi:calendar" class="text-indigo-500 text-sm" />
                <span class="font-medium text-gray-900">
                  {{ formatDate(lote.vencimiento) }}
                </span>
              </div>

              <!-- Ingreso -->
              <div class="flex items-center gap-1 text-gray-600">
                <Icon icon="mdi:truck-outline" class="text-indigo-500 text-sm" />
                {{ formatDate(lote.fechaLlegada) }}
              </div>

              <!-- Cantidad -->
              <div class="flex items-center gap-1 text-gray-600">
                <Icon icon="mdi:counter" class="text-indigo-500 text-sm" />
                {{ lote.cantidadIngresada?.toLocaleString?.() ?? '-' }}
              </div>

              <!-- Tiempo restante -->
              <div class="flex items-center gap-1 text-gray-500">
                <Icon icon="mdi:timeline-clock" class="text-indigo-500 text-sm" />
                <span v-if="resumenTab === 'vencidos'">
                  Hace
                  <strong class="text-gray-700">
                    {{ Math.abs(diasHastaVencimiento(lote.vencimiento) ?? 0) }}d
                  </strong>
                </span>
                <span v-else>
                  Faltan
                  <strong class="text-gray-700">
                    {{ Math.max(diasHastaVencimiento(lote.vencimiento) ?? 0, 0) }}d
                  </strong>
                </span>
              </div>
            </li>
          </transition-group>

          <!-- Empty state -->
          <div
            v-if="!displayedLotes.length"
            class="text-center text-gray-500 text-xs border border-dashed border-gray-200 rounded-xl py-6 mt-3"
          >
            {{
              resumenTab === 'porVencer'
                ? 'No hay lotes próximos a vencer en este momento.'
                : 'No se registran lotes vencidos.'
            }}
          </div>
        </div>

      </section>



      <section class="bg-white shadow-sm rounded-3xl border border-gray-100 p-6">
        <header class="flex items-center gap-3 mb-4">
          <Icon icon="mdi:star-box" class="text-indigo-600 text-2xl" />
          <div>
            <h2 class="text-xl font-semibold text-gray-900">Destacados del inventario</h2>
            <p class="text-sm text-gray-500">Visualiza rápidamente los productos con mayor rotación o riesgo.</p>
          </div>
        </header>

        <Topvencidos :medicamentos="productos" :configMeses="configMeses" />
      </section>
    </div>
  </div>
</template>