<script setup>
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import AddBodega from '~/components/addBodega.vue'
import { useInventarioSocket } from '~/composables/useInventarioSocket'
import {
  createUbicacion,
  updateUbicacion,
  deleteUbicacion,
  deleteBodega,
} from '~/services/inventarioService'
import DetalleSeccion from '~/components/detalleSeccion.vue'
import Bodega3D from '~/components/bodega3D.vue'
// ==========================
// 🔹 Estado general
// ==========================
const bodegas = ref([])
const bodegaActiva = ref(null)
const ubicacionesActivas = ref([])
const mostrarModalBodega = ref(false)
const dibujando = ref(false)
const previewPunto = ref(null)
const modoDibujo = ref('polygon')
const mostrarDetalle = ref(false)
const ubicacionSeleccionada = ref(null)
const bodegaEditando = ref(null)
// Referencias a Konva
const containerRef = ref(null)
const stageRef = ref(null)
const ubicacionEditando = ref(null)
const modoVista = ref('2D') // o '3D'
// ==========================
// 🔹 Inicialización
// ==========================
const { fetchBodegas, fetchUbicacionesByBodega } = useInventarioSocket()

onMounted(async () => {
  try {
    bodegas.value = await fetchBodegas()
    console.log(bodegas)
    if (bodegas.value.length) await seleccionarBodega(bodegas.value[0])

    const stage = stageRef.value?.getNode?.()
    const tr = transformerRef.value?.getNode?.()

    if (stage && tr) {
      stage.on('click tap', (e) => {
        if (e.target === stage) {
          // 🔹 Limpia selección y desactiva transformaciones
          tr.nodes([])

          stage.find('.ubicacionRect').forEach((n) => {
            const node = n.getNode ? n.getNode() : n
            if (node && node.transformEnabled) node.transformEnabled(false)
          })

          stage.batchDraw()
          console.log('❎ Selección limpiada')
        }
      })
      console.log('🎯 Transformer listo para interacción visual')
    }
  } catch (err) {
    console.error('❌ Error inicializando bodegas o transformer:', err)
  }
})

const layerRef = ref(null)

// ==========================
// 🔹 Lógica de bodegas
// ==========================
const seleccionarBodega = async (bodega) => {
  bodegaActiva.value = bodega
  previewPunto.value = null
  dibujando.value = false

  try {
    const ubicaciones = await fetchUbicacionesByBodega(bodega.id)
    console.log(ubicaciones)
    ubicacionesActivas.value = ubicaciones.map((u) => ({
      ...u,
      _key: u.id || crypto.randomUUID(),
    }))
  } catch (err) {
    console.error('❌ Error al obtener ubicaciones:', err)
    ubicacionesActivas.value = []
  }
}

const borrarBodega = async (id) => {
  try {
    await deleteBodega(id)
    bodegas.value = bodegas.value.filter((b) => b.id !== id)
    if (bodegaActiva.value?.id === id) bodegaActiva.value = null
    console.log(`🗑️ Bodega ${id} eliminada correctamente`)
  } catch (err) {
    console.error('❌ Error al eliminar bodega:', err)
  }
}
const editarBodega = (bodega) => {
  bodegaEditando.value = bodega
  mostrarModalBodega.value = true
  console.log('✏️ Editando bodega:', bodega.nombre)
}

// ==========================
// 🔹 Lógica de ubicaciones
// ==========================
const agregarSeccion = async () => {
  if (!bodegaActiva.value) {
    alert('Selecciona una bodega antes de agregar secciones.')
    return
  }
  const nuevaUbicacion = {
    descripcion: `Sección ${ubicacionesActivas.value.length + 1}`,
    idBodega: bodegaActiva.value.id,
    x: 100 + ubicacionesActivas.value.length * 25,
    y: 100 + ubicacionesActivas.value.length * 20,
    width: 120,
    height: 80,
    color: '#f97316',
  }

  try {
    const res = await createUbicacion(nuevaUbicacion)
    ubicacionesActivas.value.push({
      ...res,
      _key: res.id || crypto.randomUUID(),
    })
    console.log('✅ Sección creada:', res)
  } catch (err) {
    console.error('❌ Error al crear ubicación:', err)
  }
}

