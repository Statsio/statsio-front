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

function getNextSaturday(): Date {
  const d = new Date()
  const offset = (6 - d.getDay() + 7) % 7 // 0 if today is already Saturday
  d.setDate(d.getDate() + offset)
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
    if (selectedPreset.value === 'tomorrow') return toDateStr(getRelativeDate(1))
    if (selectedPreset.value === 'weekend') return toDateStr(getNextSaturday())
    if (selectedPreset.value === 'custom') return selectedDate.value
    return toDateStr(new Date())
  })

  const timeWindow = computed<TimeWindow>(() => {
    const n = now.value
    const nowMin = n.getHours() * 60 + n.getMinutes()

    switch (selectedPreset.value) {
      case 'live':
        return {
          startMinutes: Math.max(0, nowMin - 30),
          endMinutes: Math.min(24 * 60, nowMin + 90),
          label: 'En ce moment',
        }
      case 'tonight':
        return { startMinutes: 18 * 60, endMinutes: 24 * 60, label: 'Ce soir' }
      case 'tomorrow':
        return { startMinutes: 6 * 60, endMinutes: 24 * 60, label: 'Demain' }
      case 'weekend':
        return { startMinutes: 6 * 60, endMinutes: 24 * 60, label: 'Ce week-end' }
      case 'custom':
        return { startMinutes: 6 * 60, endMinutes: 24 * 60, label: 'Programme' }
    }
  })

  // Heure d'ancrage pour TvScheduleCardView : le programme "courant" est celui qui passe à cette minute-là
  const referenceMinutes = computed<number>(() => {
    switch (selectedPreset.value) {
      case 'live':    return now.value.getHours() * 60 + now.value.getMinutes()
      case 'tonight': return 21 * 60 + 10
      default:        return 20 * 60  // tomorrow / weekend / custom
    }
  })

  // Label du badge "courant" dans TvScheduleCardView
  const currentLabel = computed<string>(() => {
    switch (selectedPreset.value) {
      case 'live':    return 'En cours'
      case 'tonight': return 'Ce soir'
      default:        return '-'
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
    if (preset === 'tomorrow') selectedDate.value = toDateStr(getRelativeDate(1))
    else if (preset === 'weekend') selectedDate.value = toDateStr(getNextSaturday())
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
