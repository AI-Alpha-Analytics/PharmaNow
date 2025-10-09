<script setup>
import { ref, computed } from 'vue'
import { OrbitControls } from '@tresjs/cientos'

const emit = defineEmits(['abrirDetalle', 'abrirNivel'])
const props = defineProps({
  bodega: Object,
  ubicaciones: Array,
  ubicacionActiva: Object,
  niveles: Array,
  nivelActivoId: String,
})

const scale = 100
const cameraRef = ref(null)
const controlsRef = ref(null)

const bodegaWidth = computed(() => (props.bodega?.layout?.ancho ?? 800) / scale)
const bodegaHeight = computed(() => (props.bodega?.layout?.alto ?? 500) / scale)

// ==========================
// 🧱 Escalado ubicaciones
// ==========================
const ubicacionesEscaladas = computed(() => {
  const offsetX = (props.bodega?.layout?.ancho ?? 800) / (2 * scale)
  const offsetZ = (props.bodega?.layout?.alto ?? 500) / (2 * scale)

  // 🔧 offsets manuales globales
  const moveX = -0.2
  const moveZ = -0.2
  const moveY = 0

  return props.ubicaciones.map((u) => ({
    ...u,
    width3D: u.width / scale,
    depth3D: u.height / scale,
    height3D: (u.z || 90) / scale,
    x3D: (u.x + u.width / 2) / scale - offsetX + moveX,
    y3D: 0.01 + moveY,
    z3D: (u.y + u.height / 2) / scale - offsetZ + moveZ,
  }))
})

const ubicacionActivaEscalada = computed(() => {
  if (!props.ubicacionActiva) return null
  return ubicacionesEscaladas.value.find(
    (u) => u.id === props.ubicacionActiva.id
  )
})

// ==========================
// 🪜 Pilares
// ==========================
function generarPilares(base) {
  if (!base) return []
  const pilares = []
  const pillarThickness = Math.min(base.width3D, base.depth3D) * 0.1
  const pillarHeight = base.height3D * 1.05
  const offsetX = base.width3D / 2 - pillarThickness / 2
  const offsetZ = base.depth3D / 2 - pillarThickness / 2

  const posiciones = [
    [-offsetX, pillarHeight / 2, -offsetZ],
    [offsetX, pillarHeight / 2, -offsetZ],
    [-offsetX, pillarHeight / 2, offsetZ],
    [offsetX, pillarHeight / 2, offsetZ],
  ]

  for (let i = 0; i < 4; i++) {
    pilares.push({
      id: `pilar-${base.id}-${i}`,
      x3D: base.x3D + posiciones[i][0],
      y3D: posiciones[i][1],
      z3D: base.z3D + posiciones[i][2],
      width3D: pillarThickness,
      height3D: pillarHeight,
      depth3D: pillarThickness,
    })
  }
  return pilares
}

// ==========================
// 🧱 Niveles simulados como cajas completas separadas
// ==========================
function generarNivelesSimulados(base) {
  if (!base) return []
  const niveles = []
  const alturaTotalCm = base.height3D * scale
  const cantidad = Math.max(1, Math.floor(alturaTotalCm / 90))
  const alturaNivel = base.height3D / cantidad
  const espacioVertical = alturaNivel * 0.02

  for (let i = 0; i < cantidad; i++) {
    const alturaAcumulada = (i + 1) * alturaNivel
    niveles.push({
      id: `nivel-${base.id}-${i}`,
      width3D: base.width3D * 0.8,
      depth3D: base.depth3D * 0.8,
      height3D: alturaNivel - espacioVertical,
      x3D: base.x3D,
      z3D: base.z3D,
      y3D: alturaNivel / 2 + i * alturaNivel,
    })
  }
  return niveles
}

// ==========================
// 🧱 Niveles reales (activa)
// ==========================
const nivelesEscalados = computed(() => {
  if (!ubicacionActivaEscalada.value || !Array.isArray(props.niveles)) return []
  const base = ubicacionActivaEscalada.value
  const cantidad = props.niveles.length
  const alturaTotal = base.height3D
  const alturaNivel = alturaTotal / cantidad

  return props.niveles.map((n, i) => {
    const indiceInvertido = cantidad - 1 - i
    const esActivo = n.id === props.nivelActivoId
    return {
      ...n,
      id: n.id ?? i,
      width3D: base.width3D * 0.85,
      depth3D: base.depth3D * 0.85,
      height3D: alturaNivel * 0.8,
      x3D: base.x3D,
      z3D: base.z3D,
      y3D: alturaNivel / 2 + indiceInvertido * alturaNivel,
      esActivo,
    }
  })
})

