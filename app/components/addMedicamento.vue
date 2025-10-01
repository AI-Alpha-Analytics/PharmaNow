<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { Icon } from '@iconify/vue'

import { useInventarioSocket } from '~/composables/useInventarioSocket'
const { fetchBodegas, fetchUbicacionesByBodega, bodegas } = useInventarioSocket()

const props = defineProps({
  medicamentos: Array,
  medicamentosExistentes: { type: Array, default: () => [] },
})

const paso = ref(1)
const nombre = ref('')
const nuevoNombre = ref('')
const creandoNuevo = ref(false)
const mostrarOpciones = ref(false)
const error = ref('')

const bodegaSeleccionada = ref('')
const ubicacionSeleccionada = ref('')
const ubicacionesDeBodega = ref([])

watch(bodegaSeleccionada, async (nuevoId) => {
  if (nuevoId) {
    ubicacionesDeBodega.value = await fetchUbicacionesByBodega(nuevoId)
    ubicacionSeleccionada.value = ''
  } else {
    ubicacionesDeBodega.value = []
  }
})

const loteId = ref('')
const loteEmision = ref('')
const loteVencimiento = ref('')
const loteCantidad = ref(0)

const resultados = computed(() => {
  if (!nombre.value) return props.medicamentosExistentes
  return props.medicamentosExistentes.filter((m) =>
    m.nombre.toLowerCase().includes(nombre.value.toLowerCase())
  )
})

const seleccionar = (valor) => {
  creandoNuevo.value = valor === '_nuevo'
  nombre.value = creandoNuevo.value ? '' : valor
  error.value = ''
  mostrarOpciones.value = false
}

const medicamentoExistente = computed(() =>
  props.medicamentosExistentes.find(
    (m) =>
      m.nombre?.toLowerCase() ===
      (creandoNuevo.value ? nuevoNombre.value : nombre.value).toLowerCase()
  )
)

const emit = defineEmits(['guardar', 'cerrar'])
const dropdownWrapper = ref(null)
const handleClickOutside = (e) => {
  if (dropdownWrapper.value && !dropdownWrapper.value.contains(e.target)) {
    mostrarOpciones.value = false
  }
}
onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  await fetchBodegas()
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const siguiente = () => {
  error.value = ''
  const nombreFinal = creandoNuevo.value ? nuevoNombre.value : nombre.value
  if (!nombreFinal) {
    error.value = 'Debes seleccionar o crear un medicamento.'
    return
  }
  paso.value = 2
}

const guardar = () => {
  if (
    !loteId.value ||
    !loteEmision.value ||
    !loteVencimiento.value ||
    !loteCantidad.value ||
    !bodegaSeleccionada.value ||
    !ubicacionSeleccionada.value
  ) {
    alert("Faltan campos obligatorios")
    return
  }

  const nuevoLote = {
    id: loteId.value,
    emision: loteEmision.value,
    vencimiento: loteVencimiento.value,
    cantidad: loteCantidad.value,
    idBodega: bodegaSeleccionada.value,
    idUbicacion: ubicacionSeleccionada.value,
    idProducto: medicamentoExistente.value?.id ?? null,
  }

  if (medicamentoExistente.value) {
    emit('guardar', {
      tipo: 'lote',
      id: medicamentoExistente.value.id,
      lote: nuevoLote,
    })
  } else {
    const nuevoMedicamento = {
      id: Date.now(),
      nombre: creandoNuevo.value ? nuevoNombre.value : nombre.value,
      cantidadTotal: loteCantidad.value,
      lotes: [nuevoLote],
    }
    emit('guardar', { tipo: 'medicamento', data: nuevoMedicamento })
  }

  emit('cerrar')
}
</script>

