<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import DetalleSeccion from '~/components/detalleSeccion.vue'
const bodegaActiva = ref(null)
const dibujando = ref(false)
const previewPunto = ref(null)
const modoDibujo = ref('polygon')
const inicioRect = ref(null)

const containerRef = ref(null)
const stageRef = ref(null)

let resizeObserver = null

const seccionEditando = ref(null)
const detalleSeccion = ref(null)
const seccionDemo = ref({
  id: 101,
  nombre: 'Estante A - Sección 1',
  x: 120,
  y: 80,
  width: 300,
  height: 150,
  medicamentos: [
    {
      id: 1,
      nombre: 'Paracetamol 500mg',
      lote: 'L-001',
      vencimiento: '2025-08-10',
      cantidad: 120,
    },
    {
      id: 2,
      nombre: 'Ibuprofeno 400mg',
      lote: 'L-045',
      vencimiento: '2024-12-01',
      cantidad: 80,
    },
    {
      id: 3,
      nombre: 'Amoxicilina 875mg',
      lote: 'L-023',
      vencimiento: '2026-03-15',
      cantidad: 50,
    },
  ],
  subniveles: [
    {
      id: 'sub-1',
      nombre: 'Nivel Superior',
      medicamentos: [
        { id: 4, nombre: 'Paracetamol 500mg', lote: 'L-001', cantidad: 60 },
        { id: 5, nombre: 'Amoxicilina 875mg', lote: 'L-023', cantidad: 30 },
      ],
    },
    {
      id: 'sub-2',
      nombre: 'Nivel Medio',
      medicamentos: [
        { id: 6, nombre: 'Ibuprofeno 400mg', lote: 'L-045', cantidad: 80 },
      ],
    },
    {
      id: 'sub-3',
      nombre: 'Nivel Inferior',
      medicamentos: [],
    },
  ],
})

const ubicacionesActivas = ref([])
const ubicacionesPorBodega = ref({})
const detalleUbicacion = ref(null)

const construirNombreUbicacion = (ubicacion, index) => {
  return (
    ubicacion?.descripcion ||
    ubicacion?.nombre ||
    ubicacion?.codigo ||
    ubicacion?.alias ||
    `Ubicacion ${index + 1}`
  )
}

const generarCoordenadasSimuladas = (total, index) => {
  const cantidad = total || 1
  const columnas = Math.max(1, Math.ceil(Math.sqrt(cantidad)))
  const separacionX = 150
  const separacionY = 120
  const margenX = 80
  const margenY = 80
  const columna = index % columnas
  const fila = Math.floor(index / columnas)
  return {
    x: margenX + columna * separacionX,
    y: margenY + fila * separacionY,
  }
}

const generarCoordenadasEnBodega = (bodega, index, total) => {
  const puntos = Array.isArray(bodega?.puntos) ? bodega.puntos : []

  if (!puntos.length) {
    // fallback a coordenadas simuladas si no hay puntos definidos
    return generarCoordenadasSimuladas(total, index)
  }

  const xs = puntos.filter((_, i) => i % 2 === 0)
  const ys = puntos.filter((_, i) => i % 2 === 1)

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const cols = Math.ceil(Math.sqrt(total))
  const rows = Math.ceil(total / cols)

  const cellW = (maxX - minX) / cols
  const cellH = (maxY - minY) / rows

  const col = index % cols
  const row = Math.floor(index / cols)

  return {
    x: minX + col * cellW + cellW / 2,
    y: minY + row * cellH + cellH / 2,
  }
}


const decorarUbicaciones = (lista = [], bodega) => {
  const total = lista.length || 1
  return lista.map((ubicacion, index) => {
    const coords = generarCoordenadasEnBodega(bodega, index, total)
    const nombre = construirNombreUbicacion(ubicacion, index)
    return {
      ...ubicacion,
      nombre,
      x: ubicacion?.x ?? ubicacion?.posX ?? coords.x,
      y: ubicacion?.y ?? ubicacion?.posY ?? coords.y,
      _key: ubicacion?.id ?? `${nombre}-${index}`,
      simulatedPosition: ubicacion?.x == null && ubicacion?.posX == null,
    }
  })
}


