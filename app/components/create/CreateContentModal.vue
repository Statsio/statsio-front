<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import DsButton from '@/components/ds/DsButton.vue'
import StudioModal from '@/components/studio/ui/StudioModal.vue'
import StepContentInfo from '@/components/create/steps/StepContentInfo.vue'
import StepReview from '@/components/create/steps/StepReview.vue'
import StepSurveyType from '@/components/create/steps/StepSurveyType.vue'
import StepSuccess from '@/components/create/steps/StepSuccess.vue'
import { useCreateContentWizard } from '@/composables/useCreateContentWizard'
import { useContentDomain } from '@/composables/useContentDomain'
import { createStudioContent } from '@/api/studio'
import type { StatsDataDocument } from '@/api/studio'
import { fetchContentCategories } from '@/api/content-categories'
import { getErrorMessage } from '@/lib/http-errors'
import { CONTENT_COVERAGE_OPTIONS, type ContentCategory, type ContentType } from '@/types/content-creation'
import { SUB_BRAND_OPTIONS, categoryMatchesDomain } from '@/types/sub-brand'

const TYPE_META: Record<ContentType, { label: string; placeholder: string; successTitle: string }> = {
  statsdata: {
    label: 'StatsData',
    placeholder: 'Ex. Le prix des carburants par station',
    successTitle: 'StatsData créé',
  },
  article: {
    label: 'Article',
    placeholder: 'Ex. Le pouvoir d’achat en 12 graphiques',
    successTitle: 'Article créé',
  },
  survey: {
    label: 'Sondage',
    placeholder: 'Ex. Le télétravail doit-il rester la norme ?',
    successTitle: 'Sondage créé',
  },
}

const props = defineProps<{ open: boolean; type: ContentType }>()
const emit = defineEmits<{ 'update:open': [boolean]; close: [] }>()

const meta = computed(() => TYPE_META[props.type])

const submitting = ref(false)
const submitError = ref('')
const createdDoc = ref<StatsDataDocument | null>(null)

const categoriesCatalog = ref<ContentCategory[]>([])
const categoriesLoading = ref(false)

const routeDomain = useContentDomain()

const {
  title, domain, categories, coverage,
  surveyKind, requiresIdentityVerification,
  steps, currentStepId, currentStepIndex, canGoNext,
  reset, buildPayload,
} = useCreateContentWizard(props.type, routeDomain.value)

const visibleCategories = computed(() =>
  categoriesCatalog.value.filter((c) => categoryMatchesDomain(c.sub_brand, domain.value)),
)

watch(domain, () => {
  const allowed = new Set(visibleCategories.value.map((c) => c.slug))
  categories.value = categories.value.filter((slug) => allowed.has(slug))
})

const domainLabel = computed(
  () => SUB_BRAND_OPTIONS.find((o) => o.value === domain.value)?.label ?? '—',
)

const stepCount = computed(() => steps.value.length)
const stepNumber = computed(() => currentStepIndex.value + 1)
const currentStep = computed(() => steps.value[currentStepIndex.value])
const isLastStep = computed(() => currentStepIndex.value === stepCount.value - 1)
const canGoBack = computed(() => currentStepIndex.value > 0)
const stepSubtitle = computed(() => `Étape ${stepNumber.value} / ${stepCount.value} — ${currentStep.value?.title ?? ''}`)

const coverageLabel = computed(
  () => CONTENT_COVERAGE_OPTIONS.find((o) => o.value === coverage.value)?.label ?? '—',
)

const categoryLabels = computed(() =>
  categories.value
    .map((slug) => categoriesCatalog.value.find((c) => c.slug === slug)?.name ?? slug)
    .join(', '),
)

const reviewRows = computed(() => {
  const rows: { label: string; value: string }[] = [
    { label: 'Titre', value: title.value.trim() || '—' },
    { label: 'Domaine', value: domainLabel.value },
    { label: 'Catégories', value: categoryLabels.value || 'Aucune' },
    { label: 'Couverture géographique', value: coverage.value ? coverageLabel.value : 'Non précisée' },
  ]
  if (props.type === 'survey') {
    const kindLabel = { single_question: 'Sondage rapide', long: 'Questionnaire', petition: 'Pétition' }[surveyKind.value]
    rows.push({ label: 'Format', value: kindLabel })
    rows.push({ label: "Vérification d'identité", value: requiresIdentityVerification.value ? 'Requise' : 'Non' })
  }
  return rows
})

