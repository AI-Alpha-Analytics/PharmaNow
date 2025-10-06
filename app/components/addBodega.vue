<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { createBodega, updateBodega } from '~/services/inventarioService'
import { onMounted } from 'vue'
// 🔹 Eventos que el padre escuchará
const emit = defineEmits(['cerrar', 'creada', 'actualizada'])
const props = defineProps({
  bodega: { type: Object, default: null }, // Si existe, se está editando
})
onMounted(() => {
  if (props.bodega) {
    console.log('Modo edición: cargando datos de la bodega...')
    form.value.nombre = props.bodega.nombre || ''
    form.value.direccion = props.bodega.direccion || ''
    form.value.nombreEncargado = props.bodega.nombreEncargado || ''
    form.value.puntos = props.bodega.puntos || []
    form.value.cerrado = true
  }
})
// 📦 Formulario base
const form = ref({
  nombre: '',
  direccion: '',
  nombreEncargado: '',
  puntos: [],
  cerrado: false,
})

// 🧩 Estado de dibujo
const dibujando = ref(false)
const modoDibujo = ref('polygon') // "polygon" o "rect"
const previewPunto = ref(null)
const inicioRect = ref(null)
const previewRect = ref(null)
const stageRef = ref(null)
const containerRef = ref(null)

// ===============================
// 🟦 Iniciar dibujo
// ===============================
const iniciarDibujo = (modo) => {
  form.value.puntos = []
  form.value.cerrado = false
  dibujando.value = true
  modoDibujo.value = modo
  inicioRect.value = null
  previewPunto.value = null
  previewRect.value = null
}

// ===============================
// 🟡 Mover mouse → vista previa
// ===============================
const onPointerMove = (e) => {
  if (!dibujando.value) return
  const pos = e.target.getStage().getPointerPosition()
  if (!pos) return

  previewPunto.value = pos

  if (modoDibujo.value === 'rect' && inicioRect.value) {
    const { x, y } = inicioRect.value
    previewRect.value = {
      x,
      y,
      width: pos.x - x,
      height: pos.y - y,
    }
  }
}

// ===============================
// 🟢 Click → agregar punto o cerrar forma
// ===============================
const onPointerDown = (e) => {
  if (!dibujando.value) {
    console.log('%c⛔ No está en modo dibujo', 'color: red; font-weight: bold;')
    return
  }

  const stage = e.target.getStage()
  const pos = stage?.getPointerPosition()
  if (!pos) {
    console.log(
      '%c⚠️ No se pudo obtener posición del puntero',
      'color: orange;'
    )
    return
  }

  console.log(
    `%c🖱️ Click detectado en: x=${pos.x.toFixed(1)}, y=${pos.y.toFixed(1)}`,
    'color: #22c55e; font-weight: bold;'
  )

  // ==========================================================
  // 🔷 POLÍGONO
  // ==========================================================
  if (modoDibujo.value === 'polygon') {
    console.log(
      '%c🔵 Modo dibujo: POLÍGONO',
      'color: dodgerblue; font-weight: bold;'
    )

    if (tryClosePolygonNearFirstPoint(pos)) {
      console.log(
        '%c✅ Polígono cerrado cerca del primer punto',
        'color: limegreen;'
      )
      return
    }

    form.value.puntos.push(pos.x, pos.y)
    console.log(
      `%c📍 Punto agregado (#${form.value.puntos.length / 2}): [${pos.x.toFixed(
        1
      )}, ${pos.y.toFixed(1)}]`,
      'color: cyan;'
    )
  }

  // ==========================================================
  // 🟩 RECTÁNGULO
  // ==========================================================
  if (modoDibujo.value === 'rect') {
    console.log(
      '%c🟩 Modo dibujo: RECTÁNGULO',
      'color: limegreen; font-weight: bold;'
    )

    if (!inicioRect.value) {
      // Primer clic
      inicioRect.value = pos
      previewRect.value = null
      console.log('%c🟨 Primer clic: inicio del rectángulo', 'color: gold;')
    } else {
      // Segundo clic: cerrar
      const { x, y } = inicioRect.value
      const ancho = pos.x - x
      const alto = pos.y - y
      form.value.puntos = [x, y, x + ancho, y, x + ancho, y + alto, x, y + alto]
      form.value.cerrado = true
      dibujando.value = false
      inicioRect.value = null
      previewPunto.value = null
      previewRect.value = null

      console.log(
        `%c🧱 Rectángulo creado: ancho=${ancho.toFixed(1)} alto=${alto.toFixed(
          1
        )}`,
        'color: deepskyblue; font-weight: bold;'
      )
      console.log('%c✅ Dibujo de rectángulo finalizado', 'color: limegreen;')
    }
  }
}

