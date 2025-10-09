<template>
  <div
    class="w-full h-full bg-gray-100 rounded-lg overflow-hidden flex-1 relative"
  >
    <div class="absolute top-4 right-4 flex flex-col gap-2 z-50">
      <button
        @click="centrarCamara"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md transition"
      >
        Centrar bodega
      </button>
      <button
        @click="vistaCenital"
        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md transition"
      >
        Vista desde arriba
      </button>
      <button
        @click="vistaIsometrica"
        class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg shadow-md transition"
      >
        Vista 45 deg
      </button>
    </div>

    <TresCanvas clear-color="#f9fafb">
      <!-- Camara controlada -->
      <TresPerspectiveCamera
        ref="cameraRef"
        :position="cameraPosition"
        :look-at="cameraLookAt"
      />
      <!-- OrbitControls con movimiento habilitado -->
      <OrbitControls
        ref="controlsRef"
        :enableRotate="true"
        :enablePan="true"
        :enableZoom="true"
        :maxPolarAngle="Math.PI / 2.05"
        :minDistance="1"
        :maxDistance="50"
      />

      <!-- Luces -->
      <TresAmbientLight :intensity="1.15" />
      <TresHemisphereLight :intensity="0.55" />
      <TresDirectionalLight
        :position="[8, 10, 5]"
        :intensity="1.35"
        color="#ffffff"
      />
      <TresAxesHelper :args="[5]" />

      <!-- Piso de la bodega (alineado al cuadrante positivo) -->
      <TresGroup v-for="bodega in bodegasEscaladas" :key="bodega.id">
        <TresMesh :position="[0, 0, 0]" rotation-x="-1.57">
          <TresPlaneGeometry :args="[bodega.width, bodega.height]" />
          <TresMeshStandardMaterial
            :color="bodega.colorFloor"
            :roughness="0.85"
          />
        </TresMesh>
        <TresGridHelper
          :args="[
            Math.max(bodega.width, bodega.height),
            20,
            '#cbd5f5',
            '#e5edff',
          ]"
        />
      </TresGroup>

      <!-- Ubicaciones con relieve -->
      <TresGroup
        v-for="u in ubicacionesDecoradas"
        :key="u.id"
        :position="[u.x3D, 0, u.z3D]"
        :scale="[u.scale, 1, u.scale]"
      >
        <!-- Base sombreada -->
        <TresMesh
          :position="[0, u.shadowHeight / 2, 0]"
          @dblclick="(e) => handleSectionDoubleClick(e, u.raw)"
          @pointerover="handlePointerOver(u.id)"
          @pointerout="handlePointerOut"
        >
          <TresBoxGeometry
            :args="[u.width3D * 1.04, u.shadowHeight, u.depth3D * 1.04]"
          />
          <TresMeshStandardMaterial
            :color="u.shadowColor"
            :roughness="1"
            :metalness="0"
          />
        </TresMesh>

        <!-- Cuerpo principal -->
        <TresGroup :position="[0, u.baseYOffset, 0]">
          <!-- 🔹 4 pilares -->
          <TresMesh
            v-for="(pillar, i) in generarPilares(u)"
            :key="'pillar-' + i"
            :position="pillar.position"
          >
            <TresBoxGeometry :args="pillar.size" />
            <TresMeshStandardMaterial
              :color="u.baseColor"
              :roughness="0.4"
              :metalness="0.3"
              :emissive="u.isHovered ? u.emissiveColor : '#000000'"
              :emissiveIntensity="u.isHovered ? 0.6 : 0.15"
            />
          </TresMesh>

          <!-- 🔸 Niveles internos apilados dentro de los pilares -->
          <TresGroup
            v-for="(nivel, i) in generarNiveles(u)"
            :key="'nivel-' + i"
            :position="nivel.position"
          >
            <TresMesh>
              <TresBoxGeometry :args="nivel.size" />
              <TresMeshStandardMaterial
                :color="nivel.color"
                :roughness="0.4"
                :metalness="0.1"
                :emissive="adjustColor(nivel.color, -25)"
                :emissiveIntensity="0.3"
              />
            </TresMesh>
          </TresGroup>
        </TresGroup>
      </TresGroup>
    </TresCanvas>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import * as THREE from 'three'
