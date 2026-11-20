<script setup lang="ts">
import statsioLogo from '@/assets/brand/statsio-logo.svg'

/**
 * Coquille des écrans d'authentification — charte « Tranches », Bold Outline.
 * Deux colonnes 50/50 (≥ lg) : panneau marque teinté (titre Anybody, chapô,
 * encart) et carte de formulaire (slot), qui tient dans l'écran sans défiler.
 * - sans `signals` : l'encart présente les avantages d'un compte gratuit (AuthBenefits) ;
 * - avec `signals` : liste de repères (parcours de récupération, vérification…).
 * `title` : segments `{ text, em? }`, les `em` prennent la couleur d'accent.
 */
withDefaults(
  defineProps<{
    title?: { text: string; em?: boolean }[]
    description?: string
    eyebrow?: string
    eyebrowAccent?: string
    signals?: { label: string; value: string; detail: string }[]
    formMaxWidth?: string
  }>(),
  {
    title: () => [{ text: 'Les chiffres qui ' }, { text: 'racontent', em: true }, { text: ' le monde.' }],
    description:
      "Articles, données ouvertes et sondages sur l'économie, la santé, l'environnement et la société, mis à jour chaque jour.",
    eyebrow: 'Statsio',
    eyebrowAccent: 'données publiques',
    signals: () => [],
    formMaxWidth: '600px',
  },
)

const year = new Date().getFullYear()
</script>

<template>
  <main class="ds-scope ds-auth">
    <!-- Panneau marque — masqué en petit écran -->
    <aside class="ds-auth__brand" aria-label="Statsio">
      <div class="ds-auth__brand-top">
        <NuxtLink to="/" class="ds-auth__logo" aria-label="Statsio, accueil">
          <img :src="statsioLogo" alt="" width="32" height="32" />
          <span class="ds-auth__wm"><span class="st">STAT</span><span class="sio">SIO</span></span>
        </NuxtLink>
        <NuxtLink to="/" class="ds-auth__back"><span aria-hidden="true">←</span> Retour à l'accueil</NuxtLink>
      </div>

      <div class="ds-auth__pitch">
        <DsLabel>{{ eyebrow }}<template v-if="eyebrowAccent"> · <b>{{ eyebrowAccent }}</b></template></DsLabel>
        <DsHeading :level="2" size="xl" class="ds-auth__title">
          <DsRichTitle :parts="title" />
        </DsHeading>
        <p class="ds-auth__lede">{{ description }}</p>

        <ul v-if="signals.length" class="ds-auth__signals">
          <li v-for="(signal, i) in signals" :key="signal.label">
            <DsBox shadow="sm" class="ds-auth__signal">
              <span class="ds-auth__signal-n" aria-hidden="true">{{ i + 1 }}</span>
              <span class="min-w-0">
                <DsLabel>{{ signal.label }}</DsLabel>
                <b>{{ signal.value }}</b>
                <span class="ds-auth__signal-d">{{ signal.detail }}</span>
              </span>
            </DsBox>
          </li>
        </ul>
        <AuthBenefits v-else />
      </div>

      <DsMeta>© {{ year }} Statsio · la plateforme française des statistiques expliquées</DsMeta>
    </aside>

    <!-- Formulaire -->
    <section class="ds-auth__main">
      <div class="ds-auth__mobile-top">
        <NuxtLink to="/" class="ds-auth__logo" aria-label="Statsio, accueil">
          <img :src="statsioLogo" alt="" width="28" height="28" />
          <span class="ds-auth__wm"><span class="st">STAT</span><span class="sio">SIO</span></span>
        </NuxtLink>
        <NuxtLink to="/" class="ds-auth__back"><span aria-hidden="true">←</span> Accueil</NuxtLink>
      </div>

      <div class="ds-auth__center">
        <div class="w-full" :style="{ maxWidth: formMaxWidth }">
          <slot />
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.ds-auth {
  display: flex;
  width: 100%;
  height: 100%;
  background: var(--ds-bg);
  color: var(--ds-text);
  font-family: var(--ds-ui);
}

/* ─── Panneau marque ─── */
.ds-auth__brand {
  display: none;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  padding: 24px clamp(32px, 4vw, 64px);
  overflow-y: auto;
  background: var(--ds-tint);
  border-right: 2px solid var(--ds-ol);
}
@media (min-width: 1024px) {
  .ds-auth__brand {
    display: flex;
  }
}
.ds-auth__brand-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.ds-auth__logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 3px;
}
.ds-auth__wm {
  font: 800 15px/1 var(--ds-ui);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.ds-auth__wm .st {
  color: var(--ds-violet-500);
}
.ds-auth__wm .sio {
  color: var(--ds-blue-500);
}
.ds-auth__back {
  color: var(--ds-link);
  font-size: 14px;
  font-weight: 700;
}
.ds-auth__back:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.ds-auth__pitch {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 560px;
}
.ds-auth__title {
  margin-top: 2px;
}
.ds-auth__lede {
  margin: 0 0 12px;
  max-width: 48ch;
  color: var(--ds-muted);
  font-size: 17px;
  line-height: 1.55;
}

.ds-auth__signals {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.ds-auth__signal {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
}
.ds-auth__signal-n {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px solid var(--ds-ol);
  border-radius: 50%;
  color: var(--ds-link);
  font: 500 14px var(--ds-num);
}
.ds-auth__signal b {
  display: block;
  margin-top: 4px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
}
.ds-auth__signal-d {
  display: block;
  color: var(--ds-muted);
  font-size: 14px;
  line-height: 1.4;
}

/* ─── Zone formulaire ─── */
.ds-auth__main {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}
@media (min-width: 1024px) {
  /* 50/50. Le formulaire est dimensionné pour tenir sans défiler (cf. règles
     « max-height » des cartes) ; overflow auto reste un filet sur très petit écran. */
  .ds-auth__main {
    flex: 1;
  }
}
.ds-auth__mobile-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 60px;
  padding: 0 16px;
  border-bottom: 2px solid var(--ds-ol);
  background: var(--ds-bg);
}
@media (min-width: 1024px) {
  .ds-auth__mobile-top {
    display: none;
  }
}
.ds-auth__center {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 32px 16px 40px;
}
@media (min-width: 640px) {
  .ds-auth__center {
    padding: 40px;
  }
}
@media (min-width: 1024px) {
  .ds-auth__center {
    padding: 20px clamp(32px, 4vw, 64px);
  }
}
</style>

<!-- Classes partagées par les cartes de formulaire (AuthCard et ses enfants). -->
<style>
.ds-auth-link {
  color: var(--ds-link);
  font-weight: 700;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
}
.ds-auth-link:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}
.ds-auth-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  text-decoration: none;
}
.ds-auth-muted {
  color: var(--ds-muted);
}
.ds-auth-foot {
  margin: 0;
  padding-top: 18px;
  border-top: 2px solid var(--ds-divide);
  color: var(--ds-muted);
  font-size: 14.5px;
  text-align: center;
}
.ds-auth-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: 20px;
  border: 2px solid var(--ds-ol);
  border-radius: 50%;
  background: var(--ds-tint);
  color: var(--ds-link);
  box-shadow: 3px 3px 0 var(--ds-sh);
}
.ds-auth-icon--danger {
  border-color: #be123c;
  background: #fff1f2;
  color: #be123c;
  box-shadow: 3px 3px 0 #fda4af;
}
:root[data-color-scheme='dark'] .ds-auth-icon--danger {
  border-color: #fb7185;
  background: #2a1011;
  color: #fda4af;
  box-shadow: 3px 3px 0 #881337;
}
</style>
