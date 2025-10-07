<script setup>
import { ref, watchEffect, onMounted, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { GridLayout, GridItem } from 'vue3-grid-layout'
import {
  getMedicamentosByUbicacion,
  getNivelesByUbicacion,
  createNivel,
  deleteNivel,
  updateNivel,
} from '~/services/inventarioService'
import {
  updateUbicacion,
} from '~/services/inventarioService'
const props = defineProps({
  seccion: { type: Object, required: true },
})
const emit = defineEmits(['cerrar', 'actualizarZ'])

// ===========================
// 🔹 Estado general
// ===========================
const layout = ref([])
const niveles = ref([])
const medicamentos = ref([])
const cargando = ref(false)
const cargandoNiveles = ref(false)
const error = ref(null)
const nivelDetalle = ref(null)
const modoEdicion = ref(false)
const nivelSeleccionado = ref(null)
const mostrarModalNivel = ref(false)

const abrirDetalleNivel = (nivel) => {
  if (modoEdicion.value) return // 🚫 si está en edición, no hace nada
  nivelSeleccionado.value = nivel
  mostrarModalNivel.value = true
  console.log('📦 Abriendo detalle del nivel:', nivel.nombre)
}

// ===========================
// 🔹 Cargar medicamentos
// ===========================
const cargarMedicamentos = async () => {
  if (!props.seccion?.id) return
  cargando.value = true
  try {
    const data = await getMedicamentosByUbicacion(props.seccion.id)

    console.group('💊 Medicamentos recibidos desde API')
    console.log('🧾 Data completa:', data)
    console.table(data?.medicamentos || [])
    console.groupEnd()

    medicamentos.value = data?.medicamentos || []

    // Verifica las claves presentes
    if (medicamentos.value.length) {
      const keys = Object.keys(medicamentos.value[0])
      console.log('🔑 Claves del primer medicamento:', keys)
    } else {
      console.warn('⚠️ No se recibieron medicamentos para esta ubicación.')
    }

  } catch (err) {
    console.error('❌ Error al cargar medicamentos:', err)
    error.value = 'Error al cargar medicamentos'
  } finally {
    cargando.value = false
  }
}


// ===========================
// 🔹 Cargar niveles
// ===========================
const cargarNiveles = async () => {
  if (!props.seccion?.id) return
  cargandoNiveles.value = true
  try {
    const data = await getNivelesByUbicacion(props.seccion.id)
    niveles.value = data || []
    actualizarLayout()
  } catch (err) {
    console.error('❌ Error al cargar niveles:', err)
  } finally {
    cargandoNiveles.value = false
  }
}

// ===========================
// 🔹 Generar layout según niveles
// ===========================
const actualizarLayout = () => {
  layout.value = niveles.value.map((n) => ({
    i: String(n.id),
    x: n.x ?? 0,           // ✅ usar valor guardado o 0
    y: n.y ?? n.orden - 1, // ✅ usar valor guardado o el orden como fallback
    w: n.ancho ?? 1,
    h: n.alto ?? 1,
  }))
}


// ===========================
// 🔹 Crear nivel
// ===========================
const agregarNivel = async () => {
  try {
    const nuevoNivel = await createNivel({
      nombre: `Nivel ${niveles.value.length + 1}`,
      idUbicacion: props.seccion.id,
      orden: niveles.value.length + 1,
      ancho: 1,
      alto: 1,
      offsetY: 0,
      x: 0, // ✅ posición inicial
      y: niveles.value.length, // ✅ fila lógica
    })
    niveles.value.push(nuevoNivel)
    actualizarLayout()
  } catch (err) {
    console.error('❌ Error al crear nivel:', err)
  }
}


// ===========================
// 🔹 Eliminar nivel
// ===========================
const eliminarNivel = async (idNivel) => {
  try {
    await deleteNivel(idNivel)
    niveles.value = niveles.value.filter((n) => n.id !== idNivel)
    actualizarLayout()
  } catch (err) {
    console.error('❌ Error al eliminar nivel:', err)
  }
}

// ===========================
// 🔹 Actualizar nivel (ej. al mover o redimensionar)
// ===========================
const onLayoutUpdated = async (newLayout) => {
  for (const item of newLayout) {
    const nivel = niveles.value.find((n) => n.id === item.i)
    if (nivel) {
      nivel.x = item.x
      nivel.y = item.y
      nivel.ancho = item.w
      nivel.alto = item.h
      nivel.orden = item.y + 1 // o lo que uses para la “altura lógica”

      await updateNivel(item.i, {
        ancho: nivel.ancho,
        alto: nivel.alto,
        orden: nivel.orden,
        x: nivel.x,
        y: nivel.y,
      })
    }
  }
}

// ===========================
// 🔹 Totales de medicamentos
// ===========================
const totalMedicamentos = computed(() => medicamentos.value.length)
const totalUnidades = computed(() =>
  medicamentos.value.reduce((sum, m) => sum + (m.cantidad || 0), 0)
)

// ===========================
// 🔹 Ciclo de vida
// ===========================
onMounted(() => {
  cargarMedicamentos()
  cargarNiveles()
})

watch(modoEdicion, async (nuevoValor, anterior) => {
  if (anterior === true && nuevoValor === false) {
    // Al salir del modo edición, guardar los cambios
    console.log('💾 Guardando posiciones de niveles...')
    await onLayoutUpdated(layout.value)
  }
})
watch(
  niveles,
  async (nuevosNiveles) => {
    if (!props.seccion?.id) return
    const cantidad = nuevosNiveles.length
    const nuevoZ = cantidad * 90

    if (props.seccion.z === nuevoZ) return

    props.seccion.z = nuevoZ

    try {
      console.log(`📏 Actualizando Z de ubicación (${props.seccion.descripcion}): ${nuevoZ}`)
      await updateUbicacion(props.seccion.id, { z: nuevoZ })

      // 🔹 Nuevo: avisa al padre que la altura cambió
      emit('actualizarZ', { id: props.seccion.id, z: nuevoZ })
    } catch (err) {
      console.error('❌ Error al actualizar Z de ubicación:', err)
    }
  },
  { deep: true }
)
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

              <div class="flex items-center gap-2">
                <!-- Botón modo edición -->
                <button
                  @click="modoEdicion = !modoEdicion"
                  :class="[
                    'px-3 py-1 rounded text-sm flex items-center gap-1 font-medium',
                    modoEdicion
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  ]"
                >
                  <Icon
                    :icon="modoEdicion ? 'mdi:content-save-outline' : 'mdi:pencil-outline'"
                    class="w-4 h-4"
                  />
                  {{ modoEdicion ? 'Guardar' : 'Editar' }}
                </button>

                <!-- Botón crear nivel -->
                <button
                  @click="agregarNivel"
                  class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1"
                >
                  <Icon icon="mdi:plus-circle" class="w-4 h-4" />
                  Nivel
                </button>
              </div>
            </div>


            <div class="relative flex-1 min-h-0 overflow-auto rounded">
              <ClientOnly>
                <GridLayout
                  v-model:layout="layout"
                  :col-num="4"
                  :row-height="120"
                  :margin="[10, 10]"
                  :is-draggable="modoEdicion"
                  :is-resizable="modoEdicion"
                  :vertical-compact="true"
                  class="bg-gray-100 p-2 rounded min-h-full border border-dashed border-indigo-200"
                  @layout-updated="onLayoutUpdated"
                >

                  <GridItem
                    v-for="nivel in niveles"
                    :key="nivel.id"
                    :i="String(nivel.id)"
                    :x="layout.find(l => l.i === String(nivel.id))?.x"
                    :y="layout.find(l => l.i === String(nivel.id))?.y"
                    :w="layout.find(l => l.i === String(nivel.id))?.w"
                    :h="layout.find(l => l.i === String(nivel.id))?.h"
                    @click="abrirDetalleNivel(nivel)"
                    class="bg-white border rounded-lg shadow-sm p-3 relative flex flex-col items-center justify-center hover:shadow-md transition cursor-pointer"
                  >
                    <button
                      @click.stop="eliminarNivel(nivel.id)"
                      class="absolute top-2 right-2 text-red-500 hover:text-red-600"
                    >
                      <Icon icon="mdi:trash-can-outline" class="w-5 h-5" />
                    </button>
                    <h4 class="text-center font-semibold text-indigo-700">
                      {{ nivel.nombre }}
                    </h4>
                  </GridItem>
                </GridLayout>
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 💊 Modal de detalle de nivel -->


  </transition>
      <transition name="fade">
      <div
        v-if="mostrarModalNivel"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60]"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn"
        >
          <div class="flex justify-between items-center border-b px-5 py-3 bg-indigo-600 text-white">
            <h3 class="font-semibold text-lg flex items-center gap-2">
              <Icon icon="mdi:layers" class="w-5 h-5" />
              {{ nivelSeleccionado?.nombre }}
            </h3>
            <button @click="mostrarModalNivel = false" class="hover:text-gray-200">
              <Icon icon="mdi:close" class="w-6 h-6" />
            </button>
          </div>

          <div class="p-5 flex-1 overflow-y-auto">
            <template v-if="!nivelSeleccionado">
              <p class="text-gray-500 text-center py-10">Selecciona un nivel</p>
            </template>

            <template v-else>
              <h4 class="font-semibold text-indigo-700 mb-3 flex items-center gap-1">
                <Icon icon="mdi:pill-multiple" class="w-5 h-5" />
                Medicamentos en este nivel
              </h4>

              <div v-if="!medicamentos.length" class="text-gray-500 text-center py-6">
                <Icon icon="mdi:package-variant" class="w-5 h-5 inline-block mr-1 text-gray-400" />
                No hay medicamentos registrados en este nivel
              </div>

              <ul v-else class="divide-y divide-gray-200 text-sm">
                <li
                  v-for="med in medicamentos.filter(m => m.idNivel === nivelSeleccionado.id)"
                  :key="med.id"
                  class="py-2 flex justify-between items-center"
                >
                  <div class="text-gray-700 font-medium truncate">{{ med.nombre }}</div>
                  <div class="text-gray-500 text-xs">
                    {{ med.vencimiento ? new Date(med.vencimiento).toLocaleDateString() : '—' }}
                  </div>
                  <span class="font-semibold text-indigo-600 text-sm">{{ med.cantidad }}</span>
                </li>
              </ul>
            </template>
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
