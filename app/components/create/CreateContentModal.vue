<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import StepSurveyType from '@/components/create/steps/StepSurveyType.vue'
import StepSuccess from '@/components/create/steps/StepSuccess.vue'
import { useCreateContentWizard } from '@/composables/useCreateContentWizard'
import { createStudioContent } from '@/api/studio'
import type { StatsDataDocument } from '@/api/studio'
import { fetchContentCategories } from '@/api/content-categories'
import { CONTENT_COVERAGE_OPTIONS, type ContentCategory, type ContentType } from '@/types/content-creation'

const TYPE_META: Record<ContentType, { label: string; kicker: string; icon: string; iconBg: string; iconFg: string; placeholder: string; successTitle: string }> = {
  statsdata: {
    label: 'StatsData',
    kicker: 'Nouveau contenu',
    icon: '▥',
    iconBg: '#eaf1fe',
    iconFg: '#2563eb',
    placeholder: 'Ex. Le prix des carburants par station',
    successTitle: 'StatsData créé',
  },
  article: {
    label: 'Article',
    kicker: 'Nouveau contenu',
    icon: '▤',
    iconBg: '#fdeef1',
    iconFg: '#be123c',
    placeholder: 'Ex. Le pouvoir d’achat en 12 graphiques',
    successTitle: 'Article créé',
  },
  survey: {
    label: 'Sondage',
    kicker: 'Nouveau contenu',
    icon: '◐',
    iconBg: '#f2ecfd',
    iconFg: '#7c3aed',
    placeholder: 'Ex. Le télétravail doit-il rester la norme ?',
    successTitle: 'Sondage créé',
  },
}

const props = defineProps<{ open: boolean; type: ContentType }>()
const emit = defineEmits<{ 'update:open': [boolean]; close: [] }>()

const meta = computed(() => TYPE_META[props.type])

const submitting = ref(false)
const createdDoc = ref<StatsDataDocument | null>(null)

const categoriesCatalog = ref<ContentCategory[]>([])
const categoriesLoading = ref(false)

const {
  title, categories, coverage,
  surveyKind, requiresIdentityVerification,
  steps, currentStepId, currentStepIndex, canGoNext,
  reset, buildPayload,
} = useCreateContentWizard(props.type)

const stepCount = computed(() => steps.value.length)
const stepNumber = computed(() => currentStepIndex.value + 1)
const currentStep = computed(() => steps.value[currentStepIndex.value])
const isLastStep = computed(() => currentStepIndex.value === stepCount.value - 1)
const canGoBack = computed(() => currentStepIndex.value > 0)

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

function toggleCategory(slug: string) {
  const next = new Set(categories.value)
  next.has(slug) ? next.delete(slug) : next.add(slug)
  categories.value = [...next]
}

