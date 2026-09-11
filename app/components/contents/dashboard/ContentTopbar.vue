<script setup lang="ts">
import { computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppWordmark from '@/components/ui/AppWordmark.vue'
import statsioLogo from '@/assets/brand/statsio-logo.svg'
import { useContentDashboard } from '@/composables/useContentDashboard'
import { formatShortDate } from '@/lib/format'

const { content, statusMeta, isPublishing, publicPath, hasFutureSchedule, startPublish } =
  useContentDashboard()

const isPublished = computed(() => content.value?.status === 'published')
const isScheduled = computed(() => content.value?.status === 'scheduled')

const publishLabel = computed(() => {
  if (isPublishing.value) return 'Publication…'
  if (isScheduled.value) return 'Publier maintenant'
  if (hasFutureSchedule.value && !content.value?.first_published_at) return 'Programmer'
  return content.value?.first_published_at ? 'Mettre à jour' : 'Publier'
})

const saveDot = computed(() => {
  if (isPublished.value) return 'bg-emerald-500'
  if (isScheduled.value) return 'bg-blue-500'
  return 'bg-amber-500'
})

const saveText = computed(() => {
  if (isPublished.value) return `En ligne · ${statusMeta.value.label}`
  if (isScheduled.value) {
    const when = formatShortDate(content.value?.scheduled_publish_at)
    return when ? `Programmé · ${when}` : 'Programmé — non publié'
  }
  return 'Brouillon — non publié'
})
</script>

<template>
  <div class="flex min-w-0 flex-1 items-center gap-3">
    <NuxtLink to="/" title="Retour au site Statsio" class="group flex shrink-0 items-center gap-2">
      <span
        class="flex h-8 w-8 items-center justify-center rounded-[9px] border-[1.5px] border-slate-200 text-[14px] text-slate-400 transition group-hover:border-primary/40 group-hover:text-primary"
      >
        ←
      </span>
      <img
        :src="statsioLogo"
        alt=""
        class="hidden h-[26px] w-[26px] rounded-[8px] bg-white p-0.5 sm:block"
      />
      <AppWordmark as="span" class="!hidden !text-[15px] md:!inline" />
    </NuxtLink>

    <span class="hidden h-[26px] w-px bg-slate-200 sm:block" />

    <!-- Fil d'ariane -->
    <div class="flex min-w-0 items-center gap-2 text-[12.5px] text-slate-500">
      <NuxtLink
        to="/user/contenus"
        class="font-semibold text-slate-500 transition hover:text-primary"
      >
        Mes contenus
      </NuxtLink>
      <span>/</span>
      <span class="truncate font-bold text-slate-950">{{ content?.title }}</span>
    </div>

    <div class="ml-auto flex shrink-0 items-center gap-3">
      <span class="hidden items-center gap-2 text-[12px] font-medium text-slate-500 sm:flex">
        <span class="h-[7px] w-[7px] shrink-0 rounded-full" :class="saveDot" />
        {{ saveText }}
      </span>
      <AppButton
        v-if="isPublished && publicPath"
        as="router-link"
        :to="publicPath"
        variant="secondary"
        size="md"
      >
        Voir en ligne
      </AppButton>
      <AppButton
        v-else
        variant="gradient"
        size="md"
        :disabled="isPublishing"
        @click="startPublish"
      >
        {{ publishLabel }}
      </AppButton>
    </div>
  </div>
</template>
