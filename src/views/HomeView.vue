<script setup lang="ts">
import HomeArticles from '../components/home/HomeArticles.vue'
import HomeCTA from '../components/home/HomeCTA.vue'
import HomeFooter from '../components/home/HomeFooter.vue'
import HomeHero from '../components/home/HomeHero.vue'
import HomeHighlights from '../components/home/HomeHighlights.vue'
import HomeNav from '../components/home/HomeNav.vue'
import HomePolls from '../components/home/HomePolls.vue'
import HomeStatsData from '../components/home/HomeStatsData.vue'
import HomeStatsStrip from '../components/home/HomeStatsStrip.vue'

const heroBullets = [
  'Articles data-driven avec sources vérifiables',
  'Pages StatsData connectées à vos APIs',
  'Sondages live avec visuels et filtres',
]

const heroKpis = [
  { label: 'Analyses publiées', value: '12.4k' },
  { label: 'Sources ouvertes', value: '240+' },
  { label: 'Chaînes actives', value: '860' },
]

const statsStrip = [
  {
    label: 'Temps moyen',
    value: '4 min',
    hint: 'pour générer un article enrichi',
  },
  {
    label: 'Insights',
    value: '3.2M',
    hint: 'tables et graphiques consultés',
  },
  {
    label: 'Fiabilité',
    value: '98%',
    hint: 'sources monitorées en continu',
  },
]

const highlights = [
  {
    title: 'Studio éditorial collaboratif',
    description: 'Brief, données et graphiques rassemblés dans un seul flux de production.',
    tag: 'Workflow',
    icon: '✍️',
  },
  {
    title: 'Chaînes pro ultra visibles',
    description: 'Créez votre chaîne, mettez en avant vos articles et mesurez l’audience.',
    tag: 'Monétisation',
    icon: '📡',
  },
  {
    title: 'Système de preuves intégré',
    description: 'Chaque chiffre est traçable avec des sources et des notes de contexte.',
    tag: 'Confiance',
    icon: '🧭',
  },
]

const articles = [
  {
    category: 'Politique',
    title: 'Présidentielle 2027 : cartographie des indécis',
    author: 'Équipe Statsio',
    reads: '48k',
    trend: '+12%',
  },
  {
    category: 'Santé',
    title: 'Hôpitaux : l’impact des déserts médicaux',
    author: 'Camille B.',
    reads: '36k',
    trend: '+7%',
  },
  {
    category: 'Économie',
    title: 'Inflation : qui perd vraiment du pouvoir d’achat ?',
    author: 'Julien L.',
    reads: '52k',
    trend: '+18%',
  },
]

const statsData = [
  {
    title: 'Inflation par ville en France',
    scope: 'Économie locale',
    updated: 'Live',
    metrics: ['IPC', 'Logement', 'Énergie', 'Alimentation', 'Revenus'],
  },
  {
    title: 'Santé mentale des 18-25 ans',
    scope: 'Santé publique',
    updated: 'Actualisé 2h',
    metrics: ['Stress', 'Sommeil', 'Accès soins', 'Isolement', 'Prévention'],
  },
]

const polls = [
  {
    title: 'Présidentielle : intentions de vote',
    window: 'Mars 2026',
    candidates: [
      { name: 'Emmanuel Macron', score: '28%' },
      { name: 'Marine Le Pen', score: '26%' },
      { name: 'Jordan Bardella', score: '18%' },
    ],
  },
  {
    title: 'Réforme des retraites : opinion',
    window: 'Février 2026',
    candidates: [
      { name: 'Pour', score: '41%' },
      { name: 'Contre', score: '52%' },
      { name: 'Sans avis', score: '7%' },
    ],
  },
  {
    title: 'Climat : priorité budgétaire',
    window: 'Janvier 2026',
    candidates: [
      { name: 'Oui', score: '64%' },
      { name: 'Non', score: '29%' },
      { name: 'NSP', score: '7%' },
    ],
  },
]
</script>

<template>
  <div class="min-h-screen text-slate-900">
    <HomeNav />
    <main class="pb-24">
      <HomeHero
        headline="Le média statistique nouvelle génération."
        subtitle="Statsio centralise les analyses, les sources et les signaux en temps réel pour créer des articles, des StatsData et des sondages à fort impact."
        :bullets="heroBullets"
        :kpis="heroKpis"
      />
      <HomeStatsStrip :stats="statsStrip" />
      <HomeHighlights :items="highlights" />
      <HomeArticles :items="articles" />
      <HomeStatsData :items="statsData" />
      <HomePolls :items="polls" />
      <HomeCTA />
    </main>
    <HomeFooter />
  </div>
</template>
