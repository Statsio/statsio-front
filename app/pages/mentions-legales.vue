<script setup lang="ts">
import AppBadge from '@/components/ui/AppBadge.vue'

definePageMeta({
  layout: 'default',
  title: 'Mentions légales',
  description:
    "Informations légales relatives à l’éditeur et à l’hébergement du site Statsio.",
})

const LAST_UPDATE = '8 septembre 2026'
</script>

<template>
  <main class="pb-4">
    <section class="section !pb-10">
      <div class="container max-w-3xl flex flex-col gap-4">
        <AppBadge variant="soft-primary" mono class="w-fit">Informations légales</AppBadge>
        <h1 class="text-4xl font-bold leading-tight text-slate-900 sm:text-[38px]">
          Mentions légales
        </h1>
        <p class="text-[15.5px] leading-relaxed text-slate-500">
          Informations relatives à l’éditeur et à l’hébergement du site Statsio, en application des
          articles 6-III et 19 de la loi n°&nbsp;2004-575 du 21 juin 2004 pour la confiance dans
          l’économie numérique.
        </p>
        <p class="text-[13px] text-slate-400">Dernière mise à jour : {{ LAST_UPDATE }}</p>
      </div>
    </section>

    <section class="!pt-0">
      <div class="container max-w-3xl legal-prose">
        <p class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13.5px] text-amber-900">
          Statsio est un projet développé par un particulier dans le cadre d’un projet d’études de
          Mastère&nbsp;2 (titre RNCP&nbsp;39583 «&nbsp;Expert en développement logiciel&nbsp;»). Le
          site est publié à des fins pédagogiques et de démonstration, sans but lucratif.
        </p>

        <h2>1. Éditeur du site</h2>
        <p>Le site Statsio, accessible à l’adresse <a href="https://statsio.fr">https://statsio.fr</a> et à ses sous-domaines, est édité par&nbsp;:</p>
        <ul>
          <li><strong>Corentin GESSE ENTRESSANGLE</strong>, personne physique agissant à titre non professionnel ;</li>
          <li>Contact&nbsp;: <a href="mailto:contact@statsio.fr">contact@statsio.fr</a> ;</li>
          <li>
            L’éditeur agissant en qualité de particulier dans un cadre étudiant, il n’est pas
            immatriculé au registre du commerce et des sociétés et ne dispose pas de numéro SIRET
            ni de numéro de TVA intracommunautaire. Son adresse postale est communiquée sur simple
            demande aux personnes justifiant d’un intérêt légitime, ainsi qu’aux autorités.
          </li>
        </ul>

        <h2>2. Directeur de la publication</h2>
        <p>Le directeur de la publication est Corentin GESSE ENTRESSANGLE.</p>

        <h2>3. Hébergement</h2>
        <p>Le site repose sur une infrastructure répartie entre plusieurs prestataires&nbsp;:</p>
        <ul>
          <li>
            <strong>Interface web</strong> (<a href="https://statsio.fr">statsio.fr</a>) et
            <strong>stockage des fichiers et médias</strong>&nbsp;: Cloudflare,&nbsp;Inc., 101
            Townsend Street, San Francisco, CA 94107, États-Unis —
            <a href="https://www.cloudflare.com" rel="noopener noreferrer" target="_blank">cloudflare.com</a>
            (déploiement sur Cloudflare Workers, stockage objet Cloudflare R2).
          </li>
          <li>
            <strong>Serveur applicatif et base de données</strong> (API, sous-domaine
            <em>api.statsio.fr</em>)&nbsp;: serveur privé virtuel loué auprès de Contabo&nbsp;GmbH,
            Aschauer Straße 32a, 81549 Munich, Allemagne —
            <a href="https://contabo.com" rel="noopener noreferrer" target="_blank">contabo.com</a>.
          </li>
        </ul>

        <h2>4. Propriété intellectuelle</h2>
        <p>
          Le code source, l’identité visuelle, la structure du site et les contenus éditoriaux
          originaux produits par l’éditeur sont protégés par le droit de la propriété
          intellectuelle. Toute reproduction ou réutilisation non autorisée est interdite.
        </p>
        <p>
          Les jeux de données exploités sur la plateforme proviennent en majorité de sources
          publiques ouvertes (notamment data.gouv.fr et les producteurs de données publiques) et
          restent soumis à leurs licences respectives. Les marques, logos et noms de chaînes ou
          d’organisations cités demeurent la propriété de leurs titulaires respectifs et sont
          utilisés à des fins d’information.
        </p>

        <h2>5. Contenus publiés par les utilisateurs</h2>
        <p>
          Statsio permet à des utilisateurs inscrits de créer et publier des contenus (articles,
          pages de données, sondages, chaînes). L’éditeur agit comme hébergeur de ces contenus au
          sens de la loi pour la confiance dans l’économie numérique et n’exerce pas de contrôle
          éditorial <em>a priori</em>. Chaque auteur demeure responsable des contenus qu’il publie.
        </p>
        <p>
          Les données affichées, issues de sources tierces, peuvent comporter des erreurs, des
          retards de mise à jour ou des imprécisions&nbsp;: elles sont fournies à titre informatif
          et sans garantie d’exactitude ou d’exhaustivité.
        </p>

        <h2>6. Signalement de contenu illicite</h2>
        <p>
          Tout contenu que vous estimeriez illicite ou portant atteinte à vos droits peut être
          signalé à <a href="mailto:contact@statsio.fr">contact@statsio.fr</a> en précisant l’URL
          concernée et le motif du signalement. L’éditeur s’engage à traiter les signalements dans
          les meilleurs délais et à retirer promptement tout contenu manifestement illicite.
        </p>

        <h2>7. Liens hypertextes</h2>
        <p>
          Le site peut contenir des liens vers des sites tiers sur lesquels l’éditeur n’exerce
          aucun contrôle et dont il ne saurait être tenu responsable.
        </p>

        <h2>8. Données personnelles et cookies</h2>
        <p>
          Le traitement des données personnelles et l’usage des cookies sont décrits dans la
          <NuxtLink to="/politique-de-confidentialite">politique de confidentialité</NuxtLink>.
        </p>

        <h2>9. Disponibilité du service</h2>
        <p>
          S’agissant d’un projet étudiant, le service est fourni «&nbsp;en l’état&nbsp;», sans
          garantie de disponibilité, et peut être modifié, suspendu ou interrompu à tout moment
          sans préavis.
        </p>

        <h2>10. Droit applicable</h2>
        <p>
          Les présentes mentions légales sont soumises au droit français. Tout litige relatif à
          leur interprétation ou à l’utilisation du site relève, à défaut de résolution amiable, de
          la compétence des juridictions françaises.
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.legal-prose :where(h2) {
  margin-top: 2.5rem;
  margin-bottom: 0.75rem;
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  scroll-margin-top: 7rem;
}
.legal-prose :where(p) {
  margin: 0.75rem 0;
  line-height: 1.7;
  color: #475569;
  font-size: 15px;
}
.legal-prose :where(ul) {
  margin: 0.75rem 0;
  padding-left: 1.25rem;
  list-style: disc;
  color: #475569;
  font-size: 15px;
  line-height: 1.7;
}
.legal-prose :where(li) {
  margin: 0.3rem 0;
}
.legal-prose :where(a) {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.legal-prose :where(strong) {
  color: #0f172a;
}
</style>
