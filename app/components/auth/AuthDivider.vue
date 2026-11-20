<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: 'ou' })
</script>

<template>
  <div class="ds-divider" role="separator">
    <span>{{ label }}</span>
  </div>
</template>

<style scoped>
.ds-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--ds-muted);
  font: 500 11px/1 var(--ds-num);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.ds-divider::before,
.ds-divider::after {
  content: '';
  flex: 1;
  height: 2px;
  background: var(--ds-divide);
}
</style>
