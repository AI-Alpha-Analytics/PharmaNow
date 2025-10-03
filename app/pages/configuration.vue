<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { config } from 'process'

const configMeses = ref({
  vencido: -1,
  critico: 2,   // <2 meses = rojo
  riesgo: 6,    // 2–6 meses = naranjo
  alerta: 12,   // 6–12 meses = amarillo
  seguro: 24,   // 12–24 meses = verde
  optimo: 999,  // >24 meses = azul (puedes dejar grande para escalar)
})

const COLORS = {
  vencido: '#9333ea', // morado
  critico: '#ef4444', // rojo
  riesgo:  '#f97316', // naranjo
  alerta:  '#facc15', // amarillo
  seguro:  '#16a34a', // verde
  optimo:  '#3b82f6', // azul
}

const BORDERS = {
  vencido: '#6b21a8',
  critico: '#b91c1c',
  riesgo:  '#c2410c',
  alerta:  '#ca8a04',
  seguro:  '#166534',
  optimo:  '#1d4ed8',
  rest: '#cbd5e1',
}
const defaults = { ...configMeses.value }
const toDays = (m: number) => Math.max(0, Math.round(m * 30))

const ui = ref({
  vencido: String(configMeses.value.vencido),
  critico: String(configMeses.value.critico),
  riesgo: String(configMeses.value.riesgo), 
  alerta: String(configMeses.value.alerta),
  seguro: String(configMeses.value.seguro),
  optimo: String(configMeses.value.optimo),
})

const onlyDigits = (s: string) => s.replace(/[^\d]/g, '')
const onInput = (key: keyof typeof ui.value, e: Event) => {
  const el = e.target as HTMLInputElement
  ui.value[key] = onlyDigits(el.value)
}

const normalizeAndSync = () => {
  const v = configMeses.value
  v.vencido = -1
  v.critico = Math.max(0, v.critico | 0)
  v.riesgo  = Math.max(v.critico, v.riesgo | 0)
  v.alerta  = Math.max(v.riesgo, v.alerta | 0)
  v.seguro  = Math.max(v.alerta, v.seguro | 0)
  v.optimo  = Math.max(v.seguro, v.optimo | 0)

  ui.value = {
    vencido: String(v.vencido),
    critico: String(v.critico),
    riesgo:  String(v.riesgo), 
    alerta:  String(v.alerta),
    seguro:  String(v.seguro),
    optimo:  String(v.optimo),
  }
}

const commitField = (key: keyof typeof ui.value) => {
  const raw = ui.value[key]
  const n = raw === '' ? 0 : parseInt(raw, 10)
  ;(configMeses.value as any)[key] = Number.isFinite(n) ? n : 0
  normalizeAndSync()
}

const savedToast = ref(false)

const save = () => {
  localStorage.setItem(
    'inventarioConfig',
    JSON.stringify({
      optimo: toDays(configMeses.value.optimo),
      seguro: toDays(configMeses.value.seguro),
      alerta: toDays(configMeses.value.alerta),
      critico: toDays(configMeses.value.critico),
    })
  )
  savedToast.value = true
  setTimeout(() => (savedToast.value = false), 1200)
}

const reset = () => {
  configMeses.value = { ...defaults }
  normalizeAndSync()
}

onMounted(() => {
  const raw = localStorage.getItem('inventarioConfig')
  if (!raw) return
  try {
    const d = JSON.parse(raw)
    configMeses.value = {
      vencido: -1,
      critico: Math.round((Number(d.critico) || defaults.critico * 30) / 30),
      riesgo:  Math.round((Number(d.riesgo)  || defaults.riesgo  * 30) / 30),
      alerta:  Math.round((Number(d.alerta)  || defaults.alerta  * 30) / 30),
      seguro:  Math.round((Number(d.seguro)  || defaults.seguro  * 30) / 30),
      optimo:  Math.round((Number(d.optimo)  || defaults.optimo  * 30) / 30),
    }
    normalizeAndSync()
  } catch {}
})




