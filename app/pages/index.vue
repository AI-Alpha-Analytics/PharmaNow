<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useInventarioSocket } from '~/composables/useInventarioSocket'

const { productos, tandasRecientes, fetchProductos, fetchTandasRecientes,fetchTandasByProducto } = useInventarioSocket()
const totalLotes = computed(() => todosLotes.value.length)
// Configuración de vencimientos
const configMeses = ref({
  optimo: 24,   // >24 meses
  seguro: 12,   // 12–24
  alerta: 6,    // 6–12
  riesgo: 2,    // 2–6
  critico: 0,   // 0–2
  vencido: -1   // <0
})
const hoy = new Date()

// ================================
// 🔹 Paginación
// ================================
const pagina = ref(0)
const porPagina = 5

// ================================
// 🔹 Cargar datos desde socket
// ================================
onMounted(async () => {
  const prods = await fetchProductos()

  // cargar tandas de cada producto
  for (const p of prods) {
    await fetchTandasByProducto(p.id)
  }

  // si además quieres las tandas recientes
  await fetchTandasRecientes(10)
})

// ================================
// 🔹 Todos los lotes (desde productos)
// ================================
const todosLotes = computed<any[]>(() =>
  (productos.value as any[]).flatMap((m: any) =>
    (m.lotes as any[]).map((l: any) => ({
      ...l,
      medicamento: m.nombre,
    }))
  )
)

