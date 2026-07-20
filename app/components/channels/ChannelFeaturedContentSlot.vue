<script setup lang="ts">
import { ref } from 'vue'
import type { StatsDataDocument } from '@/api/studio'
import { CONTENT_TYPE_META, getStatusMeta } from '@/lib/content-display'
import { relativeUpdate } from '@/utils/statsDataFormat'

defineProps<{
  label: string
  selected: StatsDataDocument | null
  candidates: StatsDataDocument[]
  saving: boolean
}>()

const emit = defineEmits<{
  select: [id: number]
  clear: []
}>()

const browsing = ref(false)

function pick(doc: StatsDataDocument) {
  emit('select', Number(doc.id))
  browsing.value = false
}
</script>

<template>
  <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
    <div class="mb-3 flex items-center justify-between gap-3">
      <span class="text-[12px] font-bold uppercase tracking-[0.04em] text-slate-400">{{ label }}</span>
      <span v-if="saving" class="text-xs text-slate-400">Enregistrement…</span>
    </div>

    <div v-if="selected && !browsing" class="flex items-center gap-3">
      <span
        class="rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.03em]"
        :style="{ background: CONTENT_TYPE_META[selected.type ?? 'statsdata'].bg, color: CONTENT_TYPE_META[selected.type ?? 'statsdata'].color }"
      >
        {{ CONTENT_TYPE_META[selected.type ?? 'statsdata'].label }}
      </span>
      <p class="min-w-0 flex-1 truncate text-sm font-bold text-slate-950">{{ selected.title }}</p>
      <button
        type="button"
        class="shrink-0 text-xs font-bold text-primary hover:text-accent"
        :disabled="saving"
        @click="browsing = true"
      >
        Changer
      </button>
      <button
        type="button"
        class="shrink-0 text-xs font-bold text-slate-400 hover:text-rose-600"
        :disabled="saving"
        @click="emit('clear')"
      >
        Retirer
      </button>
    </div>

    <template v-else>
      <p v-if="!candidates.length" class="text-sm text-slate-400">
        Aucun contenu publié de ce type pour le moment.
      </p>
      <div v-else class="flex flex-col gap-1.5">
        <button
          v-for="doc in candidates"
          :key="doc.id"
          type="button"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
          :disabled="saving"
          @click="pick(doc)"
        >
          <span
            class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
            :style="{ background: getStatusMeta(doc.status, doc.visibility).bg, color: getStatusMeta(doc.status, doc.visibility).color }"
          >
            {{ getStatusMeta(doc.status, doc.visibility).label }}
          </span>
          <span class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{{ doc.title }}</span>
          <span class="shrink-0 text-xs text-slate-400">{{ relativeUpdate(doc.updated_at) ?? '' }}</span>
        </button>
      </div>
      <button
        v-if="selected && browsing"
        type="button"
        class="mt-2 text-xs font-bold text-slate-400 hover:text-slate-600"
        @click="browsing = false"
      >
        Annuler
      </button>
    </template>
  </div>
</template>
