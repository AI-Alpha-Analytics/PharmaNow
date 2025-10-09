<template>
  <div
    class="w-full h-full bg-gray-100 rounded-lg overflow-hidden flex-1 relative"
  >
    <!-- 🔘 Controles -->
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

      <!-- 🏗️ Piso general de la bodega -->
      <TresMesh rotation-x="-1.57">
        <TresPlaneGeometry :args="[bodegaWidth, bodegaHeight]" />
        <TresMeshStandardMaterial color="#e0e7ff" />
      </TresMesh>

      <!-- 🟦 Niveles dentro de la ubicación activa -->
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
            :emissive="n.esActivo ? '#86efac' : '#000000'"
            :emissiveIntensity="n.esActivo ? 0.5 : 0"
            :opacity="n.esActivo ? 1 : 0.6"
            transparent
          />
        </TresMesh>
      </TresGroup>

      <!-- 🟧 Ubicación activa con leve opacidad (dibujada después para transparencia) -->
      <TresMesh
        v-if="ubicacionActivaEscalada"
        :position="[
          ubicacionActivaEscalada.x3D,
          ubicacionActivaEscalada.y3D,
          ubicacionActivaEscalada.z3D,
        ]"
      >
        <TresBoxGeometry
          :args="[
            ubicacionActivaEscalada.width3D,
            ubicacionActivaEscalada.height3D,
            ubicacionActivaEscalada.depth3D,
          ]"
        />
        <TresMeshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          :opacity="0.25"
          transparent
          :depthWrite="false"
        />
      </TresMesh>

      <!-- 💡 Luz interior tenue -->
      <TresPointLight
        v-if="ubicacionActivaEscalada"
        :position="[
          ubicacionActivaEscalada.x3D,
          ubicacionActivaEscalada.y3D,
          ubicacionActivaEscalada.z3D,
        ]"
        color="#fde68a"
        :intensity="0.5"
        :distance="5"
      />

      <!-- 🩶 Otras ubicaciones en la bodega -->
      <template v-for="u in ubicacionesEscaladas" :key="u.id">
        <TresMesh
          v-if="ubicacionActiva && u.id !== ubicacionActiva.id"
          :position="[u.x3D, u.y3D, u.z3D]"
          @click="emit('abrirDetalle', u)"
        >
          <TresBoxGeometry :args="[u.width3D, u.height3D, u.depth3D]" />
          <TresMeshStandardMaterial color="#94a3b8" opacity="0.5" transparent />
        </TresMesh>
      </template>
    </TresCanvas>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
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
  const offsetX = bodegaWidth.value / 2
  const offsetZ = bodegaHeight.value / 2
  return props.ubicaciones.map((u) => ({
    ...u,
    width3D: u.width / scale,
    depth3D: u.height / scale,
    height3D: (u.z || 5) / scale,
    x3D: (u.x + u.width / 2) / scale - offsetX,
    y3D: (u.z || 5) / scale / 2,
    z3D: (u.y + u.height / 2) / scale - offsetZ,
  }))
})

const ubicacionActivaEscalada = computed(() => {
  if (!props.ubicacionActiva) return null
  return ubicacionesEscaladas.value.find(
    (u) => u.id === props.ubicacionActiva.id
  )
})

// ==========================
// 🧱 Escalado niveles
// ==========================
const nivelesEscalados = computed(() => {
  if (!ubicacionActivaEscalada.value) return []

  const base = ubicacionActivaEscalada.value
  const cantidadNiveles = props.niveles.length || 1
  const alturaTotal = base.height3D
  const alturaNivel = alturaTotal / cantidadNiveles

  return props.niveles.map((n, i) => {
    // 🔄 invertimos la posición vertical
    const indiceInvertido = cantidadNiveles - 1 - i

    return {
      ...n,
      id: n.id ?? i,
      width3D: base.width3D * 0.8,
      depth3D: base.depth3D * 0.8,
      height3D: alturaNivel * 0.8,
      x3D: base.x3D,
      z3D: base.z3D,
      y3D: alturaNivel / 2 + indiceInvertido * alturaNivel, // 🔥 nivel 1 arriba
      esActivo: n.id === props.nivelActivoId,
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
  cameraLookAt.value = [0, 0, 0]
}
function vistaCenital() {
  cameraPosition.value = [0, 15, 0]
  cameraLookAt.value = [0, 0, 0]
}
function vistaIsometrica() {
  cameraPosition.value = [6, 8, 6]
  cameraLookAt.value = [0, 0, 0]
}
</script>

<style scoped>
.btn3d {
  @apply text-white px-4 py-2 rounded-lg shadow-md hover:opacity-90 transition;
}
</style>
