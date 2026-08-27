<script setup lang="ts">
import { ref } from 'vue'
import { useModalA11y } from '@/composables/useModalA11y'
import { useStudioVariables } from '@/composables/useStudioVariables'

const props = withDefaults(
  defineProps<{
    /** Page whose variables are offered. Defaults to the current Studio page. */
    pageId?: string
    /** Human context shown in the header, e.g. "Titre · contenu". */
    context?: string
  }>(),
  { context: '' },
)

const emit = defineEmits<{ close: []; pick: [token: string] }>()

const panel = ref<HTMLElement | null>(null)
useModalA11y(panel, () => emit('close'))

const search = ref('')
const { filteredGroups, isEmpty } = useStudioVariables(() => props.pageId)

function pick(name: string) {
  emit('pick', '{{' + name + '}}')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[190] flex items-center justify-center bg-[rgba(18,18,26,0.5)] p-10 backdrop-blur-[3px]"
      @click.self="emit('close')"
    >
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        class="flex h-[620px] max-h-full w-[560px] max-w-full flex-col overflow-hidden rounded-[20px] bg-white font-sans shadow-[var(--studio-shadow-modal)]"
      >
        <div class="flex shrink-0 items-start justify-between gap-3.5 border-b border-[var(--studio-line)] px-[26px] pb-4 pt-[22px]">
          <div class="min-w-0">
            <div class="flex items-center gap-2.5">
              <span class="studio-tag text-[13px]">{ }</span>
              <span class="text-[18px] font-extrabold text-[var(--studio-ink)]">Insérer une variable</span>
            </div>
            <div class="mt-1.5 text-[12.5px] leading-[1.5] text-[var(--studio-muted)] [text-wrap:pretty]">
              La valeur est calculée à la publication, pour chaque lecteur.<template v-if="context"> Cible : {{ context }}</template>
            </div>
          </div>
          <button
            type="button"
            class="shrink-0 text-[16px] leading-none text-[var(--studio-faint)] hover:text-[var(--studio-ink)]"
            aria-label="Fermer"
            @click="emit('close')"
          >✕</button>
        </div>

        <div class="shrink-0 px-[26px] pb-2.5 pt-3.5">
          <div class="flex items-center gap-[9px] rounded-full border-[1.5px] border-[var(--studio-line-strong)] px-[15px] py-2.5 focus-within:border-[var(--color-primary)]">
            <span class="h-3 w-3 shrink-0 rounded-full border-[1.6px] border-[color:color-mix(in_srgb,var(--studio-ink)_35%,transparent)]" />
            <input
              v-model="search"
              type="search"
              placeholder="Rechercher une variable…"
              class="min-w-0 flex-1 bg-transparent text-[13.5px] text-[var(--studio-ink)] placeholder:text-[var(--studio-faint)] focus:outline-none"
            />
          </div>
        </div>

        <div class="flex min-h-0 flex-1 flex-col gap-[18px] overflow-auto px-[26px] pb-6 pt-1.5">
          <div v-for="group in filteredGroups(search)" :key="group.key">
            <div class="mb-2.5 flex items-center gap-2.5">
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-[9.5px] font-semibold"
                :style="{ background: group.iconBg, color: group.iconFg }"
              >{{ group.iconText }}</span>
              <span class="min-w-0">
                <span class="block truncate text-[13px] font-bold text-[var(--studio-ink)]">{{ group.name }}</span>
                <span class="mt-px block font-mono text-[10px] text-[var(--studio-faint)]">{{ group.meta }}</span>
              </span>
            </div>
            <div class="flex flex-col gap-1.5">
              <button
                v-for="item in group.items"
                :key="item.name"
                type="button"
                class="flex items-center justify-between gap-3 rounded-[11px] border-[1.5px] border-[var(--studio-line)] bg-white px-[13px] py-2.5 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--studio-accent-wash)]"
                @click="pick(item.name)"
              >
                <span class="truncate font-mono text-[12px] font-semibold text-[var(--studio-tag-ink)]">{{ '{' + '{' + item.name + '}' + '}' }}</span>
                <span class="shrink-0 whitespace-nowrap text-[11.5px] text-[var(--studio-faint)]">{{ item.hint }}</span>
              </button>
            </div>
          </div>

          <p v-if="isEmpty" class="text-[13px] leading-[1.55] text-[var(--studio-faint)]">
            Aucune variable disponible : ajoutez un bloc Recherche qui cible cette page, ou définissez un paramètre de page template.
          </p>
          <p v-else-if="filteredGroups(search).length === 0" class="text-[13px] text-[var(--studio-faint)]">
            Aucune variable ne correspond à «&nbsp;{{ search }}&nbsp;».
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