const eliminarUbicacion = (ubicacion) => {
  if (!ubicacion) return
  ubicacionesActivas.value = ubicacionesActivas.value.filter(
    (u) => u._key !== ubicacion._key
  )
  if (detalleUbicacion.value?._key === ubicacion._key) {
    detalleUbicacion.value = null
  }
  const idActual = bodegaActiva.value?.id
  if (idActual != null) {
    const copia = { ...ubicacionesPorBodega.value }
    if (copia[idActual]) {
      copia[idActual] = copia[idActual].filter(
        (u) => u._key !== ubicacion._key
      )
    }
    ubicacionesPorBodega.value = copia
  }
}

const abrirUbicacion = (ubic) => {
  if (!ubic) return
  detalleUbicacion.value = ubic
}

const cerrarDetalleUbicacion = () => {
  detalleUbicacion.value = null
}

const editarSeccion = (sec) => {
  seccionEditando.value = sec
}

const abrirDetalle = (sec) => {
  detalleSeccion.value = sec
}


const onTransformEnd = (sec, e) => {
  const node = e.target
  sec.width = node.width() * node.scaleX()
  sec.height = node.height() * node.scaleY()

  node.scaleX(1)
  node.scaleY(1)

  guardar()
}
const seleccionarBodega = async (bodega) => {
  if (!bodega) return
  bodegaActiva.value = bodega
  dibujando.value = false
  previewPunto.value = null
  detalleUbicacion.value = null

  try {
    const ubicaciones = await fetchUbicacionesByBodega(bodega.id)
    const decoradas = decorarUbicaciones(ubicaciones || [], bodega)
    ubicacionesPorBodega.value = {
      ...ubicacionesPorBodega.value,
      [bodega.id]: decoradas,
    }
    ubicacionesActivas.value = decoradas
  } catch (err) {
    console.error('Error al obtener ubicaciones:', err)
    ubicacionesActivas.value = ubicacionesPorBodega.value[bodega.id] || []
  }
}


const crearBodega = () => {
  const nueva = {
    id: Date.now(),
    nombre: `Bodega ${bodegas.value.length + 1}`,
    puntos: [],
    secciones: [],
    cerrado: false,
  }
  bodegas.value.push(nueva)
  bodegaActiva.value = nueva
  ubicacionesActivas.value = []
  detalleUbicacion.value = null
  ubicacionesPorBodega.value = {
    ...ubicacionesPorBodega.value,
    [nueva.id]: [],
  }
  dibujando.value = true
  guardar()
}


const borrarBodega = async (id) => {
  bodegas.value = bodegas.value.filter((b) => b.id !== id)
  const copia = { ...ubicacionesPorBodega.value }
  delete copia[id]
  ubicacionesPorBodega.value = copia
  if (bodegaActiva.value?.id === id) {
    if (bodegas.value.length > 0) {
      await seleccionarBodega(bodegas.value[0])
    } else {
      bodegaActiva.value = null
      ubicacionesActivas.value = []
      detalleUbicacion.value = null
    }
  }
  guardar()
}

const agregarPunto = (e) => {
  if (!dibujando.value || !bodegaActiva.value) return
  const pos = e.target.getStage().getPointerPosition()

  if (modoDibujo.value === 'polygon') {
    intentarCerrar(e)
    if (!dibujando.value) return
    bodegaActiva.value.puntos.push(pos.x, pos.y)
  }

  if (modoDibujo.value === 'rect') {
    if (!inicioRect.value) {
      inicioRect.value = pos
    } else {
      const { x, y } = inicioRect.value
      const ancho = pos.x - x
      const alto = pos.y - y
      bodegaActiva.value.puntos = [
        x,
        y,
        x + ancho,
        y,
        x + ancho,
        y + alto,
        x,
        y + alto,
      ]
      bodegaActiva.value.cerrado = true
      dibujando.value = false
      inicioRect.value = null
    }
  }

  guardar()
}

