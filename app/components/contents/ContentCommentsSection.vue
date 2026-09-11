<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { navigateTo } from '#app'
import {
  deleteContentComment,
  fetchContentComments,
  postContentComment,
  type ContentComment,
} from '@/api/studio'
import { useAuthStore } from '@/stores/auth'
import { AUTH_REDIRECT_KEY } from '@/lib/auth-storage'
import { formatRelativePublished } from '@/lib/catalog-format'

const props = defineProps<{
  slug: string
  enabled?: boolean
}>()

const auth = useAuthStore()
const comments = ref<ContentComment[]>([])
const loading = ref(false)
const submitting = ref(false)
const draft = ref('')
const error = ref('')

const countLabel = computed(() => {
  const n = comments.value.length
  if (n === 0) return 'Aucun commentaire'
  return n === 1 ? '1 commentaire' : `${n} commentaires`
})

const canSubmit = computed(() => draft.value.trim().length > 0 && !submitting.value)

async function load() {
  if (!props.enabled || !props.slug) {
    comments.value = []
    return
  }
  loading.value = true
  error.value = ''
  try {
    comments.value = await fetchContentComments(props.slug)
  } catch {
    comments.value = []
    error.value = 'Impossible de charger les commentaires.'
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.slug, props.enabled] as const,
  () => {
    void load()
  },
  { immediate: true },
)

function requireAuth(): boolean {
  if (auth.isAuthenticated) return true
  if (import.meta.client) {
    const next = window.location.pathname + window.location.search
    try {
      sessionStorage.setItem(AUTH_REDIRECT_KEY, next)
    } catch {
      /* ignore */
    }
    try {
      localStorage.setItem(AUTH_REDIRECT_KEY, next)
    } catch {
      /* ignore */
    }
  }
  void navigateTo('/login')
  return false
}

async function submit() {
  const body = draft.value.trim()
  if (!body || !requireAuth()) return
  submitting.value = true
  error.value = ''
  try {
    const created = await postContentComment(props.slug, body)
    comments.value = [created, ...comments.value]
    draft.value = ''
  } catch {
    error.value = "Le commentaire n'a pas pu être publié."
  } finally {
    submitting.value = false
  }
}

async function remove(comment: ContentComment) {
  if (!comment.can_delete) return
  try {
    await deleteContentComment(props.slug, comment.id)
    comments.value = comments.value.filter((c) => c.id !== comment.id)
  } catch {
    error.value = "Le commentaire n'a pas pu être supprimé."
  }
}
</script>

<template>
  <section
    v-if="enabled"
    class="rounded-[18px] bg-white px-6 py-6 shadow-[var(--studio-shadow-card,0_1px_3px_rgba(20,20,30,0.06))] sm:px-7"
  >
    <div class="flex items-baseline justify-between gap-3">
      <h2 class="text-[14px] font-extrabold text-[var(--studio-ink,#18181f)]">Commentaires</h2>
      <span class="font-mono text-[11.5px] text-slate-400">{{ countLabel }}</span>
    </div>

    <form class="mt-5" @submit.prevent="submit">
      <textarea
        v-model="draft"
        rows="3"
        maxlength="2000"
        :disabled="submitting"
        placeholder="Partagez une réaction, une question, une précision…"
        class="w-full resize-y rounded-[12px] border border-slate-200 bg-[#faf9fd] px-3.5 py-3 text-[13.5px] leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white disabled:opacity-60"
      />
      <div class="mt-2.5 flex flex-wrap items-center justify-between gap-3">
        <p v-if="!auth.isAuthenticated" class="text-[12.5px] text-slate-500">
          <button
            type="button"
            class="font-bold text-primary underline-offset-2 hover:underline"
            @click="requireAuth()"
          >
            Connectez-vous
          </button>
          pour commenter.
        </p>
        <p v-else class="text-[11.5px] text-slate-400">{{ draft.length }}/2000</p>
        <button
          type="submit"
          class="ml-auto rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent,#3b82f6))] px-5 py-2 text-[12.5px] font-extrabold tracking-[0.02em] text-white transition disabled:opacity-50"
          :disabled="!canSubmit || !auth.isAuthenticated"
        >
          {{ submitting ? 'Envoi…' : 'Publier' }}
        </button>
      </div>
    </form>

    <p v-if="error" class="mt-3 text-[12.5px] text-rose-600">{{ error }}</p>

    <div v-if="loading" class="mt-6 text-[13px] text-slate-400">Chargement…</div>

    <ul v-else-if="comments.length" class="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5">
      <li v-for="comment in comments" :key="comment.id" class="flex gap-3">
        <span
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-extrabold text-primary"
        >
          {{ comment.author.initials }}
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span class="text-[13px] font-bold text-slate-900">{{ comment.author.name }}</span>
            <span class="text-[11.5px] text-slate-400">{{
              formatRelativePublished(comment.created_at)
            }}</span>
            <button
              v-if="comment.can_delete"
              type="button"
              class="ml-auto text-[11.5px] font-semibold text-slate-400 transition hover:text-rose-600"
              @click="remove(comment)"
            >
              Supprimer
            </button>
          </div>
          <p class="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-slate-700">
            {{ comment.body }}
          </p>
        </div>
      </li>
    </ul>

    <p v-else class="mt-6 text-[13px] text-slate-400">Soyez le premier à réagir.</p>
  </section>
</template>
