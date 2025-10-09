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
const modoEdicion = ref(false)
const mostrarAvisoBloqueo = ref(false)
const modoVista = ref('2D')
const modoVista3D = computed({
  get: () => modoVista.value === '3D',
  set: (val) => (modoVista.value = val ? '3D' : '2D'),
})
// ==========================
// 🔹 Inicialización
// ==========================
const { fetchBodegas, fetchUbicacionesByBodega } = useInventarioSocket()
watch(modoEdicion, (nuevoValor) => {
  if (!nuevoValor) {
    // Cuando se desactiva el modo edición, mostrar aviso breve
    mostrarAvisoBloqueo.value = true
    setTimeout(() => {
      mostrarAvisoBloqueo.value = false
    }, 4000) // 👈 4 segundos visibles
  } else {
    mostrarAvisoBloqueo.value = false
  }
})

const activarEdicionUbicacion = (ubic) => {
  // Activa modo edición global si no lo está
  if (!modoEdicion.value) modoEdicion.value = true

  const stage = stageRef.value?.getNode?.()
  const tr = transformerRef.value?.getNode?.()
  if (!stage || !tr) return

  // Buscar el rectángulo dentro del grupo
  const groupNode = stage.findOne(`#${ubic._key}`)
  if (!groupNode) return
  const rect = groupNode.findOne('.ubicacionRect')

  if (rect) {
    rect.transformsEnabled('all')
    tr.nodes([rect])
    tr.getLayer().batchDraw()
    console.log(`🟨 Editando manualmente: ${ubic.descripcion}`)
  }
}


