<script setup lang="ts">
import DsLabel from '@/components/ds/DsLabel.vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import { CONTENT_CREATION_MENU_ITEMS } from '@/data/content-creation-menu'
import { glyphForContentType } from '@/lib/ds/types'
import type { ContentType } from '@/types/content-creation'

const emit = defineEmits<{ select: [ContentType] }>()
</script>

<template>
  <div
    class="overflow-hidden rounded-[6px] border-2 border-[var(--ds-ol)] bg-[var(--ds-surface)] text-[var(--ds-text)] shadow-[6px_6px_0_var(--ds-sh)]"
    role="menu"
    aria-label="Créer un contenu"
  >
    <div class="border-b-2 border-[var(--ds-divide)] px-4 py-3">
      <DsLabel>Créer</DsLabel>
    </div>
    <div class="flex flex-col gap-0.5 p-1.5">
      <button
        v-for="item in CONTENT_CREATION_MENU_ITEMS"
        :key="item.id"
        type="button"
        role="menuitem"
        class="group flex w-full items-center gap-3 rounded-[4px] px-2.5 py-2.5 text-left transition-colors hover:bg-[var(--ds-tint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus)]"
        @click="emit('select', item.id)"
      >
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border-2 border-[var(--ds-divide)] bg-[var(--ds-tint)] text-[var(--ds-accent)]">
          <DsTypeGlyph :kind="glyphForContentType(item.id)" :size="22" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-[13.5px] font-extrabold leading-tight" style="font-family: var(--ds-display)">{{ item.label }}</span>
          <span class="mt-0.5 block text-[12px] leading-snug text-[var(--ds-muted)]">{{ item.description }}</span>
        </span>
        <span class="shrink-0 text-[14px] text-[var(--ds-faint)] transition group-hover:text-[var(--ds-accent)]" aria-hidden="true">→</span>
      </button>
    </div>
  </div>
</template>
