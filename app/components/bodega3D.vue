<template>
  <div class="w-full h-full bg-gray-100 rounded-lg overflow-hidden flex-1 relative">
    <!-- 🔘 Botones de cámara -->
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
        Vista 45°
      </button>
    </div>


    <TresCanvas clear-color="#f9fafb">
      <!-- 🎥 Cámara controlada -->
      <TresPerspectiveCamera
        ref="cameraRef"
        :position="cameraPosition"
        :look-at="cameraLookAt"
      />
      <!-- 🕹️ OrbitControls con movimiento habilitado -->
      <OrbitControls
        ref="controlsRef"
        :enableRotate="true"
        :enablePan="true"
        :enableZoom="true"
        :maxPolarAngle="Math.PI / 2.05"
        :minDistance="1"
        :maxDistance="50"
      />

      <!-- 💡 Luces -->
      <TresAmbientLight :intensity="1.1" />
      <TresDirectionalLight :position="[8, 10, 5]" :intensity="1.4" color="#ffffff" />
      <TresAxesHelper :args="[5]" />

      <!-- 🏢 Piso de la bodega (alineado al cuadrante positivo) -->
      <TresGroup v-for="bodega in bodegasEscaladas" :key="bodega.id">
        <TresMesh :position="[0, 0, 0]" rotation-x="-1.57">
          <TresPlaneGeometry :args="[bodega.width, bodega.height]" />
          <TresMeshStandardMaterial :color="bodega.colorFloor" />
        </TresMesh>
      </TresGroup>

      <!-- 🟧 Secciones -->
      <TresMesh
        v-for="u in ubicacionesEscaladas"
        :key="u.id"
        :position="[u.x3D, u.y3D, u.z3D]"
        @click="(e) => handleMeshClick(e, u)"
        @pointerover="u.hover = true"
        @pointerout="u.hover = false"
      >
        <TresBoxGeometry :args="[u.width3D, u.height3D, u.depth3D]" />
        <TresMeshStandardMaterial
          :color="u.hover ? '#fbbf24' : (u.color || '#f97316')"
          :emissive="u.hover ? '#fbbf24' : '#000000'"
          :emissiveIntensity="u.hover ? 0.4 : 0"
      />
      </TresMesh>

    </TresCanvas>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onMounted, watch } from 'vue'
const emit = defineEmits(['seleccionarUbicacion'])
const props = defineProps({
  ubicaciones: { type: Array, default: () => [] },
})

const scale = 100
const cameraRef = ref(null)
const controlsRef = ref(null)

// ==========================
// 🏗️ Bodegas
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
// 📦 Ubicaciones
// ==========================
const EPS = 1;           // grosor mínimo solo para que se vea algo cuando z=0

const ubicacionesEscaladas = computed(() => {
  const bodega = bodegasEscaladas.value[0];
  const offsetX = bodega ? bodega.width / 2 : 0;
  const offsetZ = bodega ? bodega.height / 2 : 0;

  const ajusteX = -0.18;
  const ajusteZ =  0.18;

  return props.ubicaciones.map((u) => {
    const width3D  = u.width  / scale;
    const depth3D  = u.height / scale;

    // 🔸 altura en 3D sale de z (si z = 20 => 20/100 = 0.2 de altura)
    //     usamos EPS solo cuando z=0 para que no desaparezca
    const alturaReal = (u.z ?? 0);
    const height3D   = ((alturaReal > 0 ? alturaReal : EPS) / scale);

    // 🔸 base en el suelo: el centro queda a height3D/2
    const y3D = height3D / 2;

    const x3D = (u.x + u.width  / 2) / scale - offsetX + ajusteX;
    const z3D = (u.y + u.height / 2) / scale - offsetZ - ajusteZ;

    return { ...u, x3D, y3D, z3D, width3D, height3D, depth3D };
  });
});


// ==========================
// 🎥 Cámara control
// ==========================
const cameraPosition = ref([5, 6, 10])
const cameraLookAt = ref([5, 0, 3])

function centrarCamara() {
  const bodega = bodegasEscaladas.value[0]
  if (!bodega) return

  const centerX = bodega.width / 2
  const centerZ = bodega.height / 2

  // Mueve la cámara arriba con un leve ángulo
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

  // Vista 45° (similar a una vista 3D técnica)
  const distancia = Math.max(bodega.width, bodega.height)
  cameraPosition.value = [centerX + distancia / 1.5, distancia, centerZ + distancia / 1.5]
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
let clickTimeout = null

// 🖱️ Detecta doble clic en un mesh 3D
function handleMeshClick(e, ubic) {
  e.stopPropagation()

  if (clickTimeout) {
    // 🔹 Si ya hubo un clic reciente → doble clic
    clearTimeout(clickTimeout)
    clickTimeout = null
    emit('seleccionarUbicacion', ubic) // 🔹 Envía evento al padre
    return
  }

  // 🔹 Espera un poco por si hay un segundo clic
  clickTimeout = setTimeout(() => {
    clickTimeout = null
  }, 250) // ⏱️ Ajusta sensibilidad (200–300 ms es ideal)
}

// 📸 Centrar cámara al inicio cuando existan bodegas
// ==========================
// 🧠 Debug inicial de coordenadas
// ==========================
watch(
  () => props.ubicaciones,
  (ubicaciones) => {
    console.groupCollapsed('🧾 Coordenadas originales (props.ubicaciones)')
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
    console.groupCollapsed('🏗️ Bodega escalada')
    bodegas.forEach((b) => {
      console.log(
        `📦 ${b.nombre}`,
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
    console.groupCollapsed('📦 Ubicaciones escaladas (en 3D)')
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

watch(bodegasEscaladas, (bodegas) => {
  if (bodegas.length > 0) {
    const bodega = bodegas[0]
    const centerX = bodega.width / 2
    const centerZ = bodega.height / 2

    // Posición inicial más centrada y natural
    cameraPosition.value = [centerX + 5, 8, centerZ + 10]
    cameraLookAt.value = [centerX, 0, centerZ]

    actualizarOrbit(centerX, centerZ)
  }
}, { immediate: true })
</script>

<style scoped>
canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
