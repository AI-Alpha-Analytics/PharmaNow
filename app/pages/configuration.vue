<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

const configMeses = ref({
  optimo: 24,
  seguro: 12,
  alerta: 6,
  critico: 0,
})
const defaults = { ...configMeses.value }
const toDays = (m: number) => Math.max(0, Math.round(m * 30))

const ui = ref({
  critico: String(configMeses.value.critico),
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
  v.critico = Math.max(0, v.critico | 0)
  v.alerta = Math.max(v.critico, v.alerta | 0)
  v.seguro = Math.max(v.alerta, v.seguro | 0)
  v.optimo = Math.max(v.seguro, v.optimo | 0)

  ui.value = {
    critico: String(v.critico),
    alerta: String(v.alerta),
    seguro: String(v.seguro),
    optimo: String(v.optimo),
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
      optimo: Math.round((Number(d.optimo) || defaults.optimo * 30) / 30),
      seguro: Math.round((Number(d.seguro) || defaults.seguro * 30) / 30),
      alerta: Math.round((Number(d.alerta) || defaults.alerta * 30) / 30),
      critico: Math.round((Number(d.critico) ?? defaults.critico * 30) / 30),
    }
    normalizeAndSync()
  } catch {}
})

const COLORS = {
  optimo: 'rgb(34,197,94)',
  seguro: 'rgb(59,130,246)',
  alerta: 'rgb(234,179,8)',
  critico: 'rgb(239,68,68)',
}
const BORDERS = {
  optimo: '#047857',
  seguro: '#1e40af',
  alerta: '#b45309',
  critico: '#b91c1c',
  rest: '#cbd5e1',
}

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

