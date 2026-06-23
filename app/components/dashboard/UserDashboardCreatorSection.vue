<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'

defineProps<{
  selectedMode: 'profile' | 'channel'
  actions: {
    id: 'profile' | 'channel'
    title: string
    detail: string
    cta: string
  }[]
}>()

const emit = defineEmits<{
  select: [mode: 'profile' | 'channel']
}>()
</script>

<template>
  <section class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_90px_-60px_rgba(59,130,246,0.4)] sm:p-7">
    <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div class="max-w-2xl">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Commencer à créer</p>
        <h2 class="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Active ta présence publique ou lance ta première chaîne.
        </h2>
        <p class="mt-3 text-base leading-7 text-slate-600">
          Le dashboard prépare déjà deux entrées créateurs distinctes pour éviter un parcours générique et poser une
          vraie direction produit.
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <AppButton
          v-for="action in actions"
          :key="action.id"
          :variant="selectedMode === action.id ? 'primary' : 'secondary'"
          size="md"
          @click="emit('select', action.id)"
        >
          {{ action.cta }}
        </AppButton>
      </div>
    </div>

    <div class="mt-6 grid gap-4 lg:grid-cols-2">
      <article
        v-for="action in actions"
        :key="action.id"
        class="rounded-[1.75rem] border p-5 transition"
        :class="
          selectedMode === action.id
            ? 'border-slate-950 bg-slate-950 text-white shadow-[0_24px_70px_-50px_rgba(15,23,42,0.65)]'
            : 'border-slate-200 bg-slate-50 text-slate-900'
        "
      >
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-4">
            <p class="text-lg font-semibold">{{ action.title }}</p>
            <span
              class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
              :class="selectedMode === action.id ? 'bg-white/10 text-slate-100' : 'bg-white text-slate-500'"
            >
              {{ selectedMode === action.id ? 'Sélectionné' : 'Option' }}
            </span>
          </div>
          <p class="text-sm leading-6" :class="selectedMode === action.id ? 'text-slate-300' : 'text-slate-600'">
            {{ action.detail }}
          </p>
        </div>
      </article>
    </div>
  </section>
</template>
