<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'À propos',
  description:
    'Découvrez Statsio, la plateforme de data journalism qui centralise analyses, sources et signaux pour créer des contenus à fort impact.',
})

import { RouterLink } from 'vue-router'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'

const stats = [
  { value: '2 481', label: 'Datasets publiés' },
  { value: '640', label: 'Articles data' },
  { value: '186k', label: 'Lecteurs mensuels' },
  { value: '2019', label: 'Année de création' },
]

const readerPoints = [
  'Graphiques et cartes filtrables en direct',
  'Sources vérifiées, mises à jour automatiquement',
  'Sondages aux résultats en temps réel',
]

const creatorPoints = [
  'Import CSV, Excel ou connexion API',
  'Blocs interactifs à glisser dans vos articles',
  'Abonnements et revenus liés à votre chaîne',
]

const values = [
  {
    title: 'StatsData',
    tag: 'Pour explorer',
    desc: "Des espaces dédiés à l'exploration de données brutes issues de fichiers CSV, Excel ou d'API — sans écrire une ligne de code pour les lire.",
    color: 'var(--color-primary)',
    shape: 'rounded-[4px]',
  },
  {
    title: 'Articles',
    tag: 'Pour publier',
    desc: 'Des contenus rédactionnels enrichis de blocs interactifs — graphiques, tableaux, cartes — connectés à des sources de données vivantes.',
    color: 'var(--color-accent)',
    shape: 'rounded-full',
  },
  {
    title: 'Sondages',
    tag: 'Pour engager',
    desc: 'Des enquêtes interactives dont les résultats s’affichent en temps réel, avec des croisements possibles par profil de lecteur.',
    color: 'var(--color-error)',
    shape: 'rounded-[2px]',
  },
]

const milestones = [
  {
    year: '2019',
    title: "Un projet d'école",
    desc: "Statsio naît d'un projet universitaire porté par une bande d'étudiants convaincus que la donnée publique mérite mieux qu'un tableau Excel.",
  },
  {
    year: '2021',
    title: 'Du prototype à la plateforme',
    desc: 'Le projet étudiant devient un produit : premiers créateurs, premières chaînes, premiers lecteurs.',
  },
  {
    year: '2023',
    title: 'Ouverture aux chaînes partenaires',
    desc: 'TVStats et Medistats rejoignent la plateforme comme premières chaînes verticales.',
  },
  {
    year: '2026',
    title: '2 500 datasets et 180k lecteurs',
    desc: 'Statsio devient une référence pour comprendre les statistiques publiques françaises.',
  },
]

const moreCards = [
  {
    title: "Centre d'aide",
    desc: 'Guides pas à pas pour lancer votre première StatsData ou votre premier article.',
    cta: null,
    color: 'var(--color-primary)',
    shape: 'rounded-[4px]',
  },
  {
    title: 'Devenir créateur',
    desc: 'Créez votre chaîne et publiez votre premier contenu en quelques minutes.',
    cta: { label: 'Créer ma chaîne', to: '/register' },
    color: 'var(--color-accent)',
    shape: 'rounded-full',
  },
  {
    title: 'Presse & médias',
    desc: "Communiqués, chiffres clés et demandes d'interview.",
    cta: null,
    color: '#e11d48',
    shape: 'rounded-[2px]',
  },
]
</script>

