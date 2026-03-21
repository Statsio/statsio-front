<template>
  <section class="section">
    <div class="container">
      <div
        class="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 p-10 text-white shadow-2xl"
      >
        <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
        <div class="absolute -bottom-14 left-10 h-44 w-44 rounded-full bg-white/5"></div>
        <div class="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div class="flex items-center gap-3">
              <img
                src="@/assets/brand/statsio-white.svg"
                alt="Statsio"
                class="h-8 w-8"
              />
              <p class="eyebrow text-white/60">Passer en mode pro</p>
            </div>
            <h2 class="mt-3 text-3xl font-semibold">Transformez vos chiffres en audience</h2>
            <p class="mt-4 text-sm text-white/70">
              Créez votre chaîne, automatisez vos StatsData et publiez des articles enrichis.
            </p>
          </div>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button class="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900">
              Demander une démo
            </button>
            <button
              class="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white"
            >
              Voir les offres
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
