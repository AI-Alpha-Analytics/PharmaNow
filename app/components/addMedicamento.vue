<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  medicamentos: Array,
  medicamentosExistentes: { type: Array, default: () => [] },
})

const paso = ref(1)

const nombre = ref('')
const nuevoNombre = ref('')
const creandoNuevo = ref(false)
const mostrarOpciones = ref(false)

const resultados = computed(() => {
  if (!nombre.value) return props.medicamentosExistentes
  return props.medicamentosExistentes.filter((m) =>
    m.nombre.toLowerCase().includes(nombre.value.toLowerCase())
  )
})

const seleccionar = (valor) => {
  if (valor === '_nuevo') {
    creandoNuevo.value = true
    nombre.value = ''
  } else {
    creandoNuevo.value = false
    nombre.value = valor
  }
  mostrarOpciones.value = false
}

const medicamentoExistente = computed(() =>
  props.medicamentosExistentes.find(
    (m) =>
      m.nombre?.toLowerCase() ===
      (creandoNuevo.value ? nuevoNombre.value : nombre.value).toLowerCase()
  )
)

const loteId = ref('')
const loteEmision = ref('')
const loteVencimiento = ref('')
const loteCantidad = ref(0)

const emit = defineEmits(['guardar', 'cerrar'])

const siguiente = () => {
  const nombreFinal = creandoNuevo.value ? nuevoNombre.value : nombre.value
  if (!nombreFinal) return
  paso.value = 2
}

const guardar = () => {
  if (
    !loteId.value ||
    !loteEmision.value ||
    !loteVencimiento.value ||
    !loteCantidad.value
  )
    return

  const nuevoLote = {
    id: loteId.value,
    emision: loteEmision.value,
    vencimiento: loteVencimiento.value,
    cantidad: loteCantidad.value,
    progreso: 100,
    color: 'bg-green-500',
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
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1"
            >Medicamento</label
          >
          <input
            v-model="nombre"
            type="text"
            placeholder="Buscar o escribir..."
            @focus="mostrarOpciones = true"
            class="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />

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
            <li
              @click="seleccionar('_nuevo')"
              class="px-3 py-2 text-green-600 font-medium hover:bg-green-50 cursor-pointer flex items-center gap-2 border-t"
            >
              <Icon icon="mdi:plus-circle" class="text-green-600" />
              Nuevo medicamento
            </li>
          </ul>
        </div>

        <div v-if="creandoNuevo" class="mt-2">
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Nombre del nuevo medicamento
          </label>
          <input
            v-model="nuevoNombre"
            type="text"
            class="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ej: Amoxicilina 500mg"
          />
        </div>

        <div class="flex justify-end gap-3 pt-4">
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
      </form>

      <form v-else @submit.prevent="guardar" class="space-y-5">
        <h4 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Icon
            icon="mdi:clipboard-list-outline"
            class="text-indigo-600 text-2xl"
          />
          Datos del Lote
        </h4>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1"
            >Número de Serie (ID)</label
          >
          <input
            v-model="loteId"
            type="text"
            class="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ej: L-12345"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1"
              >Fecha Emisión</label
            >
            <input
              v-model="loteEmision"
              type="date"
              class="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1"
              >Fecha Vencimiento</label
            >
            <input
              v-model="loteVencimiento"
              type="date"
              class="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1"
            >Cantidad</label
          >
          <input
            v-model="loteCantidad"
            type="number"
            min="1"
            class="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div class="flex justify-between pt-4">
          <button
            type="button"
            @click="paso = 1"
            class="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow hover:bg-gray-300 transition"
          >
            <Icon icon="mdi:arrow-left" /> Atrás
          </button>
          <button
            type="submit"
            class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
          >
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
