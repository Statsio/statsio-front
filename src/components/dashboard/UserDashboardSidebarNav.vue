<script setup lang="ts">
const props = defineProps<{
  items: {
    id: string
    label: string
    value: string
  }[]
  activeTabId: string
}>()

const emit = defineEmits<{
  select: [tabId: string]
}>()
</script>

<template>
  <section aria-label="Navigation du dashboard"
    class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Navigation</p>
    <div class="mt-5 flex flex-col gap-3" role="tablist" aria-orientation="vertical">
      <button v-for="item in items" :key="item.id" :id="`${item.id}-tab`" type="button" role="tab"
        :aria-controls="`${item.id}-panel`"
        class="flex items-center justify-between rounded-[1.25rem] border px-4 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        :class="props.activeTabId === item.id
          ? 'border-slate-950 bg-slate-950 text-white shadow-[0_18px_45px_-38px_rgba(15,23,42,0.8)]'
          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
          " :aria-selected="props.activeTabId === item.id" :tabindex="props.activeTabId === item.id ? 0 : -1"
        @click="emit('select', item.id)">
        <span class="text-sm font-semibold">{{ item.label }}</span>
        <span class="text-xs font-semibold uppercase tracking-[0.2em]"
          :class="props.activeTabId === item.id ? 'text-slate-300' : 'text-slate-400'">
          {{ item.value }}
        </span>
      </button>
    </div>
  </section>
</template>
