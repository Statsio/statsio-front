<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import type { ContentVisibility, ContentPublishedAs } from '@/types/content-creation'
import { useMyChannels } from '@/composables/useMyChannels'
import AppSelect from '@/components/ui/AppSelect.vue'

const props = defineProps<{
  visibility: ContentVisibility
  publishedAs: ContentPublishedAs | undefined
  channelId: number | undefined
}>()

const emit = defineEmits<{
  'update:visibility': [ContentVisibility]
  'update:publishedAs': [ContentPublishedAs | undefined]
  'update:channelId': [number | undefined]
}>()

const { channels, loading: channelsLoading, fetch: fetchChannels } = useMyChannels()

watch(
  () => props.visibility,
  (v) => {
    if (v === 'public' && channels.value.length === 0) fetchChannels()
  },
)

onMounted(() => {
  if (props.visibility === 'public') fetchChannels()
})

const channelOptions = computed(() =>
  channels.value.map((c) => ({
    value: c.id as number,
    label: c.profile?.name ?? `Chaîne #${c.id}`,
  })),
)

function onChannelChange(v: string | number | boolean | null | (string | number | boolean | null)[]) {
  const id = Array.isArray(v) ? v[0] : v
  emit('update:channelId', id != null ? Number(id) : undefined)
}
</script>

<template>
  <div class="space-y-5 py-2">
    <!-- Visibility -->
    <div class="space-y-3">
      <p class="text-sm font-semibold text-slate-700">Visibilité</p>
      <div class="grid grid-cols-2 gap-3">
        <button
          type="button"
          class="flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5"
          :class="visibility === 'private'
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
            : 'border-slate-200 bg-white hover:border-[var(--color-primary)]/30'"
          @click="emit('update:visibility', 'private'); emit('update:publishedAs', undefined)"
        >
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <svg class="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </span>
          <span>
            <span class="block text-sm font-semibold" :class="visibility === 'private' ? 'text-[var(--color-primary)]' : 'text-slate-800'">Privé</span>
            <span class="block text-xs text-slate-500">Visible uniquement par vous</span>
          </span>
        </button>

        <button
          type="button"
          class="flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5"
          :class="visibility === 'public'
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
            : 'border-slate-200 bg-white hover:border-[var(--color-primary)]/30'"
          @click="emit('update:visibility', 'public'); fetchChannels()"
        >
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <svg class="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <span>
            <span class="block text-sm font-semibold" :class="visibility === 'public' ? 'text-[var(--color-primary)]' : 'text-slate-800'">Public</span>
            <span class="block text-xs text-slate-500">Accessible à tous les lecteurs</span>
          </span>
        </button>
      </div>
    </div>

    <!-- Published as (only when public) -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
    >
      <div v-if="visibility === 'public'" class="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p class="text-sm font-semibold text-slate-700">Publier en tant que</p>

        <div class="space-y-2.5">
          <!-- En mon nom -->
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition"
            :class="publishedAs === 'user'
              ? 'border-[var(--color-primary)] bg-white shadow-sm'
              : 'border-slate-200 bg-white hover:border-[var(--color-primary)]/40'"
            @click="emit('update:publishedAs', 'user'); emit('update:channelId', undefined)"
          >
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition"
              :class="publishedAs === 'user' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-slate-300'"
            >
              <span v-if="publishedAs === 'user'" class="h-2 w-2 rounded-full bg-white" />
            </span>
            <span>
              <span class="block text-sm font-semibold text-slate-800">En mon nom</span>
              <span class="block text-xs text-slate-500">Contenu lié à votre profil personnel</span>
            </span>
          </button>

          <!-- Avec une chaîne -->
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition"
            :class="publishedAs === 'channel'
              ? 'border-[var(--color-primary)] bg-white shadow-sm'
              : 'border-slate-200 bg-white hover:border-[var(--color-primary)]/40'"
            @click="emit('update:publishedAs', 'channel')"
          >
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition"
              :class="publishedAs === 'channel' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-slate-300'"
            >
              <span v-if="publishedAs === 'channel'" class="h-2 w-2 rounded-full bg-white" />
            </span>
            <span>
              <span class="block text-sm font-semibold text-slate-800">Avec une chaîne</span>
              <span class="block text-xs text-slate-500">Contenu lié à l'une de vos chaînes éditoriales</span>
            </span>
          </button>
        </div>

        <!-- Channel selector -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
        >
          <div v-if="publishedAs === 'channel'" class="space-y-3 pt-1">
            <div v-if="channelsLoading" class="flex items-center gap-2 text-sm text-slate-500">
              <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Chargement de vos chaînes…
            </div>

            <template v-else-if="channels.length > 0">
              <AppSelect
                :model-value="channelId ?? null"
                :options="channelOptions"
                placeholder="Choisir une chaîne…"
                @update:model-value="onChannelChange"
              />
            </template>

            <template v-else>
              <p class="text-sm text-slate-500">Vous n'avez pas encore de chaîne.</p>
              <NuxtLink
                to="/channels/create"
                class="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Créer une chaîne
              </NuxtLink>
            </template>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>
