<script setup lang="ts">
defineProps<{
  caption: string
  remoteError: string | null
  loading: boolean
  hasData: boolean
}>()
</script>

<template>
  <div
    class="flex w-full aspect-[16/9] max-h-[min(22rem,55vw)] flex-col rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,#fafbfc_0%,#f1f5f9_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
    role="img"
    :aria-label="caption"
  >
    <p v-if="remoteError" class="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-center text-[11px] text-amber-900">
      {{ remoteError }}
    </p>
    <p v-else-if="loading" class="flex flex-1 items-center justify-center text-xs text-slate-500">Chargement…</p>
    <slot v-else-if="hasData" />
    <slot v-else name="empty" />
  </div>
</template>