const moverMouse = (e) => {
  if (!dibujando.value || !bodegaActiva.value) return
  const pos = e.target.getStage().getPointerPosition()
  previewPunto.value = pos
}

const cerrarPoligono = () => {
  if (!dibujando.value || !bodegaActiva.value) return
  bodegaActiva.value.cerrado = true
  dibujando.value = false
  guardar()
}

const intentarCerrar = (e) => {
  if (!dibujando.value || !bodegaActiva.value) return
  if (bodegaActiva.value.puntos.length < 3) return
  const pos = e.target.getStage().getPointerPosition()
  const [x0, y0] = bodegaActiva.value.puntos
  const dx = pos.x - x0
  const dy = pos.y - y0
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < 15) {
    bodegaActiva.value.cerrado = true
    dibujando.value = false
    previewPunto.value = null
    guardar()
  }
}

const agregarSeccion = () => {
  if (!bodegaActiva.value) return
  const nuevaSeccion = {
    id: Date.now(),
    nombre: `Sección ${String.fromCharCode(
      65 + bodegaActiva.value.secciones.length
    )}`,
    x: 100,
    y: 100,
    width: 100,
    height: 80,
  }
  bodegaActiva.value.secciones.push(nuevaSeccion)
  guardar()
}

const moverSeccion = (sec, e) => {
  const pos = e.target.position()
  sec.x = pos.x
  sec.y = pos.y
  guardar()
}

const borrarSeccion = (sec) => {
  if (!bodegaActiva.value) return
  bodegaActiva.value.secciones = bodegaActiva.value.secciones.filter(
    (s) => s.id !== sec.id
  )
  guardar()
}

const guardar = () => {
  localStorage.setItem('bodegas', JSON.stringify(bodegas.value))
}
const { fetchBodegas, bodegas, fetchUbicacionesByBodega } = useInventarioSocket()

