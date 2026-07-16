<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { DisplayContent } from '@/composables/useMyStudioContents'

defineProps<{ content: DisplayContent }>()
</script>

<template>
  <div class="card">
    <div
      class="relative flex h-[130px] items-center justify-center font-mono text-[11px]"
      :style="{ background: content.typeBg, color: content.typeColor }"
    >
      {{ content.typeLabel }}

      <span
        class="absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
        :style="{ background: content.statusBg, color: content.statusColor }"
      >
        {{ content.statusLabel }}
      </span>

      <div
        class="absolute -bottom-4 left-4 flex h-[34px] w-[34px] items-center justify-center border-[2.5px] border-white text-[12.5px] font-bold text-white"
        :class="content.avatarShape === 'circle' ? 'rounded-full' : 'rounded-[9px]'"
        :style="{ background: content.avatarBg }"
      >
        {{ content.avatarInitials }}
      </div>
    </div>

    <div class="px-[18px] pb-[18px] pt-6">
      <span class="text-[11px] font-bold uppercase tracking-[0.03em]" :style="{ color: content.typeColor }">
        {{ content.typeLabel }}
      </span>

      <div class="my-2 text-[15px] font-bold leading-tight text-slate-950">{{ content.title }}</div>

      <div class="text-xs text-slate-400">{{ content.ownerLabel }} · {{ content.date }}</div>

      <div class="mt-3.5 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-3">
        <RouterLink :to="content.studioPath" class="text-[12.5px] font-bold text-primary hover:text-accent">
          Studio
        </RouterLink>

        <template v-if="content.propertiesPath">
          <span class="text-slate-300">·</span>
          <RouterLink :to="content.propertiesPath" class="text-[12.5px] font-bold text-primary hover:text-accent">
            Propriétés
          </RouterLink>
        </template>

        <span class="text-slate-300">·</span>
        <RouterLink v-if="content.publicPath" :to="content.publicPath" class="text-[12.5px] font-bold text-primary hover:text-accent">
          Voir en ligne
        </RouterLink>
        <span v-else class="text-[12.5px] font-bold text-slate-300">Voir en ligne</span>
      </div>
    </div>
  </div>
</template>
