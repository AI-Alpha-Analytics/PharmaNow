<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
const medicamentos = ref([
  {
    id: 1,
    nombre: 'Paracetamol 500mg',
    fechaIngreso: '2025-09-27',
    vencimiento: '2026-03-01',
  },
  {
    id: 2,
    nombre: 'Ibuprofeno 400mg',
    fechaIngreso: '2025-09-25',
    vencimiento: '2025-10-15',
  },
  {
    id: 3,
    nombre: 'Amoxicilina 875mg',
    fechaIngreso: '2025-09-22',
    vencimiento: '2025-12-10',
  },
  {
    id: 4,
    nombre: 'Omeprazol 20mg',
    fechaIngreso: '2025-09-20',
    vencimiento: '2027-01-01',
  },
  {
    id: 5,
    nombre: 'Loratadina 10mg',
    fechaIngreso: '2025-09-18',
    vencimiento: '2026-05-01',
  },
  {
    id: 6,
    nombre: 'Metformina 850mg',
    fechaIngreso: '2025-09-15',
    vencimiento: '2025-09-30',
  },
  {
    id: 7,
    nombre: 'Diclofenaco 50mg',
    fechaIngreso: '2025-09-10',
    vencimiento: '2026-02-20',
  },
])

const pagina = ref(0)
const porPagina = 5
const totalPaginas = computed(() =>
  Math.ceil(medicamentos.value.length / porPagina)
)
const ultimosPaginados = computed(() => {
  const start = pagina.value * porPagina
  return medicamentos.value
    .slice()
    .sort(
      (a, b) =>
        new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime()
    )
    .slice(start, start + porPagina)
})

const configMeses = ref({ optimo: 24, seguro: 12, alerta: 6, critico: 0 })

const hoy = new Date()
const proximosVencidos = computed(() => {
  return medicamentos.value.filter((m) => {
    const fechaVto = new Date(m.vencimiento)
    const diffMeses =
      (fechaVto.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24 * 30)
    if (diffMeses <= configMeses.value.critico) return true
    if (diffMeses <= configMeses.value.alerta) return true
    return false
  })
})
</script>

<template>
  <div class="bg-gray-50 min-h-screen px-4 py-10">
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

    <div class="mt-12 max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
      <div class="md:col-span-2 bg-white shadow rounded-xl p-6">
        <h2
          class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"
        >
          <Icon icon="mdi:clock-outline" class="text-indigo-600 text-2xl" />
          Últimos Medicamentos Ingresados
        </h2>

        <table class="w-full text-sm text-left border">
          <thead class="bg-gray-100 text-gray-600">
            <tr>
              <th class="p-2">Nombre</th>
              <th class="p-2">Ingreso</th>
              <th class="p-2">Vencimiento</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="m in ultimosPaginados"
              :key="m.id"
              class="border-t hover:bg-gray-50"
            >
              <td class="p-2">{{ m.nombre }}</td>
              <td class="p-2">{{ m.fechaIngreso }}</td>
              <td class="p-2">{{ m.vencimiento }}</td>
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
          ✅ No hay productos en riesgo.
        </div>
        <ul v-else class="space-y-2 text-sm">
          <li
            v-for="m in proximosVencidos"
            :key="m.id"
            class="p-3 rounded-lg border flex items-center gap-2"
            :class="{
              'bg-red-50 border-red-200': new Date(m.vencimiento) < new Date(),
              'bg-yellow-50 border-yellow-200':
                new Date(m.vencimiento) >= new Date(),
            }"
          >
            <Icon
              :icon="
                new Date(m.vencimiento) < new Date()
                  ? 'mdi:close-circle'
                  : 'mdi:alert'
              "
              class="text-lg"
              :class="
                new Date(m.vencimiento) < new Date()
                  ? 'text-red-600'
                  : 'text-yellow-600'
              "
            />
            <div>
              <p class="font-medium text-gray-800">{{ m.nombre }}</p>
              <p class="text-xs text-gray-500">Vence {{ m.vencimiento }}</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