// ==========================
// 🎥 Cámara
// ==========================
const cameraPosition = ref([4, 5, 8])
const cameraLookAt = ref([0, 0, 0])
function centrarVista() {
  cameraPosition.value = [0, 6, 10]
}
function vistaCenital() {
  cameraPosition.value = [0, 15, 0]
}
function vistaIsometrica() {
  cameraPosition.value = [6, 8, 6]
}
</script>

<template>
  <div
    class="w-full h-full bg-gray-100 rounded-lg overflow-hidden flex-1 relative"
  >
    <!-- 🎛️ Controles -->
    <div class="absolute top-4 right-4 flex flex-col gap-2 z-50">
      <button @click="centrarVista" class="btn3d bg-indigo-600">Centrar</button>
      <button @click="vistaCenital" class="btn3d bg-green-600">
        Vista cenital
      </button>
      <button @click="vistaIsometrica" class="btn3d bg-orange-600">
        Vista 45°
      </button>
    </div>

    <TresCanvas clear-color="#f9fafb">
      <!-- 🎥 Cámara -->
      <TresPerspectiveCamera
        ref="cameraRef"
        :position="cameraPosition"
        :look-at="cameraLookAt"
      />
      <OrbitControls
        ref="controlsRef"
        :enableRotate="true"
        :enableZoom="true"
        :maxPolarAngle="Math.PI / 2"
      />

      <!-- 💡 Luces -->
      <TresAmbientLight :intensity="1.2" />
      <TresDirectionalLight
        :position="[8, 10, 5]"
        :intensity="1.4"
        color="#ffffff"
      />

      <!-- 🏗️ Piso -->
      <TresMesh rotation-x="-1.57">
        <TresPlaneGeometry :args="[bodegaWidth, bodegaHeight]" />
        <TresMeshStandardMaterial color="#e0e7ff" />
      </TresMesh>

      <!-- 🩶 Pilares + cajas grises de TODAS las ubicaciones -->
      <template v-for="u in ubicacionesEscaladas" :key="u.id">
        <!-- 🧱 Pilares -->
        <TresMesh
          v-for="p in generarPilares(u)"
          :key="p.id"
          :position="[p.x3D, p.y3D, p.z3D]"
          @click="emit('abrirDetalle', u)"
        >
          <TresBoxGeometry :args="[p.width3D, p.height3D, p.depth3D]" />
          <TresMeshStandardMaterial
            :color="
              ubicacionActiva && u.id === ubicacionActiva.id
                ? '#22c55e'
                : '#9ca3af'
            "
            :opacity="
              ubicacionActiva && u.id === ubicacionActiva.id ? 0.8 : 0.4
            "
            transparent
          />
        </TresMesh>

        <!-- 🩶 Cajas simuladas (solo para ubicaciones no activas) -->
        <template v-if="!ubicacionActiva || u.id !== ubicacionActiva.id">
          <TresMesh
            v-for="(nivel, i) in generarNivelesSimulados(u)"
            :key="`nivel-${u.id}-${i}`"
            :position="[nivel.x3D, nivel.y3D, nivel.z3D]"
          >
            <TresBoxGeometry
              :args="[nivel.width3D, nivel.height3D, nivel.depth3D]"
            />
            <TresMeshStandardMaterial
              color="#b0b7c3"
              :opacity="0.25"
              transparent
            />
          </TresMesh>
        </template>
      </template>

      <!-- 🟩 Solo los niveles de la ubicación activa -->
      <TresGroup v-if="nivelesEscalados.length">
        <TresMesh
          v-for="n in nivelesEscalados"
          :key="n.id"
          :position="[n.x3D, n.y3D, n.z3D]"
          @click="emit('abrirNivel', n)"
        >
          <TresBoxGeometry :args="[n.width3D, n.height3D, n.depth3D]" />
          <TresMeshStandardMaterial
            :color="n.esActivo ? '#22c55e' : '#9ca3af'"
            :emissive="n.esActivo ? '#22c55e' : '#000000'"
            :emissiveIntensity="n.esActivo ? 0.8 : 0"
            :opacity="n.esActivo ? 1 : 0.4"
            transparent
          />
        </TresMesh>
      </TresGroup>
    </TresCanvas>
  </div>
</template>

<style scoped>
.btn3d {
  @apply text-white px-4 py-2 rounded-lg shadow-md hover:opacity-90 transition;
}
</style>
