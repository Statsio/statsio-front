<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePrefsStore } from '@/stores/prefs'
import { getBrandFromPath } from '@/data/brands'
import { loadPromoTicker } from '@/composables/useHeaderMegaMenuData'
import { usePromoFlashRotation } from '@/composables/usePromoFlashRotation'
import { fetchPromoCategories } from '@/api/promo-categories'
import { sanitizePromoTitleHtml, stripInlineHtml } from '@/lib/inline-rich-text'
import { sectorPath } from '@/lib/ds/pie'
import type { PromoTickerItem } from '@/components/layout/brands/header-nav.types'
import type { PromoCategory } from '@/types/promo-category'
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsKindTag from '@/components/ds/DsKindTag.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsHeading from '@/components/ds/DsHeading.vue'

/**
 * Bandeau « En continu » (charte Tranches), fixé tout en haut au-dessus du header.
 *
 * - Étiquette coupée à 45° : « En continu » + mini camembert qui tourne. Quand une
 *   catégorie de promotion (flash, gérée dans l'admin) est active, l'étiquette
 *   alterne avec cet « événement du moment » — rythme piloté par
 *   `usePromoFlashRotation` (durées configurées dans l'admin, `always_visible`).
 *   Un clic ouvre un popover avec les infos de l'événement.
 * - Piste défilante d'infos typées construites depuis le catalogue réel
 *   (`loadPromoTicker`) ; pause au survol / focus / bouton pause.
 * - Heure en direct (client) + bouton pause. Mouvement réduit : piste figée,
 *   défilement manuel, étiquette statique.
 *
 * Hauteur fixe 48px (h-12) : avec le header (64px) = 112px, cf. layouts/default.vue.
 */

const route = useRoute()
const { reducedMotion } = storeToRefs(usePrefsStore())
const brand = computed(() => getBrandFromPath(route.path))

const { data } = useAsyncData(
  'promo-ticker',
  () => loadPromoTicker(brand.value.id, brand.value.contentBasePath),
  { watch: [() => brand.value.id], default: (): PromoTickerItem[] => [] },
)
const items = computed<PromoTickerItem[]>(() => data.value ?? [])

const { data: categoriesData } = useAsyncData(
  'promo-flash-categories',
  () => fetchPromoCategories(brand.value.id),
  { watch: [() => brand.value.id], default: (): PromoCategory[] => [] },
)
const categories = computed<PromoCategory[]>(() => categoriesData.value ?? [])
const { phase, currentCategory, currentInfo } = usePromoFlashRotation(categories)

/* ─── Événement du moment (étiquette + popover) ───────────────────────────── */
const popoverOpen = ref(false)
/** Catégorie figée pendant que le popover est ouvert (la rotation continue derrière). */
const openedCategory = ref<PromoCategory | null>(null)

const eventCategory = computed(() => (popoverOpen.value ? openedCategory.value : currentCategory.value))
const showEvent = computed(() => popoverOpen.value || (phase.value === 'flash' && !!currentCategory.value))

const eventTitleHtml = (c: PromoCategory | null) =>
  c ? sanitizePromoTitleHtml(c.title_line_1 || c.title_line_2 || c.name) : ''
const eventTitleText = computed(() => stripInlineHtml(eventTitleHtml(eventCategory.value)))
const eventSubtitle = computed(
  () => stripInlineHtml(currentInfo.value?.title) || stripInlineHtml(eventCategory.value?.title_line_2) || 'À suivre',
)
const popoverCta = computed(() => eventCategory.value?.infos.find((i) => i.cta_link && i.cta_label) ?? null)

const labelEl = ref<HTMLElement | null>(null)
const labelA = ref<HTMLElement | null>(null)
const labelB = ref<HTMLElement | null>(null)
const eventButton = ref<HTMLButtonElement | null>(null)
const popoverEl = ref<HTMLElement | null>(null)
const labelWidth = ref<number | null>(null)

/** Largeur de l'étiquette = contenu visible + padding (transition CSS sur width). */
async function measureLabel() {
  await nextTick()
  const host = labelEl.value
  const inner = showEvent.value ? labelB.value : labelA.value
  if (!host || !inner) return
  const cs = getComputedStyle(host)
  labelWidth.value = Math.ceil(inner.scrollWidth + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight))
}
watch([showEvent, eventTitleText, eventSubtitle], () => void measureLabel())

