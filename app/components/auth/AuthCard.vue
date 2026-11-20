<script setup lang="ts">
/** Carte de formulaire des écrans d'auth : surface Bold Outline (DsBox). */
</script>

<template>
  <DsBox class="ds-auth-card">
    <slot />
  </DsBox>
</template>

<style scoped>
.ds-auth-card {
  width: 100%;
  padding: 28px 22px;
}
@media (min-width: 640px) {
  .ds-auth-card {
    padding: 30px 32px;
  }
}
@media (min-width: 1024px) and (max-height: 860px) {
  .ds-auth-card {
    padding: 20px 28px;
  }
}
</style>
