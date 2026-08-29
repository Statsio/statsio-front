<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { formatCompactNumber } from '@/lib/format'

defineProps<{
  subscription: {
    id: number
    name: string
    handle: string | null
    description: string | null
    logoUrl: string | null
    initials: string
    color: string
    subscriberCount: number
    following: boolean
    pending: boolean
  }
}>()
const emit = defineEmits<{ toggle: [id: number] }>()
</script>

<template>
  <div class="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_3px_rgba(20,20,30,0.05)]">
    <component
      :is="subscription.handle ? RouterLink : 'div'"
      :to="subscription.handle ? `/channels/@${subscription.handle}` : undefined"
      class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-[14px] font-bold text-white"
      :style="subscription.logoUrl ? undefined : { background: subscription.color }"
    >
      <img v-if="subscription.logoUrl" :src="subscription.logoUrl" alt="" class="h-full w-full object-cover" />
      <span v-else>{{ subscription.initials }}</span>
    </component>

    <div class="min-w-0 flex-1">
      <div class="text-[14.5px] font-bold text-slate-950">{{ subscription.name }}</div>
      <div class="mt-0.5 truncate text-[12px] text-slate-400">
        <span v-if="subscription.description">{{ subscription.description }} · </span>
        {{ formatCompactNumber(subscription.subscriberCount) }} abonnés
      </div>
    </div>

    <button
      type="button"
      :disabled="subscription.pending"
      class="shrink-0 rounded-full px-[18px] py-2 text-[12px] font-bold uppercase tracking-[0.06em] transition disabled:opacity-50"
      :class="
        subscription.following
          ? 'border-[1.5px] border-slate-200 bg-white text-slate-950 hover:bg-slate-50'
          : 'bg-gradient-to-br from-primary to-accent text-white'
      "
      @click="emit('toggle', subscription.id)"
    >
      {{ subscription.following ? 'Abonné' : 'Se réabonner' }}
    </button>
  </div>
</template>