const emit = defineEmits(['seleccionarUbicacion'])
const props = defineProps({
  ubicaciones: { type: Array, default: () => [] },
})

const scale = 100
const cameraRef = ref(null)
const controlsRef = ref(null)
const hoveredUbicacionId = ref(null)

// ==========================
// Bodegas
// ==========================
const bodegasEscaladas = computed(() => {
  const bodegasMap = {}
  props.ubicaciones.forEach((u) => {
    if (u.bodega && !bodegasMap[u.bodega.id]) {
      const b = u.bodega
      bodegasMap[b.id] = {
        id: b.id,
        nombre: b.nombre,
        width: b.layout.ancho / scale,
        height: b.layout.alto / scale,
        colorFloor: '#dbeafe',
      }
    }
  })
  return Object.values(bodegasMap)
})

// ==========================
// Ubicaciones
// ==========================
const EPS = 1 // grosor minimo solo para que se vea algo cuando z=0

const ubicacionesEscaladas = computed(() => {
  const bodega = bodegasEscaladas.value[0]
  const offsetX = bodega ? bodega.width / 2 : 0
  const offsetZ = bodega ? bodega.height / 2 : 0

  const ajusteX = -0.18
  const ajusteZ = 0.18

  return props.ubicaciones.map((source) => {
    const width3D = source.width / scale
    const depth3D = source.height / scale

    // altura en 3D sale de z (si z = 20 => 20/100 = 0.2 de altura)
    // usamos EPS solo cuando z=0 para que no desaparezca
    const alturaReal = source.z ?? 0
    const height3D = (alturaReal > 0 ? alturaReal : EPS) / scale

    // base en el suelo: el centro queda a height3D/2
    const y3D = height3D / 2

    const x3D = (source.x + source.width / 2) / scale - offsetX + ajusteX
    const z3D = (source.y + source.height / 2) / scale - offsetZ - ajusteZ

    return {
      ...source,
      raw: source,
      x3D,
      y3D,
      z3D,
      width3D,
      height3D,
      depth3D,
    }
  })
})

const ubicacionesDecoradas = computed(() => {
  return ubicacionesEscaladas.value.map((u) => {
    const baseColorHex = u.color || '#f97316'
    const isHovered = hoveredUbicacionId.value === u.id
    const accentHeight = Math.min(
      Math.max(u.height3D * 0.22, 0.02),
      u.height3D * 0.6
    )
    const baseHeight = Math.max(u.height3D - accentHeight, 0.02)
    const shadowHeight = 0.01

    return {
      ...u,
      baseHeight,
      baseYOffset: shadowHeight + baseHeight / 2,
      accentHeight,
      accentWidth: u.width3D * 0.9,
      accentDepth: u.depth3D * 0.9,
      accentYOffset: shadowHeight + baseHeight + accentHeight / 2,
      shadowHeight,
      shadowColor: adjustColor(baseColorHex, -60),
      baseColor: adjustColor(baseColorHex, -12),
      accentColor: adjustColor(baseColorHex, 18),
      hoverColor: adjustColor(baseColorHex, 20),
      emissiveColor: isHovered
        ? adjustColor(baseColorHex, 28)
        : adjustColor(baseColorHex, -38),
      isHovered,
      scale: isHovered ? 1.05 : 1,
    }
  })
})

// ==========================
// Camara control
// ==========================
const cameraPosition = ref([5, 6, 10])
const cameraLookAt = ref([5, 0, 3])

