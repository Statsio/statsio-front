<script setup lang="ts">
import AppCheckbox from '@/components/ui/AppCheckbox.vue'

const agreements = defineModel<{ rgpd: boolean; publicVisibility: boolean; termsOfService: boolean }>({ required: true })
</script>

<template>
  <div class="flex flex-col gap-4 py-2">
    <AppCheckbox
      v-model="agreements.rgpd"
      required
      label="J'accepte la politique de confidentialité et le traitement de mes données personnelles"
      description="Vos données seront traitées conformément au RGPD. Vous pouvez consulter notre politique de confidentialité pour plus d'informations."
    />

    <AppCheckbox
      v-model="agreements.publicVisibility"
      required
      label="J'accepte que ma chaîne soit rendue publique et visible de tous"
      description="Votre chaîne sera accessible publiquement sur Statsio. Les utilisateurs pourront s'abonner et consulter vos contenus."
    />

    <AppCheckbox
      v-model="agreements.termsOfService"
      required
      label="J'accepte les conditions générales d'utilisation de Statsio"
      description="En créant une chaîne, vous acceptez de respecter nos règles de publication et notre charte éditoriale."
    />
  </div>
</template>
