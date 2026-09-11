<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchHelpArticle, sendHelpFeedback } from '@/api/help'
import { formatShortDate } from '@/lib/format'

const route = useRoute()
const categorySlug = computed(() => String(route.params.category))
const articleSlug = computed(() => String(route.params.article))

const { data, error } = await useAsyncData(
  'help-article',
  () => fetchHelpArticle(categorySlug.value, articleSlug.value),
  { watch: [categorySlug, articleSlug] },
)

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article introuvable', fatal: true })
}

const article = computed(() => data.value!.article)
const category = computed(() => data.value!.category)

const authStore = useAuthStore()

// Utilisateur connecté : le vote est enregistré côté serveur, rattaché à son
// compte (visible en admin). Sinon : mémorisé uniquement en local storage,
// pour éviter de revoter depuis le même navigateur, sans remonter au serveur.
const feedbackStorageKey = computed(() => `statsio.help.feedback.${article.value.id}`)
const feedbackGiven = ref(false)
const isSendingFeedback = ref(false)

onMounted(() => {
  try {
    feedbackGiven.value = localStorage.getItem(feedbackStorageKey.value) !== null
  } catch {
    // Local storage indisponible (navigation privée…) : on retombe sur l'état par défaut.
  }
})

async function vote(helpful: boolean) {
  if (feedbackGiven.value || isSendingFeedback.value) return
  isSendingFeedback.value = true
  try {
    if (authStore.isAuthenticated) {
      await sendHelpFeedback(article.value.id, helpful)
    }
    try {
      localStorage.setItem(feedbackStorageKey.value, helpful ? 'yes' : 'no')
    } catch {
      // Local storage indisponible : le vote reste envoyé si connecté, juste pas mémorisé localement.
    }
    feedbackGiven.value = true
  } finally {
    isSendingFeedback.value = false
  }
}
</script>

<template>
  <main class="section container mx-auto max-w-[820px] pb-24">
    <div class="mb-6 flex flex-wrap items-center gap-2 text-[13px] text-slate-500">
      <NuxtLink to="/aide" class="font-semibold hover:text-[var(--color-primary)]">Centre d'aide</NuxtLink>
      <span>/</span>
      <NuxtLink :to="`/aide/${category.slug}`" class="font-semibold hover:text-[var(--color-primary)]">
        {{ category.name }}
      </NuxtLink>
      <span>/</span>
      <span class="font-bold text-slate-900">{{ article.title }}</span>
    </div>

    <span
      class="text-xs font-bold tracking-wide uppercase"
      :style="{ color: category.color ?? 'var(--color-primary)' }"
    >
      {{ category.name }}
    </span>
    <h1 class="mt-2 mb-2 text-[30px] leading-tight font-extrabold text-slate-900">{{ article.title }}</h1>
    <p v-if="article.updatedAt" class="mb-8 text-[13px] text-slate-500">
      Mis à jour le {{ formatShortDate(article.updatedAt) }}
    </p>

    <div class="help-article-body" v-html="article.contentHtml" />

    <div
      class="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-7"
    >
      <span class="text-sm font-bold text-slate-900">Cet article vous a-t-il été utile ?</span>
      <div v-if="!feedbackGiven" class="flex gap-2.5">
        <button
          type="button"
          class="rounded-full border border-slate-200 bg-white px-4.5 py-2 text-[13.5px] font-semibold text-slate-900 hover:border-slate-300"
          @click="vote(true)"
        >
          👍 Oui
        </button>
        <button
          type="button"
          class="rounded-full border border-slate-200 bg-white px-4.5 py-2 text-[13.5px] font-semibold text-slate-900 hover:border-slate-300"
          @click="vote(false)"
        >
          👎 Non
        </button>
      </div>
      <span v-else class="text-sm font-semibold text-slate-500">Merci pour votre retour !</span>
    </div>
  </main>
</template>

<style scoped>
.help-article-body {
  font-size: 15.5px;
  line-height: 1.75;
  color: rgba(24, 24, 31, 0.8);
}
.help-article-body :deep(p) {
  margin: 0 0 18px;
}
.help-article-body :deep(h2) {
  margin: 32px 0 12px;
  font-size: 21px;
  font-weight: 800;
  color: #18181f;
}
.help-article-body :deep(h3) {
  margin: 24px 0 10px;
  font-size: 17px;
  font-weight: 700;
  color: #18181f;
}
.help-article-body :deep(ul),
.help-article-body :deep(ol) {
  margin: 0 0 18px;
  padding-left: 22px;
}
.help-article-body :deep(li) {
  margin-bottom: 6px;
}
.help-article-body :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
}
.help-article-body :deep(img) {
  max-width: 100%;
  border-radius: 12px;
  margin: 20px 0;
}
.help-article-body :deep(strong) {
  color: #18181f;
}
.help-article-body :deep(blockquote) {
  margin: 20px 0;
  padding-left: 16px;
  border-left: 3px solid var(--color-primary);
  color: rgba(24, 24, 31, 0.6);
}
</style>
