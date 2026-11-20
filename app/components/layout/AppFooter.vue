<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { getBrandFromPath } from '@/data/brands'
import { useAuthStore } from '@/stores/auth'
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsInput from '@/components/ds/DsInput.vue'
import DsLabel from '@/components/ds/DsLabel.vue'

/**
 * Pied de page (charte Tranches). Les liens restent ceux de la marque courante
 * (`footerNav`, compte, à propos) ; seule la présentation change.
 * La « lettre de la semaine » n'a pas encore de backend : le formulaire mène à
 * l'inscription, et le texte le dit.
 */
const auth = useAuthStore()
const router = useRouter()
const openCookieBanner = useCookieBanner()

const route = useRoute()
const currentBrand = computed(() => getBrandFromPath(route.path))
const year = new Date().getFullYear()

const statsioInvite = computed(() => {
  if (currentBrand.value.id === 'statsio') return null
  return currentBrand.value.switchMenu.find((brand) => brand.id === 'statsio') ?? null
})

const accountNav = computed(() => {
  if (auth.isAuthenticated) {
    return [
      { label: 'Mon profil', href: '/user' },
      { label: 'Mes contenus', href: '/user/contenus' },
      { label: 'Mes chaînes', href: '/user/chaines' },
      { label: 'Offres', href: '/offres' },
    ]
  }
  return [
    { label: 'Me connecter', href: '/login' },
    { label: "M'inscrire", href: '/register' },
    { label: 'Offres', href: '/offres' },
  ]
})

const aboutNav = [
  { label: 'Présentation Statsio', href: '/about' },
  { label: "Centre d'aide", href: '/aide' },
  { label: 'Contact', href: '/contact' },
]

const newsletterEmail = ref('')
const newsletterNote = ref('Bientôt disponible : créez un compte pour être prévenu du lancement.')
function onNewsletterSubmit() {
  if (auth.isAuthenticated) {
    newsletterNote.value = 'Merci ! La lettre arrive bientôt : vous serez prévenu sur votre compte.'
    return
  }
  void router.push('/register')
}
</script>

<template>
  <footer class="ds-scope ds-footer">
    <div v-if="statsioInvite" class="ds-max pt-10">
      <DsBox interactive>
        <RouterLink
          :to="statsioInvite.to"
          class="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-4">
            <img :src="statsioInvite.logo" :alt="statsioInvite.name" class="h-10 w-10 shrink-0" />
            <div>
              <DsLabel>{{ statsioInvite.eyebrow }}</DsLabel>
              <p class="ds-footer__strong mt-1 text-base font-bold">Retrouvez tout l'écosystème Statsio</p>
              <p class="ds-footer__muted text-sm">{{ statsioInvite.description }}</p>
            </div>
          </div>
          <span class="ds-footer__link inline-flex shrink-0 items-center gap-2 self-start text-sm font-bold sm:self-auto">
            Découvrir Statsio <span aria-hidden="true">→</span>
          </span>
        </RouterLink>
      </DsBox>
    </div>

    <div class="ds-max ds-footer__cols">
      <div class="flex flex-col gap-3">
        <RouterLink :to="currentBrand.to" class="flex items-center gap-2">
          <img :src="currentBrand.logo" :alt="currentBrand.logoAlt" class="h-[30px] w-[30px]" />
          <span :class="[currentBrand.wordmarkClass, 'text-[15px] font-extrabold uppercase tracking-[0.08em]']">
            {{ currentBrand.prefix }}<span :class="currentBrand.suffixClass">{{ currentBrand.suffix }}</span>
          </span>
        </RouterLink>
        <p class="ds-footer__muted max-w-[36ch] text-[14.5px]">{{ currentBrand.footerTagline }}</p>
      </div>

      <nav aria-label="Navigation du pied de page">
        <DsLabel as="h2" class="mb-3">Navigation</DsLabel>
        <ul class="ds-footer__list">
          <li v-for="item in currentBrand.footerNav" :key="item.label">
            <RouterLink :to="item.href">{{ item.label }}</RouterLink>
          </li>
        </ul>
      </nav>

      <nav aria-label="Mon compte">
        <DsLabel as="h2" class="mb-3">Mon compte</DsLabel>
        <ul class="ds-footer__list">
          <li v-for="item in accountNav" :key="item.label">
            <RouterLink :to="item.href">{{ item.label }}</RouterLink>
          </li>
        </ul>
      </nav>

      <nav aria-label="À propos">
        <DsLabel as="h2" class="mb-3">À propos</DsLabel>
        <ul class="ds-footer__list">
          <li v-for="item in aboutNav" :key="item.label">
            <RouterLink :to="item.href">{{ item.label }}</RouterLink>
          </li>
        </ul>
      </nav>

      <div>
        <DsLabel as="h2" class="mb-3">La lettre de la semaine</DsLabel>
        <p class="ds-footer__muted mb-2.5 text-sm">L'essentiel des données publiques, une fois par semaine.</p>
        <form class="flex gap-2" @submit.prevent="onNewsletterSubmit">
          <label for="ds-footer-mail" class="sr-only">Adresse e-mail</label>
          <DsInput
            id="ds-footer-mail"
            v-model="newsletterEmail"
            type="email"
            placeholder="votre@adresse.fr"
            autocomplete="email"
            class="min-w-0 flex-1"
          />
          <DsButton type="submit">OK</DsButton>
        </form>
        <p class="ds-footer__note mt-2" aria-live="polite">{{ newsletterNote }}</p>
      </div>
    </div>

    <div class="ds-max">
      <div class="ds-footer__legal">
        <span>© {{ year }} Statsio</span>
        <div class="flex flex-wrap gap-4">
          <RouterLink to="/politique-de-confidentialite">Politique de confidentialité</RouterLink>
          <RouterLink to="/mentions-legales">Mentions légales</RouterLink>
          <button type="button" class="ds-footer__link font-bold" @click="openCookieBanner = true">Gérer les cookies</button>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.ds-footer {
  border-top: 2px solid var(--ds-ol);
  background: var(--ds-bg);
  color: var(--ds-text);
  font-family: var(--ds-ui);
}
.ds-footer__cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 32px;
  padding-block: 44px 36px;
}
.ds-footer__cols > :first-child,
.ds-footer__cols > :last-child {
  grid-column: 1 / -1;
}
@media (min-width: 900px) {
  .ds-footer__cols {
    grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr)) minmax(0, 2fr);
  }
  .ds-footer__cols > :first-child,
  .ds-footer__cols > :last-child {
    grid-column: auto;
  }
}
.ds-footer__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 14.5px;
}
.ds-footer__list a:hover,
.ds-footer__legal a:hover {
  color: var(--ds-link);
}
.ds-footer__muted {
  color: var(--ds-muted);
}
.ds-footer__strong {
  color: var(--ds-text);
}
.ds-footer__link {
  color: var(--ds-link);
}
.ds-footer__note {
  color: var(--ds-faint);
  font: 400 12px/1.5 var(--ds-num);
}
.ds-footer__legal {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
  padding-block: 18px 28px;
  border-top: 2px solid var(--ds-divide);
  color: var(--ds-muted);
  font-size: 13px;
}
.ds-footer__legal button {
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}
.ds-footer a:focus-visible,
.ds-footer button:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 3px;
}
</style>
