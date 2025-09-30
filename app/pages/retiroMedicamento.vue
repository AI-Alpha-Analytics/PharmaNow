<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'

const medicamentos = ref([
  {
    id: 1,
    nombre: 'Paracetamol 500mg',
    lotes: [
      {
        id: 'L-12345',
        vencimiento: '2025-01-01',
        cantidad: 10,
        ubicacion: 'Estante A1',
      },
      {
        id: 'L-12346',
        vencimiento: '2026-05-10',
        cantidad: 50,
        ubicacion: 'Estante B2',
      },
    ],
  },
  {
    id: 2,
    nombre: 'Ibuprofeno 400mg',
    lotes: [
      {
        id: 'L-98765',
        vencimiento: '2024-09-01',
        cantidad: 30,
        ubicacion: 'Estante C1',
      },
    ],
  },
  {
    id: 3,
    nombre: 'Amoxicilina 875mg',
    lotes: [
      {
        id: 'L-55555',
        vencimiento: '2026-02-20',
        cantidad: 20,
        ubicacion: 'Estante D3',
      },
    ],
  },
])

// Estados
const busqueda = ref('')
const medicamentoSeleccionado = ref(null)
const cantidadSolicitada = ref(0)
const retiros = ref([]) // listado final
const mensajeError = ref('')

// Filtro
const medicamentosFiltrados = computed(() => {
  if (!busqueda.value) return medicamentos.value
  return medicamentos.value.filter((m) =>
    m.nombre.toLowerCase().includes(busqueda.value.toLowerCase())
  )
})
const seleccionarMedicamento = (m) => {
  medicamentoSeleccionado.value = m
  busqueda.value = m.nombre
}

// Stock disponible
const stockDisponible = computed(() => {
  if (!medicamentoSeleccionado.value) return 0
  return medicamentoSeleccionado.value.lotes.reduce(
    (acc, l) => acc + l.cantidad,
    0
  )
})

// Calcular plan de retiro por lotes
const calcularPlan = () => {
  if (!medicamentoSeleccionado.value) return []
  let cantidad = cantidadSolicitada.value
  const ordenados = [...medicamentoSeleccionado.value.lotes].sort(
    (a, b) => new Date(a.vencimiento) - new Date(b.vencimiento)
  )
  const resultado = []
  for (const lote of ordenados) {
    if (cantidad <= 0) break
    const retirar = Math.min(lote.cantidad, cantidad)
    if (retirar > 0) {
      resultado.push({ ...lote, retirar })
      cantidad -= retirar
    }
  }
  return resultado
}

// Agregar medicamento al listado
const agregarMedicamento = () => {
  if (!medicamentoSeleccionado.value || cantidadSolicitada.value <= 0) return
  if (cantidadSolicitada.value > stockDisponible.value) {
    mensajeError.value = `⚠️ No puedes retirar ${cantidadSolicitada.value}, máximo ${stockDisponible.value}.`
    return
  }
  mensajeError.value = ''
  retiros.value.push({
    nombre: medicamentoSeleccionado.value.nombre,
    plan: calcularPlan(),
  })
  // reset
  medicamentoSeleccionado.value = null
  busqueda.value = ''
  cantidadSolicitada.value = 0
}

// Eliminar un medicamento del listado
const eliminarRetiro = (index) => {
  retiros.value.splice(index, 1)
}

// Confirmar retiro final
const confirmarBoleta = () => {
  alert(`Retiro confirmado:\n${JSON.stringify(retiros.value, null, 2)}`)
}
</script>

