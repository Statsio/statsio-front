<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock } from '@/types/studio'
import StudioSubModal from './StudioSubModal.vue'

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
  <StudioSubModal v-if="show" :title="modalTitle" :width="560" @close="emit('close')">
        <!-- Body -->
        <div class="flex flex-col gap-5">

          <!-- ══ BUTTON ══ -->
          <template v-if="isButton">
            <div>
              <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--studio-faint)]">Contenu</p>
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

            <div class="border-t border-[var(--studio-line)]" />

            <div>
              <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--studio-faint)]">Style</p>
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
                <label class="cfg-label">Domaine <span class="text-[var(--studio-faint)] font-normal normal-case">ex: lemonde.fr</span></label>
                <input :value="block.config.linkDomain ?? ''" type="text" placeholder="lemonde.fr" class="cfg-input" @input="cfg('linkDomain', ($event.target as HTMLInputElement).value)" />
              </div>
              <div>
                <label class="cfg-label">Image <span class="text-[var(--studio-faint)] font-normal normal-case">optionnel</span></label>
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
              <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--studio-faint)]">Points clés</p>
              <div class="flex flex-col gap-1.5">
                <div
                  v-for="(item, idx) in retenirItems" :key="idx"
                  class="flex items-center gap-2"
                >
                  <span class="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-[var(--studio-faint)] text-[10px] font-bold">{{ idx + 1 }}</span>
                  <input
                    :value="item"
                    type="text"
                    class="cfg-input flex-1"
                    placeholder="Point important…"
                    @input="updateItem(idx, ($event.target as HTMLInputElement).value)"
                  />
                  <button class="shrink-0 flex items-center justify-center w-6 h-6 rounded-lg text-[var(--studio-faint)] hover:text-red-400 hover:bg-red-50 transition-colors" @click="removeItem(idx)">
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
              <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--studio-faint)]">Couleur</p>
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
  </StudioSubModal>
</template>
