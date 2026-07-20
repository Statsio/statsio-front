<script setup lang="ts">
import { computed, toRef } from 'vue'
import type { Medicament } from '@/types/medicaments'
import { extractMedicamentBrandName, getMedicamentFormEmoji } from '@/utils/medicaments'
import { useMedicamentImage } from '@/composables/useMedicamentImage'

const props = withDefaults(
  defineProps<{
    medicament: Medicament
    variant?: 'row' | 'grid'
  }>(),
  {
    variant: 'grid',
  },
)

const { url: imageUrl } = useMedicamentImage(toRef(() => extractMedicamentBrandName(props.medicament.elementPharmaceutique)))
const formEmoji = computed(() => getMedicamentFormEmoji(props.medicament.formePharmaceutique))
</script>

<template>
  <NuxtLink
    :to="`/medistats/medicaments/${medicament.cis}`"
    class="group flex w-full text-left transition"
    :class="
      variant === 'row'
        ? 'items-center gap-3.5 border-b border-slate-100 px-5 py-3 last:border-b-0 hover:bg-slate-50'
        : 'flex-col gap-2.5 rounded-2xl border border-slate-200 bg-white p-5 hover:border-[var(--color-primary)]/30 hover:shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]'
    "
  >
    <div v-if="variant === 'row'" class="flex h-8.5 w-8.5 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--color-primary)]/10 text-sm">
      <img v-if="imageUrl" :src="imageUrl" :alt="medicament.elementPharmaceutique" class="h-full w-full object-cover" />
      <span v-else aria-hidden="true">{{ formEmoji }}</span>
    </div>

    <div v-if="variant === 'grid'" class="flex items-center justify-between gap-3">
      <span class="mono rounded-full bg-[var(--color-primary)]/10 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.03em] text-[var(--color-primary)]">
        {{ medicament.composition[0]?.denominationSubstance ?? medicament.formePharmaceutique }}
      </span>
      <div class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 text-base">
        <img v-if="imageUrl" :src="imageUrl" :alt="medicament.elementPharmaceutique" class="h-full w-full object-cover" />
        <span v-else aria-hidden="true">{{ formEmoji }}</span>
      </div>
    </div>

    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-bold text-slate-900" :class="variant === 'grid' ? 'text-[16.5px]' : ''">
        {{ medicament.elementPharmaceutique }}
      </p>
      <p class="mt-0.5 truncate text-xs text-slate-500">
        {{ medicament.composition[0]?.denominationSubstance }}<span v-if="variant === 'row'"> · {{ medicament.formePharmaceutique }}</span>
      </p>
    </div>

    <span v-if="variant === 'row'" class="shrink-0 text-[11px] font-semibold text-slate-400">
      {{ medicament.formePharmaceutique }}
    </span>
    <p v-else class="border-t border-slate-100 pt-2.5 text-xs text-slate-400">{{ medicament.titulaire }}</p>
  </NuxtLink>
</template>