<template>
  <main class="pb-4">
    <!--
      -mt-44 lg:-mt-28 cancels the layout's <main class="pt-44 lg:pt-28"> (app/layouts/default.vue)
      so the wash bleeds all the way under the translucent fixed header, matching the pattern used by
      PageHero.vue. The real content offset comes back via pt-44 lg:pt-40 on the hero container below.

      The lavender wash spans the hero AND the quote card (not just the hero) and fades out with an
      eased multi-stop gradient (opacity roughly halving at each stop) rather than a plain two-stop
      linear fade — a straight alpha fade looks like it "cuts off" near the transparent end because the
      eye is far more sensitive to contrast at low opacity. overflow-x-hidden (not overflow-hidden)
      keeps the wide blurred orbs from causing horizontal scroll without vertically clipping the wash,
      which is taller than the hero's own flow height on purpose so the fade completes gradually.
    -->
    <div class="relative -mt-44 overflow-x-hidden lg:-mt-28">
      <div
        class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1100px]"
        style="
          background: linear-gradient(
            180deg,
            #f7f3fe 0%,
            rgba(247, 243, 254, 0.82) 18%,
            rgba(247, 243, 254, 0.52) 36%,
            rgba(247, 243, 254, 0.28) 52%,
            rgba(247, 243, 254, 0.12) 68%,
            rgba(247, 243, 254, 0.04) 84%,
            rgba(247, 243, 254, 0) 100%
          );
        "
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -right-24 top-24 -z-10 h-[420px] w-[420px] rounded-full bg-[var(--color-primary)]/[0.12] blur-3xl"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -left-20 top-[420px] -z-10 h-[360px] w-[360px] rounded-full bg-[var(--color-accent)]/[0.1] blur-3xl"
        aria-hidden="true"
      />

      <!-- Hero -->
      <section class="relative">
        <div class="container flex flex-col items-center gap-6 pb-16 pt-44 text-center lg:pb-20 lg:pt-40">
          <AppBadge variant="soft-primary" mono>Né d'un projet étudiant</AppBadge>
          <h1 class="max-w-3xl text-4xl font-bold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl">
            Rapprocher l'écriture et la donnée
          </h1>
          <p class="max-w-2xl text-lg leading-relaxed text-slate-500">
            Statsio est né sur les bancs de l'école, d'un constat simple : les données existent, mais
            elles restent coincées dans des fichiers CSV et des graphiques figés. Nous construisons une
            plateforme collaborative pour créer, consulter et monétiser des contenus vraiment connectés à
            la donnée.
          </p>
        </div>
      </section>

      <!-- Citation fondateurs -->
      <section class="relative pb-20 lg:pb-24">
        <div class="container max-w-3xl">
          <div
            class="card-xl flex flex-col items-center gap-6 p-8 text-center sm:flex-row sm:text-left sm:p-11"
          >
            <AppAvatar initials="SC" size="lg" alt="Les cofondateurs de Statsio" />
            <div class="flex flex-col gap-2.5">
              <p class="text-[17px] font-semibold leading-relaxed text-slate-900">
                « On a commencé par un mémoire de fin d'études sur l'open data. En six mois, on avait un
                prototype&nbsp;; en deux ans, une équipe. Statsio, c'est la conviction qu'une donnée bien
                racontée change une conversation. »
              </p>
              <span class="text-[13.5px] font-semibold text-slate-500">Les cofondateurs de Statsio</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Stats clés -->
    <section class="section !pt-0">
      <div class="container">
        <div class="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <div v-for="stat in stats" :key="stat.label" class="card flex flex-col gap-1.5 p-6">
            <span class="mono text-3xl font-bold text-slate-900">{{ stat.value }}</span>
            <span class="text-[13.5px] font-semibold text-slate-500">{{ stat.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Le problème -->
    <section class="section">
      <div class="container grid items-center gap-12 lg:grid-cols-2">
        <div
          class="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50"
          aria-hidden="true"
        >
          <div
            class="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[var(--color-primary)]/[0.14] blur-2xl"
          />
          <div
            class="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[var(--color-accent)]/[0.12] blur-2xl"
          />
          <div
            class="absolute inset-0"
            style="
              background-image: radial-gradient(circle, rgba(139, 92, 246, 0.14) 1px, transparent 1px);
              background-size: 24px 24px;
            "
          />
        </div>
        <div class="flex flex-col gap-4">
          <p class="eyebrow">Le problème</p>
          <h2 class="text-3xl font-bold leading-tight text-slate-900">
            Des données ouvertes, mais inexploitables pour le grand public
          </h2>
          <p class="text-[15.5px] leading-relaxed text-slate-500">
            De nombreux articles et études s'appuient sur des chiffres, mais les présentent en images ou en
            tableaux figés, obsolètes dès leur publication. À côté, l'open data s'est démocratisé — sans
            devenir plus accessible : fichiers CSV et Excel volumineux, API qui exigent des compétences
            techniques.
          </p>
          <p class="text-[15.5px] leading-relaxed text-slate-500">
            Résultat : des données disponibles, mais rarement transformées en contenus clairs, interactifs
            et compréhensibles par tous.
          </p>
        </div>
      </div>
    </section>

    <!-- Notre réponse -->
    <section class="section !pt-0">
      <div class="container flex flex-col items-center gap-4 text-center">
        <p class="eyebrow">Notre réponse</p>
        <h2 class="max-w-2xl text-3xl font-bold text-slate-900">
          Une plateforme où créateurs et lecteurs se rejoignent autour de la donnée
        </h2>
        <p class="max-w-2xl text-[15.5px] leading-relaxed text-slate-500">
          D'un côté, les créateurs publient des contenus de fond. De l'autre, les lecteurs interagissent
          avec des visualisations dynamiques, connectées à des sources de données actualisées en continu.
        </p>
      </div>
    </section>

    <!-- Pour les lecteurs -->
    <section class="section !pt-0">
      <div class="container grid items-center gap-12 lg:grid-cols-2">
        <div class="flex flex-col gap-4">
          <p class="eyebrow">Pour les lecteurs</p>
          <h2 class="text-[1.9rem] font-bold leading-tight text-slate-900">
            Comprenez les chiffres en quelques secondes, pas en heures de recherche
          </h2>
          <p class="text-[15.5px] leading-relaxed text-slate-500">
            Fini les captures d'écran de tableurs. Chaque contenu Statsio se lit, se filtre et se croise
            directement dans la page : changez de région, de période ou de critère et le récit s'actualise
            sous vos yeux.
          </p>
          <ul class="mt-2 flex flex-col gap-2.5">
            <li v-for="point in readerPoints" :key="point" class="flex items-center gap-2.5">
              <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" aria-hidden="true" />
              <span class="text-sm font-semibold text-slate-700">{{ point }}</span>
            </li>
          </ul>
        </div>
        <div
          class="relative order-first aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 lg:order-last"
          aria-hidden="true"
        >
          <div
            class="absolute -left-12 -top-12 h-60 w-60 rounded-full bg-[var(--color-accent)]/[0.14] blur-2xl"
          />
          <div
            class="absolute inset-0"
            style="
              background-image: radial-gradient(circle, rgba(59, 130, 246, 0.14) 1px, transparent 1px);
              background-size: 24px 24px;
            "
          />
        </div>
      </div>
    </section>

    <!-- Pour les créateurs -->
    <section class="section !pt-0">
      <div class="container grid items-center gap-12 lg:grid-cols-2">
        <div
          class="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50"
          aria-hidden="true"
        >
          <div
            class="absolute -bottom-14 -right-10 h-60 w-60 rounded-full bg-[var(--color-primary)]/[0.14] blur-2xl"
          />
          <div
            class="absolute inset-0"
            style="
              background-image: radial-gradient(circle, rgba(139, 92, 246, 0.14) 1px, transparent 1px);
              background-size: 24px 24px;
            "
          />
        </div>
        <div class="flex flex-col gap-4">
          <p class="eyebrow">Pour les créateurs</p>
          <h2 class="text-[1.9rem] font-bold leading-tight text-slate-900">
            Créez une chaîne, publiez sans coder, monétisez votre audience
          </h2>
          <p class="text-[15.5px] leading-relaxed text-slate-500">
            Importez un CSV ou branchez une API, glissez un bloc de visualisation dans votre article, lancez
            un sondage — le tout depuis un seul studio. Votre chaîne rassemble vos contenus, vos abonnés et
            vos revenus.
          </p>
          <ul class="mt-2 flex flex-col gap-2.5">
            <li v-for="point in creatorPoints" :key="point" class="flex items-center gap-2.5">
              <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" aria-hidden="true" />
              <span class="text-sm font-semibold text-slate-700">{{ point }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Ce que vous pouvez faire sur Statsio -->
    <section class="bg-slate-950 py-24">
      <div class="container">
        <div class="mb-14 flex flex-col items-center gap-3 text-center">
          <p class="text-[12px] font-bold uppercase tracking-[0.06em] text-white/45">Trois fonctionnalités</p>
          <h2 class="text-3xl font-bold text-white">Ce que vous pouvez faire sur Statsio</h2>
        </div>
        <div class="grid gap-6 sm:grid-cols-3">
          <div
            v-for="value in values"
            :key="value.title"
            class="flex flex-col gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <div
              class="flex h-[42px] w-[42px] items-center justify-center rounded-[11px]"
              :style="{ background: value.color }"
            >
              <div class="h-3.5 w-3.5 bg-white" :class="value.shape" />
            </div>
            <div class="text-[16.5px] font-bold text-white">{{ value.title }}</div>
            <div class="text-sm leading-relaxed text-white/60">{{ value.desc }}</div>
            <div class="mt-0.5 text-[12.5px] font-semibold" :style="{ color: value.color }">
              {{ value.tag }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Notre parcours -->
    <section class="section">
      <div class="container max-w-3xl">
        <div class="mb-14 flex flex-col items-center gap-3 text-center">
          <p class="eyebrow">Notre parcours</p>
          <h2 class="text-3xl font-bold text-slate-900">De l'idée à la référence data</h2>
        </div>
        <div class="flex flex-col">
          <div v-for="(milestone, i) in milestones" :key="milestone.year" class="grid grid-cols-[70px_1fr] gap-6">
            <div class="flex flex-col items-center">
              <span class="mt-1 h-3 w-3 shrink-0 rounded-full bg-[var(--color-primary)]" />
              <span
                v-if="i < milestones.length - 1"
                class="w-0.5 flex-1 bg-slate-200"
              />
            </div>
            <div class="pb-9">
              <span class="mono text-[13px] font-bold text-[var(--color-primary)]">{{ milestone.year }}</span>
              <div class="my-1.5 text-[17px] font-bold text-slate-900">{{ milestone.title }}</div>
              <div class="text-sm leading-relaxed text-slate-500">{{ milestone.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- En savoir plus -->
    <section class="section !pt-0">
      <div class="container">
        <h2 class="mb-11 text-center text-[28px] font-bold text-slate-900">En savoir plus sur Statsio</h2>
        <div class="grid gap-5 sm:grid-cols-3">
          <div v-for="card in moreCards" :key="card.title" class="card flex flex-col gap-3 p-6">
            <div
              class="flex h-[38px] w-[38px] items-center justify-center rounded-[10px]"
              :style="{ background: card.color }"
            >
              <div class="h-3 w-3 bg-white" :class="card.shape" />
            </div>
            <div class="text-[15.5px] font-bold text-slate-900">{{ card.title }}</div>
            <div class="text-[13.5px] leading-relaxed text-slate-500">{{ card.desc }}</div>
            <RouterLink
              v-if="card.cta"
              :to="card.cta.to"
              class="mt-1 text-[13.5px] font-bold text-[var(--color-primary)] transition-opacity hover:opacity-70"
            >
              {{ card.cta.label }} →
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA final -->
    <section class="section !pt-0">
      <div class="container">
        <div
          class="flex flex-wrap items-center justify-between gap-8 rounded-[1.75rem] p-10 sm:p-14"
          style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent))"
        >
          <div class="flex max-w-lg flex-col gap-2">
            <h3 class="text-2xl font-bold text-white sm:text-[26px]">
              Et si votre prochain contenu vivait sur Statsio ?
            </h3>
            <p class="text-[14.5px] leading-relaxed text-white/85">
              Créez votre chaîne, publiez vos premières StatsData, articles ou sondages — et commencez à
              monétiser votre audience.
            </p>
          </div>
          <div class="flex flex-none flex-wrap gap-3">
            <AppButton as="router-link" to="/register" variant="light">Créer ma chaîne</AppButton>
            <AppButton as="router-link" to="/articles" variant="light-outline">
              Découvrir les contenus
            </AppButton>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
