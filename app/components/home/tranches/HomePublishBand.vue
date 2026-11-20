<script setup lang="ts">
import { computed, ref } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsPie from '@/components/ds/DsPie.vue'
import { useAuthStore } from '@/stores/auth'
import type { HomeTranchesContent } from '@/data/brands/statsio/home-tranches'

/**
 * Bande « Publier » : trois étapes = trois tranches ; survoler une étape (ou sa
 * tranche) la détache. CTA vers le Studio (ou l'inscription si déconnecté).
 */
const props = defineProps<{ content: HomeTranchesContent['publish'] }>()
const auth = useAuthStore()

const active = ref<number | null>(null)
const COLORS = ['var(--ds-t1)', 'var(--ds-t2)', 'var(--ds-t3)']
const segments = computed(() => props.content.steps.map((label, i) => ({ value: 1, color: COLORS[i % 3]!, label })))
const ctaTo = computed(() => (auth.isAuthenticated ? '/studio' : '/register'))
</script>

<template>
  <section id="publier" class="ds-max pb" aria-labelledby="pb-title">
    <DsBox class="pb__box">
      <DsPie
        :segments="segments"
        :size="120"
        :selected="active"
        :detach="7"
        animate="view"
        interactive
        label="Les trois étapes"
        class="pb__pie"
        @hover="active = $event"
        @select="active = $event"
      />
      <div>
        <DsLabel>{{ content.label }}</DsLabel>
        <h2 id="pb-title" class="pb__title">{{ content.title }}</h2>
        <ol class="pb__steps">
          <li
            v-for="(step, i) in content.steps"
            :key="step"
            :class="{ 'is-on': active === i }"
            @pointerenter="active = i"
            @pointerleave="active = null"
          >
            <span>{{ i + 1 }}</span>{{ step }}
          </li>
        </ol>
      </div>
      <DsButton :to="ctaTo">{{ content.cta }} <span aria-hidden="true">→</span></DsButton>
    </DsBox>
  </section>
</template>

<style scoped>
.pb {
  padding-block: 80px;
}
.pb__box {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 22px;
  align-items: center;
  padding: 28px;
}
@media (min-width: 900px) {
  .pb__box {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 36px;
  }
}
.pb__pie {
  width: 120px;
}
.pb__title {
  margin: 10px 0 0;
  font: 800 clamp(28px, 3.4vw, 44px) / 1 var(--ds-display);
  font-stretch: 90%;
  text-wrap: balance;
}
.pb__steps {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}
.pb__steps li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 2px solid var(--ds-divide);
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.pb__steps li.is-on {
  border-color: var(--ds-ol);
  background: var(--ds-tint);
}
.pb__steps span {
  color: var(--ds-link);
  font: 500 11px var(--ds-num);
}
</style>
