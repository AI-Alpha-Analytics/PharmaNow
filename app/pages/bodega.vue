<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
const bodegas = ref([])
const bodegaActiva = ref(null)
const dibujando = ref(false)
const previewPunto = ref(null)
const modoDibujo = ref('polygon')
const inicioRect = ref(null)

const containerRef = ref(null)
const stageRef = ref(null)

let resizeObserver = null
const seccionEditando = ref(null)

const onTransformEnd = (sec, e) => {
  const node = e.target
  sec.width = node.width() * node.scaleX()
  sec.height = node.height() * node.scaleY()

  node.scaleX(1)
  node.scaleY(1)

  guardar()
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
  dibujando.value = true
  guardar()
}

const borrarBodega = (id) => {
  bodegas.value = bodegas.value.filter((b) => b.id !== id)
  if (bodegaActiva.value?.id === id) {
    bodegaActiva.value = bodegas.value.length > 0 ? bodegas.value[0] : null
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

onMounted(() => {
  const raw = localStorage.getItem('bodegas')
  if (raw) {
    bodegas.value = JSON.parse(raw).map((b) => ({
      ...b,
      puntos: b.puntos || [],
      secciones: b.secciones || [],
      cerrado: b.cerrado || false,
    }))
    if (bodegas.value.length > 0) bodegaActiva.value = bodegas.value[0]
  }

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

      <div class="flex flex-wrap gap-3 mb-6">
        <button
          v-for="b in bodegas"
          :key="b.id"
          @click="bodegaActiva = b"
          class="px-3 py-2 rounded-lg border flex items-center gap-2"
          :class="
            bodegaActiva?.id === b.id
              ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
              : 'hover:bg-gray-100'
          "
        >
          <Icon icon="mdi:warehouse" class="w-4 h-4" />
          {{ b.nombre }}
        </button>
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
                  @dblclick="
                    seccionEditando =
                      seccionEditando?.id === sec.id ? null : sec
                  "
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
                  <button
                    @click="seccionEditando = sec"
                    class="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    <Icon icon="mdi:pencil" />
                  </button>
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
            </v-layer>
          </v-stage>
        </div>
      </div>

      <p v-else class="text-gray-500 italic">
        Crea una bodega y dibuja su polígono en el lienzo.
      </p>
    </div>
  </div>
</template>
