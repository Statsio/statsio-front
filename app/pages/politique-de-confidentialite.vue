<script setup lang="ts">
import AppBadge from '@/components/ui/AppBadge.vue'

definePageMeta({
  layout: 'default',
  title: 'Politique de confidentialité',
  description:
    "Comment Statsio collecte, utilise et protège vos données personnelles, et comment exercer vos droits au titre du RGPD.",
})

const LAST_UPDATE = '8 septembre 2026'

const sections = [
  { id: 'responsable', label: 'Responsable du traitement' },
  { id: 'donnees', label: 'Données que nous collectons' },
  { id: 'finalites', label: 'Finalités et bases légales' },
  { id: 'destinataires', label: 'Destinataires et sous-traitants' },
  { id: 'transferts', label: 'Transferts hors Union européenne' },
  { id: 'durees', label: 'Durées de conservation' },
  { id: 'cookies', label: 'Cookies et mesure d’audience' },
  { id: 'droits', label: 'Vos droits' },
  { id: 'securite', label: 'Sécurité' },
  { id: 'mineurs', label: 'Mineurs' },
  { id: 'modifications', label: 'Modifications' },
]
</script>

<template>
  <main class="pb-4">
    <section class="section !pb-10">
      <div class="container max-w-3xl flex flex-col gap-4">
        <AppBadge variant="soft-primary" mono class="w-fit">Confidentialité</AppBadge>
        <h1 class="text-4xl font-bold leading-tight text-slate-900 sm:text-[38px]">
          Politique de confidentialité
        </h1>
        <p class="text-[15.5px] leading-relaxed text-slate-500">
          Cette politique décrit les données personnelles traitées lorsque vous utilisez Statsio
          (<a href="https://statsio.fr" class="underline">statsio.fr</a> et ses sous-domaines), les
          raisons de ces traitements et les moyens dont vous disposez pour les maîtriser.
        </p>
        <p class="text-[13px] text-slate-400">Dernière mise à jour : {{ LAST_UPDATE }}</p>
      </div>
    </section>

    <section class="!pt-0">
      <div class="container max-w-3xl legal-prose">
        <nav aria-label="Sommaire" class="card mb-10 p-5 text-sm">
          <p class="eyebrow mb-3">Sommaire</p>
          <ol class="grid gap-1.5 sm:grid-cols-2">
            <li v-for="s in sections" :key="s.id">
              <a :href="`#${s.id}`" class="text-slate-600 hover:text-[var(--color-primary)]">{{ s.label }}</a>
            </li>
          </ol>
        </nav>

        <p class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13.5px] text-amber-900">
          Statsio est une plateforme développée par un particulier dans le cadre d’un projet
          d’études de Mastère&nbsp;2 (titre RNCP «&nbsp;Expert en développement logiciel&nbsp;»). Le
          service est fourni à titre pédagogique et non commercial, et peut évoluer ou être
          interrompu à tout moment.
        </p>

        <h2 id="responsable">1. Responsable du traitement</h2>
        <p>
          Le responsable du traitement des données est&nbsp;:
        </p>
        <ul>
          <li>Corentin GESSE ENTRESSANGLE, personne physique, éditeur du site Statsio&nbsp;;</li>
          <li>Contact&nbsp;: <a href="mailto:contact@statsio.fr">contact@statsio.fr</a></li>
        </ul>
        <p>
          Aucun délégué à la protection des données (DPO) n’est désigné, le projet n’y étant pas
          soumis. Pour toute question relative à vos données, écrivez à l’adresse ci-dessus.
        </p>

        <h2 id="donnees">2. Données que nous collectons</h2>
        <p>Nous collectons uniquement les données nécessaires au fonctionnement du service&nbsp;:</p>

        <h3>Création et gestion de compte</h3>
        <ul>
          <li>Nom, prénom ou pseudonyme, adresse e-mail, mot de passe (stocké sous forme hachée) ;</li>
          <li>Date de naissance renseignée à l’inscription ;</li>
          <li>Photo de profil (facultative) ;</li>
          <li>
            Si vous vous connectez avec Google&nbsp;: nom, adresse e-mail, photo et identifiant de
            compte Google transmis par Google lors de la connexion.
          </li>
        </ul>

        <h3>Contenus et activité</h3>
        <ul>
          <li>
            Contenus que vous créez ou publiez&nbsp;: chaînes, articles, pages StatsData, sondages,
            dossiers, sources de données importées ;
          </li>
          <li>Favoris, historique de consultation, chaînes suivies, abonnements ;</li>
          <li>Réponses aux sondages auxquels vous participez.</li>
        </ul>

        <h3>Vérification d’identité (certains sondages)</h3>
        <p>
          Certains sondages exigent une vérification d’identité afin de garantir l’intégrité des
          résultats. Cette vérification est réalisée par notre prestataire Didit. Les pièces
          d’identité et données biométriques éventuelles sont traitées par Didit&nbsp;; Statsio ne
          conserve qu’un statut («&nbsp;vérifié&nbsp;» / «&nbsp;non vérifié&nbsp;») et l’identifiant
          technique de la session de vérification.
        </p>

        <h3>Formulaire de contact</h3>
        <ul>
          <li>Nom, adresse e-mail, société ou chaîne (facultatif), contenu du message.</li>
        </ul>

        <h3>Données techniques</h3>
        <ul>
          <li>
            Adresse IP, date et heure des requêtes, pages consultées, type de navigateur et
            d’appareil, présents dans les journaux techniques du serveur ;
          </li>
          <li>
            Données de sécurité anti-robot générées par Cloudflare Turnstile sur les formulaires
            (contact, inscription, connexion) ;
          </li>
          <li>
            En cas d’erreur applicative dans votre navigateur, un rapport d’incident est transmis à
            Sentry (URL concernée, pile d’appels, navigateur, actions récentes).
          </li>
        </ul>

        <h2 id="finalites">3. Finalités et bases légales</h2>
        <table>
          <thead>
            <tr><th>Finalité</th><th>Base légale (RGPD)</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Créer et gérer votre compte, fournir les fonctionnalités de la plateforme</td>
              <td>Exécution des conditions d’utilisation (contrat)</td>
            </tr>
            <tr>
              <td>Publier et diffuser les contenus que vous créez</td>
              <td>Exécution du contrat</td>
            </tr>
            <tr>
              <td>Assurer la sécurité du service, prévenir la fraude et les abus, superviser le fonctionnement</td>
              <td>Intérêt légitime</td>
            </tr>
            <tr>
              <td>Vérifier l’identité des répondants sur les sondages qui l’exigent</td>
              <td>Intérêt légitime (intégrité des résultats) et votre consentement à participer</td>
            </tr>
            <tr>
              <td>Répondre à vos demandes via le formulaire de contact</td>
              <td>Intérêt légitime</td>
            </tr>
            <tr>
              <td>Mesurer l’audience du site (statistiques de fréquentation)</td>
              <td>Votre consentement</td>
            </tr>
          </tbody>
        </table>

        <h2 id="destinataires">4. Destinataires et sous-traitants</h2>
        <p>
          Vos données ne sont ni vendues ni louées. Elles sont accessibles à l’éditeur du site et
          aux prestataires techniques strictement nécessaires au service&nbsp;:
        </p>
        <ul>
          <li><strong>Contabo GmbH</strong> (Allemagne) — hébergement du serveur applicatif et de la base de données ;</li>
          <li><strong>Cloudflare, Inc.</strong> (États-Unis) — diffusion du site (Cloudflare Workers), stockage des fichiers et médias (Cloudflare R2), protection anti-robot (Turnstile) ;</li>
          <li><strong>Google LLC</strong> (États-Unis) — connexion via Google, mesure d’audience (Google Analytics / Tag Manager, soumis au consentement), polices de caractères ;</li>
          <li><strong>Didit</strong> — vérification d’identité pour les sondages concernés ;</li>
          <li><strong>Functional Software, Inc. (Sentry)</strong> (États-Unis) — collecte des erreurs applicatives ;</li>
          <li>Un service d’envoi d’e-mails transactionnels (confirmation d’inscription, réinitialisation de mot de passe, notifications).</li>
        </ul>
        <p>
          Des données peuvent également être communiquées aux autorités administratives ou
          judiciaires lorsque la loi l’impose.
        </p>

        <h2 id="transferts">5. Transferts hors Union européenne</h2>
        <p>
          Certains prestataires (Cloudflare, Google, Sentry) sont établis aux États-Unis. Les
          transferts correspondants sont encadrés par les clauses contractuelles types de la
          Commission européenne et, le cas échéant, par l’adhésion de ces sociétés au
          <em>Data Privacy Framework</em> UE–États-Unis. L’hébergement principal (serveur et base
          de données) est situé dans l’Union européenne.
        </p>

        <h2 id="durees">6. Durées de conservation</h2>
        <ul>
          <li>
            <strong>Compte et données associées</strong>&nbsp;: conservés tant que le compte est
            actif, puis supprimés ou anonymisés dans un délai raisonnable après une demande de
            suppression ou une inactivité prolongée ;
          </li>
          <li>
            <strong>Contenus publiés</strong>&nbsp;: conservés tant qu’ils sont en ligne, jusqu’à
            leur suppression par vous ou par l’éditeur ;
          </li>
          <li><strong>Journaux techniques</strong>&nbsp;: 12 mois maximum ;</li>
          <li><strong>Messages envoyés via le formulaire de contact</strong>&nbsp;: 12 mois maximum ;</li>
          <li>
            <strong>Données de vérification d’identité</strong>&nbsp;: le statut de vérification est
            conservé le temps nécessaire à l’exploitation du sondage&nbsp;; les pièces sont conservées
            par Didit selon sa propre politique ;
          </li>
          <li>
            <strong>Cookies de mesure d’audience</strong>&nbsp;: 13 mois maximum&nbsp;; le choix de
            consentement est conservé jusqu’à 12 mois.
          </li>
        </ul>

        <h2 id="cookies">7. Cookies et mesure d’audience</h2>
        <p>
          Le site dépose des cookies et technologies similaires strictement nécessaires à son
          fonctionnement (session, mémorisation de votre choix de consentement) qui ne requièrent
          pas votre accord, ainsi que des cookies soumis à consentement&nbsp;:
        </p>
        <ul>
          <li><strong>Google Analytics / Google Tag Manager</strong>&nbsp;: mesure d’audience ;</li>
          <li><strong>YouTube, Vimeo, Dailymotion</strong>&nbsp;: lecture de vidéos intégrées ;</li>
          <li><strong>Google Fonts</strong>&nbsp;: chargement des polices.</li>
        </ul>
        <p>
          Vous pouvez accepter, refuser ou modifier vos choix à tout moment via le bandeau cookies,
          accessible en bas de page par le lien «&nbsp;Gérer les cookies&nbsp;». Le refus des
          cookies non essentiels n’empêche pas l’accès au site.
        </p>

        <h2 id="droits">8. Vos droits</h2>
        <p>
          Conformément au Règlement général sur la protection des données (RGPD) et à la loi
          «&nbsp;Informatique et Libertés&nbsp;», vous disposez des droits suivants&nbsp;: droit
          d’accès, de rectification, d’effacement, de limitation, d’opposition, de portabilité de
          vos données, ainsi que du droit de retirer votre consentement à tout moment et de définir
          des directives relatives au sort de vos données après votre décès.
        </p>
        <p>
          Pour exercer ces droits, écrivez à
          <a href="mailto:contact@statsio.fr">contact@statsio.fr</a>. Une pièce justificative
          d’identité pourra être demandée en cas de doute raisonnable sur votre identité.
        </p>
        <p>
          Vous pouvez également introduire une réclamation auprès de la Commission nationale de
          l’informatique et des libertés (CNIL), 3 place de Fontenoy — TSA 80715 — 75334 Paris
          Cedex 07, <a href="https://www.cnil.fr" rel="noopener noreferrer" target="_blank">www.cnil.fr</a>.
        </p>

        <h2 id="securite">9. Sécurité</h2>
        <p>
          Les échanges sont chiffrés en HTTPS/TLS, les mots de passe sont stockés hachés, les
          environnements de développement, de pré-production et de production sont isolés, et
          l’accès aux données est restreint à l’éditeur. Le fonctionnement du service fait l’objet
          d’une supervision (journaux, alertes, suivi de disponibilité).
        </p>

        <h2 id="mineurs">10. Mineurs</h2>
        <p>
          Le service n’est pas destiné aux personnes de moins de 15 ans. Si vous constatez qu’un
          compte a été créé pour un mineur sans autorisation, contactez-nous afin que nous
          procédions à sa suppression.
        </p>

        <h2 id="modifications">11. Modifications</h2>
        <p>
          Cette politique peut être mise à jour pour refléter des évolutions du service ou de la
          réglementation. La date de dernière mise à jour figure en tête de page&nbsp;; en cas de
          changement significatif, une information sera affichée sur le site.
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
  color: var(--color-slate-900, #0f172a);
  scroll-margin-top: 7rem;
}
.legal-prose :where(h3) {
  margin-top: 1.5rem;
  margin-bottom: 0.4rem;
  font-size: 1.02rem;
  font-weight: 700;
  color: var(--color-slate-900, #0f172a);
}
.legal-prose :where(p) {
  margin: 0.75rem 0;
  line-height: 1.7;
  color: #475569;
  font-size: 15px;
}
.legal-prose :where(ul, ol):not(nav ol) {
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
.legal-prose :where(a):not(.card a) {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.legal-prose :where(table) {
  width: 100%;
  margin: 1rem 0;
  border-collapse: collapse;
  font-size: 14px;
}
.legal-prose :where(th, td) {
  border: 1px solid #e2e8f0;
  padding: 0.6rem 0.75rem;
  text-align: left;
  vertical-align: top;
  color: #475569;
}
.legal-prose :where(th) {
  background: #f8fafc;
  color: #0f172a;
  font-weight: 700;
}
.legal-prose :where(strong) {
  color: #0f172a;
}
</style>
