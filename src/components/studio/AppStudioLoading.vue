<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    message?: string
    overlay?: boolean
  }>(),
  {
    label: 'Studio',
    message: 'Préparation de votre espace de création...',
    overlay: false,
  },
)
</script>

<template>
  <div
    class="flex flex-col items-center justify-center px-6"
    :class="[
      overlay
        ? 'fixed inset-0 z-[100] bg-white/70 backdrop-blur-md'
        : 'flex-1 bg-slate-50/50 py-16',
    ]"
  >
    <div class="relative flex flex-col items-center">
      <!-- Logo Studio avec animation personnalisée -->
      <div class="relative mb-10 h-28 w-28">
        <!-- Cercle de fond animé -->
        <div class="absolute inset-0 animate-ping rounded-full bg-primary/10 duration-[2000ms]"></div>
        
        <!-- Logo SVG -->
        <img
          src="@/assets/brand/statsio-studio.svg"
          alt="Action en cours"
          class="relative z-10 h-full w-full animate-[studio-float_3s_ease-in-out_infinite]"
        />
        
        <!-- Ombre portée animée -->
        <div class="mx-auto mt-2 h-1.5 w-12 animate-[studio-shadow_3s_ease-in-out_infinite] rounded-full bg-slate-900/5 blur-sm"></div>
      </div>

      <div class="text-center">
        <h2 class="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          {{ label }}
        </h2>
        <div class="mt-3 flex items-center justify-center gap-1.5">
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></span>
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></span>
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"></span>
        </div>
        <p class="mt-6 text-xs font-medium text-slate-500">
          {{ message }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes studio-float {
  0%, 100% {
    transform: translateY(0) rotate(0);
  }
  50% {
    transform: translateY(-10px) rotate(2deg);
  }
}

@keyframes studio-shadow {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(0.8);
    opacity: 0.5;
  }
}
</style>