// ================================
// 🔹 Distribución porcentual
// ================================
const distribucionPorcentual = computed(() => {
  const total = todosLotes.value.length
  if (!total) return { vencido: 0, critico: 0, riesgo: 0, alerta: 0, seguro: 0, optimo: 0 }

  const c = configMeses.value
  const categorias = { vencido: 0, critico: 0, riesgo: 0, alerta: 0, seguro: 0, optimo: 0 }

  todosLotes.value.forEach((l: any) => {
    const fechaVto = new Date(l.vencimiento)
    const diffMeses = (fechaVto.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24 * 30)

    let categoria = ''
    if (diffMeses < 0) {
      categoria = 'Vencido'
      categorias.vencido++
    } else if (diffMeses <= 2) {
      categoria = 'Crítico'
      categorias.critico++
    } else if (diffMeses <= 6) {
      categoria = 'Riesgo'
      categorias.riesgo++
    } else if (diffMeses <= 12) {
      categoria = 'Alerta'
      categorias.alerta++
    } else if (diffMeses <= 24) {
      categoria = 'Seguro'
      categorias.seguro++
    } else {
      categoria = 'Óptimo'
      categorias.optimo++
    }
  })

  return {
    vencido: (categorias.vencido / total) * 100,
    critico: (categorias.critico / total) * 100,
    riesgo:  (categorias.riesgo  / total) * 100,
    alerta:  (categorias.alerta  / total) * 100,
    seguro:  (categorias.seguro  / total) * 100,
    optimo:  (categorias.optimo  / total) * 100,
  }
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
  vencido: '#9333ea', // morado
  critico: '#ef4444', // rojo
  riesgo:  '#f97316', // naranjo
  alerta:  '#facc15', // amarillo
  seguro:  '#16a34a', // verde
  optimo:  '#3b82f6', // azul
}

const chartOptions = computed(() => ({
  chart: { type: 'donut' },
  labels: ['Vencido', 'Crítico', 'Riesgo', 'Alerta', 'Seguro', 'Óptimo'],
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

// ================================
// 🔹 Últimas tandas (paginadas)
// ================================
const totalPaginas = computed(() =>
  Math.ceil(((tandasRecientes.value as any[]) || []).length / porPagina)
)

const ultimosPaginados = computed<any[]>(() => {
  const start = pagina.value * porPagina
  return ((tandasRecientes.value as any[]) || []).slice(start, start + porPagina)
})

// ================================
// 🔹 Próximos a vencer
// ================================
const proximosVencidos = computed<any[]>(() => {
  return (todosLotes.value as any[]).filter((l: any) => {
    const fechaVto = new Date(l.vencimiento)
    const diffMeses = (fechaVto.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24 * 30)
    if (diffMeses <= configMeses.value.critico) return true
    if (diffMeses <= configMeses.value.alerta) return true
    return false
  })
})
</script>

<template>
  <div class="bg-gray-50 px-4 py-10">
    <div
      class="px-6 py-10 bg-white shadow-lg rounded-2xl max-w-5xl w-full mx-auto"
    >
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
          to="/"
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
          to="/"
          class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow hover:bg-indigo-700 transition"
        >
          <Icon icon="mdi:arrow-right-circle" class="text-xl" />
          Ver más
        </NuxtLink>
      </div>
    </div>

    <div class="mt-12 max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
      <div class="md:col-span-2 bg-white shadow rounded-xl p-6">
        <h2
          class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"
        >
          <Icon icon="mdi:clock-outline" class="text-indigo-600 text-2xl" />
          Últimos Lotes Ingresados
        </h2>

        <table class="w-full text-sm text-left border">
          <thead class="bg-gray-100 text-gray-600">
            <tr>
              <th class="p-2">Medicamento</th>
              <th class="p-2">Cantidad Ingresada</th>
              <th class="p-2">Ingreso</th>
              <th class="p-2">Vencimiento</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="l in ultimosPaginados"
              :key="l.id"
              class="border-t hover:bg-gray-50"
            >
              <td class="p-2">{{ l.medicamento }}</td>
              <td class="p-2">{{ l.cantidadIngresada }}</td>
              <td class="p-2">{{ l.fechaLlegada }}</td>
              <td class="p-2">{{ l.vencimiento }}</td>
            </tr>
          </tbody>
        </table>

        <div class="mt-4 flex justify-between items-center">
          <button
            @click="pagina--"
            :disabled="pagina === 0"
            class="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            <Icon icon="mdi:chevron-left" class="text-xl" />
          </button>
          <span class="text-gray-600 text-sm">
            Página {{ pagina + 1 }} de {{ totalPaginas }}
          </span>
          <button
            @click="pagina++"
            :disabled="pagina >= totalPaginas - 1"
            class="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            <Icon icon="mdi:chevron-right" class="text-xl" />
          </button>
        </div>
      </div>

      <div class="bg-white shadow rounded-xl p-6">
        <h2
          class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"
        >
          <Icon icon="mdi:alert-circle" class="text-red-600 text-2xl" />
          Vencidos / Próximos a Vencer
        </h2>

        <div v-if="!proximosVencidos.length" class="text-gray-500 text-sm">
          No hay lotes en riesgo.
        </div>

        <ul
          v-else
          class="space-y-2 text-sm mb-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar"
        >
          <li
            v-for="l in proximosVencidos"
            :key="l.id"
            class="p-3 rounded-lg border flex items-center gap-2 transition hover:bg-gray-50"
            :class="{
              'bg-red-50 border-red-200': new Date(l.vencimiento) < new Date(),
              'bg-yellow-50 border-yellow-200':
                new Date(l.vencimiento) >= new Date(),
            }"
          >
            <Icon
              :icon="
                new Date(l.vencimiento) < new Date()
                  ? 'mdi:close-circle'
                  : 'mdi:alert'
              "
              class="text-lg flex-shrink-0"
              :class="
                new Date(l.vencimiento) < new Date()
                  ? 'text-red-600'
                  : 'text-yellow-600'
              "
            />
            <div class="flex-1">
              <p class="font-medium text-gray-800 truncate">
                {{ l.medicamento }}
              </p>
              <p class="text-xs text-gray-500">
                Vence {{ l.vencimiento }}
              </p>
            </div>
          </li>
        </ul>

        <!-- Footer con link -->
        <div v-if="proximosVencidos.length > 5" class="text-center mt-2">
          <NuxtLink
            to="/productosVencidos"
            class="inline-flex items-center gap-1 text-indigo-600 text-sm font-medium hover:underline"
          >
            <Icon icon="mdi:eye" class="text-base" />
            Ver todos ({{ proximosVencidos.length }})
          </NuxtLink>
        </div>

      </div>
    </div>

    <div class="mt-12 max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
      <div class="bg-white shadow rounded-xl p-6">
        <Topvencidos :medicamentos="productos" :configMeses="configMeses" />

      </div>
      <div class="bg-white shadow rounded-xl p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Icon icon="mdi:chart-pie" class="text-indigo-600 text-2xl" />
          Distribución porcentual de lotes
        </h2>

        <p class="text-sm text-gray-600 mb-2">
          Muestra qué porcentaje del total de lotes cae en cada rango de vencimiento.
        </p>

        <!-- 🔹 Aquí mostramos el total -->
        <p class="text-lg font-semibold text-black-700 text-center mb-6">
          Cantidades totales analizadas: {{ totalLotes.toLocaleString() }}
        </p>

        <client-only>
          <VueApexCharts
            type="donut"
            height="320"
            :options="chartOptions"
            :series="chartSeries"
          />
        </client-only>
      </div>
    </div>
  </div>
</template>