const onUbicacionDragEnd = async (ubic, e) => {
  const pos = e.target.position()
  ubic.x = pos.x
  ubic.y = pos.y
  try {
    await updateUbicacion(ubic.id, { x: ubic.x, y: ubic.y })
    console.log(`✅ Ubicación ${ubic.descripcion} actualizada`, ubic)
  } catch (err) {
    console.error('❌ Error al actualizar ubicación:', err)
  }
}

const abrirDetalle = (ubic) => {
  ubicacionSeleccionada.value = ubic
  mostrarDetalle.value = true
  console.log('📦 Abriendo detalle de ubicación:', ubic.descripcion)
}

const editarUbicacion = (ubic) => {
  ubicacionEditando.value = { ...ubic }
  console.log('✏️ Editando ubicación:', ubic.descripcion)
}

const transformerRef = ref(null)
const selectedNode = ref(null)

const seleccionarUbicacion = (ubic, e) => {
  e.cancelBubble = true

  const shape = e.target.getNode ? e.target.getNode() : e.target
  const tr = transformerRef.value?.getNode?.()
  const stage = stageRef.value?.getNode?.()
  if (!shape || !tr || !stage) return

  // 🔹 Desactivar selección previa
  tr.nodes([])
  stage.find('.ubicacionRect').forEach((n) => {
    const node = n.getNode ? n.getNode() : n
    if (node) node.draggable(false)
  })

  // 🔹 Activar edición para la actual
  shape.draggable(true)
  tr.nodes([shape])
  shape.getLayer().batchDraw()

  console.log(`✏️ Seleccionada ubicación: ${ubic.descripcion}`)
}

let clickTimeout = null

const handleUbicacionClick = (e, ubic) => {
  e.cancelBubble = true // Evita que suba a stage

  if (clickTimeout) {
    // 🔹 Si ya hay un click reciente → es doble click
    clearTimeout(clickTimeout)
    clickTimeout = null
    abrirDetalle(ubic)
    return
  }

  // 🔹 Si es el primer click → espera un poco por si hay un segundo
  clickTimeout = setTimeout(() => {
    seleccionarUbicacion(ubic, e)
    clickTimeout = null
  }, 200) // 200 ms diferencia entre click y doble click
}

const onDragEnd = async (ubic, e) => {
  const pos = e.target.position()
  ubic.x = pos.x
  ubic.y = pos.y
  try {
    await updateUbicacion(ubic.id, { x: ubic.x, y: ubic.y })
    console.log(`📍 Ubicación ${ubic.descripcion} movida`)
  } catch (err) {
    console.error('❌ Error al mover ubicación:', err)
  }
}

const onTransformEnd = async (ubic, e) => {
  const shape = e.target
  const scaleX = shape.scaleX()
  const scaleY = shape.scaleY()

  // 🔹 Calcular el nuevo ancho y alto reales (sin proporción)
  const newWidth = Math.max(20, shape.width() * scaleX)
  const newHeight = Math.max(20, shape.height() * scaleY)

  // 🔹 Restablecer escalado (para evitar acumulación)
  shape.scaleX(1)
  shape.scaleY(1)

  // 🔹 Actualizar posición y tamaño
  ubic.x = shape.x()
  ubic.y = shape.y()
  ubic.width = newWidth
  ubic.height = newHeight

  // 🔹 Aplicar visualmente
  shape.width(newWidth)
  shape.height(newHeight)
  shape.getLayer().batchDraw()

  try {
    await updateUbicacion(ubic.id, {
      x: ubic.x,
      y: ubic.y,
      width: ubic.width,
      height: ubic.height,
    })
    console.log(`✅ Ubicación ${ubic.descripcion} actualizada libremente`)
  } catch (err) {
    console.error('❌ Error al actualizar ubicación:', err)
  }
}

