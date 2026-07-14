<script setup lang="ts">
import StatsDataToggleButton from './StatsDataToggleButton.vue'
import StatsDataLinkButton from './StatsDataLinkButton.vue'

defineProps<{
  title: string
  description?: string | null
  isFavorite: boolean
  canEdit: boolean
  propertiesPath?: string | null
  studioPath?: string | null
}>()

defineEmits<{ 'toggle-favorite': [] }>()
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div class="flex min-w-0 max-w-3xl flex-col gap-3">
      <h1 class="text-3xl font-bold tracking-[-0.02em] text-[#18181f] sm:text-4xl lg:text-[2.75rem]">{{ title }}</h1>
      <p v-if="description" class="max-w-2xl text-[14.5px] leading-relaxed text-[#18181f]/60">{{ description }}</p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <template v-if="canEdit && propertiesPath && studioPath">
        <StatsDataLinkButton :to="propertiesPath">
          <template #icon>
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.213-1.281Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </template>
          Modifier les paramètres
        </StatsDataLinkButton>

        <StatsDataLinkButton :to="studioPath">
          <template #icon>
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </template>
          Modifier dans le studio
        </StatsDataLinkButton>
      </template>

      <StatsDataToggleButton
        v-if="!canEdit"
        :active="isFavorite"
        active-label="Favori"
        inactive-label="Favori"
        @toggle="$emit('toggle-favorite')"
      >
        <template #icon>
          <svg class="h-3.5 w-3.5" :fill="isFavorite ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.5a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0l-4.725 2.885a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557L2.04 10.386a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L10.48 3.5z" />
          </svg>
        </template>
      </StatsDataToggleButton>
    </div>
  </div>
</template>
