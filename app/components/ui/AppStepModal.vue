<script setup lang="ts">
import { computed, ref, watch } from 'vue'

export interface ModalStep {
  id: string
  title: string
  description?: string
  canSkip?: boolean
}

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    steps: ModalStep[]
    currentStepId: string
    canGoNext?: boolean
    canGoPrevious?: boolean
    loading?: boolean
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    canGoNext: true,
    canGoPrevious: true,
    loading: false,
    size: 'lg',
  }
)

const emit = defineEmits<{
  'update:open': [boolean]
  'update:currentStepId': [string]
  'next': []
  'previous': []
  'close': []
  'submit': []
}>()

const currentStepIndex = computed(() =>
  props.steps.findIndex(s => s.id === props.currentStepId)
)

const currentStep = computed(() => props.steps[currentStepIndex.value])

const isFirstStep = computed(() => currentStepIndex.value === 0)
const isLastStep = computed(() => currentStepIndex.value === props.steps.length - 1)

const handleClose = () => {
  emit('update:open', false)
  emit('close')
}

const handlePrevious = () => {
  if (!props.canGoPrevious || isFirstStep.value) return
  const prevStep = props.steps[currentStepIndex.value - 1]
  if (prevStep) {
    emit('update:currentStepId', prevStep.id)
    emit('previous')
  }
}

const handleNext = () => {
  if (!props.canGoNext) return
  if (isLastStep.value) {
    emit('submit')
  } else {
    const nextStep = props.steps[currentStepIndex.value + 1]
    if (nextStep) {
      emit('update:currentStepId', nextStep.id)
      emit('next')
    }
  }
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="handleClose"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="open"
            class="flex max-h-[90vh] w-full flex-col rounded-2xl bg-white shadow-2xl"
            :class="sizeClasses[size]"
          >
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div class="flex-1">
                <h2 class="text-lg font-semibold text-slate-900">{{ title }}</h2>
                <p v-if="currentStep?.description" class="mt-1 text-sm text-slate-500">
                  {{ currentStep.description }}
                </p>
              </div>
              <button
                type="button"
                class="ml-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                @click="handleClose"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Steps indicator -->
            <div v-if="steps.length > 1" class="border-b border-slate-200 px-6 py-4">
              <div class="flex items-center justify-between">
                <div
                  v-for="(step, index) in steps"
                  :key="step.id"
                  class="flex flex-1 items-center"
                >
                  <div class="flex items-center">
                    <div
                      class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition"
                      :class="
                        index < currentStepIndex
                          ? 'bg-primary text-white'
                          : index === currentStepIndex
                          ? 'bg-primary text-white ring-4 ring-primary/20'
                          : 'bg-slate-200 text-slate-500'
                      "
                    >
                      <svg v-if="index < currentStepIndex" class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      <span v-else>{{ index + 1 }}</span>
                    </div>
                    <span
                      class="ml-2 text-sm font-medium transition"
                      :class="index === currentStepIndex ? 'text-slate-900' : 'text-slate-500'"
                    >
                      {{ step.title }}
                    </span>
                  </div>
                  <div
                    v-if="index < steps.length - 1"
                    class="mx-4 h-0.5 flex-1 transition"
                    :class="index < currentStepIndex ? 'bg-primary' : 'bg-slate-200'"
                  />
                </div>
              </div>
            </div>

            <!-- Content -->
            <div class="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <slot :step="currentStep" :step-index="currentStepIndex" />
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between border-t border-slate-200 px-6 py-4">
              <button
                v-if="!isFirstStep"
                type="button"
                class="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                :disabled="!canGoPrevious || loading"
                @click="handlePrevious"
              >
                Précédent
              </button>
              <div v-else />

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  @click="handleClose"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  class="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
                  :disabled="!canGoNext || loading"
                  @click="handleNext"
                >
                  <span v-if="loading" class="flex items-center gap-2">
                    <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Chargement...
                  </span>
                  <span v-else>{{ isLastStep ? 'Terminer' : 'Suivant' }}</span>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
