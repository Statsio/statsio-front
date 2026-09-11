<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import {
  emptyContentPermissions,
  getContentAccessCatalog,
  inviteContentCollaborators,
  type ContentAccessCatalog,
  type ContentAccessLevel,
  type ContentAccessResource,
  type InviteContentCollaboratorsResult,
} from '@/api/studio'
import { getErrorMessage } from '@/lib/http-errors'

const props = defineProps<{ open: boolean; contentSlug: string }>()
const emit = defineEmits<{ 'update:open': [boolean]; invited: [] }>()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LEVELS: ContentAccessLevel[] = ['none', 'read', 'write']
const LEVEL_LABELS: Record<ContentAccessLevel, string> = {
  none: 'Aucun',
  read: 'Lecture',
  write: 'Modification',
}

const emails = ref<string[]>([])
const emailInput = ref('')
const catalog = ref<ContentAccessCatalog | null>(null)
const catalogLoading = ref(true)
const permissions = ref(emptyContentPermissions())
const submitting = ref(false)
const error = ref('')
const result = ref<InviteContentCollaboratorsResult | null>(null)

const resources = computed(() => catalog.value?.resources ?? [])

watch(
  () => props.open,
  (open) => {
    if (open) resetForm()
  },
)

onMounted(async () => {
  try {
    catalog.value = await getContentAccessCatalog()
  } finally {
    catalogLoading.value = false
  }
})

function setLevel(resource: ContentAccessResource, level: ContentAccessLevel) {
  permissions.value = { ...permissions.value, [resource]: level }
}

function addEmailsFrom(raw: string) {
  raw
    .split(/[,\s\n]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .forEach((e) => {
      if (!emails.value.includes(e)) emails.value.push(e)
    })
}

function onEmailKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    if (emailInput.value.trim()) {
      addEmailsFrom(emailInput.value)
      emailInput.value = ''
    }
  } else if (e.key === 'Backspace' && !emailInput.value && emails.value.length) {
    emails.value.pop()
  }
}

function onEmailBlur() {
  if (emailInput.value.trim()) {
    addEmailsFrom(emailInput.value)
    emailInput.value = ''
  }
}

function onEmailPaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text')
  if (text && /[,\s\n]/.test(text)) {
    e.preventDefault()
    addEmailsFrom(text)
  }
}

function removeEmail(email: string) {
  emails.value = emails.value.filter((e) => e !== email)
}

function isValidEmail(email: string) {
  return EMAIL_RE.test(email)
}

const hasAnyPermission = computed(() =>
  Object.values(permissions.value).some((l) => l === 'read' || l === 'write'),
)

const canSubmit = computed(
  () =>
    emails.value.length > 0 &&
    emails.value.every(isValidEmail) &&
    hasAnyPermission.value &&
    !submitting.value,
)

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  error.value = ''
  try {
    result.value = await inviteContentCollaborators(props.contentSlug, {
      emails: emails.value,
      permissions: permissions.value,
    })
    emit('invited')
  } catch (e) {
    error.value = getErrorMessage(e, "Erreur lors de l'envoi des invitations.")
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  emails.value = []
  emailInput.value = ''
  permissions.value = emptyContentPermissions()
  result.value = null
  error.value = ''
}

function close() {
  emit('update:open', false)
  resetForm()
}
</script>

<template>
  <AppModal :open="open" title="Inviter à collaborer" size="lg" @update:open="close">
    <div v-if="result" class="flex flex-col gap-4">
      <p
        v-if="result.created.length"
        class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
      >
        Invitation envoyée à : {{ result.created.join(', ') }}
      </p>
      <p
        v-if="result.resent.length"
        class="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700"
      >
        Invitation renvoyée à : {{ result.resent.join(', ') }}
      </p>
      <p
        v-if="result.skipped.length"
        class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
      >
        Ignoré :
        {{ result.skipped.map((s) => `${s.email} (${s.reason})`).join(', ') }}
      </p>
      <AppButton variant="primary" size="md" @click="close">Fermer</AppButton>
    </div>

    <div v-else class="flex flex-col gap-6">
      <div>
        <label class="mb-2 block text-sm font-semibold text-slate-700">Adresses e-mail</label>
        <div
          class="flex flex-wrap items-center gap-2 rounded-[1.25rem] border border-slate-200 bg-white px-3 py-2.5 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20"
        >
          <span
            v-for="e in emails"
            :key="e"
            class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="isValidEmail(e) ? 'bg-primary/10 text-primary' : 'bg-rose-50 text-rose-600'"
          >
            {{ e }}
            <button type="button" class="text-current/60 hover:text-current" @click="removeEmail(e)">
              ×
            </button>
          </span>
          <input
            v-model="emailInput"
            type="text"
            class="min-w-[160px] flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="nom@exemple.com, ..."
            @keydown="onEmailKeydown"
            @blur="onEmailBlur"
            @paste="onEmailPaste"
          />
        </div>
        <p class="mt-1.5 text-xs text-slate-400">
          Entrée, virgule ou collage multiple pour ajouter plusieurs adresses.
        </p>
      </div>

      <div>
        <label class="mb-2 block text-sm font-semibold text-slate-700">Permissions</label>
        <p class="mb-3 text-xs text-slate-500">
          Accès &amp; partage, suppression et duplication restent réservés au propriétaire.
        </p>
        <div v-if="catalogLoading" class="h-40 animate-pulse rounded-2xl bg-slate-100" />
        <div v-else class="overflow-hidden rounded-2xl border border-slate-200">
          <div
            v-for="res in resources"
            :key="res.key"
            class="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <p class="text-[13.5px] font-bold text-slate-900">{{ res.label }}</p>
              <p class="text-[12px] text-slate-500">{{ res.description }}</p>
            </div>
            <div class="flex shrink-0 gap-1 rounded-full bg-slate-100 p-1">
              <button
                v-for="level in LEVELS"
                :key="level"
                type="button"
                class="rounded-full px-3 py-1.5 text-[11.5px] font-bold transition-colors"
                :class="
                  permissions[res.key] === level
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                "
                @click="setLevel(res.key, level)"
              >
                {{ LEVEL_LABELS[level] }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <p v-if="error" class="text-sm text-rose-600">{{ error }}</p>

      <div class="flex items-center gap-3">
        <AppButton variant="primary" size="md" :disabled="!canSubmit" @click="submit">
          {{ submitting ? 'Envoi…' : `Inviter${emails.length ? ` (${emails.length})` : ''}` }}
        </AppButton>
        <AppButton variant="secondary" size="md" @click="close">Annuler</AppButton>
      </div>
    </div>
  </AppModal>
</template>
