<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{
  show: boolean
  block: StudioBlock
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const studio = useStudioStore()

function cfg(key: string, value: unknown) {
  studio.updateBlockConfig(props.block.id, { [key]: value })
}

const isButton   = computed(() => props.block.type === 'button')
const isLinkCard = computed(() => props.block.type === 'link-card')
const isRetenir  = computed(() => props.block.type === 'retenir')

const retenirItems = computed<string[]>(() => props.block.config.retenirItems ?? [])

function updateItem(idx: number, val: string) {
  cfg('retenirItems', retenirItems.value.map((v, i) => i === idx ? val : v))
}

function addItem() {
  cfg('retenirItems', [...retenirItems.value, ''])
}

function removeItem(idx: number) {
  cfg('retenirItems', retenirItems.value.filter((_, i) => i !== idx))
}

const COLORS = [
  { v: 'violet',  bg: 'bg-[var(--color-primary)]',  ring: 'ring-violet-400'  },
  { v: 'emerald', bg: 'bg-emerald-500',              ring: 'ring-emerald-400' },
  { v: 'amber',   bg: 'bg-amber-400',                ring: 'ring-amber-400'   },
  { v: 'blue',    bg: 'bg-blue-500',                 ring: 'ring-blue-400'    },
]

const BUTTON_VARIANTS = [
  { v: 'primary',   l: 'Primaire'  },
  { v: 'secondary', l: 'Sombre'    },
  { v: 'outline',   l: 'Contour'   },
]

const modalTitle = computed(() => {
  if (isButton.value)   return 'Bouton'
  if (isLinkCard.value) return 'Carte lien'
  if (isRetenir.value)  return 'À retenir'
  return 'Contenu'
})
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[9998] flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="emit('close')" />

      <div class="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" style="max-height: min(85vh, 640px);">

        <!-- Header -->
        <div class="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-3.5">
          <div class="flex items-center gap-3">
            <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <svg v-if="isLinkCard" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
              <svg v-else-if="isRetenir" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
              <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" />
              </svg>
            </span>
            <h3 class="text-[13px] font-semibold text-slate-800">{{ modalTitle }}</h3>
          </div>
          <button class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" @click="emit('close')">×</button>
        </div>

        <!-- Body -->
        <div class="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-5">

          <!-- ══ BUTTON ══ -->
          <template v-if="isButton">
            <div>
              <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Contenu</p>
              <div class="flex flex-col gap-2">
                <div>
                  <label class="cfg-label">Label du bouton</label>
                  <input :value="block.config.buttonLabel ?? ''" type="text" placeholder="En savoir plus" class="cfg-input" @input="cfg('buttonLabel', ($event.target as HTMLInputElement).value)" />
                </div>
                <div>
                  <label class="cfg-label">URL de destination</label>
                  <input :value="block.config.buttonUrl ?? ''" type="url" placeholder="https://…" class="cfg-input" @input="cfg('buttonUrl', ($event.target as HTMLInputElement).value)" />
                </div>
              </div>
            </div>

            <div class="border-t border-slate-100" />

            <div>
              <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Style</p>
              <div class="flex flex-col gap-3">
                <div>
                  <label class="cfg-label">Variante</label>
                  <div class="grid grid-cols-3 gap-1.5">
                    <button
                      v-for="v in BUTTON_VARIANTS" :key="v.v"
                      class="rounded-xl border py-2 text-xs font-semibold transition-colors"
                      :class="(block.config.buttonVariant ?? 'primary') === v.v ? 'cfg-active' : 'cfg-inactive'"
                      @click="cfg('buttonVariant', v.v)"
                    >{{ v.l }}</button>
                  </div>
                </div>
                <div>
                  <label class="cfg-label">Taille</label>
                  <div class="grid grid-cols-3 gap-1.5">
                    <button
                      v-for="s in ['sm', 'md', 'lg']" :key="s"
                      class="rounded-xl border py-2 text-xs font-semibold uppercase transition-colors"
                      :class="(block.config.buttonSize ?? 'md') === s ? 'cfg-active' : 'cfg-inactive'"
                      @click="cfg('buttonSize', s)"
                    >{{ s }}</button>
                  </div>
                </div>
                <div>
                  <label class="cfg-label">Alignement</label>
                  <div class="grid grid-cols-3 gap-1.5">
                    <button
                      v-for="a in [{ v: 'left', icon: 'M3.75 6.75h16.5M3.75 12H12m-8.25 5.25h16.5' }, { v: 'center', icon: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5' }, { v: 'right', icon: 'M3.75 6.75h16.5M12 12h8.25M3.75 17.25h16.5' }]"
                      :key="a.v"
                      class="flex items-center justify-center rounded-xl border py-2 transition-colors"
                      :class="(block.config.buttonAlign ?? 'center') === a.v ? 'cfg-active' : 'cfg-inactive'"
                      @click="cfg('buttonAlign', a.v)"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" :d="a.icon" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- ══ LINK-CARD ══ -->
          <template v-if="isLinkCard">
            <div>
              <label class="cfg-label">URL</label>
              <input :value="block.config.linkUrl ?? ''" type="url" placeholder="https://…" class="cfg-input" @input="cfg('linkUrl', ($event.target as HTMLInputElement).value)" />
            </div>
            <div>
              <label class="cfg-label">Titre</label>
              <input :value="block.config.linkTitle ?? ''" type="text" placeholder="Titre de l'article" class="cfg-input" @input="cfg('linkTitle', ($event.target as HTMLInputElement).value)" />
            </div>
            <div>
              <label class="cfg-label">Description</label>
              <textarea :value="block.config.linkDescription ?? ''" rows="3" placeholder="Résumé ou accroche…" class="cfg-input resize-none" @input="cfg('linkDescription', ($event.target as HTMLTextAreaElement).value)" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="cfg-label">Domaine <span class="text-slate-400 font-normal normal-case">ex: lemonde.fr</span></label>
                <input :value="block.config.linkDomain ?? ''" type="text" placeholder="lemonde.fr" class="cfg-input" @input="cfg('linkDomain', ($event.target as HTMLInputElement).value)" />
              </div>
              <div>
                <label class="cfg-label">Image <span class="text-slate-400 font-normal normal-case">optionnel</span></label>
                <input :value="block.config.linkImage ?? ''" type="url" placeholder="https://…" class="cfg-input" @input="cfg('linkImage', ($event.target as HTMLInputElement).value)" />
              </div>
            </div>
          </template>

          <!-- ══ RETENIR ══ -->
          <template v-if="isRetenir">
            <div>
              <label class="cfg-label">Titre du bloc</label>
              <input :value="block.config.retenirTitle ?? ''" type="text" placeholder="À retenir" class="cfg-input" @input="cfg('retenirTitle', ($event.target as HTMLInputElement).value)" />
            </div>

            <div>
              <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Points clés</p>
              <div class="flex flex-col gap-1.5">
                <div
                  v-for="(item, idx) in retenirItems" :key="idx"
                  class="flex items-center gap-2"
                >
                  <span class="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400 text-[10px] font-bold">{{ idx + 1 }}</span>
                  <input
                    :value="item"
                    type="text"
                    class="cfg-input flex-1"
                    placeholder="Point important…"
                    @input="updateItem(idx, ($event.target as HTMLInputElement).value)"
                  />
                  <button class="shrink-0 flex items-center justify-center w-6 h-6 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors" @click="removeItem(idx)">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <button
                  class="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-primary)] hover:opacity-70 transition-opacity mt-1 ml-7"
                  @click="addItem"
                >
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Ajouter un point
                </button>
              </div>
            </div>

            <div>
              <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Couleur</p>
              <div class="flex gap-3">
                <button
                  v-for="c in COLORS" :key="c.v"
                  class="w-8 h-8 rounded-full shrink-0 transition-all border-2"
                  :class="[c.bg, (block.config.retenirColor ?? 'violet') === c.v ? `ring-2 ring-offset-2 ${c.ring} scale-110 border-transparent` : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105']"
                  @click="cfg('retenirColor', c.v)"
                />
              </div>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="flex shrink-0 items-center justify-end border-t border-slate-100 px-5 py-3">
          <button class="rounded-xl bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity" @click="emit('close')">Terminé</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