<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- Título -->
    <h1 class="text-3xl font-bold mb-8 flex items-center gap-2 text-gray-800">
      <Icon icon="mdi:clipboard-list" class="text-indigo-600 text-4xl" />
      Retiro de Medicamentos
    </h1>

    <!-- Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-10 gap-8">
      <!-- Izquierda -->
      <div class="lg:col-span-7 space-y-6">
        <!-- Buscador -->
        <div>
          <label
            class="font-semibold text-gray-800 flex items-center gap-2 mb-2"
          >
            <Icon icon="mdi:magnify" class="text-indigo-600 text-xl" />
            Buscar medicamento
          </label>
          <div class="relative w-full max-w-full">
            <input
              type="text"
              v-model="busqueda"
              placeholder="Ej: Paracetamol, Ibuprofeno..."
              class="p-3 border rounded-lg w-full pr-10 focus:ring-2 focus:ring-indigo-500"
            />
            <Icon
              icon="mdi:medical-bag"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
            />

            <!-- Resultados -->
            <ul
              v-if="
                busqueda &&
                medicamentosFiltrados.length &&
                !medicamentoSeleccionado
              "
              class="absolute left-0 top-full z-10 w-full bg-white border rounded-lg shadow mt-1 max-h-56 overflow-y-auto divide-y"
            >
              <li
                v-for="m in medicamentosFiltrados"
                :key="m.id"
                @click="seleccionarMedicamento(m)"
                class="px-4 py-2 cursor-pointer hover:bg-indigo-50 flex items-center gap-2 truncate"
              >
                <Icon icon="mdi:pill" class="text-indigo-500" />
                <span class="truncate">{{ m.nombre }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Cantidad y plan previo -->
        <div
          v-if="medicamentoSeleccionado"
          class="bg-gray-50 p-5 rounded-lg border shadow-sm space-y-4"
        >
          <h2 class="font-semibold text-gray-800 flex items-center gap-2">
            <Icon icon="mdi:counter" class="text-indigo-600 text-xl" />
            Cantidad a retirar
          </h2>
          <div class="relative">
            <input
              type="number"
              v-model.number="cantidadSolicitada"
              min="1"
              class="p-3 border rounded-lg w-full pr-10 focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej: 10"
            />
            <Icon
              icon="mdi:clipboard-text-outline"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
            />
          </div>
          <p
            v-if="cantidadSolicitada > stockDisponible"
            class="text-red-600 text-sm flex items-center gap-1"
          >
            <Icon icon="mdi:alert-circle" class="text-lg" />
            Stock insuficiente: máximo {{ stockDisponible }}
          </p>

          <!-- Vista previa del plan -->
          <div
            v-if="calcularPlan().length"
            class="bg-white p-4 rounded-lg border"
          >
            <h3
              class="text-sm font-semibold mb-2 flex items-center gap-1 text-gray-700"
            >
              <Icon icon="mdi:playlist-check" class="text-indigo-600" />
              Lotes afectados
            </h3>
            <ul class="space-y-1 text-sm text-gray-600">
              <li
                v-for="l in calcularPlan()"
                :key="l.id"
                class="flex items-center gap-2"
              >
                <Icon icon="mdi:check" class="text-green-600" />
                Retirar {{ l.retirar }} del lote <b>{{ l.id }}</b> (vence
                {{ l.vencimiento }}, en {{ l.ubicacion }})
              </li>
            </ul>
          </div>

          <button
            @click="agregarMedicamento"
            class="mt-2 w-full bg-green-600 text-white px-5 py-3 rounded-lg shadow-md hover:bg-green-700 flex items-center justify-center gap-2 font-semibold"
          >
            <Icon icon="mdi:plus-circle" class="text-xl" />
            Añadir al listado
          </button>
        </div>
      </div>

      <!-- Derecha (Listado final) -->
      <div class="lg:col-span-3">
        <div class="bg-white shadow-lg rounded-xl p-6 h-full flex flex-col">
          <!-- Título -->
          <h2
            class="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800"
          >
            <Icon icon="mdi:receipt-text" class="text-indigo-600 text-2xl" />
            Listado de Medicamentos
          </h2>

          <!-- Vacío -->
          <div
            v-if="!retiros.length"
            class="flex flex-col items-center text-gray-500 py-12"
          >
            <Icon
              icon="mdi:package-variant"
              class="text-6xl mb-4 text-gray-300"
            />
            <p class="text-sm">No hay medicamentos añadidos al listado.</p>
          </div>

          <!-- Listado -->
          <ul v-else class="flex-1 overflow-y-auto space-y-4 pr-1">
            <li
              v-for="(r, index) in retiros"
              :key="index"
              class="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:shadow-md transition"
            >
              <!-- Cabecera -->
              <div class="flex justify-between items-start mb-2">
                <p class="font-semibold text-gray-900 flex items-center gap-2">
                  <Icon icon="mdi:pill" class="text-indigo-500" />
                  {{ r.nombre }}
                </p>
                <button
                  @click="eliminarRetiro(index)"
                  class="text-red-500 hover:text-red-700 transition"
                  title="Eliminar"
                >
                  <Icon icon="mdi:close-circle-outline" class="text-2xl" />
                </button>
              </div>

              <!-- Lotes -->
              <ul class="ml-1 space-y-1 text-sm text-gray-600">
                <li
                  v-for="l in r.plan"
                  :key="l.id"
                  class="flex items-center gap-2 bg-white p-2 rounded border border-gray-100"
                >
                  <Icon
                    icon="mdi:check-circle"
                    class="text-green-600 text-lg"
                  />
                  <div>
                    <span class="font-medium text-gray-800">
                      Retirar {{ l.retirar }}
                    </span>
                    <span class="text-gray-500">
                      del lote <b>{{ l.id }}</b></span
                    >
                    <div class="text-xs text-gray-500 flex gap-3 mt-1">
                      <span class="flex items-center gap-1">
                        <Icon icon="mdi:calendar" class="text-gray-400" />
                        Vence: {{ l.vencimiento }}
                      </span>
                      <span class="flex items-center gap-1">
                        <Icon
                          icon="mdi:map-marker-outline"
                          class="text-gray-400"
                        />
                        {{ l.ubicacion }}
                      </span>
                    </div>
                  </div>
                </li>
              </ul>
            </li>
          </ul>

          <!-- Botón Confirmar -->
          <button
            v-if="retiros.length"
            @click="confirmarBoleta"
            class="mt-6 w-full bg-indigo-600 text-white px-5 py-3 rounded-lg shadow-md hover:bg-indigo-700 flex items-center justify-center gap-2 font-semibold transition"
          >
            <Icon icon="mdi:check-bold" class="text-xl" />
            Confirmar Retiro
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
