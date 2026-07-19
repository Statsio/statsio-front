<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Contact',
  description:
    'Une question sur Statsio, un partenariat ou une demande presse ? Contactez notre équipe.',
})

import { computed, ref } from 'vue'
import { getBrandFromPath } from '@/data/brands'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'

type ReasonKey = 'general' | 'partenariat' | 'presse' | 'commercial'

const REASONS: {
  key: ReasonKey
  title: string
  desc: string
  label: string
  color: string
  bg: string
  shape: string
}[] = [
  {
    key: 'general',
    title: 'Question générale',
    desc: 'Une question sur Statsio',
    label: 'Question générale',
    color: 'var(--color-primary)',
    bg: '#f2ecfd',
    shape: 'rounded-[4px]',
  },
  {
    key: 'partenariat',
    title: 'Partenariat',
    desc: 'Devenir chaîne partenaire',
    label: 'Demande de partenariat',
    color: 'var(--color-accent)',
    bg: '#eaf1fe',
    shape: 'rounded-full',
  },
  {
    key: 'presse',
    title: 'Presse & médias',
    desc: 'Interview ou communiqué',
    label: 'Demande presse',
    color: '#e11d48',
    bg: '#fdeef2',
    shape: 'rounded-[2px]',
  },
  {
    key: 'commercial',
    title: 'Ventes & offres pro',
    desc: 'Abonnements pour équipes',
    label: 'Demande commerciale',
    color: '#166534',
    bg: '#eafbf1',
    shape: 'rounded-[4px]',
  },
]

const reasonKey = ref<ReasonKey>('general')
const name = ref('')
const email = ref('')
const company = ref('')
const message = ref('')
const submitted = ref(false)

const currentReason = computed(() => REASONS.find((r) => r.key === reasonKey.value)!)
const canSubmit = computed(() => Boolean(name.value.trim() && email.value.trim() && message.value.trim()))

function selectReason(key: ReasonKey) {
  reasonKey.value = key
}

function onSubmit() {
  if (!canSubmit.value) return
  submitted.value = true
}

function resetForm() {
  reasonKey.value = 'general'
  name.value = ''
  email.value = ''
  company.value = ''
  message.value = ''
  submitted.value = false
}

const route = useRoute()
const xUrl = computed(() => getBrandFromPath(route.path).xUrl)
</script>