onMounted(async () => {
  // 1) Primero intentamos cargar desde API
  try {
    bodegas.value = await fetchBodegas()
    if (bodegas.value.length > 0) {
      await seleccionarBodega(bodegas.value[0])
    }
    console.log('Bodegas cargadas desde API:', bodegas.value)
  } catch (err) {
    console.error('Error cargando bodegas desde API:', err)
    // fallback a localStorage si falla
    const raw = localStorage.getItem('bodegas')
    if (raw) {
      bodegas.value = JSON.parse(raw).map((b) => ({
        ...b,
        puntos: b.puntos || [],
        secciones: b.secciones || [],
        cerrado: b.cerrado || false,
      }))
      if (bodegas.value.length > 0) {
        bodegaActiva.value = bodegas.value[0]
        const cache = ubicacionesPorBodega.value[bodegaActiva.value.id] || []
        ubicacionesActivas.value = cache
      }
    }
  }

  // 2) ResizeObserver para el canvas
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (stageRef.value?.getStage) {
        const stage = stageRef.value.getStage()
        stage.width(entry.contentRect.width)
        stage.height(entry.contentRect.height)
        stage.draw()
      }
    }
  })

  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
})
onBeforeUnmount(() => {
  if (resizeObserver && containerRef.value) {
    resizeObserver.unobserve(containerRef.value)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-6xl mx-auto bg-white shadow-lg rounded-xl p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-indigo-700 flex items-center gap-2">
          <Icon icon="mdi:warehouse" class="text-indigo-600 w-8 h-8" />
          Gestión de Bodegas
        </h1>
        <button
          @click="crearBodega"
          class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
        >
          <Icon icon="mdi:shape-polygon-plus" class="w-5 h-5" />
          Crear Bodega
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div
          v-for="b in bodegas"
          :key="b.id"
          @click="seleccionarBodega(b)"
          class="cursor-pointer rounded-lg border p-4 shadow-sm hover:shadow-md transition"
          :class="bodegaActiva?.id === b.id 
            ? 'bg-indigo-50 border-indigo-400' 
            : 'bg-white border-gray-200'"
        >
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-bold text-indigo-700 flex items-center gap-2">
              <Icon icon="mdi:warehouse" class="w-5 h-5 text-indigo-600" />
              {{ b.nombre }}
            </h3>
            <span
              v-if="b.isDeleted"
              class="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full"
            >
              Eliminada
            </span>
          </div>
          <p class="text-sm text-gray-600">
            📍 {{ b.direccion || 'Sin dirección' }}
          </p>
          <p class="text-sm text-gray-600">
            👤 Encargado: <span class="font-medium">{{ b.nombreEncargado || 'N/A' }}</span>
          </p>
        </div>
      </div>


      <div v-if="dibujando" class="flex gap-2 mb-4">
        <button
          @click="
            () => {
              modoDibujo = 'polygon'
              dibujando = true
              bodegaActiva.puntos = []
            }
          "
          class="flex items-center gap-2 px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <Icon icon="mdi:vector-polygon" class="w-4 h-4" />
          Polígono
        </button>
        <button
          @click="
            () => {
              modoDibujo = 'rect'
              dibujando = true
              bodegaActiva.puntos = []
            }
          "
          class="flex items-center gap-2 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          <Icon icon="mdi:rectangle-outline" class="w-4 h-4" />
          Rectángulo
        </button>
      </div>

      <div
        v-if="bodegaActiva"
        ref="containerRef"
        class="relative rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200"
      >
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

        <div
          class="h-[500px] md:h-[600px] lg:h-[700px] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"
        >
        <div v-if="seccionEditando" class="absolute top-16 right-4 z-50">
          <button
            @click="seccionEditando = null"
            class="flex items-center gap-1 px-3 py-1 bg-yellow-600 text-white rounded shadow hover:bg-yellow-700 transition"
          >
            <Icon icon="mdi:check" class="w-4 h-4" />
            Terminar edición
          </button>
        </div>
          <v-stage
            ref="stageRef"
            :config="{
              width: containerRef?.offsetWidth || 800,
              height: containerRef?.offsetHeight || 500,
            }"
            style="width: 100%; height: 100%"
            @click="agregarPunto"
            @mousemove="moverMouse"
          >
            <v-layer>
              <v-circle
                v-if="dibujando && bodegaActiva?.puntos?.length"
                :config="{
                  x: bodegaActiva.puntos[0],
                  y: bodegaActiva.puntos[1],
                  radius: 8,
                  fill: '#fff',
                  stroke: '#10b981',
                  strokeWidth: 2,
                  shadowBlur: 4,
                }"
              />

              <v-line
                v-if="bodegaActiva?.puntos && bodegaActiva.puntos.length > 1"
                :config="{
                  points: bodegaActiva.puntos,
                  stroke: '#374151',
                  strokeWidth: 2,
                  closed: bodegaActiva.cerrado,
                  fill: bodegaActiva.cerrado
                    ? 'rgba(99,102,241,0.08)'
                    : undefined,
                }"
              />

              <v-line
                v-if="dibujando && previewPunto && bodegaActiva?.puntos?.length"
                :config="{
                  points: [
                    ...bodegaActiva.puntos,
                    previewPunto.x,
                    previewPunto.y,
                  ],
                  stroke: '#6366f1',
                  dash: [6, 4],
                  strokeWidth: 2,
                }"
              />

              <v-rect
                v-if="
                  dibujando &&
                  modoDibujo === 'rect' &&
                  inicioRect &&
                  previewPunto
                "
                :config="{
                  x: Math.min(inicioRect.x, previewPunto.x),
                  y: Math.min(inicioRect.y, previewPunto.y),
                  width: Math.abs(previewPunto.x - inicioRect.x),
                  height: Math.abs(previewPunto.y - inicioRect.y),
                  stroke: '#3b82f6',
                  dash: [6, 4],
                  strokeWidth: 2,
                  fill: 'rgba(59,130,246,0.12)',
                }"
              />

              <template v-for="sec in bodegaActiva.secciones" :key="sec.id">
                <v-group
                  :config="{ x: sec.x, y: sec.y, draggable: true }"
                  @dragend="moverSeccion(sec, $event)"
                  @dblclick="() => { if (!seccionEditando) abrirDetalle(sec) }"
                >
                  <v-rect
                    :ref="(el) => (sec.node = el)"
                    :config="{
                      width: sec.width,
                      height: sec.height,
                      fill: '#3b82f6',
                      opacity: 0.9,
                      stroke: '#1e40af',
                      strokeWidth: 2,
                      cornerRadius: 6,
                      shadowBlur: 6,
                      name: `sec-${sec.id}`,
                    }"
                    @transformend="onTransformEnd(sec, $event)"
                  />
                  <v-text
                    :config="{
                      x: 0,
                      y: sec.height / 2 - 8,
                      width: sec.width,
                      align: 'center',
                      text: sec.nombre,
                      fontSize: 14,
                      fill: 'white',
                      fontStyle: 'bold',
                    }"
                  />
                  <v-text
                    :config="{
                      x: sec.width - 16,
                      y: 4,
                      text: '✕',
                      fontSize: 14,
                      fill: 'white',
                      fontStyle: 'bold',
                      cursor: 'pointer',
                    }"
                    @click="borrarSeccion(sec)"
                  />

                  <v-text
                    v-if="seccionEditando?.id !== sec.id"
                    :config="{
                      x: sec.width - 20,
                      y: sec.height - 20,
                      text: '✏️',
                      fontSize: 14,
                      fill: 'yellow',
                      cursor: 'pointer',
                    }"
                    @click="editarSeccion(sec)"
                  />

                </v-group>
                <v-transformer
                  v-if="seccionEditando?.id === sec.id"
                  :config="{
                    nodes: [sec.node?.getNode()],
                    enabledAnchors: [
                      'top-left',
                      'top-right',
                      'bottom-left',
                      'bottom-right',
                    ],
                    rotateEnabled: false,
                    keepRatio: false,
                  }"
                />
              </template>
              <template v-for="ubic in ubicacionesActivas" :key="ubic._key">
                <v-group
                  :config="{ x: ubic.x, y: ubic.y }"
                  @click="abrirUbicacion(ubic)"
                  @dblclick="() => {
                    if (ubic.simulatedPosition) {
                      detalleSeccion.value = seccionDemo // de momento usamos demo
                    } else {
                      abrirUbicacion(ubic)
                    }
                  }"
                >
                  <v-circle
                    :config="{
                      radius: 14,
                      fill: ubic.simulatedPosition ? '#fbbf24' : '#ee9452',
                      stroke: ubic.simulatedPosition ? '#d97706' : '#c2410c',
                      strokeWidth: 2,
                      shadowBlur: 8,
                    }"
                  />
                  <v-text
                    :config="{
                      x: 20,
                      y: -6,
                      text: ubic.nombre,
                      fontSize: 13,
                      fontStyle: 'bold',
                      fill: '#1f2937',
                    }"
                  />
                </v-group>
              </template>

            </v-layer>
          </v-stage>
        </div>
      </div>
      <div
        v-if="ubicacionesActivas.length"
        class="mt-8"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-indigo-700 flex items-center gap-2">
            <Icon icon="mdi:map-marker" class="w-5 h-5 text-indigo-600" />
            Ubicaciones en bodega
          </h3>
          <span class="text-sm text-gray-500">
            {{ ubicacionesActivas.length }} ubicaciones
          </span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="ubic in ubicacionesActivas"
            :key="ubic._key + '-card'"
            class="relative rounded-lg border border-indigo-100 bg-white/80 backdrop-blur-sm p-4 shadow-sm hover:shadow-md transition"
            @click="abrirUbicacion(ubic)"
          >
            <button
              class="absolute top-3 right-3 text-xs font-semibold text-red-500 hover:text-red-600"
              @click.stop="eliminarUbicacion(ubic)"
              type="button"
            >
              X
            </button>
            <div class="flex items-start gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-semibold"
              >
                {{ (ubic.nombre || 'U').charAt(0).toUpperCase() }}
              </div>
              <div class="space-y-1 text-sm">
                <h4 class="text-base font-semibold text-gray-800">
                  {{ ubic.nombre }}
                </h4>
                <p
                  v-if="ubic.descripcion && ubic.descripcion !== ubic.nombre"
                  class="text-gray-600"
                >
                  {{ ubic.descripcion }}
                </p>
                <p v-if="ubic.codigo" class="text-xs uppercase tracking-wide text-indigo-500">
                  Codigo: {{ ubic.codigo }}
                </p>
                <p v-if="ubic.capacidad" class="text-xs text-gray-500">
                  Capacidad: {{ ubic.capacidad }}
                </p>
                <p v-if="ubic.simulatedPosition" class="text-xs text-gray-400 italic">
                  Posicion mostrada de forma simulada
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="detalleUbicacion" class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 rounded-xl border border-indigo-100 bg-white/90 backdrop-blur-sm p-5 shadow-lg">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-indigo-700">
              Detalle de {{ detalleUbicacion.nombre }}
            </h3>
            <button
              class="text-sm text-indigo-500 hover:text-indigo-600 font-semibold"
              type="button"
              @click="cerrarDetalleUbicacion()"
            >
              Cerrar
            </button>
          </div>
          <dl class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <dt class="font-semibold text-gray-900">Descripcion</dt>
              <dd>{{ detalleUbicacion.descripcion || 'Sin descripcion' }}</dd>
            </div>
            <div>
              <dt class="font-semibold text-gray-900">Codigo</dt>
              <dd>{{ detalleUbicacion.codigo || 'Sin codigo' }}</dd>
            </div>
            <div>
              <dt class="font-semibold text-gray-900">Capacidad</dt>
              <dd>{{ detalleUbicacion.capacidad ?? 'Desconocida' }}</dd>
            </div>
            <div>
              <dt class="font-semibold text-gray-900">Posicion</dt>
              <dd>{{ detalleUbicacion.x }}, {{ detalleUbicacion.y }} <span v-if="detalleUbicacion.simulatedPosition" class="italic text-xs text-gray-500">(simulada)</span></dd>
            </div>
          </dl>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-5 shadow" v-if="detalleUbicacion?.medicamentos?.length">
          <h4 class="text-lg font-semibold text-gray-800 mb-3">Medicamentos almacenados</h4>
          <ul class="space-y-2 text-sm text-gray-700">
            <li v-for="med in detalleUbicacion.medicamentos" :key="med.id || med.nombre" class="flex justify-between border-b border-gray-100 pb-2">
              <span class="font-medium">{{ med.nombre || 'Producto' }}</span>
              <span class="text-gray-500">{{ med.cantidad ?? med.stock ?? '?' }} unidades</span>
            </li>
          </ul>
        </div>
      </div>
      <DetalleSeccion
                  v-if="detalleSeccion"
                  :seccion="seccionDemo"
                  @cerrar="detalleSeccion = null"
                />

      <p v-else class="text-gray-500 italic">
        Crea una bodega y dibuja su polígono en el lienzo.
      </p>
    </div>
  </div>
</template>