function centrarCamara() {
  const bodega = bodegasEscaladas.value[0]
  if (!bodega) return

  const centerX = bodega.width / 2
  const centerZ = bodega.height / 2

  // Mueve la camara arriba con un leve angulo
  cameraPosition.value = [centerX, 10, centerZ + 5]
  cameraLookAt.value = [centerX, 0, centerZ]
  actualizarOrbit(centerX, centerZ)
}

function vistaCenital() {
  const bodega = bodegasEscaladas.value[0]
  if (!bodega) return

  const centerX = bodega.width / 2
  const centerZ = bodega.height / 2

  // Vista 100% desde arriba
  cameraPosition.value = [centerX, 20, centerZ]
  cameraLookAt.value = [centerX, 0, centerZ]
  actualizarOrbit(centerX, centerZ)
}

function vistaIsometrica() {
  const bodega = bodegasEscaladas.value[0]
  if (!bodega) return

  const centerX = bodega.width / 2
  const centerZ = bodega.height / 2

  // Vista 45 deg (similar a una vista 3D tecnica)
  const distancia = Math.max(bodega.width, bodega.height)
  cameraPosition.value = [
    centerX + distancia / 1.5,
    distancia,
    centerZ + distancia / 1.5,
  ]
  cameraLookAt.value = [centerX, 0, centerZ]
  actualizarOrbit(centerX, centerZ)
}

function actualizarOrbit(centerX, centerZ) {
  if (controlsRef.value?.value) {
    const controls = controlsRef.value.value
    controls.target.set(centerX, 0, centerZ)
    controls.update()
  }
}

function handleSectionDoubleClick(e, ubicacion) {
  e.stopPropagation()
  emit('seleccionarUbicacion', ubicacion)
}

function handlePointerOver(id) {
  hoveredUbicacionId.value = id
}

function handlePointerOut() {
  hoveredUbicacionId.value = null
}