function selectCoverage(value: typeof coverage.value) {
  coverage.value = coverage.value === value ? null : value
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
  try {
    createdDoc.value = await createStudioContent(buildPayload(props.type))
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
  <!-- Success state -->
  <AppModal
    v-if="createdDoc"
    :open="open"
    :title="meta.successTitle"
    size="sm"
    @update:open="handleClose"
    @close="handleClose"
  >
    <StepSuccess :content-type-label="meta.label" :studio-path="studioPath()" @close="handleClose" />
  </AppModal>

  <!-- Wizard -->
  <Teleport v-else to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(20,16,30,0.55)] p-6"
        @click.self="handleClose"
      >
        <div class="flex max-h-[88vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_30px_70px_rgba(20,16,30,0.35)]">
          <!-- Header -->
          <div class="flex items-center gap-3 border-b border-[#14141e]/[0.08] px-[26px] py-[22px]">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[16px]"
              :style="{ background: meta.iconBg, color: meta.iconFg }"
            >{{ meta.icon }}</span>
            <span class="min-w-0 flex-1">
              <span class="block font-mono text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#18181f]/45">{{ meta.kicker }}</span>
              <span class="mt-0.5 block text-[17px] font-extrabold text-[#18181f]">{{ meta.label }}</span>
            </span>
            <button
              type="button"
              class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[14px] text-[#18181f]/50 transition-colors hover:bg-[#f4f3f8]"
              aria-label="Fermer"
              @click="handleClose"
            >✕</button>
          </div>

          <!-- Progress -->
          <div class="flex items-center gap-2 px-[26px] pt-[18px]">
            <span
              v-for="(s, i) in steps"
              :key="s.id"
              class="h-1 flex-1 rounded-[3px] transition-colors"
              :class="i <= currentStepIndex ? 'bg-[var(--color-primary)]' : 'bg-[#eeebf6]'"
            />
          </div>
          <div class="px-[26px] pb-1 pt-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#18181f]/45">
            Étape {{ stepNumber }} / {{ stepCount }} — {{ currentStep?.title }}
          </div>

          <!-- Body -->
          <div class="min-h-0 flex-1 overflow-y-auto px-[26px] py-[18px]">
            <!-- Step: info -->
            <div v-if="currentStepId === 'info'" class="flex flex-col gap-[18px]">
              <div>
                <div class="mb-2 text-[12.5px] font-bold text-[#18181f]">Nom du contenu</div>
                <input
                  v-model="title"
                  type="text"
                  :placeholder="meta.placeholder"
                  class="w-full rounded-[11px] border-[1.5px] border-[#14141e]/[0.12] px-3.5 py-3 text-[14px] font-semibold text-[#18181f] outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <div class="mb-2 text-[12.5px] font-bold text-[#18181f]">Catégories</div>
                <p v-if="categoriesLoading" class="text-[12px] text-[#18181f]/45">Chargement…</p>
                <div v-else class="flex flex-wrap gap-1.5">
                  <button
                    v-for="cat in categoriesCatalog"
                    :key="cat.slug"
                    type="button"
                    class="rounded-full border-[1.5px] px-[13px] py-[7px] text-[12.5px] font-bold transition-colors"
                    :class="categories.includes(cat.slug)
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                      : 'border-[#14141e]/[0.12] bg-white text-[#18181f]/70 hover:border-[var(--color-primary)]/40'"
                    @click="toggleCategory(cat.slug)"
                  >{{ cat.name }}</button>
                </div>
              </div>

              <div>
                <div class="mb-2 text-[12.5px] font-bold text-[#18181f]">Couverture géographique</div>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="opt in CONTENT_COVERAGE_OPTIONS"
                    :key="opt.value"
                    type="button"
                    class="rounded-full border-[1.5px] px-[13px] py-[7px] text-[12.5px] font-bold transition-colors"
                    :class="coverage === opt.value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                      : 'border-[#14141e]/[0.12] bg-white text-[#18181f]/70 hover:border-[var(--color-primary)]/40'"
                    @click="selectCoverage(opt.value)"
                  >{{ opt.label }}</button>
                </div>
              </div>
            </div>

            <!-- Step: survey -->
            <StepSurveyType
              v-else-if="currentStepId === 'survey'"
              :kind="surveyKind"
              :identity="requiresIdentityVerification"
              @update:kind="surveyKind = $event"
              @update:identity="requiresIdentityVerification = $event"
            />

            <!-- Step: review -->
            <div v-else class="flex flex-col gap-2.5">
              <div
                v-for="row in reviewRows"
                :key="row.label"
                class="flex items-baseline justify-between gap-3.5 rounded-[11px] bg-[#faf9fd] px-3.5 py-3"
              >
                <span class="text-[12px] font-bold text-[#18181f]/50">{{ row.label }}</span>
                <span class="text-right text-[13px] font-bold text-[#18181f]">{{ row.value }}</span>
              </div>
              <p class="pt-1 text-[12px] text-[#18181f]/50">
                Le contenu sera créé en brouillon. Vous le publierez depuis le Studio.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center gap-2.5 border-t border-[#14141e]/[0.08] px-[26px] py-[18px]">
            <button
              v-if="canGoBack"
              type="button"
              class="rounded-full border-[1.5px] border-[#14141e]/[0.12] px-5 py-3 text-[13px] font-bold text-[#18181f]/70 transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              @click="goBack"
            >Retour</button>
            <span class="flex-1" />
            <button
              type="button"
              class="rounded-full px-6 py-3 text-[13px] font-extrabold tracking-[0.02em] text-white transition-opacity disabled:opacity-40"
              :class="isLastStep
                ? 'bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))]'
                : 'bg-[#18181f]'"
              :disabled="!canGoNext || submitting"
              @click="goNext"
            >
              {{ submitting ? 'Création…' : isLastStep ? 'Créer le contenu →' : 'Continuer →' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
