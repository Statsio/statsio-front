<template>
  <kbd class="ds-kbd"><slot /></kbd>
</template>

<style scoped>
.ds-kbd {
  flex: none;
  padding: 2px 6px;
  border: 1.5px solid var(--ds-divide);
  border-radius: 3px;
  color: var(--ds-muted);
  font: 400 11px/1.3 var(--ds-num);
}
</style>
