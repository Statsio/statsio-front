<script setup lang="ts">
import { computed } from 'vue'
import { BLOCK_META } from '@/types/studio'
import { useStudioStore } from '@/stores/studio'

const studio = useStudioStore()

const blockType = computed(() => studio.premiumUpsellBlockType)
const blockLabel = computed(() => (blockType.value ? BLOCK_META[blockType.value].label : ''))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="blockType"
      class="fixed inset-0 z-[130] flex items-center justify-center bg-[rgba(20,16,30,0.55)] p-6"
      @click.self="studio.dismissPremiumUpsell()"
    >
      <div class="w-full max-w-[420px] overflow-hidden rounded-[18px] bg-white shadow-[0_30px_70px_rgba(20,16,30,0.35)]">
        <div class="flex items-center justify-between border-b border-[var(--studio-line)] px-6 py-[18px]">
          <span class="text-[15px] font-extrabold text-[var(--studio-ink)]">Bloc réservé à l'offre Premium</span>
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-full text-[13px] text-[var(--studio-muted)] hover:bg-[var(--studio-wash)]"
            aria-label="Fermer"
            @click="studio.dismissPremiumUpsell()"
          >✕</button>
        </div>

        <div class="px-6 py-5">
          <p class="text-[13px] leading-relaxed text-[var(--studio-muted)]">
            Le bloc « {{ blockLabel }} » fait partie de l'offre
            <span class="font-bold text-[var(--studio-ink)]">Premium</span>. Passez à Premium pour l'utiliser
            sans limite, avec vos chaînes et vos sondages.
          </p>

          <div class="mt-5 flex items-center justify-end gap-2.5">
            <button
              type="button"
              class="rounded-full px-4 py-2.5 text-[12.5px] font-bold text-[var(--studio-muted)] hover:bg-[var(--studio-wash)]"
              @click="studio.dismissPremiumUpsell()"
            >
              Fermer
            </button>
            <NuxtLink
              to="/offres"
              target="_blank"
              class="rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] px-5 py-2.5 text-[12.5px] font-bold text-white"
              @click="studio.dismissPremiumUpsell()"
            >
              Voir les offres
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
