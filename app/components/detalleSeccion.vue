<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { GridLayout, GridItem } from 'vue3-grid-layout'

const props = defineProps({
  seccion: { type: Object, required: true },
})
const emit = defineEmits(['cerrar'])

const layout = ref(
  props.seccion.subniveles?.map((n, i) => ({
    i: String(n.id),
    x: i % 4,
    y: Math.floor(i / 4),
    w: 1,
    h: 1,
  })) || []
)

const nivelDetalle = ref(null)

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
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div
      class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-7xl max-h-[95vh] overflow-hidden relative flex flex-col"
    >
      <button
        class="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        @click="emit('cerrar')"
      >
        <Icon icon="mdi:close" class="w-6 h-6" />
      </button>

      <h2
        class="text-2xl font-bold text-indigo-700 flex items-center gap-2 mb-6"
      >
        <Icon icon="mdi:warehouse" class="w-6 h-6" />
        Detalle de {{ seccion.nombre }}
      </h2>

      <div class="grid grid-cols-10 gap-6 flex-1 min-h-0">
        <div class="col-span-10 md:col-span-3 flex flex-col gap-6 min-h-0">
          <div class="bg-gray-50 rounded-lg p-4 border">
            <h3
              class="font-semibold text-indigo-700 mb-3 flex items-center gap-2"
            >
              <Icon icon="mdi:information" class="w-5 h-5" /> Información
            </h3>
            <ul class="text-sm space-y-2">
              <li><strong>ID:</strong> {{ seccion.id }}</li>
              <li>
                <strong>Posición:</strong> X: {{ seccion.x }}, Y:
                {{ seccion.y }}
              </li>
              <li>
                <strong>Dimensiones:</strong> {{ seccion.width }} ×
                {{ seccion.height }}
              </li>
            </ul>
          </div>

          <div
            class="bg-gray-50 rounded-lg p-4 border flex flex-col flex-1 min-h-0"
          >
            <h3
              class="font-semibold text-indigo-700 mb-4 flex items-center gap-2"
            >
              <Icon icon="mdi:pill" class="w-5 h-5" /> Medicamentos
            </h3>
            <div v-if="!seccion.medicamentos?.length" class="text-gray-500">
              📦 Vacío
            </div>

            <div v-else class="flex-1 overflow-auto">
              <table class="w-full text-sm border rounded-lg">
                <thead class="bg-indigo-600 text-white sticky top-0">
                  <tr>
                    <th class="p-2 text-left">Nombre</th>
                    <th class="p-2 text-left">Lote</th>
                    <th class="p-2 text-left">Vencimiento</th>
                    <th class="p-2 text-left">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="med in seccion.medicamentos"
                    :key="med.id"
                    class="border-b hover:bg-indigo-50"
                  >
                    <td class="p-2">{{ med.nombre }}</td>
                    <td class="p-2">{{ med.lote }}</td>
                    <td class="p-2">{{ med.vencimiento }}</td>
                    <td class="p-2">{{ med.cantidad }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div
          class="col-span-10 md:col-span-7 bg-gray-50 rounded-lg p-4 border flex flex-col min-h-0"
        >
          <div class="flex justify-between items-center mb-3 shrink-0">
            <h3 class="font-semibold text-indigo-700 flex items-center gap-2">
              <Icon icon="mdi:view-split-vertical" class="w-5 h-5" />
              Distribución Física
            </h3>
            <button
              @click="agregarNivel"
              class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              <Icon icon="mdi:plus" class="w-4 h-4 inline-block" />
              Agregar nivel
            </button>
          </div>

          <div class="relative flex-1 min-h-0 overflow-auto rounded">
            <GridLayout
              v-model:layout="layout"
              :col-num="4"
              :row-height="120"
              :margin="[10, 10]"
              :is-draggable="true"
              :is-resizable="true"
              :vertical-compact="true"
              class="bg-gray-100 p-2 rounded min-h-full"
            >
              <GridItem
                v-for="nivel in seccion.subniveles"
                :key="nivel.id"
                :i="String(nivel.id)"
                :x="layout.find((l) => l.i === String(nivel.id))?.x"
                :y="layout.find((l) => l.i === String(nivel.id))?.y"
                :w="layout.find((l) => l.i === String(nivel.id))?.w"
                :h="layout.find((l) => l.i === String(nivel.id))?.h"
                class="bg-white border rounded shadow p-3 relative cursor-pointer flex flex-col items-center justify-center"
                @click="seleccionado = nivel.id"
                @dblclick="abrirDetalleNivel(nivel)"
              >
                <button
                  @click.stop="eliminarNivel(nivel.id)"
                  class="absolute top-2 right-2 text-red-600"
                >
                  <Icon icon="mdi:delete" class="w-5 h-5" />
                </button>
                <h4 class="text-center font-semibold text-indigo-700">
                  {{ nivel.nombre }}
                </h4>
                <p class="text-sm text-gray-500 text-center">
                  {{ nivel.medicamentos?.length || 0 }} medicamentos
                </p>
              </GridItem>
            </GridLayout>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="nivelDetalle"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-hidden relative flex flex-col"
      >
        <button
          class="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          @click="cerrarDetalleNivel"
        >
          <Icon icon="mdi:close" class="w-6 h-6" />
        </button>

        <h2
          class="text-xl font-bold text-indigo-700 mb-4 flex items-center gap-2"
        >
          <Icon icon="mdi:layers" class="w-6 h-6" />
          Detalle de {{ nivelDetalle.nombre }}
        </h2>

        <div v-if="!nivelDetalle.medicamentos?.length" class="text-gray-500">
          📦 Este nivel no tiene medicamentos
        </div>
        <div v-else class="overflow-auto flex-1">
          <table class="w-full text-sm border rounded-lg">
            <thead class="bg-indigo-600 text-white sticky top-0">
              <tr>
                <th class="p-2 text-left">Nombre</th>
                <th class="p-2 text-left">Lote</th>
                <th class="p-2 text-left">Vencimiento</th>
                <th class="p-2 text-left">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="med in nivelDetalle.medicamentos"
                :key="med.id"
                class="border-b hover:bg-indigo-50"
              >
                <td class="p-2">{{ med.nombre }}</td>
                <td class="p-2">{{ med.lote }}</td>
                <td class="p-2">{{ med.vencimiento }}</td>
                <td class="p-2">{{ med.cantidad }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