function openPopover() {
  openedCategory.value = currentCategory.value
  popoverOpen.value = true
  void nextTick(() => popoverEl.value?.querySelector<HTMLElement>('[data-close]')?.focus())
}
function closePopover(restoreFocus = true) {
  if (!popoverOpen.value) return
  popoverOpen.value = false
  openedCategory.value = null
  if (restoreFocus) void nextTick(() => eventButton.value?.focus())
}
function onDocPointer(e: PointerEvent) {
  if (!popoverOpen.value) return
  const t = e.target as Node
  if (popoverEl.value?.contains(t) || eventButton.value?.contains(t)) return
  closePopover(false)
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') closePopover()
}

/* ─── Piste défilante ─────────────────────────────────────────────────────── */
const paused = ref(false)
const track = ref<HTMLElement | null>(null)
const trackDuration = ref(60)
const PX_PER_SECOND = 70

async function measureTrack() {
  await nextTick()
  const el = track.value
  if (!el) return
  trackDuration.value = Math.max(30, Math.round(el.scrollWidth / 2 / PX_PER_SECOND))
}
watch(items, () => void measureTrack())

/* ─── Horloge (client uniquement : pas de décalage d'hydratation) ─────────── */
const clock = ref('')
let clockTimer: ReturnType<typeof setInterval> | undefined
function tick() {
  const d = new Date()
  clock.value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function onResize() {
  void measureLabel()
  void measureTrack()
}

onMounted(() => {
  tick()
  clockTimer = setInterval(tick, 15_000)
  void measureLabel()
  void measureTrack()
  window.addEventListener('resize', onResize)
  document.addEventListener('pointerdown', onDocPointer)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  clearInterval(clockTimer)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('pointerdown', onDocPointer)
  document.removeEventListener('keydown', onKey)
})

/** Mini camembert de l'étiquette événement : 3 tranches de la charte (décoratif). */
const eventPie = [
  { d: sectorPath(20, 20, 17, -90, 30), fill: 'var(--ds-violet-500)' },
  { d: sectorPath(20, 20, 17, 30, 150), fill: 'var(--ds-blue-500)' },
  { d: sectorPath(20, 20, 17, 150, 270), fill: 'var(--ds-violet-300)' },
]

const isExternal = (href: string) => /^https?:\/\//.test(href)
</script>

<template>
  <section
    class="ds-scope ds-flash fixed inset-x-0 top-0 z-50"
    :class="{ 'is-paused': paused, 'is-reduced': reducedMotion }"
    aria-label="Infos en continu"
  >
    <!-- Étiquette : « En continu » ⇄ événement du moment -->
    <div
      ref="labelEl"
      class="ds-flash__label"
      :class="{ 'is-event': showEvent }"
      :style="labelWidth ? { width: `${labelWidth}px` } : undefined"
    >
      <span ref="labelA" class="ds-flash__a" :aria-hidden="showEvent ? 'true' : undefined">
        <i class="ds-flash__spin" aria-hidden="true" />
        <span class="ds-flash__a-text">En continu</span>
      </span>
      <button
        v-if="eventCategory || showEvent"
        ref="eventButton"
        type="button"
        class="ds-flash__b"
        :tabindex="showEvent ? 0 : -1"
        :aria-hidden="showEvent ? undefined : 'true'"
        aria-haspopup="dialog"
        aria-controls="ds-flash-popover"
        :aria-expanded="popoverOpen"
        @click="popoverOpen ? closePopover() : openPopover()"
      >
        <span ref="labelB" class="ds-flash__b-inner">
          <svg viewBox="0 0 40 40" width="26" height="26" aria-hidden="true" class="ds-flash__b-pie">
            <path v-for="(p, i) in eventPie" :key="i" :d="p.d" :style="{ fill: p.fill }" stroke="#fff" stroke-width="1.5" />
            <circle cx="20" cy="20" r="17.5" fill="none" stroke="currentColor" stroke-width="1.5" />
          </svg>
          <span class="ds-flash__b-lines">
            <b>{{ eventTitleText }}</b>
            <small>{{ eventSubtitle }}</small>
          </span>
          <span class="ds-flash__b-arrow" aria-hidden="true">→</span>
        </span>
      </button>
    </div>

    <!-- Piste défilante -->
    <div class="ds-flash__mask">
      <div ref="track" class="ds-flash__track" :style="{ '--ds-flash-dur': `${trackDuration}s` }">
        <template v-for="copy in reducedMotion ? 1 : 2" :key="copy">
          <NuxtLink
            v-for="(item, index) in items"
            :key="`${copy}-${index}`"
            :to="item.href"
            class="ds-flash__item"
            :aria-hidden="copy === 2 ? 'true' : undefined"
            :tabindex="copy === 2 ? -1 : undefined"
          >
            <DsKindTag :kind="item.kind" tone="flash">{{ item.label }}</DsKindTag>
            <span class="ds-flash__text">
              <template v-for="(part, p) in item.parts" :key="p">
                <b v-if="part.strong">{{ part.text }}</b>
                <template v-else>{{ part.text }}</template>
              </template>
            </span>
          </NuxtLink>
        </template>
      </div>
    </div>

    <!-- Heure + pause -->
    <div class="ds-flash__right">
      <time class="ds-flash__clock" aria-label="Heure">{{ clock }}</time>
      <button
        v-if="!reducedMotion"
        type="button"
        class="ds-flash__pause"
        :aria-pressed="paused"
        :aria-label="paused ? 'Relancer le bandeau' : 'Mettre le bandeau en pause'"
        @click="paused = !paused"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path v-if="paused" d="M3 1.5 L10.5 6 L3 10.5 Z" fill="currentColor" />
          <template v-else>
            <rect x="2" y="1.5" width="3" height="9" fill="currentColor" />
            <rect x="7" y="1.5" width="3" height="9" fill="currentColor" />
          </template>
        </svg>
      </button>
    </div>

    <!-- Popover de l'événement -->
    <DsBox
      v-if="popoverOpen && eventCategory"
      id="ds-flash-popover"
      class="ds-flash__pop"
      role="dialog"
      aria-modal="false"
      aria-labelledby="ds-flash-pop-title"
    >
      <div ref="popoverEl" class="ds-flash__pop-inner">
        <div class="ds-flash__pop-head">
          <DsLabel>{{ eventCategory.name }} · <b>en ce moment</b></DsLabel>
          <button type="button" class="ds-flash__pop-x" data-close aria-label="Fermer" @click="closePopover()">×</button>
        </div>
        <DsHeading id="ds-flash-pop-title" :level="3" size="md">
          <span v-html="eventTitleHtml(eventCategory)" />
        </DsHeading>
        <ul v-if="eventCategory.infos.length" class="ds-flash__pop-list">
          <li v-for="(info, i) in eventCategory.infos" :key="i">
            <b>{{ info.title }}</b>
            <span v-if="info.description">{{ info.description }}</span>
          </li>
        </ul>
        <DsButton
          v-if="popoverCta"
          :to="isExternal(popoverCta.cta_link!) ? undefined : popoverCta.cta_link!"
          :href="isExternal(popoverCta.cta_link!) ? popoverCta.cta_link! : undefined"
          class="self-start"
          @click="closePopover(false)"
        >
          {{ popoverCta.cta_label }} <span aria-hidden="true">→</span>
        </DsButton>
      </div>
    </DsBox>
  </section>
</template>

<style scoped>
.ds-flash {
  display: flex;
  align-items: stretch;
  height: 48px;
  background: var(--ds-flash-bg);
  color: var(--ds-flash-ink);
  font-family: var(--ds-ui);
}

/* ── étiquette ── */
.ds-flash__label {
  position: relative;
  flex: none;
  display: grid;
  align-items: center;
  padding: 0 30px 0 16px;
  overflow: hidden;
  background: var(--ds-flash-label);
  clip-path: polygon(0 0, 100% 0, calc(100% - 16px) 100%, 0 100%);
  transition:
    width 0.6s var(--ds-e-glisse),
    background-color 0.45s;
}
@media (min-width: 1024px) {
  .ds-flash__label {
    padding-left: 40px;
  }
}
.ds-flash__label > * {
  grid-area: 1 / 1;
}
.ds-flash__label.is-event {
  background: #fff;
}
.ds-flash__a {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  font: 500 11.5px/1 var(--ds-num);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  transition: opacity 0.25s;
}
.is-event .ds-flash__a {
  opacity: 0;
}
@property --ds-fl {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}
.ds-flash__spin {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: conic-gradient(#fff var(--ds-fl), rgba(255, 255, 255, 0.28) 0);
  animation: ds-flash-spin 1.6s var(--ds-e-balaye) infinite;
}
@keyframes ds-flash-spin {
  to {
    --ds-fl: 360deg;
  }
}
.is-reduced .ds-flash__spin {
  animation: none;
  background: conic-gradient(#fff 270deg, rgba(255, 255, 255, 0.28) 0);
}

@property --ds-sw {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}
.ds-flash__b {
  padding: 0;
  border: 0;
  background: none;
  color: #6d28d9;
  font: inherit;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  /* révélation par balayage conique, centré sur le mini camembert */
  --ds-sw: 0deg;
  -webkit-mask-image: conic-gradient(from 0deg at 13px 50%, #000 var(--ds-sw), transparent 0);
  mask-image: conic-gradient(from 0deg at 13px 50%, #000 var(--ds-sw), transparent 0);
  transition:
    --ds-sw 0.45s var(--ds-e-balaye),
    opacity 0.2s;
}
.is-event .ds-flash__b {
  opacity: 1;
  pointer-events: auto;
  --ds-sw: 360deg;
  transition:
    --ds-sw 0.85s var(--ds-e-balaye) 0.15s,
    opacity 0.1s;
}
.is-reduced .ds-flash__b {
  transition: none;
}
.ds-flash__b:focus-visible {
  outline: 2px solid #6d28d9;
  outline-offset: 2px;
}
.ds-flash__b-inner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.ds-flash__b-pie {
  flex: none;
  color: #6d28d9;
}
.ds-flash__b-lines {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1;
}
.ds-flash__b-lines b {
  font: 600 11.5px/1 var(--ds-num);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.ds-flash__b-lines small {
  color: #1d4ed8;
  font: 600 12.5px/1 var(--ds-ui);
}
.ds-flash__b-arrow {
  color: #1d4ed8;
  font-weight: 800;
  transition: transform 0.2s;
}
.ds-flash__b:hover .ds-flash__b-arrow {
  transform: translateX(3px);
}

/* ── piste ── */
.ds-flash__mask {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 3%, #000 97%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 3%, #000 97%, transparent);
}
.ds-flash__track {
  display: flex;
  align-items: center;
  width: max-content;
  height: 100%;
  animation: ds-flash-scroll var(--ds-flash-dur, 60s) linear infinite;
}
.ds-flash:hover .ds-flash__track,
.ds-flash:focus-within .ds-flash__track,
.ds-flash.is-paused .ds-flash__track {
  animation-play-state: paused;
}
@keyframes ds-flash-scroll {
  to {
    transform: translateX(-50%);
  }
}
.is-reduced .ds-flash__track {
  animation: none;
}
.is-reduced .ds-flash__mask {
  overflow-x: auto;
}
.ds-flash__item {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 100%;
  padding: 0 22px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  text-decoration: none;
}
.ds-flash__item::after {
  content: '';
  width: 8px;
  height: 8px;
  margin-left: 12px;
  border-radius: 100% 0 0 0;
  background: var(--ds-flash-swatch);
}
.ds-flash__item:hover .ds-flash__text {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.ds-flash__item:focus-visible {
  outline: 2px solid #fff;
  outline-offset: -4px;
}
.ds-flash__text b {
  padding: 1px 5px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.16);
  font-family: var(--ds-num);
  font-weight: 500;
}

/* ── droite ── */
.ds-flash__right {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px 0 12px;
  background: var(--ds-flash-bg);
}
@media (min-width: 1024px) {
  .ds-flash__right {
    padding-right: 40px;
  }
}
.ds-flash__clock {
  font: 500 13px var(--ds-num);
  letter-spacing: 0.04em;
}
.ds-flash__pause {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1.5px solid rgba(255, 255, 255, 0.7);
  border-radius: 3px;
  background: transparent;
  color: #fff;
  cursor: pointer;
}
.ds-flash__pause:hover {
  background: rgba(255, 255, 255, 0.14);
}
.ds-flash__pause:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
@media (max-width: 640px) {
  .ds-flash__a-text,
  .ds-flash__clock {
    display: none;
  }
  .ds-flash__label {
    padding-right: 22px;
  }
}

/* ── popover ── */
.ds-flash__pop {
  position: absolute;
  top: 54px;
  left: 16px;
  z-index: 60;
  width: min(440px, calc(100vw - 32px));
}
@media (min-width: 1024px) {
  .ds-flash__pop {
    left: 40px;
  }
}
.ds-flash__pop-inner {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
}
.ds-flash__pop-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.ds-flash__pop-x {
  width: 32px;
  height: 32px;
  border: 2px solid var(--ds-ol);
  border-radius: 3px;
  background: var(--ds-surface);
  color: var(--ds-ol);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}
.ds-flash__pop-list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}
.ds-flash__pop-list li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 0;
  border-bottom: 2px solid var(--ds-divide);
  font-size: 14px;
}
.ds-flash__pop-list li:last-child {
  border-bottom: 0;
}
.ds-flash__pop-list span {
  color: var(--ds-muted);
  font-size: 13.5px;
}
</style>