// ==========================
// Utilidades de color
// ==========================
function adjustColor(hex, amount) {
  const { r, g, b } = hexToRgb(hex)
  const factor = amount / 100
  const nr = clamp(
    Math.round(r + (amount > 0 ? (255 - r) * factor : r * factor)),
    0,
    255
  )
  const ng = clamp(
    Math.round(g + (amount > 0 ? (255 - g) * factor : g * factor)),
    0,
    255
  )
  const nb = clamp(
    Math.round(b + (amount > 0 ? (255 - b) * factor : b * factor)),
    0,
    255
  )
  return rgbToHex(nr, ng, nb)
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '')
  const bigint = parseInt(normalized, 16)
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((value) => {
      const clamped = clamp(value, 0, 255)
      const hex = clamped.toString(16)
      return hex.length === 1 ? `0${hex}` : hex
    })
    .join('')}`
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}
function generarPilares(u) {
  const pillarThickness = Math.min(u.width3D, u.depth3D) * 0.18

  // 🔹 Pilares un poco más cortos (solo hasta la parte superior de los niveles)
  const pillarHeight = u.baseHeight * 1.15

  const offsetX = u.width3D / 2 - pillarThickness / 2
  const offsetZ = u.depth3D / 2 - pillarThickness / 2

  // 🔹 Bajamos un poco los pilares para que no tapen los niveles
  const yOffset = pillarHeight / 2 - u.baseHeight / 2

  return [
    {
      position: [-offsetX, yOffset, -offsetZ],
      size: [pillarThickness, pillarHeight, pillarThickness],
    },
    {
      position: [offsetX, yOffset, -offsetZ],
      size: [pillarThickness, pillarHeight, pillarThickness],
    },
    {
      position: [-offsetX, yOffset, offsetZ],
      size: [pillarThickness, pillarHeight, pillarThickness],
    },
    {
      position: [offsetX, yOffset, offsetZ],
      size: [pillarThickness, pillarHeight, pillarThickness],
    },
  ]
}

function generarNiveles(u) {
  const niveles = []

  const alturaReal = u.raw.z || 90
  const alturaPorNivel = 90
  const cantidadNiveles = Math.max(1, Math.round(alturaReal / alturaPorNivel))

  // 🔹 Altura de los pilares (el límite total)
  const alturaPilar = u.baseHeight * 1.15

  // 🔹 Los niveles deben caber dentro del volumen de los pilares
  const margenSuperior = alturaPilar * 0.03
  const margenInferior = alturaPilar * 0.03
  const alturaUtil = alturaPilar - margenSuperior - margenInferior

  // 🔸 Proporción interna: más separación visible (40%)
  const separacionRatio = 0.4
  const alturaNivel =
    alturaUtil / (cantidadNiveles + (cantidadNiveles - 1) * separacionRatio)
  const separacion = alturaNivel * separacionRatio

  // 🔸 Márgenes laterales (para no chocar con los pilares)
  const margenLateral = Math.min(u.width3D, u.depth3D) * 0.25

  // 🔸 Base inferior dentro del límite del pilar
  const offsetBase = -alturaPilar / 2 + margenInferior + alturaNivel / 2

  // 🎨 Color distinto para niveles (más frío y claro)
  const colorBaseNiveles = adjustColor(u.baseColor, 35)
  const colorAlternativo = adjustColor(u.baseColor, 55)

  // 🧱 Crear niveles dentro del rango permitido
  for (let i = 0; i < cantidadNiveles; i++) {
    const y = offsetBase + i * (alturaNivel + separacion)
    niveles.push({
      position: [0, y, 0],
      size: [
        u.width3D - margenLateral,
        alturaNivel * 0.9,
        u.depth3D - margenLateral,
      ],
      // alterna entre dos tonos para un efecto visual más nítido
      color: i % 2 === 0 ? colorBaseNiveles : colorAlternativo,
    })
  }

  return niveles
}
// ==========================
// Debug
// ==========================
watch(
  () => props.ubicaciones,
  (ubicaciones) => {
    console.groupCollapsed('Ubicaciones originales')
    ubicaciones.forEach((u, i) => {
      console.log(
        `#${i + 1} ${u.descripcion || '(sin nombre)'}`,
        `\n  x: ${u.x}`,
        `\n  y: ${u.y}`,
        `\n  width: ${u.width}`,
        `\n  height: ${u.height}`,
        `\n  bodega ancho: ${u.bodega?.layout?.ancho}`,
        ` alto: ${u.bodega?.layout?.alto}`
      )
    })
    console.groupEnd()
  },
  { immediate: true }
)

watch(
  () => bodegasEscaladas.value,
  (bodegas) => {
    if (!bodegas.length) return
    console.groupCollapsed('Bodega escalada')
    bodegas.forEach((b) => {
      console.log(
        `Bodega: ${b.nombre}`,
        `\n  width: ${b.width}`,
        `\n  height: ${b.height}`,
        `\n  colorFloor: ${b.colorFloor}`
      )
    })
    console.groupEnd()
  },
  { immediate: true }
)

watch(
  () => ubicacionesEscaladas.value,
  (ubicaciones) => {
    console.groupCollapsed('Ubicaciones escaladas (3D)')
    ubicaciones.forEach((u, i) => {
      console.log(
        `#${i + 1} ${u.descripcion || '(sin nombre)'}`,
        `\n  x3D: ${u.x3D.toFixed(3)}`,
        `\n  z3D: ${u.z3D.toFixed(3)}`,
        `\n  width3D: ${u.width3D.toFixed(3)}`,
        `\n  depth3D: ${u.depth3D.toFixed(3)}`
      )
    })
    console.groupEnd()
  },
  { immediate: true }
)

watch(
  bodegasEscaladas,
  (bodegas) => {
    if (bodegas.length > 0) {
      const bodega = bodegas[0]
      const centerX = bodega.width / 2
      const centerZ = bodega.height / 2

      // Posicion inicial mas centrada y natural
      cameraPosition.value = [centerX + 5, 8, centerZ + 10]
      cameraLookAt.value = [centerX, 0, centerZ]

      actualizarOrbit(centerX, centerZ)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