<template>
  <main class="pb-4">
    <!-- Hero -->
    <section class="section !pb-14">
      <div class="container flex flex-col items-center gap-4 text-center">
        <AppBadge variant="soft-primary" mono>Contact</AppBadge>
        <h1 class="max-w-2xl text-4xl font-bold leading-tight text-slate-900 sm:text-[38px]">
          Parlons de votre projet
        </h1>
        <p class="max-w-xl text-[15.5px] leading-relaxed text-slate-500">
          Une question sur Statsio, un partenariat ou une demande presse&nbsp;? Choisissez le bon
          interlocuteur ci-dessous.
        </p>
      </div>
    </section>

    <!-- Reason cards -->
    <section class="!pt-0">
      <div class="container max-w-3xl">
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <button
            v-for="r in REASONS"
            :key="r.key"
            type="button"
            class="flex cursor-pointer flex-col gap-2.5 rounded-[14px] border p-5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2"
            :style="{
              borderColor: reasonKey === r.key ? r.color : 'rgba(20,20,30,0.08)',
              backgroundColor: reasonKey === r.key ? r.bg : '#fff',
            }"
            @click="selectReason(r.key)"
          >
            <span
              class="flex h-[34px] w-[34px] items-center justify-center rounded-[9px]"
              :style="{ background: r.bg }"
            >
              <span class="block h-[11px] w-[11px]" :class="r.shape" :style="{ background: r.color }" />
            </span>
            <span class="text-sm font-bold text-slate-900">{{ r.title }}</span>
            <span class="text-xs leading-relaxed text-slate-500">{{ r.desc }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Form + sidebar -->
    <section class="!pt-12">
      <div class="container grid max-w-3xl items-start gap-10 lg:grid-cols-[1fr_300px]">
        <div v-if="!submitted" class="card flex flex-col gap-4.5 p-8">
          <div class="text-[13.5px] font-bold" :style="{ color: currentReason.color }">
            {{ currentReason.label }}
          </div>

          <div class="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label for="contact-name" class="mb-1.5 block text-[13px] font-bold text-slate-900">Nom</label>
              <input
                id="contact-name"
                v-model="name"
                type="text"
                placeholder="Votre nom"
                class="w-full rounded-[10px] border border-slate-200 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
            </div>
            <div>
              <label for="contact-email" class="mb-1.5 block text-[13px] font-bold text-slate-900">E-mail</label>
              <input
                id="contact-email"
                v-model="email"
                type="email"
                placeholder="vous@exemple.fr"
                class="w-full rounded-[10px] border border-slate-200 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
            </div>
          </div>

          <div>
            <label for="contact-company" class="mb-1.5 block text-[13px] font-bold text-slate-900">
              Entreprise ou chaîne (facultatif)
            </label>
            <input
              id="contact-company"
              v-model="company"
              type="text"
              placeholder="Nom de votre chaîne ou société"
              class="w-full rounded-[10px] border border-slate-200 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </div>

          <div>
            <label for="contact-message" class="mb-1.5 block text-[13px] font-bold text-slate-900">
              Votre message
            </label>
            <textarea
              id="contact-message"
              v-model="message"
              rows="6"
              placeholder="Décrivez votre demande…"
              class="w-full resize-y rounded-[10px] border border-slate-200 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </div>

          <AppButton
            type="button"
            variant="gradient"
            size="lg"
            class="self-start"
            :disabled="!canSubmit"
            @click="onSubmit"
          >
            Envoyer le message
          </AppButton>
        </div>

        <div v-else class="card flex flex-col items-center gap-4 p-10 text-center sm:p-14">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-700">
            ✓
          </div>
          <h2 class="text-[22px] font-bold text-slate-900">Message envoyé</h2>
          <p class="max-w-[22rem] text-[14.5px] leading-relaxed text-slate-500">
            Merci {{ name }}, nous revenons vers vous à {{ email }} dans les meilleurs délais.
          </p>
          <button
            type="button"
            class="mt-1 cursor-pointer text-[13.5px] font-bold text-[var(--color-primary)] hover:opacity-70"
            @click="resetForm"
          >
            Envoyer un autre message
          </button>
        </div>

        <!-- Sidebar -->
        <div class="flex flex-col gap-4">
          <div class="card p-5.5">
            <p class="eyebrow mb-3">Coordonnées</p>
            <div class="flex flex-col gap-3">
              <div>
                <p class="mb-0.5 text-xs text-slate-500">E-mail</p>
                <a href="mailto:contact@statsio.fr" class="text-sm font-bold text-slate-900 hover:text-[var(--color-primary)]">
                  contact@statsio.fr
                </a>
              </div>
            </div>
          </div>

          <div class="card p-5.5">
            <p class="mb-2 text-sm font-bold text-slate-900">Besoin d'assistance technique&nbsp;?</p>
            <p class="mb-2.5 text-[13px] leading-relaxed text-slate-500">
              Pour un problème avec votre compte ou un bug, passez plutôt par le support dédié.
            </p>
            <a
              href="mailto:support@statsio.fr"
              class="text-[13px] font-bold text-[var(--color-primary)] hover:opacity-70"
            >
              Contacter le support →
            </a>
          </div>

          <div class="flex gap-2.5">
            <a
              :href="xUrl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Suivre sur X"
              class="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-slate-200 text-slate-700 transition hover:border-slate-300 hover:text-[var(--color-primary)]"
            >
              <FontAwesomeIcon :icon="['fab', 'x-twitter']" class="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
