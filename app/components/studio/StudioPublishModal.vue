<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import DossierPicker from '@/components/studio/DossierPicker.vue'
import { useMyChannels } from '@/composables/useMyChannels'
import { useModalA11y } from '@/composables/useModalA11y'
import { useStudioStore } from '@/stores/studio'
import { useStudioMetaStore } from '@/stores/studio-meta'
import { studioChecks } from '@/lib/studio-checks'
import DsButton from '@/components/ds/DsButton.vue'
import StudioIcon from '@/components/studio/ui/StudioIcon.vue'

const props = defineProps<{
  /** 'author' = 1re publication (choix profil/chaîne), 'confirm' = re-publication. */
  mode: 'author' | 'confirm'
  nextVersion: number
  publishing: boolean
  /** slug ou id du contenu — pour charger dossiers & suggestions. */
  documentId: string
}>()

const emit = defineEmits<{
  close: []
  confirm: [{ publishedAs?: 'user' | 'channel'; channelId?: number | null; dossierIds: number[]; note?: string }]
}>()

const { channels, loading: channelsLoading, fetch: fetchChannels } = useMyChannels()

const publishedAs = ref<'user' | 'channel'>('user')
const channelId = ref<number | null>(null)
const dossierIds = ref<number[]>([])
const note = ref('')

const studio = useStudioStore()
const meta = useStudioMetaStore()
/** Points non remplis de la liste « Avant de publier » (jamais bloquants). */
const issues = computed(() =>
  studioChecks({
    type: studio.content?.type ?? 'statsdata',
    title: studio.content?.title,
    description: meta.doc?.description,
    hasCover: !!meta.doc?.thumbnail_url?.trim(),
    surveyKind: meta.doc?.survey_kind ?? studio.content?.survey_kind,
    blocks: studio.blocks,
  }).filter((c) => !c.ok),
)
const lockedAuthor = computed(() => {
  if (props.mode !== 'confirm') return null
  if (meta.doc?.published_as === 'channel') return meta.doc.channel?.name ?? 'votre chaîne'
  return meta.doc?.author?.name ?? 'votre profil'
})
const lockedIsChannel = computed(() => meta.doc?.published_as === 'channel')

const dialog = ref<HTMLElement | null>(null)
useModalA11y(dialog, () => emit('close'))
/** En mode 'author', étape 1 = choix auteur, étape 2 = dossier. */
const step = ref<1 | 2>(1)

onMounted(() => {
  if (props.mode === 'author') fetchChannels()
})

const channelOptions = computed(() =>
  channels.value.map((c) => ({ value: c.id as number, label: c.profile?.name ?? `Chaîne #${c.id}` })),
)

const authorInvalid = computed(
  () => props.mode === 'author' && publishedAs.value === 'channel' && !channelId.value,
)

const title = computed(() => {
  if (props.mode === 'confirm') return `Publier la version ${props.nextVersion}`
  return step.value === 1 ? 'Publier ce contenu' : 'Ranger dans un dossier'
})

function onChannelChange(v: unknown) {
  const raw = Array.isArray(v) ? v[0] : v
  channelId.value = raw != null ? Number(raw) : null
}

function next() {
  if (authorInvalid.value) return
  step.value = 2
}