const segStyle = (
  widthPct: number,
  fill: string,
  border: string,
  cap?: 'left' | 'right',
  patterned = false
) => ({
  width: `${widthPct}%`,
  background: patterned
    ? `repeating-linear-gradient(45deg,#e5e7eb 0 8px,#f3f4f6 8px 16px)`
    : fill,
  borderTopLeftRadius: cap === 'left' ? '9999px' : '0',
  borderBottomLeftRadius: cap === 'left' ? '9999px' : '0',
  borderTopRightRadius: cap === 'right' ? '9999px' : '0',
  borderBottomRightRadius: cap === 'right' ? '9999px' : '0',
  boxShadow: `
    inset 0 0 0 1px ${border},
    inset 0 -2px 4px rgba(0,0,0,.08)
  `,
  backgroundImage: patterned
    ? undefined
    : `linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,0))`,
})

const maxBar = computed(() => configMeses.value.optimo)
const widths = computed(() => {
  const c = configMeses.value
  const max = maxBar.value
  const clamp = (x: number) => Math.max(0, Math.min(100, x))

  // cada tramo es un intervalo
  const wCrit   = clamp((c.critico / max) * 100)                        // 0–2
  const wRiesgo = clamp(((c.riesgo - c.critico) / max) * 100)           // 2–6
  const wAlert  = clamp(((c.alerta - c.riesgo) / max) * 100)            // 6–12
  const wSeg    = clamp(((c.seguro - c.alerta) / max) * 100)            // 12–24
  const wOpt    = clamp(((c.optimo - c.seguro) / max) * 100)            // >24

  return { wCrit, wRiesgo, wAlert, wSeg, wOpt }
})

const wRest = computed(() => {
  const { wCrit, wAlert, wSeg, wOpt } = widths.value
  return Math.max(0, 100 - (wCrit + wAlert + wSeg + wOpt))
})

const ticks = computed(() => {
  const c = configMeses.value
  const max = maxBar.value
  const pos = (m: number) => `${(m / max) * 100}%`

  return [
    { key: 'vencido', m: c.vencido, label: `Vencido`, color: COLORS.vencido, left: '0%' },
    { key: 'critico', m: c.critico, label: `<${c.critico}m (Crítico)`, color: COLORS.critico, left: pos(c.critico) },
    { key: 'riesgo',  m: c.riesgo,  label: `2–${c.riesgo}m (Riesgo)`, color: COLORS.riesgo, left: pos(c.riesgo) },
    { key: 'alerta',  m: c.alerta,  label: `6–${c.alerta}m (Alerta)`, color: COLORS.alerta, left: pos(c.alerta) },
    { key: 'seguro',  m: c.seguro,  label: `12–${c.seguro}m (Seguro)`, color: COLORS.seguro, left: pos(c.seguro) },
    { key: 'optimo',  m: c.optimo,  label: `>24m (Óptimo)`, color: COLORS.optimo, left: pos(c.seguro), inside: true },
  ]
})

