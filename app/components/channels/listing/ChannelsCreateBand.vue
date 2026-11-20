<script setup lang="ts">
import DsButton from '@/components/ds/DsButton.vue'
import ListingPublishBand from '@/components/listing/tranches/ListingPublishBand.vue'

/**
 * Bande « Créer » du listing des chaînes. Le CTA ouvre la création de chaîne de
 * l'espace compte (`?create=1`) ; son middleware renvoie vers la connexion si besoin.
 */
const CREATE_CHANNEL = { path: '/user/chaines', query: { create: '1' } }
</script>

<template>
  <ListingPublishBand>
    <template #label>Créer · <b>gratuit</b></template>
    <template #title>Ouvrez votre chaîne en quelques minutes.</template>
    Un espace public pour vos jeux de données, vos articles et vos consultations, avec les
    statistiques d'audience et la vérification du compte.
    <template #actions>
      <DsButton :to="CREATE_CHANNEL">Créer ma chaîne <span aria-hidden="true">→</span></DsButton>
      <DsButton to="/about" variant="secondary">Charte éditoriale</DsButton>
    </template>
  </ListingPublishBand>
</template>
