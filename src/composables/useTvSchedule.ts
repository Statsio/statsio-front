import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { fetchChannelSchedules } from '@/api/tv-schedule'
import type { ChannelSchedule, TimePreset, TimeWindow } from '@/types/tv-schedule'

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getRelativeDate(offsetDays: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d
}

export function useTvSchedule() {
  const selectedPreset = ref<TimePreset>('tonight')
  const selectedDate = ref<string>(toDateStr(new Date()))
  const schedules = ref<ChannelSchedule[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const now = ref<Date>(new Date())

  let clockInterval: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    clockInterval = setInterval(() => {
      now.value = new Date()
    }, 60_000)
  })

  onUnmounted(() => {
    if (clockInterval) clearInterval(clockInterval)
  })

  const effectiveDate = computed<string>(() => {
    if (selectedPreset.value === 'yesterday') return toDateStr(getRelativeDate(-1))
    if (selectedPreset.value === 'tomorrow') return toDateStr(getRelativeDate(1))
    if (selectedPreset.value === 'custom') return selectedDate.value
    return toDateStr(new Date())
  })

  const timeWindow = computed<TimeWindow>(() => {
    const n = now.value
    const nowMin = n.getHours() * 60 + n.getMinutes()

    switch (selectedPreset.value) {
      case 'yesterday':
        return { startMinutes: 6 * 60, endMinutes: 24 * 60, label: 'Hier' }
      case 'morning':
        return { startMinutes: 6 * 60, endMinutes: 12 * 60, label: 'Matin' }
      case 'afternoon':
        return { startMinutes: 12 * 60, endMinutes: 18 * 60, label: 'Après-midi' }
      case 'live':
        return {
          startMinutes: Math.max(0, nowMin - 30),
          endMinutes: Math.min(24 * 60, nowMin + 90),
          label: 'En ce moment',
        }
      case 'tonight':
        return { startMinutes: 18 * 60, endMinutes: 24 * 60, label: 'Ce soir' }
      case 'night':
        return { startMinutes: 23 * 60, endMinutes: 24 * 60, label: 'Nuit' }
      case 'tomorrow':
        return { startMinutes: 6 * 60, endMinutes: 24 * 60, label: 'Demain' }
      case 'custom':
        return { startMinutes: 6 * 60, endMinutes: 24 * 60, label: 'Programme' }
    }
  })

  // Heure d'ancrage pour TvScheduleNowNext : le programme "courant" est celui qui passe à cette minute-là
  const referenceMinutes = computed<number>(() => {
    switch (selectedPreset.value) {
      case 'live':      return now.value.getHours() * 60 + now.value.getMinutes()
      case 'morning':   return 8 * 60
      case 'afternoon': return 14 * 60
      case 'tonight':   return 21 * 60 + 10
      case 'night':     return 23 * 60 + 30
      default:          return 20 * 60  // yesterday / tomorrow / custom
    }
  })

  // Label du badge "courant" dans TvScheduleNowNext
  const currentLabel = computed<string>(() => {
    switch (selectedPreset.value) {
      case 'live':      return 'En cours'
      case 'morning':   return 'Matin'
      case 'afternoon': return 'Après-midi'
      case 'tonight':   return 'Ce soir'
      case 'night':     return 'Nuit'
      default:          return '-'
    }
  })

  async function load() {
    isLoading.value = true
    error.value = null
    try {
      schedules.value = await fetchChannelSchedules(effectiveDate.value)
    } catch {
      error.value = 'Impossible de charger le programme TV. Veuillez réessayer.'
      schedules.value = []
    } finally {
      isLoading.value = false
    }
  }

  watch(effectiveDate, load, { immediate: true })

  function selectPreset(preset: Exclude<TimePreset, 'custom'>) {
    selectedPreset.value = preset
    if (preset === 'yesterday') selectedDate.value = toDateStr(getRelativeDate(-1))
    else if (preset === 'tomorrow') selectedDate.value = toDateStr(getRelativeDate(1))
    else selectedDate.value = toDateStr(new Date())
  }

  function selectDate(dateStr: string) {
    selectedDate.value = dateStr
    selectedPreset.value = 'custom'
  }

  const formattedDate = computed(() =>
    new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(effectiveDate.value + 'T12:00:00')),
  )

  return {
    schedules,
    isLoading,
    error,
    selectedPreset,
    selectedDate,
    timeWindow,
    referenceMinutes,
    currentLabel,
    now,
    formattedDate,
    load,
    selectPreset,
    selectDate,
  }
}