// ===============================
// 🔸 Cerrar polígono manualmente si clic cerca del 1° punto
// ===============================
const tryClosePolygonNearFirstPoint = (pos) => {
  const pts = form.value.puntos
  if (pts.length < 4) return false
  const dx = pos.x - pts[0]
  const dy = pos.y - pts[1]
  const dist = Math.hypot(dx, dy)
  if (dist < 12) {
    form.value.cerrado = true
    dibujando.value = false
    previewPunto.value = null
    return true
  }
  return false
}

// ===============================
// 💾 Guardar bodega en backend
// ===============================
// ===============================
// 💾 Guardar bodega en backend (versión corregida)
// ===============================
const guardarBodega = async () => {
  if (!form.value.nombre.trim()) {
    alert('Debe ingresar un nombre para la bodega.')
    return
  }

  // Calcular layout solo si hay puntos nuevos
  let layout = null
  if (form.value.puntos.length) {
    const xs = form.value.puntos.filter((_, i) => i % 2 === 0)
    const ys = form.value.puntos.filter((_, i) => i % 2 === 1)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)

    layout = {
      ancho: +(maxX - minX).toFixed(1),
      alto: +(maxY - minY).toFixed(1),
      x: +minX.toFixed(1),
      y: +minY.toFixed(1),
    }
  } else if (props.bodega?.layout) {
    layout = props.bodega.layout // mantener el actual si no se redibuja
  }

  // ✅ Incluir puntos y cerrado también
  const payload = {
    nombre: form.value.nombre,
    direccion: form.value.direccion,
    nombreEncargado: form.value.nombreEncargado,
    layout,
    puntos: form.value.puntos,
    cerrado: form.value.cerrado,
  }

  try {
    let res
    if (props.bodega) {
      // ✏️ Editar bodega existente
      res = await updateBodega(props.bodega.id, payload)
      console.log('✅ Bodega actualizada correctamente:', res)
      emit('actualizada', { ...res, layout })
    } else {
      // 🆕 Crear nueva bodega
      res = await createBodega(payload)
      console.log('✅ Bodega creada correctamente:', res)
      emit('creada', { ...res, layout })
    }

    emit('cerrar')
  } catch (err) {
    console.error('❌ Error al guardar bodega:', err)
    alert('Error al guardar la bodega. Verifica la consola.')
  }
}
</script>
<template>
  <!-- 🔷 Modal contenedor -->
  <div
    class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]"
  >
    <div
      class="bg-white rounded-xl shadow-2xl w-[900px] max-h-[90vh] overflow-auto border border-indigo-100"
    >
      <!-- 🟣 Header -->
      <div
        class="flex justify-between items-center border-b px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-t-xl"
      >
        <h2 class="text-xl font-bold flex items-center gap-2">
          <Icon icon="mdi:warehouse" class="w-6 h-6" />
          {{ props.bodega ? 'Editar Bodega' : 'Nueva Bodega' }}
        </h2>

        <button
          @click="
            () => {
              console.log('❌ Cerrar modal')
              emit('cerrar')
            }
          "
          class="hover:text-red-200 transition"
          title="Cerrar"
        >
          <Icon icon="mdi:close" class="w-6 h-6" />
        </button>
      </div>

      <!-- 🧾 Formulario -->
      <div class="p-6 space-y-5">
        <!-- Campos básicos -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700">
              Nombre
            </label>
            <input
              v-model="form.nombre"
              type="text"
              placeholder="Ej: Bodega Central"
              class="w-full border rounded-lg p-2 focus:ring focus:ring-indigo-300"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700">
              Dirección
            </label>
            <input
              v-model="form.direccion"
              type="text"
              placeholder="Ej: Calle 123"
              class="w-full border rounded-lg p-2 focus:ring focus:ring-indigo-300"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700">
              Encargado
            </label>
            <input
              v-model="form.nombreEncargado"
              type="text"
              placeholder="Ej: Juan Pérez"
              class="w-full border rounded-lg p-2 focus:ring focus:ring-indigo-300"
            />
          </div>
        </div>

        <!-- 🎨 Controles de dibujo -->
        <div class="flex gap-3 mt-4">
          <button
            @click="
              () => {
                iniciarDibujo('polygon')
                console.log('🟢 Modo Polígono activado')
              }
            "
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200',
              modoDibujo === 'polygon' && dibujando
                ? 'bg-indigo-700 text-white ring-2 ring-indigo-300 scale-105'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105',
            ]"
          >
            <Icon icon="mdi:vector-polygon" />
            Polígono
          </button>

          <button
            @click="
              () => {
                iniciarDibujo('rect')
                console.log('🔷 Modo Rectángulo activado')
              }
            "
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200',
              modoDibujo === 'rect' && dibujando
                ? 'bg-blue-700 text-white ring-2 ring-blue-300 scale-105'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105',
            ]"
          >
            <Icon icon="mdi:rectangle-outline" />
            Rectángulo
          </button>
        </div>

        <!-- 🖼️ Lienzo de dibujo -->
        <div
          ref="containerRef"
          class="border rounded-lg shadow-inner bg-gray-50 h-[400px] relative mt-4"
          style="pointer-events: auto; overflow: hidden"
        >
          <v-stage
            ref="stageRef"
            :config="{ width: 800, height: 400 }"
            style="border: 1px solid #e5e7eb"
          >
            <v-layer
              :config="{ listening: true }"
              @pointerdown="onPointerDown"
              @pointermove="onPointerMove"
            >
              <v-rect
                :config="{
                  x: 0,
                  y: 0,
                  width: 800,
                  height: 400,
                  fill: 'transparent',
                  listening: true,
                }"
              />

              <!-- 🔵 Primer punto -->
              <v-circle
                v-if="dibujando && form.puntos.length"
                :config="{
                  x: form.puntos[0],
                  y: form.puntos[1],
                  radius: 8,
                  fill: '#fff',
                  stroke: '#10b981',
                  strokeWidth: 2,
                }"
              />

              <!-- 🔷 Polígono base -->
              <v-line
                v-if="form.puntos.length > 1"
                :config="{
                  points: form.puntos,
                  stroke: '#374151',
                  strokeWidth: 2,
                  lineJoin: 'round',
                  closed: form.cerrado,
                  fill: form.cerrado ? 'rgba(99,102,241,0.1)' : undefined,
                }"
              />

              <!-- 🟣 Línea temporal -->
              <v-line
                v-if="
                  dibujando &&
                  previewPunto &&
                  form.puntos.length &&
                  modoDibujo === 'polygon'
                "
                :config="{
                  points: [...form.puntos, previewPunto.x, previewPunto.y],
                  stroke: '#6366f1',
                  dash: [6, 4],
                  strokeWidth: 2,
                }"
              />

              <!-- 🟦 Rectángulo preview -->
              <v-rect
                v-if="
                  dibujando &&
                  modoDibujo === 'rect' &&
                  inicioRect &&
                  previewRect
                "
                :config="{
                  x: Math.min(inicioRect.x, inicioRect.x + previewRect.width),
                  y: Math.min(inicioRect.y, inicioRect.y + previewRect.height),
                  width: Math.abs(previewRect.width),
                  height: Math.abs(previewRect.height),
                  stroke: '#3b82f6',
                  dash: [6, 4],
                  strokeWidth: 2,
                  fill: 'rgba(59,130,246,0.12)',
                }"
              />

              <!-- 🔹 Puntos -->
              <template v-for="(coord, i) in form.puntos" :key="i">
                <v-circle
                  v-if="i % 2 === 0"
                  :config="{
                    x: form.puntos[i],
                    y: form.puntos[i + 1],
                    radius: 4,
                    fill: i === 0 ? '#10b981' : '#2563eb',
                    stroke: '#1e3a8a',
                    strokeWidth: 1,
                  }"
                />
              </template>
            </v-layer>
          </v-stage>
        </div>

        <!-- 🧭 Botones -->
        <div class="flex justify-end gap-3 mt-6">
          <button
            @click="
              () => {
                console.log('🚫 Cancelar creación')
                emit('cerrar')
              }
            "
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 active:bg-gray-500 transition-all duration-150"
          >
            Cancelar
          </button>
          <button
            @click="guardarBodega"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 transition-all duration-150"
          >
            {{ props.bodega ? 'Actualizar' : 'Guardar Bodega' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
