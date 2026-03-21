<template>
  <header class="relative z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
    <div class="container flex items-center justify-between py-5">
      <div class="flex items-center gap-4">
        <img
          src="@/assets/brand/statsio-logo.svg"
          alt="Statsio"
          class="h-10 w-10 rounded-xl bg-white"
        />
        <div>
          <p class="eyebrow text-slate-500">Statsio</p>
          <p class="text-base font-semibold text-slate-900">Le média des chiffres</p>
        </div>
      </div>

      <nav class="hidden items-center gap-8 text-sm font-semibold text-slate-500 lg:flex">
        <a class="transition hover:text-slate-900" href="#">Articles</a>
        <a class="transition hover:text-slate-900" href="#">StatsData</a>
        <a class="transition hover:text-slate-900" href="#">Sondages</a>
        <a class="transition hover:text-slate-900" href="#">Chaînes</a>
      </nav>

      <div class="flex items-center gap-3">
        <button
          class="hidden rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 md:inline-flex"
        >
          Connexion
        </button>
        <button class="btn-primary">
          Créer un article
          <span class="text-base">→</span>
        </button>
      </div>
    </div>
  </header>
</template>