onMounted(async () => {
  try {
    bodegas.value = await fetchBodegas()
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
    z: 0, // 👈 En 2D, Z representa altura del pallet o nivel
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
function onActualizarZ({ id, z }) {
  const ubic = ubicacionesActivas.value.find(u => u.id === id)
  if (!ubic) return

  ubic.z = z
  // ⚡ Fuerza reactividad para refrescar el render 3D
  ubicacionesActivas.value = [...ubicacionesActivas.value]

  // (Opcional) sincroniza en backend
  updateUbicacion(id, { z }).catch(err =>
    console.error('❌ Error al actualizar altura desde padre:', err)
  )
}


// ==========================
// 💾 Guardar y cancelar edición
// ==========================
const guardarCambiosUbicaciones = async () => {
  if (!bodegaActiva.value) return

  try {
    const stage = stageRef.value?.getNode?.()
    if (stage) {
      stage.find('.ubicacionGroup').forEach((groupNode) => {
        const id = groupNode.id()
        const ubic = ubicacionesActivas.value.find(u => u._key === id)
        if (!ubic) return

        // 🔸 posición del grupo
        ubic.x = groupNode.x()
        ubic.y = groupNode.y()

        // 🔸 tamaño del rect (aplicando escalado)
        const rectNode = groupNode.findOne('.ubicacionRect')
        if (rectNode) {
          const scaleX = rectNode.scaleX() || 1
          const scaleY = rectNode.scaleY() || 1

          ubic.width  = rectNode.width()  * scaleX
          ubic.height = rectNode.height() * scaleY

          // limpia el escalado visual
          rectNode.scale({ x: 1, y: 1 })
        }
      })
    }

    // 🔹 Guarda en backend
    await Promise.all(
      ubicacionesActivas.value.map((u) =>
        updateUbicacion(u.id, {
          x: u.x,
          y: u.y,
          width: u.width,
          height: u.height,
          z: u.z ?? 0,
        })
      )
    )

    modoEdicion.value = false
    const ubicaciones = await fetchUbicacionesByBodega(bodegaActiva.value.id)
    ubicacionesActivas.value = []
    await nextTick()
    ubicacionesActivas.value = ubicaciones.map(u => ({ ...u, _key: u.id || crypto.randomUUID() }))
  } catch (err) {
    console.error('❌ Error al guardar ubicaciones:', err)
  }
}

const cancelarEdicionUbicaciones = async () => {
  if (!bodegaActiva.value) return
  if (!confirm('¿Deseas descartar los cambios no guardados?')) return

  // 🔄 Volver a cargar ubicaciones originales desde el backend
  const ubicaciones = await fetchUbicacionesByBodega(bodegaActiva.value.id)
  ubicacionesActivas.value = ubicaciones.map((u) => ({
    ...u,
    _key: u.id || crypto.randomUUID(),
  }))

  modoEdicion.value = false
  console.log('↩️ Edición cancelada y ubicaciones restauradas')
}

const abrirDetalle = (ubic) => {
  ubicacionSeleccionada.value = ubic
  mostrarDetalle.value = true
}

const onGroupDragMove = (ubic, e) => {
  const pos = e.target.position()
  ubic.x = pos.x
  ubic.y = pos.y
}

const transformerRef = ref(null)
const selectedNode = ref(null)

const seleccionarUbicacion = (ubic, e) => {
  e.cancelBubble = true
  if (!modoEdicion.value) return

  const tr = transformerRef.value?.getNode?.()
  if (!tr) return

  const target = e.target.getNode ? e.target.getNode() : e.target
  const group = target.className === 'Group' ? target : target.getParent()
  const rect = group.findOne('.ubicacionRect')

  if (rect) {
    rect.draggable(false) // no se mueve individualmente
    rect.listening(true)
    rect.transformsEnabled('all') // ✅ permite transformar
    tr.nodes([rect])
    tr.getLayer().batchDraw()
  }
}


const onGroupDragEnd = async (ubic, e) => {
  const group = e.target
  const pos = group.position()
  ubic.x = pos.x
  ubic.y = pos.y

  try {
    await updateUbicacion(ubic.id, {
      x: ubic.x,
      y: ubic.y,
      width: ubic.width,
      height: ubic.height,
      z: ubic.z ?? 0,
    })
    console.log(`📍 Ubicación ${ubic.descripcion} movida y guardada en ${ubic.x},${ubic.y}`)
  } catch (err) {
    console.error('❌ Error al guardar movimiento:', err)
  }
}

const onTransformEnd = async (ubic, e) => {
  const rect = e.target
  const group = rect.getParent()

  const scaleX = rect.scaleX()
  const scaleY = rect.scaleY()

  const newWidth = Math.max(20, rect.width() * scaleX)
  const newHeight = Math.max(20, rect.height() * scaleY)

  rect.width(newWidth)
  rect.height(newHeight)
  rect.scaleX(1)
  rect.scaleY(1)

  ubic.width = newWidth
  ubic.height = newHeight
  ubic.x = group.x()
  ubic.y = group.y()

  rect.getLayer().batchDraw()

  await updateUbicacion(ubic.id, {
    x: ubic.x,
    y: ubic.y,
    width: ubic.width,
    height: ubic.height,
    z: ubic.z ?? 0,
  })
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
const onBodegaActualizada = async (actualizada) => {
  const index = bodegas.value.findIndex((b) => b.id === actualizada.id)
  if (index !== -1) bodegas.value[index] = actualizada

  if (bodegaActiva.value?.id === actualizada.id) {
    bodegaActiva.value = actualizada

    // 🔄 Refresca las ubicaciones después de guardar
    try {
      const ubicaciones = await fetchUbicacionesByBodega(actualizada.id)
      ubicacionesActivas.value = ubicaciones.map((u) => ({
        ...u,
        _key: u.id || crypto.randomUUID(),
      }))
      console.log('♻️ Ubicaciones recargadas después de actualización')
    } catch (err) {
      console.error('❌ Error al refrescar ubicaciones:', err)
    }
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
              v-if="!modoEdicion"
              @click="modoEdicion = true"
              :disabled="modoVista === '3D'"
              class="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md shadow transition
                text-white
                bg-yellow-500 hover:bg-yellow-600
                disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
            >
              <Icon icon="mdi:lock" class="w-4 h-4" />
              Editar ubicaciones
            </button>


            <!-- 💾 Botón guardar cambios -->
            <button
              v-else
              @click="guardarCambiosUbicaciones"
              class="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md shadow hover:bg-green-700 transition"
            >
              <Icon icon="mdi:check" class="w-4 h-4" />
              Aceptar y guardar
            </button>

            <!-- ❌ Botón cancelar edición -->
            <button
              v-if="modoEdicion"
              @click="cancelarEdicionUbicaciones"
              class="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white text-sm rounded-md shadow hover:bg-gray-600 transition"
            >
              <Icon icon="mdi:close" class="w-4 h-4" />
              Cancelar
            </button>

            <!-- 🟩 Agregar nueva sección -->
            <button
              v-if="!dibujando && !modoEdicion"
              @click="agregarSeccion"
              class="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md shadow hover:bg-green-700 transition"
            >
              <Icon icon="mdi:shape-square-plus" class="w-4 h-4" />
              Sección
            </button>

            <!-- 🗑️ Eliminar bodega -->
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
            <div v-if="modoVista === '2D'" class="w-full h-full relative">
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
                      enabledAnchors: ['top-left','top-right','bottom-left','bottom-right'],
                      anchorStroke: 'dodgerblue',
                      anchorFill: 'white',
                      anchorSize: 8,
                      borderStroke: 'dodgerblue',
                      keepRatio: false,
                      rotateEnabled: false,
                      ignoreStroke: true,
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
                    <v-group
                      :config="{
                        id: ubic._key,
                        x: ubic.x ?? 0,
                        y: ubic.y ?? 0,
                        draggable: modoEdicion,
                        name: 'ubicacionGroup',
                      }"
                      @click="modoEdicion ? (e) => seleccionarUbicacion(ubic, e) : undefined"
                      @dblclick="() => abrirDetalle(ubic)"
                      @dragmove="(e) => onGroupDragMove(ubic, e)"
                      @dragend="modoEdicion ? (e) => onGroupDragEnd(ubic, e) : undefined"
                    >

                      <!-- 🟧 Rectángulo -->
                      <v-rect
                        :config="{
                          width: ubic.width ?? 100,
                          height: ubic.height ?? 60,
                          fill: ubic.color || '#f97316',
                          stroke: darkenColor(ubic.color || '#f97316', 0.25),
                          strokeWidth: 2,
                          cornerRadius: 6,
                          shadowBlur: 4,
                          opacity: 0.9,
                          name: 'ubicacionRect',
                          draggable: false, // solo mueve el grupo
                          listening: true, // ✅ necesario para transformación
                          cursor: modoEdicion ? 'move' : 'pointer',
                        }"
                        @transformend="modoEdicion && ((e) => onTransformEnd(ubic, e))"
                      />

                      <!-- 🏷️ Texto centrado -->
                      <v-text
                        :config="{
                          text: ubic.descripcion || 'Ubicación',
                          y: (ubic.height ?? 60) / 2 - 8,
                          width: ubic.width ?? 100,
                          align: 'center',
                          fontSize: 13,
                          fontStyle: 'bold',
                          fill: 'white',
                          listening: false,
                        }"
                      />
                    </v-group>


                  </template>

                </v-layer>
                <div
                  v-if="!modoEdicion && mostrarAvisoBloqueo"
                  class="absolute inset-0 flex items-center justify-center bg-black/5 text-gray-600 text-sm pointer-events-none select-none transition-opacity duration-500"
                >
                  Edición desactivada — presiona “Editar ubicaciones” para modificar
                </div>
              </v-stage>

              

              <!-- ⚙️ Botones de edición manual de cada sección -->
              <div
                v-for="ubic in ubicacionesActivas"
                :key="ubic._key + '-btn'"
                class="absolute z-50 group"
                :style="{
                  left: `${(ubic.x ?? 0) + (ubic.width ?? 100) - 36}px`,
                  top: `${(ubic.y ?? 0) + 6}px`,
                }"
              >
                <button
                  class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white bg-indigo-600 hover:bg-indigo-700 rounded-full p-1.5 shadow-md"
                  @click.stop="activarEdicionUbicacion(ubic)"
                  title="Editar sección"
                >
                  <Icon icon="mdi:pencil" class="w-4 h-4" />
                </button>
              </div>

            </div>

            <!-- 🔹 Vista 3D -->
            <Bodega3D
              v-else
              :ubicaciones="ubicacionesActivas"
              class="w-full h-full"
              @seleccionarUbicacion="abrirDetalle" 
            />
          </ClientOnly>
        </div>
          <div
            class="absolute bottom-4 right-4 z-50 flex items-center gap-3 bg-white/95 backdrop-blur-lg px-5 py-2.5 rounded-full shadow-md border border-gray-200"
          >
            <span
              class="text-xs font-semibold"
              :class="modoVista === '2D' ? 'text-indigo-700' : 'text-gray-400'"
            >
              Vista 2D
            </span>

            <label class="relative inline-flex items-center cursor-pointer select-none">
              <input type="checkbox" v-model="modoVista3D" class="sr-only" />
              <div
                class="w-12 h-6 rounded-full transition-all duration-300 relative"
                :class="modoVista3D ? 'bg-indigo-600' : 'bg-gray-300'"
              >
                <div
                  class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300"
                  :class="modoVista3D ? 'translate-x-6' : 'translate-x-0'"
                ></div>
              </div>
            </label>

            <span
              class="text-xs font-semibold"
              :class="modoVista === '3D' ? 'text-indigo-700' : 'text-gray-400'"
            >
              Vista 3D
            </span>
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
        @actualizarZ="onActualizarZ"
      />
    </div>
  </div>
</template>
<style>
.absolute button {
  pointer-events: all;
}
.absolute button:hover {
  transform: scale(1.1);
}
</style>
