import { ref } from 'vue'

/** Onglet de config actif pour le bloc sélectionné (mobile ET desktop, source unique) + palier du bottom sheet mobile. */
export function useStudioMobileSheet() {
  const activeBlockTab = ref('data')
  const mobileSheetSnap = ref<'closed' | 'half' | 'full'>('closed')

  function openMobileSheet(snap: 'half' | 'full' = 'half') {
    mobileSheetSnap.value = snap
  }

  function closeMobileSheet() {
    mobileSheetSnap.value = 'closed'
  }

  function setMobileSheetSnap(snap: 'closed' | 'half' | 'full') {
    mobileSheetSnap.value = snap
  }

  return { activeBlockTab, mobileSheetSnap, openMobileSheet, closeMobileSheet, setMobileSheetSnap }
}