defineExpose({
  ui,
  onInput,
  commitField,
  normalizeAndSync,
  save,
  reset,
  savedToast,
  COLORS,
  BORDERS,
  segStyle,
  widths,
  wRest,
  ticks,
  maxBar,
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-10 px-4">
    <div class="mx-auto max-w-4xl">
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1
            class="text-3xl font-extrabold text-indigo-900 flex items-center gap-2"
          >
            <Icon icon="mdi:tune-variant" class="text-indigo-600 text-3xl" />
            Configuración de Rangos
          </h1>
          <p class="text-sm text-gray-600 mt-1">
            Define los umbrales en <strong>meses</strong>. La barra muestra cómo
            se segmenta el tiempo de vida.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="reset"
            class="px-3 py-2 rounded-lg border text-gray-700 hover:bg-gray-100"
          >
            Restablecer
          </button>
          <button
            @click="save"
            class="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 shadow"
          >
            Guardar
          </button>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-5">
        <div class="bg-white rounded-xl shadow-sm border p-4">
          <label class="text-xs uppercase text-gray-500">Crítico ≤</label>
          <div class="mt-1 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: COLORS.critico }"></span>
            <input
              :value="ui.critico"
              @input="onInput('critico', $event)"
              @blur="commitField('critico')"
              @keyup.enter="commitField('critico')"
              @focus=";($event.target as HTMLInputElement).select()"
              inputmode="numeric"
              pattern="[0-9]*"
              autocomplete="off"
              class="w-full border rounded-md p-2 text-right no-spinner"
              placeholder="2"
              aria-label="Meses crítico"
            />
            <span class="text-sm text-gray-500">meses</span>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border p-4">
          <label class="text-xs uppercase text-gray-500">Riesgo hasta</label>
          <div class="mt-1 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: COLORS.riesgo }"></span>
            <input
              :value="ui.riesgo"
              @input="onInput('riesgo', $event)"
              @blur="commitField('riesgo')"
              @keyup.enter="commitField('riesgo')"
              @focus=";($event.target as HTMLInputElement).select()"
              inputmode="numeric"
              pattern="[0-9]*"
              autocomplete="off"
              class="w-full border rounded-md p-2 text-right no-spinner"
              placeholder="6"
              aria-label="Meses riesgo"
            />
            <span class="text-sm text-gray-500">meses</span>
          </div>
        </div>

        <!-- Alerta -->
        <div class="bg-white rounded-xl shadow-sm border p-4">
          <label class="text-xs uppercase text-gray-500">Alerta hasta</label>
          <div class="mt-1 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: COLORS.alerta }"></span>
            <input
              :value="ui.alerta"
              @input="onInput('alerta', $event)"
              @blur="commitField('alerta')"
              @keyup.enter="commitField('alerta')"
              @focus=";($event.target as HTMLInputElement).select()"
              inputmode="numeric"
              pattern="[0-9]*"
              autocomplete="off"
              class="w-full border rounded-md p-2 text-right no-spinner"
              placeholder="12"
              aria-label="Meses alerta"
            />
            <span class="text-sm text-gray-500">meses</span>
          </div>
        </div>

        <!-- Seguro -->
        <div class="bg-white rounded-xl shadow-sm border p-4">
          <label class="text-xs uppercase text-gray-500">Seguro hasta</label>
          <div class="mt-1 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: COLORS.seguro }"></span>
            <input
              :value="ui.seguro"
              @input="onInput('seguro', $event)"
              @blur="commitField('seguro')"
              @keyup.enter="commitField('seguro')"
              @focus=";($event.target as HTMLInputElement).select()"
              inputmode="numeric"
              pattern="[0-9]*"
              autocomplete="off"
              class="w-full border rounded-md p-2 text-right no-spinner"
              placeholder="24"
              aria-label="Meses seguro"
            />
            <span class="text-sm text-gray-500">meses</span>
          </div>
        </div>

        <!-- Óptimo -->
        <div class="bg-white rounded-xl shadow-sm border p-4">
          <label class="text-xs uppercase text-gray-500">Óptimo &gt;</label>
          <div class="mt-1 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: COLORS.optimo }"></span>
            <input
              :value="ui.optimo"
              @input="onInput('optimo', $event)"
              @blur="commitField('optimo')"
              @keyup.enter="commitField('optimo')"
              @focus=";($event.target as HTMLInputElement).select()"
              inputmode="numeric"
              pattern="[0-9]*"
              autocomplete="off"
              class="w-full border rounded-md p-2 text-right no-spinner"
              placeholder="999"
              aria-label="Meses óptimo"
            />
            <span class="text-sm text-gray-500">meses</span>
          </div>
        </div>
      </div>


      <div class="mt-8 bg-white rounded-xl shadow-sm border p-5">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm text-gray-600">0 meses</span>
          <span class="text-sm text-gray-600"
            >{{ maxBar }} meses (escala de ejemplo)</span
          >
        </div>

        <div class="relative">
          <div class="w-full h-5 rounded-full overflow-hidden bg-gray-200 relative flex">
            <div
              class="h-full flex items-center justify-start text-[11px] font-semibold text-white pl-1"
              style="
                width: 40px; /* ancho visible del degradado */
                border-top-left-radius: 9999px;
                border-bottom-left-radius: 9999px;
                background: linear-gradient(
                  to left,
                  #9333ea 0%,               /* morado sólido en el borde izquierdo */
                  rgba(147,51,234,0.4) 60%, /* se va desvaneciendo */
                  rgba(147,51,234,0) 100%   /* se funde con gris */
                );
              "
            >
              -1
            </div>

            <!-- Crítico -->
            <div
              v-if="widths.wCrit > 0"
              class="h-full flex items-center justify-center text-[11px] font-semibold text-white px-1"
              :style="segStyle(widths.wCrit, COLORS.critico, BORDERS.critico, 'left')"
            >
              <span v-if="widths.wCrit > 15">Crítico (≤{{ configMeses.critico }}m)</span>
              <span v-else>{{ configMeses.critico }}</span>
            </div>
            <!-- Riesgo -->
            <div
              v-if="widths.wRiesgo > 0"
              class="h-full flex items-center justify-center text-[11px] font-semibold text-white px-1"
              :style="segStyle(widths.wRiesgo, COLORS.riesgo, BORDERS.riesgo)"
            >
              <span v-if="widths.wRiesgo > 15">{{ configMeses.critico }}–{{ configMeses.riesgo }}m</span>
              <span v-else>{{ configMeses.riesgo }}</span>
            </div>

            <!-- Alerta -->
            <div
              v-if="widths.wAlert > 0"
              class="h-full flex items-center justify-center text-[11px] font-semibold text-white px-1"
              :style="segStyle(widths.wAlert, COLORS.alerta, BORDERS.alerta)"
            >
              <span v-if="widths.wAlert > 15">{{ configMeses.riesgo }}–{{ configMeses.alerta }}m</span>
              <span v-else>{{ configMeses.alerta }}</span>
            </div>

            <!-- Seguro -->
            <div
              v-if="widths.wSeg > 0"
              class="h-full flex items-center justify-center text-[11px] font-semibold text-white px-1"
              :style="segStyle(widths.wSeg, COLORS.seguro, BORDERS.seguro)"
            >
              <span v-if="widths.wSeg > 15">{{ configMeses.alerta }}–{{ configMeses.seguro }}m</span>
              <span v-else>{{ configMeses.seguro }}</span>
            </div>

            <!-- Óptimo -->
            <div
              v-if="widths.wOpt > 0"
              class="h-full flex items-center justify-center text-[11px] font-semibold text-white px-1"
              :style="segStyle(widths.wOpt, COLORS.optimo, BORDERS.optimo, 'right')"
            >
              <span v-if="widths.wOpt > 15">>{{ configMeses.seguro }}m</span>
              <span v-else>{{ configMeses.seguro }}</span>
            </div>
          </div>
        </div>



        <div class="mt-4 flex flex-wrap gap-4 text-sm">
          <span class="inline-flex items-center gap-2">
            <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: COLORS.vencido }"></span>
            Vencido
          </span>
          <span class="inline-flex items-center gap-2">
            <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: COLORS.critico }"></span>
            Crítico (< 2m)
          </span>
          <span class="inline-flex items-center gap-2">
            <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: COLORS.riesgo }"></span>
            Riesgo (2–6m)
          </span>
          <span class="inline-flex items-center gap-2">
            <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: COLORS.alerta }"></span>
            Alerta (6–12m)
          </span>
          <span class="inline-flex items-center gap-2">
            <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: COLORS.seguro }"></span>
            Seguro (12–24m)
          </span>
          <span class="inline-flex items-center gap-2">
            <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: COLORS.optimo }"></span>
            Óptimo (>24m)
          </span>
        </div>
      </div>

      <div class="mt-8 flex items-center justify-between">
        <transition name="fade">
          <div
            v-if="savedToast"
            class="text-sm px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200"
          >
            <Icon icon="mdi:check-circle" class="inline mr-1" />
            Configuración guardada
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style>
.no-spinner[type='number'] {
  appearance: textfield;
  -moz-appearance: textfield;
}
.no-spinner[type='number']::-webkit-outer-spin-button,
.no-spinner[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