watch(() => props.open, (v) => {
  if (v) {
    domain.value = routeDomain.value
    void loadCategories()
  } else {
    setTimeout(reset, 300)
    createdDoc.value = null
  }
})

onMounted(() => {
  if (props.open) void loadCategories()
})

async function loadCategories() {
  if (categoriesCatalog.value.length || categoriesLoading.value) return
  categoriesLoading.value = true
  try {
    categoriesCatalog.value = await fetchContentCategories()
  } finally {
    categoriesLoading.value = false
  }
}

function goNext() {
  if (!canGoNext.value) return
  if (isLastStep.value) return void handleSubmit()
  const next = steps.value[currentStepIndex.value + 1]
  if (next) currentStepId.value = next.id
}

function goBack() {
  const prev = steps.value[currentStepIndex.value - 1]
  if (prev) currentStepId.value = prev.id
}

async function handleSubmit() {
  submitting.value = true
  submitError.value = ''
  try {
    createdDoc.value = await createStudioContent(buildPayload(props.type))
  } catch (error) {
    submitError.value = getErrorMessage(error, 'Impossible de créer ce contenu pour le moment.')
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  emit('update:open', false)
  emit('close')
}

const studioPath = () =>
  createdDoc.value ? `/studio/${props.type}/${createdDoc.value.slug ?? createdDoc.value.id}` : '/studio'
</script>

<template>
  <StudioModal
    v-if="open"
    :title="createdDoc ? meta.successTitle : meta.label"
    :subtitle="createdDoc ? 'Brouillon enregistré.' : stepSubtitle"
    :theme="domain"
    :width="560"
    @close="handleClose"
  >
    <StepSuccess
      v-if="createdDoc"
      :content-type-label="meta.label"
      :studio-path="studioPath()"
      @close="handleClose"
    />

    <template v-else>
      <div class="mb-5 flex gap-1.5" aria-hidden="true">
        <span
          v-for="(s, i) in steps"
          :key="s.id"
          class="h-1.5 flex-1 rounded-[2px]"
          :class="i <= currentStepIndex ? 'bg-[var(--ds-ol)]' : 'bg-[var(--ds-divide)]'"
        />
      </div>

      <StepContentInfo
        v-if="currentStepId === 'info'"
        v-model:title="title"
        v-model:domain="domain"
        v-model:categories="categories"
        v-model:coverage="coverage"
        :placeholder="meta.placeholder"
        :categories-catalog="visibleCategories"
        :categories-loading="categoriesLoading"
      />
      <StepSurveyType
        v-else-if="currentStepId === 'survey'"
        :kind="surveyKind"
        :identity="requiresIdentityVerification"
        @update:kind="surveyKind = $event"
        @update:identity="requiresIdentityVerification = $event"
      />
      <StepReview v-else :rows="reviewRows" />

      <p
        v-if="submitError"
        class="mt-4 rounded-[3px] border-2 border-[var(--ds-warn-line)] bg-[var(--ds-warn-bg)] px-3 py-2 text-[12.5px] font-semibold text-[var(--ds-warn-ink)]"
      >
        {{ submitError }}
      </p>
    </template>

    <template v-if="!createdDoc" #footer>
      <button
        v-if="canGoBack"
        type="button"
        class="text-[13px] font-bold text-[var(--ds-faint)] hover:text-[var(--ds-text)]"
        @click="goBack"
      >
        Retour
      </button>
      <span v-else />
      <DsButton :disabled="!canGoNext || submitting" @click="goNext">
        {{ submitting ? 'Création…' : isLastStep ? 'Créer le contenu' : 'Continuer' }}
      </DsButton>
    </template>
  </StudioModal>
</template>
