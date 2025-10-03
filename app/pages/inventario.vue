<script setup>
import { reactive, computed, ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import AddMedicamento from '~/components/addMedicamento.vue'
import LoteDetalleVue from '~/components/LoteDetalle.vue'
import AnalisisMedicamentoVue from '~/components/AnalisisMedicamento.vue'

// SOCKET para leer
const {
  productos: medicamentos,
  fetchProductos,
  fetchTandasByProducto,
  tandas,
} = useInventarioSocket()

// REST para crear
const { addProducto,addTanda, productos } = useInventario()
const COLORS = {
  vencido: '#9333ea', // morado
  critico: '#ef4444', // rojo
  riesgo:  '#f97316', // naranjo
  alerta:  '#facc15', // amarillo
  seguro:  '#16a34a', // verde
  optimo:  '#3b82f6', // azul
}

const RANGOS = computed(() => {
  const mCrit   = daysToMonths(config.critico ?? 0)
  const mRiesgo = daysToMonths(config.riesgo ?? 0)
  const mAlert  = daysToMonths(config.alerta ?? 0)
  const mSeg    = daysToMonths(config.seguro ?? 0)
  const mOpt    = daysToMonths(config.optimo ?? 0)

  return [
    { key: 'vencido', color: COLORS.vencido, label: 'Vencido', rango: '≤0d', check: (d) => d < 0 },
    { key: 'critico', color: COLORS.critico, label: 'Crítico', rango: `≤${mCrit}m`, check: (d) => d >= 0 && d <= config.critico },
    { key: 'riesgo',  color: COLORS.riesgo,  label: 'Riesgo',  rango: `${mCrit}–${mRiesgo}m`, check: (d) => d > config.critico && d <= config.riesgo },
    { key: 'alerta',  color: COLORS.alerta,  label: 'Alerta',  rango: `${mRiesgo}–${mAlert}m`, check: (d) => d > config.riesgo && d <= config.alerta },
    { key: 'seguro',  color: COLORS.seguro,  label: 'Seguro',  rango: `${mAlert}–${mSeg}m`, check: (d) => d > config.alerta && d <= config.seguro },
    { key: 'optimo',  color: COLORS.optimo,  label: 'Óptimo',  rango: `>${mSeg}m`, check: (d) => d > config.seguro },
  ]
})

const search = ref('')
const sortBy = ref('nombre')

const medicamentosFiltrados = computed(() => {
  let lista = [...(medicamentos.value || [])]

  // Filtro seguro
  if (search.value.trim()) {
    const criterio = search.value.toLowerCase()
    lista = lista.filter((m) => m?.nombre?.toLowerCase().includes(criterio))
  }

  // Orden seguro
  if (sortBy.value === 'nombre') {
    lista.sort((a, b) =>
      (a?.nombre || '').localeCompare(b?.nombre || '')
    )
  } else if (sortBy.value === 'vencidos') {
    lista.sort((a, b) => {
      const vencidosA = (a.lotes || []).filter(
        (l) => daysUntil(l.vencimiento) <= config.critico
      ).length
      const vencidosB = (b.lotes || []).filter(
        (l) => daysUntil(l.vencimiento) <= config.critico
      ).length
      return vencidosB - vencidosA
    })
  } else if (sortBy.value === 'proximos') {
    lista.sort((a, b) => {
      const diasA = Math.min(...(a.lotes || []).map((l) => daysUntil(l.vencimiento)))
      const diasB = Math.min(...(b.lotes || []).map((l) => daysUntil(l.vencimiento)))
      return diasA - diasB
    })
  }

  return lista
})

const hoveredMed = ref(null) 



const modalAnalisis = ref(false)
const seleccionado = ref(null)
const abrirAnalisis = (med) => {
  seleccionado.value = med
  modalAnalisis.value = true
}

const toggleExpand = (id) => {
  if (expanded.value.includes(id)) {
    expanded.value = expanded.value.filter((x) => x !== id)
  } else {
    expanded.value.push(id)
    fetchTandasByProducto(id)
  }
}
const cantidadTotal = (med) => {
  return (med.lotes || []).reduce(
    (acc, l) => acc + (l.cantidad ?? l.cantidadActual ?? 0),
    0
  )
}



const daysToMonths = (d) => Math.round(d / 30)
const daysUntil = (isoDate) => {
  const today = new Date()
  const target = new Date(isoDate)
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const t1 = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.ceil((t1 - t0) / (1000 * 60 * 60 * 24))
}

const config = reactive({
  vencido: -1,
  critico: 2 * 30,   // 2 meses = 60 días
  riesgo:  6 * 30,   // 6 meses = 180 días
  alerta: 12 * 30,   // 12 meses = 360 días
  seguro: 24 * 30,   // 24 meses = 720 días
  optimo: 36 * 30,   // ejemplo: >36 meses
})
onMounted(async () => {
  const saved = localStorage.getItem('inventarioConfig')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      const toNum = (v, fallback) =>
        Number.isFinite(Number(v)) ? Number(v) : fallback
      Object.assign(config, {
        vencido: -1,
        critico: toNum(parsed.critico, config.critico),
        alerta: toNum(parsed.alerta, config.alerta),
        seguro: toNum(parsed.seguro, config.seguro),
        optimo: toNum(parsed.optimo, config.optimo),
      })
    } catch (e) {
      console.warn("⚠️ Error leyendo inventarioConfig:", e)
    }
  }

  await fetchProductos()
  await Promise.all(
    medicamentos.value.map(async (med) => {
      const tandasProducto = await fetchTandasByProducto(med.id)

      med.lotes = tandasProducto

      med.cantidadTotal = tandasProducto.reduce(
        (acc, l) => acc + (l.cantidad ?? 0),
        0
      )

      med.fechaVencimiento = tandasProducto.length
        ? tandasProducto.reduce((min, l) => {
            const fecha = new Date(l.vencimiento)
            return fecha < min ? fecha : min
          }, new Date(tandasProducto[0].vencimiento))
        : null
    })
  )
})


