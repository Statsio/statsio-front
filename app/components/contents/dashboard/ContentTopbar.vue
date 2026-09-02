<script setup lang="ts">
import { computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppWordmark from '@/components/ui/AppWordmark.vue'
import statsioLogo from '@/assets/brand/statsio-logo.svg'
import { useContentDashboard } from '@/composables/useContentDashboard'

const { content, statusMeta, isPublishing, publicPath, startPublish } = useContentDashboard()

const isPublished = computed(() => content.value?.status === 'published')
const publishLabel = computed(() => {
  if (isPublishing.value) return 'Publication…'
  return content.value?.first_published_at ? 'Mettre à jour' : 'Publier'
})

const saveDot = computed(() => (isPublished.value ? 'bg-emerald-500' : 'bg-amber-500'))
const saveText = computed(() =>
  isPublished.value ? `En ligne · ${statusMeta.value.label}` : 'Brouillon — non publié',
)
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
