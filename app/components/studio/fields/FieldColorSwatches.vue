<script setup lang="ts">
import StudioField from './StudioField.vue'

withDefaults(
  defineProps<{ label?: string; hint?: string; colors: readonly string[] }>(),
  { label: '', hint: '' },
)

const model = defineModel<string>({ required: true })
</script>

<template>
  <StudioField :label="label" :hint="hint">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="c in colors"
        :key="c"
        type="button"
        class="box-border h-[30px] w-[30px] rounded-[9px] border-[2.5px] transition-transform hover:scale-105"
        :style="{
          background: c === 'transparent' ? '#fff' : c,
          borderColor: model === c ? 'var(--studio-ink)' : 'var(--studio-line)',
        }"
        :aria-label="c"
        @click="model = c"
      />
    </div>
  </StudioField>
</template>
