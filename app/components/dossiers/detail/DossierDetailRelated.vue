<script setup lang="ts">
import { computed } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsHeading from '@/components/ds/DsHeading.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsMeta from '@/components/ds/DsMeta.vue'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'
import { publicDossierListPath, publicDossierPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { useAuthStore } from '@/stores/auth'
import type { DossierRelated } from '@/types/dossier'

defineProps<{
  name: string
  items: DossierRelated[]
}>()

const basePath = useContentBasePath()
const auth = useAuthStore()
const listPath = computed(() => publicDossierListPath(basePath.value))
const studioTo = computed(() => (auth.isAuthenticated ? '/studio' : '/register'))
</script>

<template>
  <section class="dd-rel" aria-labelledby="dd-rel">
    <div class="dd-rel__h">
      <div>
        <DsLabel>À suivre aussi</DsLabel>
        <DsHeading id="dd-rel" :level="2" size="xl">Dossiers <em>liés</em></DsHeading>
      </div>
      <DsButton :to="listPath" variant="secondary" size="sm">
        Tous les dossiers <span aria-hidden="true">→</span>
      </DsButton>
    </div>
    <div class="dd-cards">
      <article v-for="item in items" :key="item.slug" class="dd-dos">
        <div class="dd-top">
          <span class="dd-tab">
            <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true">
              <path
                d="M1 2.2C1 1.5 1.5 1 2.2 1H6l1.6 1.8h6.2c.7 0 1.2.5 1.2 1.2v7.8c0 .7-.5 1.2-1.2 1.2H2.2c-.7 0-1.2-.5-1.2-1.2Z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linejoin="round"
              />
              <path d="M1 5.2h14" stroke="currentColor" stroke-width="1.8" />
            </svg>
            Dossier · <b>{{ item.content_count }} contenus</b>
          </span>
        </div>
        <DsBox class="dd-relcard">
          <NuxtLink class="dd-relcard__im" :to="publicDossierPath(item.slug, basePath)" tabindex="-1" aria-hidden="true">
            <AppMediaImage :src="item.image_url" :alt="item.name" />
          </NuxtLink>
          <div class="dd-relcard__bd">
            <NuxtLink :to="publicDossierPath(item.slug, basePath)">
              <h3>{{ item.name }}</h3>
            </NuxtLink>
            <DsMeta>{{ item.content_count }} contenus</DsMeta>
          </div>
        </DsBox>
      </article>

      <article class="dd-dos dd-ghost">
        <div class="dd-top">
          <span class="dd-tab">Vous publiez sur ce sujet ?</span>
        </div>
        <DsBox class="dd-relcard">
          <DsLabel>Studio · <b>publication</b></DsLabel>
          <h3>Rangez votre contenu dans « {{ name }} »</h3>
          <p>
            Au moment de publier un StatsData, un article ou un sondage, choisissez ce dossier : le
            Studio le suggère quand votre titre s'en rapproche.
          </p>
          <DsButton :to="studioTo">Ouvrir le Studio <span aria-hidden="true">→</span></DsButton>
        </DsBox>
      </article>
    </div>
  </section>
</template>