// ==========================
// 🔹 Eventos del modal AddBodega
// ==========================
const onBodegaCreada = (nueva) => {
  // Limpiar ubicaciones anteriores
  ubicacionesActivas.value = []
  previewPunto.value = null
  dibujando.value = false

  bodegas.value.push(nueva)
  bodegaActiva.value = nueva
  mostrarModalBodega.value = false

  console.log('✅ Nueva bodega agregada y ubicaciones reseteadas:', nueva)
}
const onBodegaActualizada = (actualizada) => {
  const index = bodegas.value.findIndex((b) => b.id === actualizada.id)
  if (index !== -1) bodegas.value[index] = actualizada

  if (bodegaActiva.value?.id === actualizada.id) {
    bodegaActiva.value = actualizada
  }

  bodegaEditando.value = null
  mostrarModalBodega.value = false
  console.log('✅ Bodega actualizada:', actualizada)
}

// ==========================
// 🔹 Utilidad visual
// ==========================
const darkenColor = (hex, factor = 0.25) => {
  if (!hex?.startsWith('#')) return hex
  const c = parseInt(hex.slice(1), 16)
  const r = (c >> 16) & 255
  const g = (c >> 8) & 255
  const b = c & 255
  const darker = (v) => Math.max(0, Math.floor(v * (1 - factor)))
  return `rgb(${darker(r)}, ${darker(g)}, ${darker(b)})`
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-6xl mx-auto bg-white shadow-lg rounded-xl p-6">
      <!-- 🔹 Header principal -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-indigo-700 flex items-center gap-2">
          <Icon icon="mdi:warehouse" class="text-indigo-600 w-8 h-8" />
          Gestión de Bodegas
        </h1>
        <button
          @click="mostrarModalBodega = true"
          class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
        >
          <Icon icon="mdi:shape-polygon-plus" class="w-5 h-5" />
          Crear Bodega
        </button>
      </div>

      <!-- 🔸 Listado de bodegas -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div
          v-for="b in bodegas"
          :key="b.id"
          @click="seleccionarBodega(b)"
          class="cursor-pointer rounded-lg border p-4 shadow-sm hover:shadow-md transition"
          :class="
            bodegaActiva?.id === b.id
              ? 'bg-indigo-50 border-indigo-400'
              : 'bg-white border-gray-200'
          "
        >
          <div class="flex items-center justify-between mb-2">
            <h3
              class="text-lg font-bold text-indigo-700 flex items-center gap-2"
            >
              <Icon icon="mdi:warehouse" class="w-5 h-5 text-indigo-600" />
              {{ b.nombre }}
            </h3>
            <button
              @click="modoVista = modoVista === '2D' ? '3D' : '2D'"
              class="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md shadow hover:bg-indigo-700 transition"
            >
              <Icon
                :icon="modoVista === '2D' ? 'mdi:cube' : 'mdi:vector-square'"
                class="w-4 h-4"
              />
              {{ modoVista === '2D' ? 'Vista 3D' : 'Vista 2D' }}
            </button>

            <button
              @click.stop="editarBodega(b)"
              class="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Icon icon="mdi:pencil" class="w-4 h-4" />
              Editar
            </button>
          </div>
          <p class="text-sm text-gray-600">
            📍 {{ b.direccion || 'Sin dirección' }}
          </p>
          <p class="text-sm text-gray-600">
            👤 Encargado:
            <span class="font-medium">{{ b.nombreEncargado || 'N/A' }}</span>
          </p>
        </div>
      </div>

      <!-- 🔹 Lienzo principal -->
      <div
        v-if="bodegaActiva && !mostrarModalBodega"
        ref="containerRef"
        class="relative rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200"
      >
        <!-- Header de bodega -->
        <div
          class="flex justify-between items-center px-4 py-3 border-b bg-white/80 backdrop-blur-sm"
        >
          <h2
            class="text-lg font-semibold text-indigo-700 flex items-center gap-2"
          >
            <Icon icon="mdi:warehouse" class="w-5 h-5 text-indigo-600" />
            {{ bodegaActiva.nombre }}
          </h2>
          <div class="flex gap-2">
            <button
              v-if="!dibujando"
              @click="agregarSeccion"
              class="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md shadow hover:bg-green-700 transition"
            >
              <Icon icon="mdi:shape-square-plus" class="w-4 h-4" />
              Sección
            </button>
            <button
              @click="borrarBodega(bodegaActiva.id)"
              class="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md shadow hover:bg-red-700 transition"
            >
              <Icon icon="mdi:trash" class="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </div>

        <!-- 🎨 Stage principal -->
        <div class="w-full h-[75vh] bg-gray-100 relative flex-1">
          <ClientOnly>
            <!-- 🔹 Vista 2D -->
            <div v-if="modoVista === '2D'" class="w-full h-full">
              <v-stage
                ref="stageRef"
                :config="{
                  width: containerRef?.offsetWidth || 800,
                  height: containerRef?.offsetHeight || 500,
                }"
                style="width: 100%; height: 100%"
              >
                <v-layer ref="layerRef" :config="{ listening: true }">
                  <!-- ✅ Transformer dentro del layer, con su config declarativa -->
                  <v-transformer
                    ref="transformerRef"
                    :config="{
                      enabledAnchors: [
                        'top-left',
                        'top-right',
                        'bottom-left',
                        'bottom-right',
                      ],
                      anchorStroke: 'dodgerblue',
                      anchorFill: 'white',
                      anchorSize: 8,
                      borderStroke: 'dodgerblue',
                      keepRatio: false,
                      rotateEnabled: false,
                    }"
                  />

                  <!-- 🔷 Fondo rectangular de la bodega (si tienes layout) -->
                  <v-rect
                    v-if="bodegaActiva?.layout"
                    :config="{
                      x: 20,
                      y: 20,
                      width: bodegaActiva.layout.ancho,
                      height: bodegaActiva.layout.alto,
                      fill: 'rgba(147,197,253,0.15)',
                      stroke: '#1e3a8a',
                      strokeWidth: 2,
                      cornerRadius: 10,
                      shadowBlur: 8,
                      listening: false,
                    }"
                  />

                  <v-line
                    v-else-if="bodegaActiva?.puntos?.length > 1"
                    :config="{
                      points: bodegaActiva.puntos,
                      closed: bodegaActiva.cerrado,
                      stroke: '#2563eb',
                      strokeWidth: 3,
                      lineJoin: 'round',
                      fill: bodegaActiva.cerrado
                        ? 'rgba(37,99,235,0.08)'
                        : undefined,
                      listening: false,
                    }"
                  />

                  <!-- 🟧 Ubicaciones editables -->
                  <template v-for="ubic in ubicacionesActivas" :key="ubic._key">
                    <v-rect
                      :config="{
                        id: ubic._key,
                        x: ubic.x ?? 0,
                        y: ubic.y ?? 0,
                        width: ubic.width ?? 100,
                        height: ubic.height ?? 60,
                        fill: ubic.color || '#f97316',
                        stroke: darkenColor(ubic.color || '#f97316', 0.25),
                        strokeWidth: 2,
                        cornerRadius: 6,
                        shadowBlur: 4,
                        draggable: true,
                        opacity: 0.9,
                        name: 'ubicacionRect',
                      }"
                      @mousedown="(e) => handleUbicacionClick(e, ubic)"
                      @transformend="(e) => onTransformEnd(ubic, e)"
                      @dragend="(e) => onDragEnd(ubic, e)"
                    />
                    <v-text
                      :config="{
                        text: ubic.descripcion || 'Ubicación',
                        x: ubic.x ?? 0,
                        y: (ubic.y ?? 0) + (ubic.height ?? 60) / 2 - 8,
                        width: ubic.width ?? 100,
                        align: 'center',
                        fontSize: 13,
                        fontStyle: 'bold',
                        fill: 'white',
                      }"
                    />
                  </template>
                </v-layer>
              </v-stage>
            </div>

            <!-- 🔹 Vista 3D -->
            <Bodega3D
              v-else
              :ubicaciones="ubicacionesActivas"
              class="w-full h-full"
            />
          </ClientOnly>
        </div>

      </div>

      <!-- 🔹 Modal de creación -->
      <AddBodega
        v-if="mostrarModalBodega"
        :bodega="bodegaEditando"
        @cerrar="mostrarModalBodega = false; bodegaEditando = null"
        @creada="onBodegaCreada"
        @actualizada="onBodegaActualizada"
      />
      <DetalleSeccion
        v-if="ubicacionSeleccionada"
        :seccion="ubicacionSeleccionada"
        @cerrar="ubicacionSeleccionada = null"
      />
    </div>
  </div>
</template>
