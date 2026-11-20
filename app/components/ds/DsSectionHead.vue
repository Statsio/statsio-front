<script setup lang="ts">
import DsHeading from './DsHeading.vue'
import DsLabel from './DsLabel.vue'

/**
 * En-tête de section : étiquette mono, grand titre (slot `title`, accepte <em>),
 * description optionnelle et action alignée à droite (slot `action`).
 */
withDefaults(defineProps<{ label?: string; level?: 2 | 3; headingId?: string }>(), { level: 2 })
</script>

<template>
  <div class="ds-sechead">
    <div class="ds-sechead__main">
      <DsLabel v-if="label || $slots.label"><slot name="label">{{ label }}</slot></DsLabel>
      <DsHeading :id="headingId" :level="level" size="xl" class="ds-sechead__title">
        <slot name="title" />
      </DsHeading>
      <p v-if="$slots.default" class="ds-sechead__desc"><slot /></p>
    </div>
    <div v-if="$slots.action" class="ds-sechead__action"><slot name="action" /></div>
  </div>
</template>

<style scoped>
.ds-sechead {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
}
.ds-sechead__title {
  margin-top: 12px;
}
.ds-sechead__desc {
  max-width: 52ch;
  margin: 10px 0 0;
  color: var(--ds-muted);
  font-size: 16.5px;
  line-height: 1.6;
}
</style>
