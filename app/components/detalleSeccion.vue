<script setup>
import { ref, watchEffect, onMounted, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { GridLayout, GridItem } from 'vue3-grid-layout'
import { getMedicamentosByUbicacion } from '~/services/inventarioService'

const props = defineProps({
  seccion: { type: Object, required: true },
})
const emit = defineEmits(['cerrar'])

const layout = ref([])
const nivelDetalle = ref(null)
const medicamentos = ref([])
const cargando = ref(false)
const error = ref(null)

// 🔹 Cargar medicamentos desde el backend
const cargarMedicamentos = async () => {
  if (!props.seccion?.id) return
  cargando.value = true
  error.value = null
  try {
    const data = await getMedicamentosByUbicacion(props.seccion.id)
    medicamentos.value = data?.medicamentos || []
  } catch (err) {
    console.error('❌ Error al cargar medicamentos:', err)
    error.value = 'Error al cargar medicamentos'
  } finally {
    cargando.value = false
  }
}

// 🔹 Calcular totales de esta ubicación
const totalMedicamentos = computed(() => medicamentos.value.length)
const totalUnidades = computed(() =>
  medicamentos.value.reduce((sum, m) => sum + (m.cantidad || 0), 0)
)

// 🔹 Layout dinámico
watchEffect(() => {
  if (!props.seccion) return
  if (!props.seccion.subniveles) props.seccion.subniveles = []

  layout.value = props.seccion.subniveles.map((n, i) => ({
    i: String(n.id),
    x: i % 4,
    y: Math.floor(i / 4),
    w: 1,
    h: 1,
  }))
})

// 🔹 Métodos
const agregarNivel = () => {
  const id = Date.now()
  props.seccion.subniveles.push({
    id,
    nombre: `Nivel ${props.seccion.subniveles.length + 1}`,
    medicamentos: [],
  })
  layout.value.push({ i: String(id), x: 0, y: Infinity, w: 1, h: 1 })
}

const eliminarNivel = (id) => {
  props.seccion.subniveles = props.seccion.subniveles.filter((n) => n.id !== id)
  layout.value = layout.value.filter((l) => l.i !== String(id))
}

const abrirDetalleNivel = (nivel) => (nivelDetalle.value = nivel)
const cerrarDetalleNivel = () => (nivelDetalle.value = null)

onMounted(() => {
  cargarMedicamentos()
})
</script>

<template>
  <transition name="fade">
    <div
      v-if="seccion"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-7xl max-h-[95vh] overflow-hidden relative flex flex-col animate-fadeIn"
      >
        <!-- 🔘 Botón cerrar -->
        <button
          class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
          @click="emit('cerrar')"
        >
          <Icon icon="mdi:close" class="w-6 h-6" />
        </button>

        <!-- 🔷 Título -->
        <h2 class="text-2xl font-extrabold text-indigo-700 flex items-center gap-2 mb-4">
          <Icon icon="mdi:warehouse" class="w-7 h-7 text-indigo-600" />
          {{ seccion?.descripcion || 'Sección sin nombre' }}
        </h2>

        <p class="text-sm text-gray-500 mb-6">
          ID: <span class="font-mono text-gray-700">{{ seccion.id }}</span>
        </p>

        <div class="grid grid-cols-10 gap-6 flex-1 min-h-0">
          <!-- 📋 Panel izquierdo -->
          <div class="col-span-10 md:col-span-3 flex flex-col gap-6 min-h-0">
            <!-- Información general -->
            <div class="bg-gray-50 rounded-xl p-4 border border-indigo-100 shadow-sm">
              <h3 class="font-semibold text-indigo-700 mb-3 flex items-center gap-2">
                <Icon icon="mdi:information-outline" class="w-5 h-5" />
                Información general
              </h3>

              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600 flex items-center gap-1">
                    <Icon icon="mdi:map-marker" class="w-4 h-4 text-indigo-500" />
                    Posición (X, Y):
                  </span>
                  <span class="font-semibold text-gray-800">
                    {{ Math.round(seccion.x) }}, {{ Math.round(seccion.y) }}
                  </span>
                </div>

                <div class="flex justify-between">
                  <span class="text-gray-600 flex items-center gap-1">
                    <Icon icon="mdi:ruler-square" class="w-4 h-4 text-indigo-500" />
                    Dimensiones:
                  </span>
                  <span class="font-semibold text-gray-800">
                    {{ seccion.width }} × {{ seccion.height }}
                  </span>
                </div>

                <div class="pt-3 border-t border-gray-200 mt-3 text-sm space-y-1">
                  <div class="flex items-center gap-1 text-indigo-700 font-medium">
                    <Icon icon="mdi:clipboard-list-outline" class="w-4 h-4" />
                    Totales en esta ubicación:
                  </div>
                  <div class="flex justify-between text-gray-700">
                    <span>Medicamentos únicos:</span>
                    <strong>{{ totalMedicamentos }}</strong>
                  </div>
                  <div class="flex justify-between text-gray-700">
                    <span>Unidades totales:</span>
                    <strong>{{ totalUnidades }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tabla de medicamentos -->
            <div class="bg-gray-50 rounded-xl p-4 border border-indigo-100 shadow-sm flex flex-col flex-1 min-h-0">
              <h3 class="font-semibold text-indigo-700 mb-4 flex items-center gap-2">
                <Icon icon="mdi:pill" class="w-5 h-5" />
                Medicamentos
              </h3>

              <!-- Estado de carga -->
              <div v-if="cargando" class="flex-1 flex items-center justify-center text-gray-500">
                <Icon icon="mdi:loading" class="w-6 h-6 animate-spin mr-2" />
                Cargando medicamentos...
              </div>

              <!-- Error -->
              <div v-else-if="error" class="text-red-500 text-sm text-center">
                {{ error }}
              </div>

              <!-- Sin datos -->
              <div v-else-if="!medicamentos.length" class="text-gray-500 text-center py-6">
                <Icon icon="mdi:package-variant" class="w-5 h-5 inline-block text-gray-400 mr-1" />
                No hay medicamentos almacenados
              </div>

              <!-- Tabla -->
              <div v-else class="flex-1 overflow-y-auto overflow-x-hidden rounded border border-gray-200">
                <table class="w-full text-sm table-fixed">
                  <thead class="bg-indigo-600 text-white sticky top-0">
                    <tr>
                      <th class="p-2 text-left w-1/2 font-semibold">Nombre</th>
                      <th class="p-2 text-left w-1/4 font-semibold">Vencimiento</th>
                      <th class="p-2 text-right w-1/4 font-semibold">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="med in medicamentos"
                      :key="med.id"
                      class="border-b last:border-0 hover:bg-indigo-50 transition"
                    >
                      <td class="p-2 text-gray-800 truncate" :title="med.nombre">{{ med.nombre }}</td>
                      <td class="p-2 text-gray-600">
                        {{ med.vencimiento ? new Date(med.vencimiento).toLocaleDateString() : '—' }}
                      </td>
                      <td class="p-2 text-right font-semibold text-indigo-700">{{ med.cantidad }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 📦 Panel derecho -->
          <div
            class="col-span-10 md:col-span-7 bg-gray-50 rounded-xl p-4 border border-indigo-100 shadow-sm flex flex-col min-h-0"
          >
            <div class="flex justify-between items-center mb-3 shrink-0">
              <h3 class="font-semibold text-indigo-700 flex items-center gap-2">
                <Icon icon="mdi:view-split-vertical" class="w-5 h-5" />
                Distribución física
              </h3>
              <button
                @click="agregarNivel"
                class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1"
              >
                <Icon icon="mdi:plus-circle" class="w-4 h-4" />
                Nivel
              </button>
            </div>

            <div class="relative flex-1 min-h-0 overflow-auto rounded">
              <ClientOnly>
                <GridLayout
                  v-model:layout="layout"
                  :col-num="4"
                  :row-height="120"
                  :margin="[10, 10]"
                  :is-draggable="true"
                  :is-resizable="true"
                  :vertical-compact="true"
                  class="bg-gray-100 p-2 rounded min-h-full border border-dashed border-indigo-200"
                >
                  <GridItem
                    v-for="nivel in seccion.subniveles"
                    :key="nivel.id"
                    :i="String(nivel.id)"
                    :x="layout.find((l) => l.i === String(nivel.id))?.x"
                    :y="layout.find((l) => l.i === String(nivel.id))?.y"
                    :w="layout.find((l) => l.i === String(nivel.id))?.w"
                    :h="layout.find((l) => l.i === String(nivel.id))?.h"
                    class="bg-white border rounded-lg shadow-sm p-3 relative cursor-pointer flex flex-col items-center justify-center hover:shadow-md transition"
                    @dblclick="abrirDetalleNivel(nivel)"
                  >
                    <button
                      @click.stop="eliminarNivel(nivel.id)"
                      class="absolute top-2 right-2 text-red-500 hover:text-red-600"
                    >
                      <Icon icon="mdi:trash-can-outline" class="w-5 h-5" />
                    </button>
                    <h4 class="text-center font-semibold text-indigo-700">{{ nivel.nombre }}</h4>
                    <p class="text-sm text-gray-500 text-center">
                      {{ nivel.medicamentos?.length || 0 }} medicamentos
                    </p>
                  </GridItem>
                </GridLayout>
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
