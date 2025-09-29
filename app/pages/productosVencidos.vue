<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'

const medicamentos = ref([
  {
    id: 1,
    nombre: 'Paracetamol 500mg',
    lotes: [
      { id: 'L-001', vencimiento: '2025-08-01' },
      { id: 'L-002', vencimiento: '2025-07-15' },
    ],
  },
  {
    id: 2,
    nombre: 'Ibuprofeno 400mg',
    lotes: [{ id: 'L-005', vencimiento: '2025-09-01' }],
  },
])

const activeTab = ref<'vencidos' | 'mermas'>('vencidos')

const mermas = ref<
  Array<{ id: string; medicamento: string; vencimiento: string }>
>([])

const vencidos = computed(() =>
  medicamentos.value.flatMap((m) =>
    m.lotes
      .filter((l) => new Date(l.vencimiento) < new Date())
      .map((l) => ({ ...l, medicamento: m.nombre }))
  )
)

const mandarAMerma = (lote: any) => {
  mermas.value.push(lote)

  medicamentos.value = medicamentos.value.map((m) => ({
    ...m,
    lotes: m.lotes.filter((l) => l.id !== lote.id),
  }))
}
</script>

<template>
  <div class="bg-gray-50 min-h-screen px-6 py-10">
    <div class="max-w-7xl mx-auto bg-white shadow-xl rounded-2xl p-8">
      <div class="flex items-center justify-between mb-8">
        <h2
          class="text-3xl font-extrabold text-gray-800 flex items-center gap-3"
        >
          <Icon icon="mdi:warehouse" class="text-indigo-600 text-4xl" />
          Gestión de <span class="text-red-600">Vencidos</span> y
          <span class="text-indigo-600">Mermas</span>
        </h2>
        <Icon icon="mdi:shield-check" class="text-3xl text-gray-400" />
      </div>

      <div class="flex gap-4 mb-8">
        <button
          @click="activeTab = 'vencidos'"
          :class="[
            'flex items-center gap-2 px-5 py-2 rounded-lg font-semibold shadow-sm transition',
            activeTab === 'vencidos'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          ]"
        >
          <Icon
            icon="mdi:alert-circle"
            :class="activeTab === 'vencidos' ? 'text-white' : 'text-red-600'"
          />
          Vencidos
        </button>
        <button
          @click="activeTab = 'mermas'"
          :class="[
            'flex items-center gap-2 px-5 py-2 rounded-lg font-semibold shadow-sm transition',
            activeTab === 'mermas'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          ]"
        >
          <Icon
            icon="mdi:package-variant"
            :class="activeTab === 'mermas' ? 'text-white' : 'text-indigo-600'"
          />
          Mermas
        </button>
      </div>

      <div v-if="activeTab === 'vencidos'">
        <div
          v-if="!vencidos.length"
          class="text-gray-500 flex items-center gap-2"
        >
          <Icon icon="mdi:check-circle" class="text-green-500" />
          Actualmente no hay productos vencidos.
        </div>

        <table
          v-else
          class="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden"
        >
          <thead class="bg-red-600 text-white">
            <tr>
              <th class="p-3">Medicamento</th>
              <th class="p-3">Lote</th>
              <th class="p-3">Fecha de Vencimiento</th>
              <th class="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="l in vencidos"
              :key="l.id"
              class="border-b hover:bg-red-50"
            >
              <td class="p-3 font-medium text-gray-800">{{ l.medicamento }}</td>
              <td class="p-3">{{ l.id }}</td>
              <td class="p-3 text-red-600 font-semibold">
                {{ l.vencimiento }}
              </td>
              <td class="p-3 text-center">
                <button
                  @click="mandarAMerma(l)"
                  class="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition"
                >
                  <Icon icon="mdi:trash-can-arrow-up" class="text-red-600" />
                  Mandar a merma
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else>
        <div
          v-if="!mermas.length"
          class="text-gray-500 flex items-center gap-2"
        >
          <Icon icon="mdi:archive-outline" class="text-indigo-500" />
          No hay registros en merma.
        </div>

        <table
          v-else
          class="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden"
        >
          <thead class="bg-indigo-600 text-white">
            <tr>
              <th class="p-3">Medicamento</th>
              <th class="p-3">Lote</th>
              <th class="p-3">Fecha de Vencimiento</th>
              <th class="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="l in mermas"
              :key="l.id"
              class="border-b hover:bg-indigo-50"
            >
              <td class="p-3 font-medium text-gray-800">{{ l.medicamento }}</td>
              <td class="p-3">{{ l.id }}</td>
              <td class="p-3">{{ l.vencimiento }}</td>
              <td
                class="p-3 text-indigo-600 font-semibold flex items-center gap-1"
              >
                <Icon
                  icon="mdi:package-variant-closed"
                  class="text-indigo-500"
                />
                En merma
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