const maxBar = computed(() => configMeses.value.optimo || 1)
const widths = computed(() => {
  const c = configMeses.value
  const max = maxBar.value
  const clamp = (x: number) => Math.max(0, Math.min(100, x))

  const wCrit = clamp((c.critico / max) * 100)
  const wAlert = clamp(((c.alerta - c.critico) / max) * 100)
  const wSeg = clamp(((c.seguro - c.alerta) / max) * 100)
  const wOpt = clamp(((c.optimo - c.seguro) / max) * 100)

  return { wCrit, wAlert, wSeg, wOpt }
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
    {
      key: 'critico',
      m: c.critico,
      label: `Crítico (${c.critico}m)`,
      color: COLORS.critico,
      left: pos(c.critico),
    },
    {
      key: 'alerta',
      m: c.alerta,
      label: `Alerta (${c.alerta}m)`,
      color: COLORS.alerta,
      left: pos(c.alerta),
    },
    {
      key: 'seguro',
      m: c.seguro,
      label: `Seguro (${c.seguro}m)`,
      color: COLORS.seguro,
      left: pos(c.seguro),
    },
    {
      key: 'optimo',
      m: c.optimo,
      label: `Óptimo (${c.optimo}m)`,
      color: COLORS.optimo,
      left: pos(c.optimo),
    },
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

      <div class="grid gap-4 md:grid-cols-4">
        <div class="bg-white rounded-xl shadow-sm border p-4">
          <label class="text-xs uppercase text-gray-500">Crítico ≤</label>
          <div class="mt-1 flex items-center gap-2">
            <span
              class="w-2.5 h-2.5 rounded-full"
              :style="{ backgroundColor: COLORS.critico }"
            ></span>
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
              placeholder="0"
              aria-label="Meses crítico"
            />
            <span class="text-sm text-gray-500">meses</span>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border p-4">
          <label class="text-xs uppercase text-gray-500">Alerta hasta</label>
          <div class="mt-1 flex items-center gap-2">
            <span
              class="w-2.5 h-2.5 rounded-full"
              :style="{ backgroundColor: COLORS.alerta }"
            ></span>
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
              placeholder="6"
              aria-label="Meses alerta"
            />
            <span class="text-sm text-gray-500">meses</span>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border p-4">
          <label class="text-xs uppercase text-gray-500">Seguro hasta</label>
          <div class="mt-1 flex items-center gap-2">
            <span
              class="w-2.5 h-2.5 rounded-full"
              :style="{ backgroundColor: COLORS.seguro }"
            ></span>
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
              placeholder="12"
              aria-label="Meses seguro"
            />
            <span class="text-sm text-gray-500">meses</span>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border p-4">
          <label class="text-xs uppercase text-gray-500">Óptimo &gt;</label>
          <div class="mt-1 flex items-center gap-2">
            <span
              class="w-2.5 h-2.5 rounded-full"
              :style="{ backgroundColor: COLORS.optimo }"
            ></span>
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
              placeholder="24"
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
          <div class="relative h-6">
            <template v-for="t in ticks" :key="t.key + '-lbl'">
              <div
                class="absolute -top-0.5 text-[11px] whitespace-nowrap px-1"
                :style="{ left: t.left, transform: 'translateX(-50%)' }"
              >
                <span class="inline-flex items-center gap-1">
                  <span
                    class="w-2 h-2 rounded-full"
                    :style="{ backgroundColor: t.color }"
                  ></span>
                  {{ t.label }}
                </span>
              </div>
            </template>
          </div>

          <div
            class="w-full h-5 rounded-full overflow-hidden bg-gray-200 relative"
          >
            <div class="flex w-full h-full">
              <div
                v-if="widths.wCrit > 0"
                class="h-full"
                :style="
                  segStyle(
                    widths.wCrit,
                    COLORS.critico,
                    BORDERS.critico,
                    'left'
                  )
                "
              />
              <div
                v-if="
                  widths.wCrit > 0 &&
                  widths.wAlert + widths.wSeg + widths.wOpt + wRest > 0
                "
                class="w-[2px] h-full bg-white/60 mix-blend-overlay"
              ></div>

              <div
                v-if="widths.wAlert > 0"
                class="h-full"
                :style="segStyle(widths.wAlert, COLORS.alerta, BORDERS.alerta)"
              />

              <div
                v-if="
                  widths.wAlert > 0 && widths.wSeg + widths.wOpt + wRest > 0
                "
                class="w-[2px] h-full bg-white/60 mix-blend-overlay"
              ></div>

              <div
                v-if="widths.wSeg > 0"
                class="h-full"
                :style="segStyle(widths.wSeg, COLORS.seguro, BORDERS.seguro)"
              />

              <div
                v-if="widths.wSeg > 0 && widths.wOpt + wRest > 0"
                class="w-[2px] h-full bg-white/60 mix-blend-overlay"
              ></div>

              <div
                v-if="widths.wOpt > 0"
                class="h-full"
                :style="
                  segStyle(
                    widths.wOpt,
                    COLORS.optimo,
                    BORDERS.optimo,
                    wRest === 0 ? 'right' : undefined
                  )
                "
              />

              <div
                v-if="wRest > 0"
                class="h-full"
                :style="segStyle(wRest, '#e5e7eb', BORDERS.rest, 'right', true)"
              />
            </div>
            <template v-for="t in ticks" :key="t.key">
              <div
                class="absolute -top-1.5"
                :style="{ left: t.left, transform: 'translateX(-50%)' }"
              >
                <div
                  class="w-[6px] h-[6px] rounded-full border-2"
                  :style="{ backgroundColor: '#fff', borderColor: t.color }"
                ></div>
              </div>
            </template>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-4 text-sm">
          <span class="inline-flex items-center gap-2">
            <span
              class="w-3 h-3 rounded-full"
              :style="{ backgroundColor: COLORS.critico }"
            ></span>
            Crítico ≤ {{ configMeses.critico }}m
          </span>
          <span class="inline-flex items-center gap-2">
            <span
              class="w-3 h-3 rounded-full"
              :style="{ backgroundColor: COLORS.alerta }"
            ></span>
            {{ configMeses.critico }}–{{ configMeses.alerta }}m
          </span>
          <span class="inline-flex items-center gap-2">
            <span
              class="w-3 h-3 rounded-full"
              :style="{ backgroundColor: COLORS.seguro }"
            ></span>
            {{ configMeses.alerta }}–{{ configMeses.seguro }}m
          </span>
          <span class="inline-flex items-center gap-2">
            <span
              class="w-3 h-3 rounded-full"
              :style="{ backgroundColor: COLORS.optimo }"
            ></span>
            &gt; {{ configMeses.seguro }}m
          </span>
          <span class="ml-auto text-xs text-gray-500">* 1 mes ≈ 30 días</span>
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
