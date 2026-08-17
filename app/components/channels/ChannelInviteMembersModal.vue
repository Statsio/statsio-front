<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect, { type AppSelectOption } from '@/components/ui/AppSelect.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import {
  getChannelPermissionsCatalog,
  inviteChannelMembers,
  INVITABLE_ROLES,
  channelRoleLabels,
  type ChannelPermissionCategory,
  type ChannelRole,
  type InviteChannelMembersResult,
} from '@/api/channels'
import { getErrorMessage } from '@/lib/http-errors'

const props = defineProps<{ open: boolean; channelId: number }>()
const emit = defineEmits<{ 'update:open': [boolean]; invited: [] }>()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const roleOptions: AppSelectOption[] = INVITABLE_ROLES.map((r) => ({ value: r, label: channelRoleLabels[r] }))

const ROLE_DEFAULTS: Record<ChannelRole, string[]> = {
  owner: [],
  admin: [],
  redactor: ['contents.create', 'contents.edit', 'contents.publish', 'audience.view_stats'],
  guest: ['contents.create', 'contents.edit'],
  subscriber: [],
}

const emails = ref<string[]>([])
const emailInput = ref('')
const role = ref<ChannelRole>('redactor')
const categories = ref<ChannelPermissionCategory[]>([])
const categoriesLoading = ref(true)
const selectedPermissions = ref<Set<string>>(new Set())
const submitting = ref(false)
const error = ref('')
const result = ref<InviteChannelMembersResult | null>(null)

const allPermissionKeys = computed(() => categories.value.flatMap((c) => c.permissions.map((p) => p.key)))
const isLockedRole = computed(() => role.value === 'owner' || role.value === 'admin')

function applyRoleDefaults() {
  selectedPermissions.value = isLockedRole.value
    ? new Set(allPermissionKeys.value)
    : new Set(ROLE_DEFAULTS[role.value])
}

watch(role, applyRoleDefaults)

onMounted(async () => {
  try {
    categories.value = await getChannelPermissionsCatalog()
  } finally {
    categoriesLoading.value = false
    applyRoleDefaults()
  }
})

function togglePermission(key: string) {
  if (isLockedRole.value) return
  const next = new Set(selectedPermissions.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  selectedPermissions.value = next
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

const canSubmit = computed(() => emails.value.length > 0 && emails.value.every(isValidEmail) && !submitting.value)

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  error.value = ''
  try {
    result.value = await inviteChannelMembers(props.channelId, {
      emails: emails.value,
      role: role.value,
      permissions: [...selectedPermissions.value],
    })
    emit('invited')
  } catch (e) {
    error.value = getErrorMessage(e, "Erreur lors de l'envoi des invitations.")
  } finally {
    submitting.value = false
  }
}

function reset() {
  emails.value = []
  emailInput.value = ''
  role.value = 'redactor'
  result.value = null
  error.value = ''
  applyRoleDefaults()
}

function close() {
  emit('update:open', false)
  reset()
}
</script>

<template>
  <AppModal :open="open" title="Inviter des membres" size="lg" @update:open="close">
    <div v-if="result" class="flex flex-col gap-4">
      <p v-if="result.created.length" class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        Invitation envoyée à : {{ result.created.join(', ') }}
      </p>
      <p v-if="result.resent.length" class="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
        Invitation renvoyée à : {{ result.resent.join(', ') }}
      </p>
      <p v-if="result.skipped.length" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Ignoré : {{ result.skipped.map((s) => `${s.email} (${s.reason})`).join(', ') }}
      </p>
      <AppButton variant="primary" size="md" @click="close">Fermer</AppButton>
    </div>

    <div v-else class="flex flex-col gap-6">
      <!-- Emails -->
      <div>
        <label class="mb-2 block text-sm font-semibold text-slate-700">Adresses e-mail</label>
        <div class="flex flex-wrap items-center gap-2 rounded-[1.25rem] border border-slate-200 bg-white px-3 py-2.5 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20">
          <span
            v-for="e in emails"
            :key="e"
            class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="isValidEmail(e) ? 'bg-primary/10 text-primary' : 'bg-rose-50 text-rose-600'"
          >
            {{ e }}
            <button type="button" class="text-current/60 hover:text-current" @click="removeEmail(e)">×</button>
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
        <p class="mt-1.5 text-xs text-slate-400">Entrée, virgule ou collage multiple pour ajouter plusieurs adresses.</p>
      </div>

      <!-- Rôle -->
      <div>
        <label class="mb-2 block text-sm font-semibold text-slate-700">Rôle</label>
        <AppSelect v-model="role" :options="roleOptions" size="md" class="w-full max-w-xs" />
      </div>

      <!-- Permissions -->
      <div>
        <label class="mb-2 block text-sm font-semibold text-slate-700">
          Permissions
          <span v-if="isLockedRole" class="font-normal text-slate-400">— accès complet pour ce rôle</span>
        </label>
        <div v-if="categoriesLoading" class="h-32 animate-pulse rounded-2xl bg-slate-100" />
        <div v-else class="grid gap-4 sm:grid-cols-2">
          <div v-for="cat in categories" :key="cat.category" class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{{ cat.category }}</p>
            <div class="flex flex-col gap-2.5">
              <AppCheckbox
                v-for="perm in cat.permissions"
                :key="perm.key"
                :model-value="selectedPermissions.has(perm.key)"
                :disabled="isLockedRole"
                :label="perm.label"
                @update:model-value="togglePermission(perm.key)"
              />
            </div>
          </div>
        </div>
      </div>

      <p v-if="error" class="text-sm text-rose-600">{{ error }}</p>

      <div class="flex items-center gap-3">
        <AppButton variant="primary" size="md" :disabled="!canSubmit" @click="submit">
          {{ submitting ? 'Envoi...' : `Inviter${emails.length ? ` (${emails.length})` : ''}` }}
        </AppButton>
        <AppButton variant="secondary" size="md" @click="close">Annuler</AppButton>
      </div>
    </div>
  </AppModal>
</template>
