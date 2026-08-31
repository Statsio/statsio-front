<script setup lang="ts">
import { computed } from 'vue'
import type { StatsDataDocument } from '@/api/studio'
import StatsDataPublisherCard from '@/components/statsdata/detail/StatsDataPublisherCard.vue'
import { resolveArticleFormat } from '@/lib/articleFormat'

const props = defineProps<{
  doc: StatsDataDocument
  readingMinutes: number
  linkedCount: number
  isFollowing: boolean
  canFollow: boolean
}>()

defineEmits<{ 'toggle-follow': [] }>()

const format = computed(() => resolveArticleFormat(props.doc.categories))

function formatDate(iso?: string) {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
const publishedOn = computed(() => formatDate(props.doc.created_at) ?? formatDate(props.doc.updated_at))
</script>

<template>
  <section class="border-b border-[var(--studio-line)] bg-white">
    <div class="mx-auto grid max-w-[1180px] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_306px] lg:gap-[46px] lg:py-11">
      <div class="min-w-0">
        <div class="mb-4 flex flex-wrap items-center gap-2.5">
          <span
            v-if="format.formatLabel"
            class="mono rounded-[5px] bg-[#eaf1fe] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#2563eb]"
          >{{ format.formatLabel }}</span>
          <span v-if="format.theme" class="mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--studio-faint)]">
            {{ format.theme }}
          </span>
          <span v-if="linkedCount > 0" class="h-[3px] w-[3px] rounded-full bg-[var(--studio-faint)]" />
          <span v-if="linkedCount > 0" class="mono text-[10.5px] font-semibold text-[var(--color-primary)]">
            ▤ {{ linkedCount }} Statsdata lié{{ linkedCount > 1 ? 's' : '' }}
          </span>
        </div>

        <h1 class="max-w-[22ch] text-[32px] font-extrabold leading-[1.08] tracking-[-0.025em] [text-wrap:pretty] text-[var(--studio-ink)] sm:text-[40px] lg:text-[44px]">
          {{ doc.title }}
        </h1>
        <p v-if="doc.description" class="mt-[18px] max-w-[58ch] text-[16px] leading-[1.62] text-[var(--studio-muted)] [text-wrap:pretty] sm:text-[17px]">
          {{ doc.description }}
        </p>

        <div class="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[var(--studio-line)] pt-[18px] text-[13px] text-[var(--studio-muted)]">
          <span v-if="doc.author?.name || doc.channel?.name" class="font-bold text-[var(--studio-ink)]">
            {{ doc.channel?.name ?? doc.author?.name }}
          </span>
          <span v-if="publishedOn" class="h-[3px] w-[3px] rounded-full bg-[var(--studio-faint)]" />
          <span v-if="publishedOn">{{ publishedOn }}</span>
          <span class="h-[3px] w-[3px] rounded-full bg-[var(--studio-faint)]" />
          <span>{{ readingMinutes }} min de lecture</span>
        </div>
      </div>

      <StatsDataPublisherCard
        :doc="doc"
        :is-following="isFollowing"
        :can-follow="canFollow"
        @toggle-follow="$emit('toggle-follow')"
      />
    </div>
  </section>
</template>
