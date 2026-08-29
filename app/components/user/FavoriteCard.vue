<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AccountContentThumb from '@/components/user/AccountContentThumb.vue'
import type { DisplayAccountContent } from '@/lib/account-content'

defineProps<{ content: DisplayAccountContent }>()
const emit = defineEmits<{ remove: [id: string] }>()
</script>

<template>
  <div class="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(20,20,30,0.05)]">
    <div class="relative">
      <component
        :is="content.publicPath ? RouterLink : 'div'"
        :to="content.publicPath ?? undefined"
        class="block"
      >
        <AccountContentThumb :content="content" rounded="rounded-none" class="h-[106px] w-full" />
      </component>
      <button
        type="button"
        title="Retirer des favoris"
        class="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/92 text-rose-600 shadow-sm transition hover:bg-white"
        @click="emit('remove', content.id)"
      >
        ♥
      </button>
    </div>
    <div class="flex flex-1 flex-col p-4">
      <span class="text-[10.5px] font-bold uppercase tracking-[0.06em]" :style="{ color: content.typeColor }">
        {{ content.typeLabel }}
      </span>
      <component
        :is="content.publicPath ? RouterLink : 'div'"
        :to="content.publicPath ?? undefined"
        class="mb-auto mt-1.5 text-[14px] font-bold leading-snug text-pretty text-slate-950 hover:text-primary"
      >
        {{ content.title }}
      </component>
      <div class="mt-3 text-[11.5px] text-slate-400">{{ content.ownerLabel }}</div>
    </div>
  </div>
</template>