const legend = computed(() =>
  RANGOS.value.map(r => ({
    key: r.key,
    color: r.color,
    text: `${r.label}: ${r.rango}`
  }))
)

const getColorByDiff = (diffDays) => {
  const rango = RANGOS.value.find(r => r.check(diffDays))
  return rango ? rango.color : '#999'
}

const getSituacionTexto = (med) => {
  const counts = Object.fromEntries(RANGOS.value.map(r => [r.key, 0]))

  med.lotes.forEach((lote) => {
    const diff = daysUntil(lote.vencimiento)
    const rango = RANGOS.value.find(r => r.check(diff))
    if (rango) counts[rango.key]++
  })

  const found = RANGOS.value.find(r => counts[r.key] > 0)
  return found ? `${counts[found.key]} lotes ${found.label}` : 'Sin lotes'
}

const expanded = ref([])



const mostrarModal = ref(false)

const guardarMedicamento = async (payload) => {
  console.log("📦 [guardarMedicamento] payload:", payload)

  if (payload.tipo === 'medicamento') {
  try {
    console.log("🚀 Enviando a endpoint createProducto...")
    const nuevoProducto = await addProducto({
      nombre: payload.data.nombre,
      descripcion: payload.data.descripcion || "",
    })
    console.log("✅ Producto creado:", nuevoProducto)

    const lote = payload.data.lotes?.[0]
    if (lote) {
      console.log("📤 Payload tanda:", {
        idProducto: nuevoProducto.id,
        idBodega: lote.idBodega,
        idUbicacion: lote.idUbicacion,
        cantidadIngresada: lote.cantidad, 
        fechaVencimiento: lote.vencimiento 
      })

      const nuevaTanda = await addTanda({
        idProducto: nuevoProducto.id,
        idBodega: lote.idBodega,
        idUbicacion: lote.idUbicacion,
        cantidadIngresada: lote.cantidad,
        fechaVencimiento: lote.vencimiento,
      })
      console.log("✅ Tanda creada:", nuevaTanda)
    }
  } catch (err) {
    console.error("❌ Error al crear producto o tanda:", err)
    alert("Error al guardar medicamento")
  }
}

  if (payload.tipo === 'lote') {
    try {
      console.log("🚀 Enviando a endpoint createTanda...")
      const nuevaTanda = await addTanda({
        idProducto: payload.id,
        idBodega: payload.lote.idBodega,
        idUbicacion: payload.lote.idUbicacion,
        cantidadIngresada: payload.lote.cantidad,
        fechaVencimiento: payload.lote.vencimiento 
      })
      console.log("✅ Tanda creada:", nuevaTanda)
    } catch (err) {
      console.error("❌ Error al crear tanda:", err)
      alert("Error al guardar lote")
    }
  }

}
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-7xl mx-auto bg-white shadow-lg rounded-2xl p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-3xl font-bold text-indigo-700">
            Inventario de Medicamentos
          </h2>
          <p class="text-gray-600 mt-1">
            Gestione stock, vencimientos y lotes fácilmente
          </p>
        </div>

        <div class="flex gap-3">
          <NuxtLink
            to="/retiroMedicamento"
            class="inline-flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
          >
            <Icon icon="mdi:package-variant-minus" class="text-xl" />
            Retirar Medicamentos
          </NuxtLink>

          <button
            @click="mostrarModal = true"
            class="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
          >
            <Icon icon="mdi:plus-circle" class="text-xl" />
            Agregar Medicamento o Lote
          </button>
        </div>
      </div>

      <div
        class="mb-8 bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex flex-wrap gap-4 items-center"
      >
        <span class="font-semibold text-indigo-900"
          >Rangos de vencimiento:</span
        >
        <template v-for="item in legend" :key="item.key">
          <span
            class="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full"
            :style="{ backgroundColor: item.color + '22',}"
          >
            <span
              class="w-2 h-2 rounded-full"
              :style="{ backgroundColor: item.color }"
            ></span>
            {{ item.text }}
          </span>
        </template>
      </div>

      <div class="overflow-hidden rounded-lg border border-gray-200">
        <div class="flex flex-wrap gap-4 items-center mb-6 w-full">
          <div class="flex items-center border rounded-lg px-3 py-2 bg-gray-50 flex-1 min-w-[250px]">
            <Icon icon="mdi:magnify" class="text-gray-500 mr-2" />
            <input
              v-model="search"
              type="text"
              placeholder="Buscar medicamento..."
              class="flex-1 bg-transparent outline-none text-sm"
            />
          </div>

          <div class="flex-1 min-w-[200px]">
            <select
              v-model="sortBy"
              class="w-full px-3 py-2 border rounded-lg bg-white text-sm"
            >
              <option value="nombre">Ordenar por nombre</option>
              <option value="vencidos">Ordenar por más vencidos</option>
              <option value="proximos">Ordenar por próximos a vencer</option>
            </select>
          </div>
        </div>

        <table class="min-w-full text-sm text-left">
          <thead class="bg-indigo-600 text-white">
            <tr>
              <th class="px-4 py-3 text-center text-gray-200 w-8">#</th>
              <th class="px-4 py-3">Medicamento</th>
              <th class="px-4 py-3">Fecha Emisión</th>
              <th class="px-4 py-3">Fecha Vencimiento</th>
              <th class="px-4 py-3">Cantidad Total</th>
              <th class="px-4 py-3">Analizar</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <template v-for="med in medicamentosFiltrados" :key="med.id">
              <tr
                class="hover:bg-indigo-50 cursor-pointer"
                @click="toggleExpand(med.id)"
              >
                <!-- 🔹 Columna de flechas -->
                <td class="px-4 py-3 text-center text-gray-500 w-8">
                  <span class="text-sm">
                    {{ expanded.includes(med.id) ? '▲' : '▼' }}
                  </span>
                </td>

                <!-- 🔹 Nombre del medicamento -->
                <td class="px-4 py-3 font-medium text-indigo-800">
                  {{ med.nombre }}
                </td>

                <td class="px-4 py-3">{{ med.fechaEmision }}</td>
                <td class="px-4 py-3 relative">
                  <div v-if="med.fechaVencimiento" class="flex items-center gap-2">
                    <span
                      class="w-3 h-3 rounded-full cursor-pointer"
                      :style="{ backgroundColor: getColorByDiff(daysUntil(med.fechaVencimiento)) }"
                      @mouseenter="hoveredMed = med.id"
                      @mouseleave="hoveredMed = null"
                    ></span>
                    {{ new Date(med.fechaVencimiento).toLocaleDateString() }}

                    <!-- Tooltip flotante -->
                    <div
                      v-if="hoveredMed === med.id"
                      class="absolute left-8 top-1/2 -translate-y-1/2 z-10
                            bg-white text-gray-800 text-xs px-3 py-2 rounded-lg shadow-lg border"
                    >
                      {{ getSituacionTexto(med) }}
                    </div>
                  </div>
                  <span v-else>-</span>
                </td>

                <td class="px-4 py-3">{{ cantidadTotal(med) }}</td>
                <td class="px-4 py-3">
                  <button
                    @click.stop="abrirAnalisis(med)"
                    class="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                  >
                    <Icon icon="mdi:chart-pie" />
                  </button>
                </td>
              </tr>

              <!-- 🔹 Fila expandida -->
              <tr v-if="expanded.includes(med.id)" class="bg-gray-50">
                <td colspan="6" class="px-6 py-4">
                  <div v-if="(tandas[med.id] || []).length" class="grid md:grid-cols-2 gap-4">
                    <LoteDetalleVue
                      v-for="lote in tandas[med.id] || []"
                      :key="lote.id"
                      :lote="lote"
                      :config="config"
                      :total="med.cantidadTotal ?? 0"
                    />
                  </div>
                  <div
                    v-else
                    class="flex items-center justify-center gap-2 text-gray-500 text-sm py-6 border border-dashed border-gray-300 rounded-lg bg-white"
                  >
                    <Icon icon="mdi:archive-remove-outline" class="text-2xl text-gray-400" />
                    No existen lotes registrados para este medicamento.
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <AnalisisMedicamentoVue
          v-if="modalAnalisis"
          :medicamento="seleccionado"
          :config="config"
          @cerrar="modalAnalisis = false"
        />

      <AddMedicamento
        v-if="mostrarModal"
        :medicamentos="medicamentos"
        :medicamentos-existentes="medicamentos"
        @cerrar="mostrarModal = false"
        @guardar="guardarMedicamento"
      />
    </div>
  </div>
</template>