<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
  >
    <div
      class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg animate-fadeIn"
    >
      <h3
        class="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-2"
      >
        <Icon icon="mdi:pill" class="text-indigo-600 text-3xl" />
        Agregar Medicamento
      </h3>

      <form
        v-if="paso === 1"
        @submit.prevent="siguiente"
        class="space-y-5 relative"
      >
        <div v-if="!creandoNuevo" class="dropdown-wrapper">
          <div ref="dropdownWrapper" class="dropdown-wrapper relative">
            <label class="block text-sm font-semibold text-gray-700 mb-1">
              Medicamento
            </label>
            <input
              v-model="nombre"
              type="text"
              placeholder="Buscar..."
              @focus="mostrarOpciones = true"
              class="w-full border rounded-lg p-2 focus:ring-2"
              :class="error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'"
            />
            <p v-if="error" class="mt-1 text-sm text-red-600 flex items-center gap-1">
              <Icon icon="mdi:alert-circle" class="text-base" />
              {{ error }}
            </p>

            <ul
              v-if="mostrarOpciones"
              class="absolute mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50"
            >
              <li
                v-for="m in resultados"
                :key="m.id"
                @click="seleccionar(m.nombre)"
                class="px-3 py-2 hover:bg-indigo-50 cursor-pointer flex items-center gap-2"
              >
                <Icon icon="mdi:pill" class="text-indigo-500" /> {{ m.nombre }}
              </li>
            </ul>
          </div>
        </div>

        <div v-else>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Nombre del nuevo medicamento
          </label>
          <input
            v-model="nuevoNombre"
            type="text"
            placeholder="Ej: Amoxicilina 500mg"
            class="w-full border rounded-lg p-2 focus:ring-2"
            :class="error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'"
          />
          <p v-if="error" class="mt-1 text-sm text-red-600 flex items-center gap-1">
            <Icon icon="mdi:alert-circle" class="text-base" />
            {{ error }}
          </p>
        </div>

        <div class="flex justify-between pt-4">
          <button
            v-if="!creandoNuevo"
            type="button"
            @click="creandoNuevo = true; nombre=''; error=''; mostrarOpciones=false"
            class="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg shadow hover:bg-green-200 transition"
          >
            <Icon icon="mdi:plus-circle" /> Nuevo medicamento
          </button>

          <div class="flex gap-3 ml-auto">
            <button
              type="button"
              @click="emit('cerrar')"
              class="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow hover:bg-gray-300 transition"
            >
              <Icon icon="mdi:close" /> Cancelar
            </button>
            <button
              type="submit"
              class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
            >
              <Icon icon="mdi:arrow-right" /> Siguiente
            </button>
          </div>
        </div>
      </form>

      <form v-else @submit.prevent="guardar" class="space-y-5">
        <h4 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Icon icon="mdi:clipboard-list-outline" class="text-indigo-600 text-2xl" />
          Datos del Lote
        </h4>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Número de Serie (ID)</label>
          <input v-model="loteId" type="text" class="w-full border rounded-lg p-2" placeholder="Ej: L-12345" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Fecha Emisión</label>
            <input v-model="loteEmision" type="date" class="w-full border rounded-lg p-2" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Fecha Vencimiento</label>
            <input v-model="loteVencimiento" type="date" class="w-full border rounded-lg p-2" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Cantidad</label>
          <input v-model="loteCantidad" type="number" min="1" class="w-full border rounded-lg p-2" />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Bodega</label>
          <select v-model="bodegaSeleccionada" class="w-full border rounded-lg p-2">
            <option disabled value="">Selecciona una bodega</option>
            <option v-for="b in bodegas" :key="b.id" :value="b.id">{{ b.nombre }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Ubicación</label>
          <select v-model="ubicacionSeleccionada" class="w-full border rounded-lg p-2">
            <option disabled value="">Selecciona una ubicación</option>
            <option v-for="u in ubicacionesDeBodega" :key="u.id" :value="u.id">{{ u.descripcion }}</option>
          </select>
        </div>

        <div class="flex justify-between pt-4">
          <button type="button" @click="paso = 1" class="px-4 py-2 bg-gray-200 rounded-lg">
            <Icon icon="mdi:arrow-left" /> Atrás
          </button>
          <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-lg">
            <Icon icon="mdi:content-save" /> Guardar
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
</style>
