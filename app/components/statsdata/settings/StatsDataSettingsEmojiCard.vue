<script setup lang="ts">
import StatsDataSettingsCard from './StatsDataSettingsCard.vue'

const SUGGESTED_EMOJIS = [
  '📊', '📈', '📉', '🗺️', '💧', '🏥', '🎓', '💰',
  '🏠', '🚗', '🌍', '⚡', '🌾', '👥', '🏛️', '⚖️',
]

const emoji = defineModel<string | null>({ required: true })

function pick(value: string) {
  emoji.value = emoji.value === value ? null : value
}

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  // Keep only the first grapheme so the field always holds a single emoji/character.
  const first = [...value][0]
  emoji.value = first ?? null
}
</script>

<template>
  <StatsDataSettingsCard title="Emoji" description="Utilisé comme visuel par défaut du contenu, en l'absence de miniature.">
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#18181f]/10 bg-slate-50 text-2xl">
          {{ emoji || '·' }}
        </span>
        <input
          type="text"
          :value="emoji ?? ''"
          placeholder="Choisissez ou saisissez un emoji"
          maxlength="4"
          class="w-full rounded-[10px] border border-[#18181f]/[0.14] px-3.5 py-3 text-sm text-[#18181f] transition-colors focus:border-primary focus:outline-none"
          @input="onInput"
        />
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="e in SUGGESTED_EMOJIS"
          :key="e"
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-xl border text-lg transition hover:-translate-y-0.5"
          :class="emoji === e
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
            : 'border-slate-200 bg-white hover:border-[var(--color-primary)]/40'"
          :aria-pressed="emoji === e"
          @click="pick(e)"
        >
          {{ e }}
        </button>
      </div>
    </div>
  </StatsDataSettingsCard>
</template>
