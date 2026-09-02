<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { useMyChannels } from '@/composables/useMyChannels'

const props = defineProps<{
  /** 'author' = 1re publication (choix profil/chaîne), 'confirm' = re-publication. */
  mode: 'author' | 'confirm'
  nextVersion: number
  publishing: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: [{ publishedAs?: 'user' | 'channel'; channelId?: number | null }]
}>()

const { channels, loading: channelsLoading, fetch: fetchChannels } = useMyChannels()

const publishedAs = ref<'user' | 'channel'>('user')
const channelId = ref<number | null>(null)

onMounted(() => {
  if (props.mode === 'author') fetchChannels()
})

const channelOptions = computed(() =>
  channels.value.map((c) => ({ value: c.id as number, label: c.profile?.name ?? `Chaîne #${c.id}` })),
)

const invalid = computed(() => props.mode === 'author' && publishedAs.value === 'channel' && !channelId.value)

function onChannelChange(v: unknown) {
  const raw = Array.isArray(v) ? v[0] : v
  channelId.value = raw != null ? Number(raw) : null
}

function submit() {
  if (props.publishing || invalid.value) return
  emit('confirm', props.mode === 'author'
    ? { publishedAs: publishedAs.value, channelId: publishedAs.value === 'channel' ? channelId.value : null }
    : {})
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[130] flex items-center justify-center bg-[rgba(20,16,30,0.55)] p-6"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-[460px] overflow-hidden rounded-[18px] bg-white shadow-[0_30px_70px_rgba(20,16,30,0.35)]">
        <div class="flex items-center justify-between border-b border-[var(--studio-line)] px-6 py-[18px]">
          <span class="text-[15px] font-extrabold text-[var(--studio-ink)]">
            {{ mode === 'author' ? 'Publier ce contenu' : `Publier la version ${nextVersion}` }}
          </span>
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-full text-[13px] text-[var(--studio-muted)] hover:bg-[var(--studio-wash)]"
            aria-label="Fermer"
            @click="emit('close')"
          >✕</button>
        </div>

        <div class="px-6 py-5">
          <template v-if="mode === 'author'">
            <p class="mb-4 text-[12.5px] leading-relaxed text-[var(--studio-muted)]">
              Au nom de qui ce contenu paraît publiquement ? Ce choix est définitif — il pourra
              ensuite être modifié depuis les propriétés du contenu.
            </p>

            <div class="flex flex-col gap-2.5">
              <button
                type="button"
                class="flex items-center gap-3 rounded-xl border-[1.5px] px-4 py-3 text-left transition-colors"
                :class="publishedAs === 'user' ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)]' : 'border-[var(--studio-line-strong)] bg-white'"
                @click="publishedAs = 'user'; channelId = null"
              >
                <span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2" :class="publishedAs === 'user' ? 'border-[var(--color-primary)]' : 'border-[var(--studio-line-strong)]'">
                  <span v-if="publishedAs === 'user'" class="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                </span>
                <span>
                  <span class="block text-[13px] font-bold text-[var(--studio-ink)]">En mon nom</span>
                  <span class="mt-0.5 block text-[11.5px] text-[var(--studio-muted)]">Contenu lié à votre profil personnel.</span>
                </span>
              </button>

              <button
                type="button"
                class="flex items-center gap-3 rounded-xl border-[1.5px] px-4 py-3 text-left transition-colors"
                :class="publishedAs === 'channel' ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)]' : 'border-[var(--studio-line-strong)] bg-white'"
                @click="publishedAs = 'channel'"
              >
                <span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2" :class="publishedAs === 'channel' ? 'border-[var(--color-primary)]' : 'border-[var(--studio-line-strong)]'">
                  <span v-if="publishedAs === 'channel'" class="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                </span>
                <span>
                  <span class="block text-[13px] font-bold text-[var(--studio-ink)]">Avec une chaîne</span>
                  <span class="mt-0.5 block text-[11.5px] text-[var(--studio-muted)]">Contenu lié à l'une de vos chaînes éditoriales.</span>
                </span>
              </button>

              <div v-if="publishedAs === 'channel'" class="pt-1">
                <p v-if="channelsLoading" class="text-[12px] text-[var(--studio-muted)]">Chargement de vos chaînes…</p>
                <AppSelect
                  v-else-if="channelOptions.length"
                  :model-value="channelId ?? null"
                  :options="channelOptions"
                  placeholder="Choisir une chaîne…"
                  @update:model-value="onChannelChange"
                />
                <NuxtLink v-else to="/user/chaines?create=1" class="text-[12.5px] font-bold text-[var(--color-primary)]">
                  Créer une chaîne →
                </NuxtLink>
              </div>
            </div>
          </template>

          <p v-else class="text-[12.5px] leading-relaxed text-[var(--studio-muted)]">
            Les visiteurs verront vos dernières modifications enregistrées. La version en ligne
            actuelle reste consultable dans l'historique du contenu.
          </p>
        </div>

        <div class="flex items-center justify-end gap-2.5 border-t border-[var(--studio-line)] px-6 py-4">
          <button type="button" class="text-[13px] font-bold text-[var(--studio-faint)]" @click="emit('close')">Annuler</button>
          <button
            type="button"
            class="studio-gradient rounded-full px-5 py-2.5 text-[12.5px] font-extrabold tracking-[0.06em] text-white disabled:opacity-40"
            :disabled="publishing || invalid"
            @click="submit"
          >
            {{ publishing ? 'PUBLICATION…' : 'PUBLIER' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