function submit() {
  if (props.publishing) return
  if (props.mode === 'author') {
    if (authorInvalid.value) return
    emit('confirm', {
      publishedAs: publishedAs.value,
      channelId: publishedAs.value === 'channel' ? channelId.value : null,
      dossierIds: dossierIds.value,
      note: note.value,
    })
  } else {
    emit('confirm', { dossierIds: dossierIds.value, note: note.value })
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[130] flex items-center justify-center bg-[color-mix(in_srgb,var(--ds-text)_35%,transparent)] p-4"
      @click.self="emit('close')"
    >
      <div
        ref="dialog"
        class="flex max-h-[calc(100vh-32px)] w-full max-w-[560px] flex-col gap-4 overflow-auto rounded-[6px] border-2 border-[var(--ds-ol)] bg-[var(--ds-surface)] p-[22px] text-[var(--ds-text)] shadow-[6px_6px_0_var(--ds-sh)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pub-t"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <span class="st-lbl">Publier · version {{ nextVersion }}</span>
            <h2 id="pub-t" class="mt-2 text-[28px] font-extrabold leading-none [font-stretch:90%]" style="font-family: var(--ds-display)">
              {{ mode === 'author' && step === 2 ? 'Ranger dans un dossier' : (studio.content?.title || title) }}
            </h2>
          </div>
          <button type="button" class="st-ibtn" aria-label="Fermer" @click="emit('close')">
            <StudioIcon name="x" :size="16" />
          </button>
        </div>

        <!-- 1re publication — étape 1 : choix de l'auteur -->
        <template v-if="mode === 'author' && step === 1">
          <p class="st-hint">
            Au nom de qui ce contenu paraît-il ? Ce choix est verrouillé après la première publication.
          </p>
          <div class="st-pick">
            <button type="button" :aria-pressed="publishedAs === 'user'" @click="publishedAs = 'user'; channelId = null">
              <span class="st-tg"><StudioIcon name="pen" :size="16" /></span>
              <span>En mon nom<small class="st-meta block">Contenu lié à votre profil personnel</small></span>
            </button>
            <button type="button" :aria-pressed="publishedAs === 'channel'" @click="publishedAs = 'channel'">
              <span class="st-tg"><StudioIcon name="share" :size="16" /></span>
              <span>Avec une chaîne<small class="st-meta block">Contenu lié à l’une de vos chaînes</small></span>
            </button>
          </div>
          <div v-if="publishedAs === 'channel'">
            <p v-if="channelsLoading" class="st-hint">Chargement de vos chaînes…</p>
            <AppSelect
              v-else-if="channelOptions.length"
              :model-value="channelId ?? null"
              :options="channelOptions"
              placeholder="Choisir une chaîne…"
              @update:model-value="onChannelChange"
            />
            <NuxtLink v-else to="/user/chaines?create=1" class="st-addl">Créer une chaîne →</NuxtLink>
          </div>
        </template>

        <!-- Dossier + note (1re publication étape 2, ou republication) -->
        <template v-else>
          <div v-if="lockedAuthor" class="flex items-center gap-2.5 rounded-[4px] border-2 border-[var(--ds-divide)] px-3 py-2.5 text-[13.5px]">
            <StudioIcon name="lock" :size="18" />
            <span>Publié {{ lockedIsChannel ? 'sur la chaîne' : 'au nom de' }} <b>{{ lockedAuthor }}</b>. Choix verrouillé depuis la v1.</span>
          </div>

          <div class="flex flex-col gap-1.5">
            <span class="st-lbl">Dossier</span>
            <DossierPicker
              v-model="dossierIds"
              :document-id="documentId"
              :seed-from-current="mode === 'confirm'"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="st-lbl" for="pub-note">Note de version (visible dans l’historique)</label>
            <textarea id="pub-note" v-model="note" class="studio-input" rows="2" maxlength="500" placeholder="Ex. Ajout du camembert par département" />
          </div>

          <div v-if="issues.length" class="st-notice">
            <StudioIcon name="callout" :size="16" />
            <span>{{ issues.map((i) => i.label).join(' · ') }}. Vous pouvez publier quand même.</span>
          </div>
          <p v-else class="st-hint">Tout est prêt. La page publique affichera cette version dès la publication.</p>
        </template>

        <div class="flex flex-wrap items-center justify-end gap-2.5">
          <button v-if="mode === 'author' && step === 2" type="button" class="st-addl mr-auto" @click="step = 1">← Retour</button>
          <DsButton variant="secondary" size="sm" @click="emit('close')">Annuler</DsButton>
          <DsButton v-if="mode === 'author' && step === 1" size="sm" :disabled="authorInvalid" @click="next">
            Continuer <span aria-hidden="true">→</span>
          </DsButton>
          <DsButton v-else size="sm" :disabled="publishing || authorInvalid" @click="submit">
            {{ publishing ? 'Publication…' : `Publier la version ${nextVersion}` }}
          </DsButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
