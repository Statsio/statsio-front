<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import BlockRenderer from '@/components/studio/blocks/BlockRenderer.vue'
import StatsDataShareMenu from '@/components/statsdata/detail/StatsDataShareMenu.vue'
import { fetchPublicStatsDataDocument, fetchPublicSurveys, type StatsDataDocument } from '@/api/studio'
import { fetchBlockResponse, submitBlockResponse, type BlockResponseAggregate, type FormAnswerValue } from '@/api/studio-responses'
import { startIdentityVerification } from '@/api/identity'
import { toggleFavorite } from '@/api/statsio-account'
import { getChannel, toggleChannelSubscription, type Channel } from '@/api/channels'
import { useStudioStore } from '@/stores/studio'
import { useAuthStore } from '@/stores/auth'
import { isFormBlock } from '@/types/studio'
import type { StudioBlock } from '@/types/studio'
import { getHttpErrorStatus } from '@/lib/http-errors'
import { publicContentPath, publicContentListPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { useRespondentToken } from '@/composables/useRespondentToken'
import { AUTH_REDIRECT_KEY } from '@/lib/auth-storage'
import { getPollStatus } from '@/lib/poll-status'
import { getSurveyKindMeta } from '@/lib/poll-visuals'
import { profileLabel } from '@/lib/profile-labels'
import { formatCompactNumber } from '@/lib/format'
import { channelBannerStyle, resolveChannelColors } from '@/lib/channel-brand'

const props = defineProps<{
  categories?: string[]
}>()

const route = useRoute()
const router = useRouter()
const studio = useStudioStore()
const auth = useAuthStore()
const basePath = useContentBasePath()
const respondentToken = useRespondentToken()

const slug = computed(() => String(route.params.slug ?? ''))

const poll = ref<StatsDataDocument | null>(null)
const relatedPolls = ref<StatsDataDocument[]>([])
const loading = ref(true)

usePageSeo({
  title: computed(() => poll.value?.title),
  description: computed(() => poll.value?.description ?? undefined),
  type: 'article',
})

/* ───────── Métadonnées d'en-tête ───────── */

const kind = computed(() => getSurveyKindMeta(poll.value?.survey_kind))
const isPetition = computed(() => poll.value?.survey_kind === 'petition')
const isLong = computed(() => poll.value?.survey_kind === 'long')

const theme = computed(() => {
  const first = poll.value?.categories?.[0]
  return first ? first.toUpperCase() : 'SONDAGE'
})

const status = computed(() => getPollStatus(poll.value ?? {}))
const statusTone = computed(() =>
  status.value.closed
    ? { fg: 'rgba(24,24,31,0.5)', dot: 'rgba(24,24,31,0.3)' }
    : status.value.urgent
      ? { fg: '#b45309', dot: '#f59e0b' }
      : { fg: '#047857', dot: '#059669' },
)

const authorLabel = computed(() => poll.value?.channel?.name ?? poll.value?.author?.name ?? 'Anonyme')
const requiresIdentity = computed(() => Boolean(poll.value?.requires_identity_verification))

function formatDate(iso?: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}
function fmt(n: number) {
  return formatCompactNumber(n)
}

const heroMeta = computed(() => {
  const rows: { label: string; value: string }[] = [
    { label: isPetition.value ? 'Signatures' : 'Répondants', value: fmt(primaryTotal.value) },
  ]
  if (poll.value?.response_deadline) rows.push({ label: 'Clôture', value: status.value.closed ? 'Terminée' : status.value.label })
  if (isPetition.value && poll.value?.petition_goal) rows.push({ label: 'Objectif', value: fmt(poll.value.petition_goal) })
  if (formatDate(poll.value?.created_at)) rows.push({ label: 'Publié', value: formatDate(poll.value?.created_at)! })
  return rows
})

const goalPct = computed(() => {
  if (!isPetition.value || !poll.value?.petition_goal) return null
  return Math.min(100, Math.round((primaryTotal.value / poll.value.petition_goal) * 100))
})

/* ───────── Chaîne éditrice + suivi ───────── */

const channelName = computed(() => poll.value?.channel?.name ?? null)
const channelLogoUrl = computed(() => poll.value?.channel?.logo_url ?? null)
const channelHandle = computed(() => (poll.value?.channel?.handle ? `@${poll.value.channel.handle}` : null))
const channelAvatarBg = computed(() => {
  const c = poll.value?.channel
  if (!c) return '#8b5cf6'
  const colors = resolveChannelColors(String(c.id), c.custom_color_primary, c.custom_color_secondary)
  return channelBannerStyle(colors.primary, colors.secondary).background
})
const channelInitials = computed(() =>
  (channelName.value ?? authorLabel.value)
    .split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
)

const channel = ref<Channel | null>(null)
const isFollowingChannel = ref(false)
const isTogglingFollow = ref(false)

async function loadChannel() {
  const channelId = poll.value?.channel_id
  if (poll.value?.published_as !== 'channel' || !channelId) return
  try {
    channel.value = await getChannel(channelId)
    isFollowingChannel.value = channel.value.profile?.is_following ?? false
  } catch {
    channel.value = null
  }
}

function requireAuth(): boolean {
  if (auth.isAuthenticated) return true
  try {
    sessionStorage.setItem(AUTH_REDIRECT_KEY, route.fullPath)
    localStorage.setItem(AUTH_REDIRECT_KEY, route.fullPath)
  } catch { /* stockage indisponible */ }
  router.push('/login')
  return false
}

async function onToggleFollow() {
  if (isTogglingFollow.value || !poll.value?.channel_id) return
  if (!requireAuth()) return
  isTogglingFollow.value = true
  try {
    const result = await toggleChannelSubscription(poll.value.channel_id)
    isFollowingChannel.value = result.isFollowing
  } finally {
    isTogglingFollow.value = false
  }
}

/* ───────── Favori ───────── */

const isFavorite = ref(false)
const favoritePending = ref(false)
async function onToggleFavorite() {
  if (favoritePending.value || !poll.value) return
  if (!requireAuth()) return
  favoritePending.value = true
  try {
    isFavorite.value = await toggleFavorite(poll.value.id)
  } finally {
    favoritePending.value = false
  }
}

/* ───────── Partage ───────── */

const shareUrl = computed(() =>
  import.meta.client ? window.location.origin + window.location.pathname : `${basePath.value}/sondages/${slug.value}`,
)
const canWebShare = computed(() => import.meta.client && typeof navigator !== 'undefined' && 'share' in navigator)
const shareTargets = computed(() => {
  const u = encodeURIComponent(shareUrl.value)
  const t = encodeURIComponent(poll.value?.title ?? 'Sondage Statsio')
  return [
    { key: 'x', label: 'X / Twitter', href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { key: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { key: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: 'email', label: 'E-mail', href: `mailto:?subject=${t}&body=${u}` },
  ]
})
async function nativeShare() {
  try {
    await navigator.share({ title: poll.value?.title ?? 'Sondage Statsio', url: shareUrl.value })
  } catch { /* annulé */ }
}

/* ───────── Vérification d'identité (Didit) ───────── */

const identityVerified = computed(() => auth.user?.identity_verified === true)
/** Bloque réellement le vote tant que l'identité du compte n'est pas vérifiée. */
const identityBlocking = computed(() => requiresIdentity.value && !identityVerified.value)
const identityStarting = ref(false)

async function startIdentityFlow() {
  if (identityStarting.value) return
  if (!auth.isAuthenticated) {
    requireAuth()
    return
  }
  identityStarting.value = true
  try {
    const { url, verified } = await startIdentityVerification(route.fullPath)
    if (verified) {
      await auth.refreshUser()
      return
    }
    if (url) window.location.assign(url)
  } catch {
    /* 503 (non configuré) ou réseau : on laisse la carte en l'état */
  } finally {
    identityStarting.value = false
  }
}

/* ───────── Questions + résultats en direct ───────── */

const questionBlocks = computed(() => (studio.blocks ?? []).filter((b: StudioBlock) => isFormBlock(b.type)))
const otherBlocks = computed(() => (studio.blocks ?? []).filter((b: StudioBlock) => !isFormBlock(b.type)))
const primaryBlock = computed(() => questionBlocks.value[0])
const primaryOptions = computed<string[]>(() => primaryBlock.value?.config?.formOptions ?? [])

const primaryAggregate = ref<BlockResponseAggregate | null>(null)
const primaryLoaded = ref(false)
const myAnswer = ref<FormAnswerValue | null>(null)
const answered = ref(false)
const submitting = ref(false)
let pollTimer: ReturnType<typeof setInterval> | undefined

const primaryTotal = computed(() => primaryAggregate.value?.totalResponses ?? 0)
const demographics = computed(() => primaryAggregate.value?.demographics ?? null)

const resultRows = computed(() => {
  const agg = primaryAggregate.value
  if (!agg) return []
  if (agg.options?.length) {
    return agg.options.map((o) => ({ label: o.value, pct: Math.round(o.percent) }))
  }
  return primaryOptions.value.map((label) => ({ label, pct: 0 }))
})
const leadPct = computed(() => resultRows.value.reduce((m, r) => Math.max(m, r.pct), 0))

async function loadPrimaryResults() {
  const block = primaryBlock.value
  if (!block || !poll.value?.slug) {
    primaryLoaded.value = true
    return
  }
  try {
    const state = await fetchBlockResponse(poll.value.slug, block.id, respondentToken.value)
    primaryAggregate.value = state.aggregate
    answered.value = state.answered
    myAnswer.value = state.myAnswer
  } catch {
    primaryAggregate.value = null
  } finally {
    primaryLoaded.value = true
  }
}

async function vote(value: string) {
  const block = primaryBlock.value
  if (!block || !poll.value?.slug || submitting.value || status.value.closed) return
  // Répondre à un sondage impose d'être connecté (règle serveur : type === 'survey').
  if (!requireAuth()) return
  if (identityBlocking.value) {
    void startIdentityFlow()
    return
  }
  submitting.value = true
  try {
    const state = await submitBlockResponse(poll.value.slug, block.id, {
      value,
      respondent_token: respondentToken.value,
    })
    primaryAggregate.value = state.aggregate
    answered.value = state.answered
    myAnswer.value = state.myAnswer
  } catch { /* déjà voté / clôturé */ } finally {
    submitting.value = false
  }
}

/* ───────── Répartitions démographiques ───────── */

const DEMO_DIMS = [
  { key: 'age', label: "Tranche d'âge", icon: '⏳', color: 'var(--color-primary)' },
  { key: 'gender', label: 'Sexe', icon: '⚥', color: 'var(--color-accent)' },
  { key: 'profession', label: 'Profession', icon: '💼', color: '#10b981' },
  { key: 'region', label: 'Région', icon: '📍', color: '#f59e0b' },
] as const

const demoCards = computed(() =>
  DEMO_DIMS.map((d) => {
    const rows = demographics.value?.[d.key] ?? null
    return {
      ...d,
      unlocked: Array.isArray(rows),
      rows: (rows ?? []).map((r) => ({ label: profileLabel(r.key, r.label), pct: r.percent })),
    }
  }),
)
const profileDone = computed(() => demoCards.value.filter((c) => c.unlocked).length)

/* ───────── Autres consultations ───────── */

const otherPolls = computed(() =>
  relatedPolls.value.slice(0, 4).map((p) => {
    const km = getSurveyKindMeta(p.survey_kind)
    return {
      slug: p.slug,
      to: publicContentPath('survey', p.slug ?? '', basePath.value),
      question: p.title,
      kindLabel: km.label.toUpperCase(),
      kindFg: km.fg,
      kindBg: km.bg,
      meta: p.channel?.name ?? p.author?.name ?? 'Statsio',
    }
  }),
)

const listPath = computed(() => publicContentListPath('survey', basePath.value))

onMounted(async () => {
  try {
    const [doc, surveys] = await Promise.all([
      fetchPublicStatsDataDocument(slug.value),
      fetchPublicSurveys(props.categories),
    ])

    poll.value = doc
    isFavorite.value = doc.is_favorited ?? false
    relatedPolls.value = surveys.filter((item) => item.slug !== doc.slug)

    studio.initPage(
      { id: doc.id, type: 'survey', title: doc.title, status: doc.status as 'draft' | 'published', slug: slug.value },
      doc.sections,
      doc.blocks,
      doc.pages,
    )

    await Promise.all([loadPrimaryResults(), loadChannel()])
    pollTimer = setInterval(loadPrimaryResults, 6000)
  } catch (e) {
    showError(
      createError({
        statusCode: getHttpErrorStatus(e, 404),
        statusMessage: 'Ce sondage est introuvable ou non publié.',
        fatal: true,
      }),
    )
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="min-h-screen bg-[#f4f3f8]">
    <div v-if="loading" class="flex items-center justify-center py-40">
      <svg class="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <template v-else-if="poll">
      <!-- Sous-header collant -->
      <div class="sticky top-44 z-30 flex items-center gap-3.5 border-b border-slate-200/70 bg-white/90 px-4 py-2.5 backdrop-blur-md sm:px-6 lg:top-28">
        <span
          class="shrink-0 rounded-[5px] px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.06em]"
          :style="{ color: kind.fg, background: kind.bg }"
        >{{ kind.label }}</span>
        <span class="hidden max-w-[420px] shrink truncate text-[13px] font-bold text-slate-950 sm:block">{{ poll.title }}</span>
        <div class="min-w-0 flex-1" />
        <div class="flex shrink-0 items-center gap-2">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-[7px] text-[12.5px] font-bold transition disabled:opacity-60"
            :class="isFavorite ? 'border-[#c4b5fd] bg-[#f2ecfd] text-primary' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'"
            :disabled="favoritePending"
            @click="onToggleFavorite"
          >
            <span>{{ isFavorite ? '★' : '☆' }}</span>
            <span class="hidden md:inline">{{ isFavorite ? 'En favoris' : 'Favoris' }}</span>
          </button>
          <button
            v-if="channelName"
            type="button"
            class="rounded-full px-3.5 py-[7px] text-[12.5px] font-extrabold tracking-[0.02em] transition disabled:opacity-60"
            :class="isFollowingChannel
              ? 'border-[1.5px] border-[#c4b5fd] bg-white text-primary'
              : 'bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] text-white'"
            :disabled="isTogglingFollow"
            @click="onToggleFollow"
          >
            {{ isFollowingChannel ? 'Suivi ✓' : 'Suivre' }}
          </button>
          <StatsDataShareMenu
            :share-url="shareUrl"
            :can-web-share="canWebShare"
            :targets="shareTargets"
            @native-share="nativeShare"
          />
        </div>
      </div>

      <!-- Hero -->
      <section class="border-b border-slate-200/80 bg-white px-4 py-10 sm:px-6 lg:py-11">
        <div class="mx-auto grid max-w-[1180px] items-start gap-10 lg:grid-cols-[minmax(0,1fr)_306px]">
          <div class="min-w-0">
            <RouterLink :to="listPath" class="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-400 transition hover:text-primary">
              ← Retour aux sondages
            </RouterLink>
            <div class="mb-4 flex flex-wrap items-center gap-2.5">
              <span class="rounded-[5px] px-2 py-1 font-mono text-[9.5px] font-semibold tracking-[0.08em]" :style="{ color: kind.fg, background: kind.bg }">
                {{ kind.label.toUpperCase() }}
              </span>
              <span class="font-mono text-[10.5px] font-semibold text-slate-400">{{ theme }}</span>
              <span class="h-[3px] w-[3px] rounded-full bg-slate-300" />
              <span class="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.06em]" :style="{ color: statusTone.fg }">
                <span class="h-1.5 w-1.5 rounded-full" :style="{ background: statusTone.dot }" />{{ status.label.toUpperCase() }}
              </span>
              <span
                v-if="requiresIdentity"
                class="flex items-center gap-1.5 rounded-[5px] bg-[#fef3c7] px-2 py-1 font-mono text-[9.5px] font-semibold tracking-[0.06em] text-[#92400e]"
              >🛡 IDENTITÉ VÉRIFIÉE REQUISE</span>
            </div>

            <h1 class="max-w-[30ch] text-[30px] font-extrabold leading-[1.14] tracking-[-0.025em] text-pretty text-slate-950 sm:text-[38px]">
              {{ poll.title }}
            </h1>
            <p v-if="poll.description" class="mt-4 max-w-[60ch] text-[15.5px] leading-relaxed text-slate-500">
              {{ poll.description }}
            </p>

            <div class="mt-6 flex flex-wrap gap-6 border-t border-slate-200/80 pt-5">
              <div v-for="m in heroMeta" :key="m.label">
                <div class="text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-slate-400">{{ m.label }}</div>
                <div class="mt-1 font-mono text-[13.5px] font-semibold text-slate-950">{{ m.value }}</div>
              </div>
            </div>
          </div>

          <aside class="rounded-[18px] border-[1.5px] border-slate-200/80 p-5">
            <div class="mb-3.5 text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-slate-400">Publié par</div>
            <div class="flex items-center gap-3">
              <span
                class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[9px] text-[15px] font-extrabold text-white"
                :style="channelLogoUrl ? undefined : { background: channelName ? channelAvatarBg : 'linear-gradient(135deg,#3b82f6,#059669)' }"
              >
                <img v-if="channelLogoUrl" :src="channelLogoUrl" :alt="authorLabel" class="h-full w-full object-cover" />
                <span v-else>{{ channelInitials }}</span>
              </span>
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="truncate text-[15px] font-extrabold text-slate-950">{{ channelName ?? authorLabel }}</span>
                  <span v-if="channelName" class="shrink-0 text-[11px] text-accent" title="Chaîne">✔</span>
                </div>
                <div v-if="channelHandle" class="mt-0.5 font-mono text-[10.5px] text-slate-400">{{ channelHandle }}</div>
              </div>
            </div>
            <div class="mt-4 flex gap-2">
              <button
                v-if="channelName"
                type="button"
                class="flex-1 rounded-full px-3 py-2.5 text-center text-[12.5px] font-extrabold transition disabled:opacity-60"
                :class="isFollowingChannel
                  ? 'border-[1.5px] border-[#c4b5fd] text-primary'
                  : 'bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] text-white'"
                :disabled="isTogglingFollow"
                @click="onToggleFollow"
              >
                {{ isFollowingChannel ? 'Suivi ✓' : 'Suivre' }}
              </button>
              <RouterLink
                v-if="channel?.profile?.handle"
                :to="`/chaines/${channel.profile.handle}`"
                class="rounded-full border-[1.5px] border-slate-200 px-4 py-2.5 text-[12.5px] font-bold text-slate-600 transition hover:border-primary hover:text-primary"
              >
                Profil
              </RouterLink>
            </div>
          </aside>
        </div>
      </section>

      <!-- Corps 2 colonnes -->
      <div class="mx-auto grid max-w-[1180px] items-start gap-10 px-4 pb-24 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_306px]">
        <main class="flex min-w-0 flex-col gap-4">
          <!-- Porte de vérification d'identité (Didit) — bloque le vote tant que non vérifié -->
          <section
            v-if="requiresIdentity && identityBlocking"
            class="rounded-[18px] border-[1.5px] border-[#fde68a] bg-white p-8 text-center shadow-[0_1px_3px_rgba(20,20,30,0.06)]"
          >
            <div class="mx-auto mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-[#fef3c7] text-[22px]">🛡</div>
            <div class="text-[19px] font-extrabold tracking-[-0.015em]">Vérification d'identité requise</div>
            <p class="mx-auto mt-2.5 max-w-[46ch] text-[14px] leading-relaxed text-slate-500">
              Le créateur de cette consultation exige une vérification d'identité (un répondant = une voix). Elle est
              assurée par Didit, un prestataire tiers indépendant, et ne prend que quelques minutes — une seule fois
              pour l'ensemble de vos consultations.
            </p>
            <button
              type="button"
              class="mt-5 rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] px-[26px] py-3 text-[13px] font-extrabold tracking-[0.03em] text-white disabled:opacity-60"
              :disabled="identityStarting"
              @click="startIdentityFlow"
            >
              {{ identityStarting ? 'Redirection…' : auth.isAuthenticated ? 'Vérifier mon identité' : 'Se connecter pour vérifier mon identité' }}
            </button>
          </section>

          <!-- Identité vérifiée -->
          <section
            v-else-if="requiresIdentity && identityVerified"
            class="flex items-center gap-3 rounded-[16px] border-[1.5px] border-emerald-200 bg-emerald-50/60 px-5 py-4"
          >
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[15px] text-white">✓</span>
            <div class="text-[13px] font-bold text-emerald-800">Identité vérifiée — votre réponse comptera comme une voix authentifiée.</div>
          </section>

          <!-- Zone de réponse : masquée tant que la vérification d'identité requise n'est pas faite
               (aligné sur la maquette « Detail Sondage v2 » : isUnlockedMain = !isGated). -->
          <template v-if="!identityBlocking">
          <!-- Sondage rapide / pétition : vote + résultats -->
          <template v-if="!isLong && primaryBlock">
            <section
              v-if="!answered"
              class="rounded-[18px] bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.06)]"
            >
              <div class="mb-4 text-[10px] font-extrabold uppercase tracking-[0.1em] text-primary">
                {{ isPetition ? 'Signer la pétition' : 'Votre réponse' }}
              </div>
              <div class="flex flex-col gap-2.5">
                <button
                  v-for="opt in primaryOptions"
                  :key="opt"
                  type="button"
                  class="rounded-[13px] border-[1.5px] border-slate-200 bg-[#faf9fd] px-4 py-4 text-left text-[14.5px] font-bold text-slate-950 transition hover:border-primary hover:bg-[#faf8ff] disabled:opacity-60"
                  :disabled="submitting || status.closed || identityBlocking"
                  @click="vote(opt)"
                >
                  {{ isPetition ? '✍ ' + opt : opt }}
                </button>
              </div>
              <p v-if="status.closed" class="mt-3 text-[12.5px] text-slate-400">Cette consultation est clôturée.</p>
              <p v-else-if="!auth.isAuthenticated" class="mt-3 text-[12.5px] text-slate-500">
                <button type="button" class="font-bold text-primary underline-offset-2 hover:underline" @click="requireAuth()">
                  Connectez-vous
                </button>
                pour enregistrer votre réponse.
              </p>
            </section>

            <section
              v-else
              class="rounded-[18px] bg-[linear-gradient(135deg,#18181f,#2c2440)] p-6 text-white shadow-[0_1px_3px_rgba(20,20,30,0.06)]"
            >
              <div class="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#c4b5fd]">
                {{ isPetition ? 'Signature enregistrée' : 'Votre réponse' }}
              </div>
              <div class="flex items-center gap-3">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[16px] text-white">✓</span>
                <span class="text-[17px] font-extrabold">{{ Array.isArray(myAnswer) ? myAnswer.join(', ') : myAnswer }}</span>
              </div>
              <div class="mt-2.5 text-[12.5px] text-white/60">Enregistrée · comptabilisée dans les résultats ci-dessous.</div>
            </section>

            <!-- Jauge pétition -->
            <section v-if="isPetition && goalPct !== null" class="rounded-[18px] bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
              <div class="flex items-baseline justify-between gap-3">
                <span class="font-mono text-[22px] font-semibold tracking-[-0.02em] text-[#be123c]">{{ fmt(primaryTotal) }} signatures</span>
                <span class="font-mono text-[12px] text-slate-500">objectif {{ fmt(poll.petition_goal ?? 0) }}</span>
              </div>
              <div class="mt-3 h-2.5 overflow-hidden rounded-md bg-[#f7dde4]">
                <div class="h-full rounded-md bg-[linear-gradient(90deg,#e11d48,#8b5cf6)]" :style="{ width: `${goalPct}%` }" />
              </div>
              <p class="mt-2 font-mono text-[11px] text-slate-500">{{ goalPct }} % atteint</p>
              <p v-if="poll.petition_target" class="mt-3 text-[13px] leading-relaxed text-slate-500">{{ poll.petition_target }}</p>
            </section>

            <!-- Résultats globaux -->
            <section v-if="resultRows.length" class="rounded-[18px] bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
              <div class="mb-4 flex items-baseline justify-between gap-3">
                <div class="text-[10px] font-extrabold uppercase tracking-[0.1em] text-primary">Résultats globaux</div>
                <div class="font-mono text-[11.5px] text-slate-400">{{ fmt(primaryTotal) }} réponses</div>
              </div>
              <div class="flex flex-col gap-3">
                <div
                  v-for="r in resultRows"
                  :key="r.label"
                  class="relative overflow-hidden rounded-xl border border-slate-200/80 px-4 py-3.5"
                >
                  <span
                    class="absolute inset-y-0 left-0"
                    :style="{ width: `${r.pct}%`, background: r.pct === leadPct && leadPct > 0 ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.05)' }"
                  />
                  <span class="relative flex items-center justify-between gap-3">
                    <span class="text-[14.5px] font-bold text-slate-950">{{ r.label }}</span>
                    <span class="shrink-0 font-mono text-[13.5px] font-semibold text-slate-700">{{ r.pct }}%</span>
                  </span>
                </div>
              </div>
            </section>
          </template>

          <!-- Questionnaire : rendu des blocs -->
          <template v-else>
            <p
              v-if="!auth.isAuthenticated"
              class="rounded-[16px] border-[1.5px] border-slate-200 bg-white px-5 py-4 text-[13px] text-slate-600"
            >
              <button type="button" class="font-bold text-primary underline-offset-2 hover:underline" @click="requireAuth()">
                Connectez-vous
              </button>
              pour répondre à ce questionnaire.
            </p>
            <section
              v-for="block in otherBlocks"
              :key="block.id"
              class="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_1px_3px_rgba(20,20,30,0.06)]"
            >
              <BlockRenderer :block="block" :readonly="true" />
            </section>
            <section
              v-for="block in questionBlocks"
              :key="block.id"
              class="rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(20,20,30,0.06)] sm:p-5"
            >
              <BlockRenderer :block="block" :readonly="true" />
            </section>
            <div
              v-if="questionBlocks.length === 0 && otherBlocks.length === 0"
              class="rounded-[18px] border border-dashed border-slate-200 bg-white py-20 text-center text-slate-400"
            >
              <p class="text-sm">Ce questionnaire ne contient aucune question pour le moment.</p>
            </div>
          </template>

          <!-- Résultats détaillés -->
          <div v-if="primaryBlock" class="mt-2">
            <div class="text-[19px] font-extrabold tracking-[-0.015em]">Résultats détaillés</div>
            <p class="mt-2 max-w-[64ch] text-[13.5px] leading-relaxed text-slate-500">
              Chaque répartition démographique n'est visible qu'une fois le champ correspondant complété dans votre
              profil — ceci protège l'anonymat des répondants tout en fiabilisant les données.
            </p>
          </div>

          <div v-if="primaryBlock" class="grid gap-4 sm:grid-cols-2">
            <section
              v-for="c in demoCards"
              :key="c.key"
              class="relative overflow-hidden rounded-[18px] bg-white p-5 shadow-[0_1px_3px_rgba(20,20,30,0.06)]"
            >
              <div class="mb-4 flex items-center gap-2">
                <div class="flex-1 text-[11px] font-extrabold uppercase tracking-[0.04em] text-slate-500">Répartition · {{ c.label }}</div>
                <span class="text-[12px]">{{ c.unlocked ? '✓' : '🔒' }}</span>
              </div>
              <div
                class="flex flex-col gap-2.5"
                :class="c.unlocked ? '' : 'pointer-events-none select-none opacity-50 blur-[5px]'"
              >
                <div
                  v-for="r in (c.unlocked && c.rows.length ? c.rows : [{ label: '—', pct: 52 }, { label: '—', pct: 33 }, { label: '—', pct: 15 }])"
                  :key="r.label + r.pct"
                  class="flex items-center gap-2.5"
                >
                  <span class="w-28 flex-none truncate text-[12px] text-slate-600">{{ r.label }}</span>
                  <span class="h-2 flex-1 overflow-hidden rounded-md bg-[#eae7f4]">
                    <span class="block h-full rounded-md" :style="{ width: `${r.pct}%`, background: c.color }" />
                  </span>
                  <span class="w-8 flex-none text-right font-mono text-[11px] text-slate-400">{{ r.pct }}%</span>
                </div>
              </div>
              <div v-if="!c.unlocked" class="absolute inset-x-5 bottom-5 top-[52px] flex items-center justify-center bg-white/40">
                <RouterLink
                  to="/user/parametres#demographics"
                  class="whitespace-nowrap rounded-full bg-[#f2ecfd] px-3.5 py-2 text-[11.5px] font-bold text-primary"
                >🔒 Compléter mon profil</RouterLink>
              </div>
            </section>
          </div>

          <section v-if="primaryBlock" class="rounded-[18px] bg-white p-5 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
            <div class="mb-2.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-primary">Méthodologie</div>
            <p class="text-[13px] leading-relaxed text-slate-500">
              Une participation par compte. Les répartitions démographiques sont calculées uniquement sur les
              répondants ayant renseigné le champ correspondant dans leur profil ; elles ne sont affichées qu'à partir
              d'un volume suffisant de réponses pour préserver l'anonymat.
            </p>
          </section>
          </template>
        </main>

        <!-- Rail droit collant -->
        <aside class="flex flex-col gap-4 lg:sticky lg:top-[130px]">
          <div v-if="requiresIdentity" class="rounded-[16px] bg-white p-[18px] shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
            <div class="mb-3 text-[10px] font-extrabold uppercase tracking-[0.09em] text-slate-400">Vérification d'identité</div>
            <div class="flex items-center gap-2.5">
              <span
                class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] text-[15px]"
                :class="identityVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-[#fef3c7] text-[#92400e]'"
              >{{ identityVerified ? '✓' : '🛡' }}</span>
              <div class="min-w-0">
                <div class="text-[13px] font-extrabold">{{ identityVerified ? 'Identité vérifiée' : 'Requise pour répondre' }}</div>
                <div class="mt-0.5 text-[11px] text-slate-500">
                  {{ identityVerified ? 'via Didit, prestataire indépendant' : 'vérification Didit, ~2 minutes' }}
                </div>
              </div>
            </div>
            <button
              v-if="!identityVerified"
              type="button"
              class="mt-3.5 w-full rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] px-4 py-2.5 text-[12px] font-extrabold tracking-[0.02em] text-white disabled:opacity-60"
              :disabled="identityStarting"
              @click="startIdentityFlow"
            >
              {{ auth.isAuthenticated ? 'Vérifier mon identité' : 'Se connecter' }}
            </button>
          </div>

          <div class="rounded-[16px] bg-white p-[18px] shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
            <div class="mb-1.5 flex items-baseline justify-between gap-2.5">
              <div class="text-[10px] font-extrabold uppercase tracking-[0.09em] text-slate-400">Votre profil</div>
              <div class="font-mono text-[10.5px] font-semibold text-primary">{{ profileDone }} / {{ demoCards.length }}</div>
            </div>
            <div class="mb-3.5 h-1.5 overflow-hidden rounded bg-[#eeebf6]">
              <div class="h-full rounded bg-[linear-gradient(90deg,var(--color-primary),var(--color-accent))]" :style="{ width: `${(profileDone / demoCards.length) * 100}%` }" />
            </div>
            <div class="flex flex-col gap-0.5">
              <div v-for="c in demoCards" :key="c.key" class="flex items-center gap-2.5 px-1 py-2">
                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10.5px]"
                  :class="c.unlocked ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'"
                >{{ c.unlocked ? '✓' : '🔒' }}</span>
                <span class="flex-1 text-[12.5px] font-semibold" :class="c.unlocked ? 'text-slate-950' : 'text-slate-500'">{{ c.label }}</span>
                <RouterLink v-if="!c.unlocked" to="/user/parametres#demographics" class="shrink-0 text-[11px] font-bold text-primary">Compléter</RouterLink>
              </div>
            </div>
            <RouterLink
              to="/user/parametres#demographics"
              class="mt-3.5 block rounded-full border-[1.5px] border-slate-200 py-2.5 text-center text-[12px] font-bold text-slate-600 transition hover:border-primary hover:text-primary"
            >
              Gérer mon profil
            </RouterLink>
          </div>

          <div v-if="otherPolls.length" class="rounded-[16px] bg-white p-[18px] shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
            <div class="mb-3 text-[10px] font-extrabold uppercase tracking-[0.09em] text-slate-400">D'autres consultations</div>
            <div class="flex flex-col gap-0.5">
              <RouterLink
                v-for="p in otherPolls"
                :key="p.slug"
                :to="p.to"
                class="-mx-2 flex flex-col gap-1.5 rounded-[11px] px-2 py-2.5 transition hover:bg-[#faf9fd]"
              >
                <span class="flex items-center gap-1.5">
                  <span class="rounded-[5px] px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-[0.06em]" :style="{ color: p.kindFg, background: p.kindBg }">{{ p.kindLabel }}</span>
                  <span class="truncate text-[10.5px] text-slate-400">{{ p.meta }}</span>
                </span>
                <span class="text-[13px] font-bold leading-snug text-slate-950">{{ p.question }}</span>
              </RouterLink>
            </div>
            <RouterLink
              :to="listPath"
              class="mt-2 block rounded-full border-[1.5px] border-slate-200 py-2.5 text-center text-[12px] font-bold text-slate-600 transition hover:border-primary hover:text-primary"
            >
              Voir tous les sondages
            </RouterLink>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>
