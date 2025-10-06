<template>
  <div
    class="w-full h-full bg-gray-100 rounded-lg overflow-hidden flex-1 relative"
  >
    <TresCanvas clear-color="#f9fafb">
      <!-- 🔹 Fondo muy claro -->
      <!-- 🎥 Cámara -->
      <TresPerspectiveCamera :position="[0, 8, 10]" :look-at="[0, 0, 0]" />
      <OrbitControls />

      <!-- 💡 Luces -->
      <TresAmbientLight :intensity="1.1" />
      <TresDirectionalLight
        :position="[6, 10, 6]"
        :intensity="1.5"
        color="#ffffff"
      />

      <!-- 🏢 Bodegas -->
      <TresGroup v-for="bodega in bodegasEscaladas" :key="bodega.id">
        <!-- Piso -->
        <TresMesh :position="[bodega.cx, 0, bodega.cz]" rotation-x="-1.57">
          <TresPlaneGeometry :args="[bodega.width, bodega.height]" />
          <TresMeshStandardMaterial :color="bodega.colorFloor" />
        </TresMesh>

        <!-- Pared frontal -->
        <TresMesh
          :position="[bodega.cx, wallHeight / 2, bodega.cz + bodega.height / 2]"
        >
          <TresPlaneGeometry :args="[bodega.width, wallHeight]" />
          <TresMeshStandardMaterial
            :color="bodega.colorWalls"
            :transparent="true"
            :opacity="0.05"
          />
        </TresMesh>

        <!-- Pared trasera -->
        <TresMesh
          :position="[bodega.cx, wallHeight / 2, bodega.cz - bodega.height / 2]"
          rotation-y="3.1416"
        >
          <TresPlaneGeometry :args="[bodega.width, wallHeight]" />
          <TresMeshStandardMaterial
            :color="bodega.colorWalls"
            :transparent="true"
            :opacity="0.05"
          />
        </TresMesh>

        <!-- Pared izquierda -->
        <TresMesh
          :position="[bodega.cx - bodega.width / 2, wallHeight / 2, bodega.cz]"
          rotation-y="1.5708"
        >
          <TresPlaneGeometry :args="[bodega.height, wallHeight]" />
          <TresMeshStandardMaterial
            :color="bodega.colorWalls"
            :transparent="true"
            :opacity="0.05"
          />
        </TresMesh>

        <!-- Pared derecha -->
        <TresMesh
          :position="[bodega.cx + bodega.width / 2, wallHeight / 2, bodega.cz]"
          rotation-y="-1.5708"
        >
          <TresPlaneGeometry :args="[bodega.height, wallHeight]" />
          <TresMeshStandardMaterial
            :color="bodega.colorWalls"
            :transparent="true"
            :opacity="0.05"
          />
        </TresMesh>
      </TresGroup>

      <!-- 🟩 Cajas (ubicaciones) -->
      <TresMesh
        v-for="u in ubicacionesEscaladas"
        :key="u.id"
        :position="[u.x, u.height3D / 2, u.z]"
      >
        <TresBoxGeometry :args="[u.width3D, u.height3D, u.depth3D]" />
        <TresMeshStandardMaterial :color="u.color || '#60a5fa'" />
      </TresMesh>
    </TresCanvas>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  ubicaciones: { type: Array, default: () => [] },
})

// ==========================
// 🔹 Configuración general
// ==========================
const scale = 100
const wallHeight = 2.5

// ==========================
// 🔹 Cálculo de bodegas únicas
// ==========================
const bodegasEscaladas = computed(() => {
  const bodegasMap = {}
  props.ubicaciones.forEach((u) => {
    if (u.bodega && !bodegasMap[u.bodega.id]) {
      const b = u.bodega
      bodegasMap[b.id] = {
        id: b.id,
        nombre: b.nombre,
        layout: b.layout,
        width: b.layout.ancho / scale,
        height: b.layout.alto / scale,
        cx: (b.layout.x ?? 0) / scale,
        cz: (b.layout.y ?? 0) / scale,
        colorFloor: '#e5e7eb', // piso gris muy claro
        colorWalls: '#f3f4f6', // paredes casi blancas
      }
    }
  })
  return Object.values(bodegasMap)
})

// ==========================
// 🔹 Coordenadas 3D de ubicaciones
// ==========================
const ubicacionesEscaladas = computed(() =>
  props.ubicaciones.map((u) => {
    const layout = u.bodega?.layout || { ancho: 800, alto: 500, x: 0, y: 0 }
    const offsetX = -layout.ancho / 2
    const offsetZ = -layout.alto / 2

    return {
      ...u,
      x: (u.x + u.width / 2 + offsetX + (layout.x ?? 0)) / scale,
      z: (u.y + u.height / 2 + offsetZ + (layout.y ?? 0)) / scale,
      width3D: u.width / scale,
      height3D: Math.max(u.height / scale / 2, 0.3),
      depth3D: Math.max(u.width / scale / 2, 0.6),
    }
  })
)
</script>

<style scoped>
canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
