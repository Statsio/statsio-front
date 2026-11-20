<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { PIE_START, easeInOut, segmentsToAngles, sectorPath, sliceOffset, type DsPieSegment } from '@/lib/ds/pie'
import { useDrawAnimation } from '@/composables/useDrawAnimation'
import { useInViewOnce } from '@/composables/useInViewOnce'

/**
 * Camembert de la charte « Tranches » — 5 parts maximum (au-delà : regrouper).
 * Signature : « le camembert qui se dessine » — les tranches apparaissent en un
 * balayage horaire continu (coupé en mouvement réduit).
 *
 * - `animate` : `mount` (au montage), `view` (à l'entrée dans l'écran), `false`.
 * - `interactive` : chaque tranche est un bouton (clic, Entrée, Espace) ;
 *   `selected` détache la tranche choisie et estompe les autres.
 * - `you` sur un segment : « votre part » (violet clair, voir --ds-vous).
 * - `track` : disque de fond teinté (utile quand la somme < `total`).
 */
const props = withDefaults(
  defineProps<{
    segments: DsPieSegment[]
    /** total de référence ; par défaut la somme des valeurs */
    total?: number
    size?: number
    animate?: 'mount' | 'view' | false
    duration?: number
    interactive?: boolean
    selected?: number | null
    /** px (unités du viewBox de 120) de détachement de la tranche sélectionnée */
    detach?: number
    track?: boolean
    ring?: boolean
    separator?: 'surface' | 'outline'
    label?: string
  }>(),
  {
    total: undefined,
    size: 120,
    animate: 'mount',
    duration: 900,
    interactive: false,
    selected: null,
    detach: 8,
    track: true,
    ring: true,
    separator: 'surface',
    label: undefined,
  },
)

const emit = defineEmits<{ select: [index: number]; hover: [index: number | null] }>()

const C = 60
const R = 56
const root = ref<SVGSVGElement | null>(null)
const hovered = ref<number | null>(null)
const { progress, play } = useDrawAnimation(props.animate ? 0 : 1)

const slices = computed(() =>
  segmentsToAngles(
    props.segments.map((s) => s.value),
    PIE_START,
    props.total,
  ),
)

const sweep = computed(() => PIE_START + 360 * easeInOut(progress.value))

const paths = computed(() =>
  slices.value.map((slice, i) => {
    const seg = props.segments[i]!
    const d = sectorPath(C, C, R, slice.a0, Math.min(slice.a1, sweep.value))
    let offset = { x: 0, y: 0 }
    if (props.selected === i) offset = sliceOffset(slice, props.detach)
    else if (props.interactive && hovered.value === i) offset = sliceOffset(slice, props.detach / 2.5)
    return {
      d,
      seg,
      transform: offset.x || offset.y ? `translate(${offset.x}px, ${offset.y}px)` : undefined,
      dimmed: props.selected != null && props.selected !== i,
      fill: seg.you ? 'var(--ds-vous)' : seg.color,
    }
  }),
)

const ariaLabel = computed(
  () =>
    props.label ??
    props.segments
      .filter((s) => s.label)
      .map((s) => `${s.label} : ${s.value}`)
      .join(', '),
)

function onKey(e: KeyboardEvent, i: number) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    emit('select', i)
  }
}

function setHover(i: number | null) {
  hovered.value = i
  emit('hover', i)
}

defineExpose({ replay: (duration?: number) => play(duration ?? props.duration) })

if (props.animate === 'view') useInViewOnce(root, () => play(props.duration))
onMounted(() => {
  if (props.animate === 'mount') play(props.duration)
})

// Les données changent (ex. un vote ajouté) → on redessine.
watch(
  () => props.segments.map((s) => `${s.value}:${s.you ? 1 : 0}`).join('|'),
  () => {
    if (props.animate) play(props.duration)
  },
)
</script>

<template>
  <svg
    ref="root"
    class="ds-pie"
    viewBox="-12 -12 144 144"
    :width="size"
    :height="size"
    :role="interactive ? 'group' : 'img'"
    :aria-label="ariaLabel || undefined"
  >
    <circle v-if="track" :cx="C" :cy="C" :r="R" class="ds-pie__track" />
    <path
      v-for="(p, i) in paths"
      :key="i"
      :d="p.d"
      class="ds-pie__slice"
      :class="{ 'is-dimmed': p.dimmed, 'is-interactive': interactive, 'sep-outline': separator === 'outline' }"
      :style="{ fill: p.fill, transform: p.transform }"
      :tabindex="interactive ? 0 : undefined"
      :role="interactive ? 'button' : undefined"
      :aria-label="interactive ? `${p.seg.label ?? ''}, ${p.seg.value}` : undefined"
      :aria-pressed="interactive ? selected === i : undefined"
      @click="interactive && emit('select', i)"
      @keydown="interactive && onKey($event, i)"
      @pointerenter="interactive && setHover(i)"
      @pointerleave="interactive && setHover(null)"
      @focus="interactive && setHover(i)"
      @blur="interactive && setHover(null)"
    />
    <circle v-if="ring" :cx="C" :cy="C" :r="R + 1" class="ds-pie__ring" />
  </svg>
</template>

<style scoped>
.ds-pie {
  display: block;
  max-width: 100%;
  height: auto;
  overflow: visible;
}
.ds-pie__track {
  fill: var(--ds-tint);
}
.ds-pie__slice {
  stroke: var(--ds-surface);
  stroke-width: 2.5;
  stroke-linejoin: round;
  transform-origin: 60px 60px;
  transition:
    transform 0.35s var(--ds-e-glisse),
    opacity 0.25s;
}
.ds-pie__slice.sep-outline {
  stroke: var(--ds-ol);
}
.ds-pie__slice.is-interactive {
  cursor: pointer;
}
.ds-pie__slice.is-dimmed {
  opacity: 0.55;
}
.ds-pie__slice:focus-visible {
  outline: none;
  stroke: var(--ds-text);
  stroke-width: 3.5;
}
.ds-pie__ring {
  fill: none;
  stroke: var(--ds-ol);
  stroke-width: 2;
}
</style>
