export type TvTimePreset = 'yesterday' | 'live' | 'tonight' | 'tomorrow' | 'custom'

export type TvProgramme = {
  title: string
  category: string
  type: string
  durationMinutes: number
  description: string
  avgAdBreaks: number
  avgAdMinutes: number
  reviewScore: number
  archiveAudience: string
  image: string
  imageAlt: string
}

type TvProgrammeSeed = Omit<TvProgramme, 'reviewScore' | 'archiveAudience' | 'image' | 'imageAlt'>

export type TvChannelSchedule = {
  id: string
  name: string
  slug: string
  toneClass: string
  programmes: Array<
    TvProgramme & {
      startsAt: string
      endsAt: string
    }
  >
}

type ChannelSeed = {
  id: string
  name: string
  slug: string
  toneClass: string
  catalog: TvProgrammeSeed[]
}

type ProgramImageTheme = { from: string; to: string; accent: string }

const programImageThemes: Record<string, ProgramImageTheme> = {
  Information: { from: '#0f172a', to: '#1d4ed8', accent: '#bfdbfe' },
  Divertissement: { from: '#3f0d12', to: '#a21caf', accent: '#f5d0fe' },
  Magazine: { from: '#0f3d2e', to: '#0f766e', accent: '#99f6e4' },
  Jeu: { from: '#7c2d12', to: '#ea580c', accent: '#fed7aa' },
  Fiction: { from: '#312e81', to: '#7c3aed', accent: '#ddd6fe' },
  Documentaire: { from: '#164e63', to: '#0891b2', accent: '#bae6fd' },
  Sport: { from: '#14532d', to: '#16a34a', accent: '#bbf7d0' },
  Culture: { from: '#581c87', to: '#9333ea', accent: '#e9d5ff' },
  Cinema: { from: '#111827', to: '#4b5563', accent: '#e5e7eb' },
  Humour: { from: '#7f1d1d', to: '#ef4444', accent: '#fecaca' },
}

const getProgramImageTheme = (category: string): ProgramImageTheme => {
  if (category === 'Cinéma') {
    return programImageThemes.Cinema!
  }

  return programImageThemes[category] ?? { from: '#134e4a', to: '#0f766e', accent: '#ccfbf1' }
}

const escapeSvgText = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const getTitleSeed = (value: string) =>
  Array.from(value).reduce((total, char) => total + char.charCodeAt(0), 0)

const getReviewScore = (programme: TvProgrammeSeed) => {
  const seed = getTitleSeed(programme.title) + programme.avgAdBreaks + programme.durationMinutes
  return Math.max(2, Math.min(5, 3 + (seed % 3)))
}

const getArchiveAudience = (programme: TvProgrammeSeed) => {
  const seed = getTitleSeed(programme.title)
  const audience = 0.6 + ((seed % 48) + programme.durationMinutes / 10) / 10

  return `${audience.toFixed(1).replace('.', ',')}M de téléspectateurs`
}

const buildProgrammeImage = (programme: TvProgrammeSeed) => {
  const theme = getProgramImageTheme(programme.category)
  const title = escapeSvgText(programme.title)
  const category = escapeSvgText(programme.category.toUpperCase())
  const subtitle = escapeSvgText(`${programme.type} - ${programme.durationMinutes} MIN`)
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" role="img" aria-label="${title}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${theme.from}" />
          <stop offset="100%" stop-color="${theme.to}" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" rx="36" fill="url(#bg)" />
      <circle cx="528" cy="88" r="96" fill="${theme.accent}" opacity="0.16" />
      <circle cx="92" cy="304" r="132" fill="${theme.accent}" opacity="0.12" />
      <rect x="42" y="42" width="160" height="34" rx="17" fill="rgba(255,255,255,0.16)" />
      <text x="122" y="64" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#ffffff" letter-spacing="2">${category}</text>
      <text x="42" y="212" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#ffffff">${title}</text>
      <text x="42" y="256" font-family="Arial, sans-serif" font-size="20" font-weight="500" fill="rgba(255,255,255,0.82)">${subtitle}</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`
}

const withProgrammeVisual = (programme: TvProgrammeSeed): TvProgramme => ({
  ...programme,
  reviewScore: getReviewScore(programme),
  archiveAudience: getArchiveAudience(programme),
  image: buildProgrammeImage(programme),
  imageAlt: `Visuel du programme ${programme.title}`,
})

const channelSeeds: ChannelSeed[] = [
  {
    id: 'tf1',
    name: 'TF1',
    slug: 'tf1',
    toneClass: 'bg-[#1f4fd6] text-white',
    catalog: [
      {
        title: 'Bonjour ! La Matinale TF1',
        category: 'Information',
        type: 'Direct',
        durationMinutes: 150,
        description: 'Un grand rendez-vous info et services pour suivre l’actualité, la météo et les premières tendances du jour.',
        avgAdBreaks: 4,
        avgAdMinutes: 18,
      },
      {
        title: 'Les 12 coups de midi',
        category: 'Divertissement',
        type: 'Inédit',
        durationMinutes: 65,
        description: 'Jeu quotidien porté par une forte fidélité d’audience et des écrans publicitaires réguliers.',
        avgAdBreaks: 3,
        avgAdMinutes: 14,
      },
      {
        title: 'Journal de 20H',
        category: 'Information',
        type: 'Direct',
        durationMinutes: 40,
        description: 'Le rendez-vous central de l’antenne avec édition en direct, duplex et séquences de décryptage.',
        avgAdBreaks: 1,
        avgAdMinutes: 6,
      },
      {
        title: 'Danse avec les stars',
        category: 'Divertissement',
        type: 'Évènement',
        durationMinutes: 155,
        description: 'Prime de divertissement premium avec forte exposition annonceurs et nombreuses séquences sponsors.',
        avgAdBreaks: 6,
        avgAdMinutes: 29,
      },
      {
        title: 'Grey’s Anatomy',
        category: 'Fiction',
        type: 'Rediffusion',
        durationMinutes: 95,
        description: 'Série installée en grille de seconde partie de soirée, portée par une audience stable.',
        avgAdBreaks: 4,
        avgAdMinutes: 17,
      },
      {
        title: 'Koh-Lanta',
        category: 'Divertissement',
        type: 'Nouvelle saison',
        durationMinutes: 140,
        description: 'Marque forte de prime time avec pics d’attention sur les épreuves et le conseil final.',
        avgAdBreaks: 5,
        avgAdMinutes: 25,
      },
    ],
  },
  {
    id: 'france-2',
    name: 'France 2',
    slug: 'france-2',
    toneClass: 'bg-[#d7263d] text-white',
    catalog: [
      {
        title: 'Télématin',
        category: 'Magazine',
        type: 'Direct',
        durationMinutes: 160,
        description: 'Magazine matinal mêlant info, culture et vie quotidienne avec une mécanique d’antenne très segmentée.',
        avgAdBreaks: 2,
        avgAdMinutes: 8,
      },
      {
        title: 'Tout le monde veut prendre sa place',
        category: 'Jeu',
        type: 'Inédit',
        durationMinutes: 55,
        description: 'Jeu quotidien très fédérateur sur la tranche déjeuner, au rythme publicitaire mesuré.',
        avgAdBreaks: 2,
        avgAdMinutes: 7,
      },
      {
        title: 'Journal de 20H',
        category: 'Information',
        type: 'Direct',
        durationMinutes: 35,
        description: 'Grand rendez-vous d’information nationale avec architecture éditoriale resserrée.',
        avgAdBreaks: 1,
        avgAdMinutes: 5,
      },
      {
        title: 'Envoyé spécial',
        category: 'Magazine',
        type: 'Inédit',
        durationMinutes: 125,
        description: 'Magazine d’enquête événementialisé avec audience qualitative et forte durée d’écoute.',
        avgAdBreaks: 2,
        avgAdMinutes: 9,
      },
      {
        title: 'Cash Investigation',
        category: 'Magazine',
        type: 'Évènement',
        durationMinutes: 130,
        description: 'Format d’investigation premium, souvent mobilisateur en replay et sur les réseaux.',
        avgAdBreaks: 2,
        avgAdMinutes: 9,
      },
      {
        title: 'Un si grand soleil',
        category: 'Fiction',
        type: 'Inédit',
        durationMinutes: 30,
        description: 'Feuilleton quotidien d’access programmé comme locomotive de début de soirée.',
        avgAdBreaks: 1,
        avgAdMinutes: 4,
      },
    ],
  },
  {
    id: 'france-3',
    name: 'France 3',
    slug: 'france-3',
    toneClass: 'bg-[#2463eb] text-white',
    catalog: [
      {
        title: 'Slam',
        category: 'Jeu',
        type: 'Inédit',
        durationMinutes: 35,
        description: 'Jeu emblématique de l’après-midi avec un public fidèle et une structure d’écran légère.',
        avgAdBreaks: 1,
        avgAdMinutes: 4,
      },
      {
        title: 'Questions pour un champion',
        category: 'Jeu',
        type: 'Inédit',
        durationMinutes: 45,
        description: 'Programme patrimonial de pré-access, stable en audience et très identifiable.',
        avgAdBreaks: 1,
        avgAdMinutes: 4,
      },
      {
        title: '19/20 National',
        category: 'Information',
        type: 'Direct',
        durationMinutes: 45,
        description: 'Édition nationale intégrée à l’offre régionale, au rythme d’antenne très éditorial.',
        avgAdBreaks: 1,
        avgAdMinutes: 5,
      },
      {
        title: 'Des racines et des ailes',
        category: 'Documentaire',
        type: 'Évènement',
        durationMinutes: 120,
        description: 'Prime de découverte patrimoniale à forte durée d’écoute et exposition familiale.',
        avgAdBreaks: 2,
        avgAdMinutes: 8,
      },
      {
        title: 'Meurtres à...',
        category: 'Fiction',
        type: 'Rediffusion',
        durationMinutes: 100,
        description: 'Collection policière installée, performante en prime et en différé.',
        avgAdBreaks: 2,
        avgAdMinutes: 8,
      },
      {
        title: 'Thalassa',
        category: 'Documentaire',
        type: 'Inédit',
        durationMinutes: 110,
        description: 'Magazine premium à tonalité découverte, renforcé par un habillage éditorial fort.',
        avgAdBreaks: 2,
        avgAdMinutes: 8,
      },
    ],
  },
  {
    id: 'm6',
    name: 'M6',
    slug: 'm6',
    toneClass: 'bg-[#111827] text-white',
    catalog: [
      {
        title: 'Le 12.45',
        category: 'Information',
        type: 'Direct',
        durationMinutes: 35,
        description: 'JT de la mi-journée calibré pour une audience active avec forte lisibilité commerciale.',
        avgAdBreaks: 2,
        avgAdMinutes: 8,
      },
      {
        title: 'Scènes de ménages',
        category: 'Humour',
        type: 'Rediffusion',
        durationMinutes: 45,
        description: 'Access historique de la chaîne avec répétition courte et forte disponibilité annonceur.',
        avgAdBreaks: 2,
        avgAdMinutes: 10,
      },
      {
        title: 'Le 19.45',
        category: 'Information',
        type: 'Direct',
        durationMinutes: 35,
        description: 'JT d’access de référence pour la chaîne, très structurant pour la suite de grille.',
        avgAdBreaks: 2,
        avgAdMinutes: 8,
      },
      {
        title: 'Top Chef',
        category: 'Divertissement',
        type: 'Nouvelle saison',
        durationMinutes: 150,
        description: 'Compétition culinaire premium, puissante sur les cibles commerciales et les réseaux.',
        avgAdBreaks: 5,
        avgAdMinutes: 24,
      },
      {
        title: 'Capital',
        category: 'Magazine',
        type: 'Inédit',
        durationMinutes: 115,
        description: 'Magazine économique grand public, attractif sur les sujets consommation et quotidien.',
        avgAdBreaks: 4,
        avgAdMinutes: 19,
      },
      {
        title: 'Pékin Express',
        category: 'Divertissement',
        type: 'Évènement',
        durationMinutes: 145,
        description: 'Aventure événementielle au fort potentiel de récurrence d’audience et de replay.',
        avgAdBreaks: 5,
        avgAdMinutes: 24,
      },
    ],
  },
  {
    id: 'canal-plus',
    name: 'Canal+',
    slug: 'canal-plus',
    toneClass: 'bg-black text-white',
    catalog: [
      {
        title: 'La Matinale Week-End',
        category: 'Information',
        type: 'Direct',
        durationMinutes: 120,
        description: 'Session d’actualité et culture média pensée pour une audience premium et connectée.',
        avgAdBreaks: 0,
        avgAdMinutes: 0,
      },
      {
        title: 'Canal Football Club',
        category: 'Sport',
        type: 'Direct',
        durationMinutes: 70,
        description: 'Magazine sport premium articulé autour des droits, débats et avant-matchs.',
        avgAdBreaks: 1,
        avgAdMinutes: 4,
      },
      {
        title: 'Le Grand Journal du Sport',
        category: 'Sport',
        type: 'Direct',
        durationMinutes: 55,
        description: 'Décryptage et analyses du jour, avec forte logique de personnalités et d’expertise.',
        avgAdBreaks: 1,
        avgAdMinutes: 4,
      },
      {
        title: 'Match de Ligue 1',
        category: 'Sport',
        type: 'Évènement',
        durationMinutes: 125,
        description: 'Live premium générateur de pics simultanés, avec monétisation publicitaire plus resserrée.',
        avgAdBreaks: 1,
        avgAdMinutes: 5,
      },
      {
        title: 'Création Originale Canal+',
        category: 'Fiction',
        type: 'Inédit',
        durationMinutes: 52,
        description: 'Épisode premium de fiction originale, vecteur d’image et d’acquisition.',
        avgAdBreaks: 0,
        avgAdMinutes: 0,
      },
      {
        title: 'Late Sport 360',
        category: 'Sport',
        type: 'Rediffusion',
        durationMinutes: 60,
        description: 'Débrief et replay éditorialisés des grands moments de la soirée.',
        avgAdBreaks: 1,
        avgAdMinutes: 3,
      },
    ],
  },
  {
    id: 'arte',
    name: 'Arte',
    slug: 'arte',
    toneClass: 'bg-[#f97316] text-white',
    catalog: [
      {
        title: 'Arte Journal',
        category: 'Information',
        type: 'Direct',
        durationMinutes: 25,
        description: 'Journal international synthétique avec hiérarchie éditoriale très identifiable.',
        avgAdBreaks: 0,
        avgAdMinutes: 0,
      },
      {
        title: 'Invitation au voyage',
        category: 'Magazine',
        type: 'Inédit',
        durationMinutes: 45,
        description: 'Magazine quotidien de découverte très repérable dans la grille d’access.',
        avgAdBreaks: 0,
        avgAdMinutes: 0,
      },
      {
        title: 'Le dessous des images',
        category: 'Culture',
        type: 'Inédit',
        durationMinutes: 15,
        description: 'Format court d’analyse culturelle et médiatique à forte valeur éditoriale.',
        avgAdBreaks: 0,
        avgAdMinutes: 0,
      },
      {
        title: 'Arte Reportage',
        category: 'Documentaire',
        type: 'Inédit',
        durationMinutes: 90,
        description: 'Grand format d’investigation et de terrain, très distinctif dans l’offre française.',
        avgAdBreaks: 0,
        avgAdMinutes: 0,
      },
      {
        title: 'Soirée Thema',
        category: 'Documentaire',
        type: 'Évènement',
        durationMinutes: 110,
        description: 'Soirée éditorialisée autour d’un sujet central avec forte cohérence de programmation.',
        avgAdBreaks: 0,
        avgAdMinutes: 0,
      },
      {
        title: 'Cinéma de patrimoine',
        category: 'Cinéma',
        type: 'Rediffusion',
        durationMinutes: 120,
        description: 'Case cinéma culturelle mise en valeur par une forte qualité de prescription.',
        avgAdBreaks: 0,
        avgAdMinutes: 0,
      },
    ],
  },
]

const presetTimeBlocks: Record<Exclude<TvTimePreset, 'custom'>, [string, string]> = {
  yesterday: ['20:10', '22:15'],
  live: ['18:05', '19:15'],
  tonight: ['21:10', '23:05'],
  tomorrow: ['21:10', '23:15'],
}

const customTimeBlocks = ['21:10', '23:05'] as const

const presetSeedOffset: Record<Exclude<TvTimePreset, 'custom'>, number> = {
  yesterday: 1,
  live: 2,
  tonight: 3,
  tomorrow: 4,
}

const addMinutes = (time: string, minutes: number) => {
  const [hours = 0, mins = 0] = time.split(':').map(Number)
  const total = hours * 60 + mins + minutes
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60)
  const nextHours = String(Math.floor(normalized / 60)).padStart(2, '0')
  const nextMinutes = String(normalized % 60).padStart(2, '0')

  return `${nextHours}:${nextMinutes}`
}

const getDaySeed = (date: Date) => date.getDay() + date.getMonth() + date.getDate()

export const getRelativeDate = (offsetDays: number) => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + offsetDays)
  return date
}

export const toDateInputValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getProgramAt = (catalog: TvProgrammeSeed[], index: number) => {
  const program = catalog[index % catalog.length]

  if (!program) {
    throw new Error('TV programme catalog is empty.')
  }

  return program
}

export const getTvProgrammesForDate = (date: Date, preset: TvTimePreset): TvChannelSchedule[] => {
  const daySeed = getDaySeed(date)
  const timeBlocks = preset === 'custom' ? customTimeBlocks : presetTimeBlocks[preset]

  return channelSeeds.map((channel, channelIndex) => {
    const presetOffset = preset === 'custom' ? 5 : presetSeedOffset[preset]
    const startIndex = (daySeed + channelIndex + presetOffset) % channel.catalog.length
    const firstProgram = getProgramAt(channel.catalog, startIndex)
    const secondProgram = getProgramAt(channel.catalog, startIndex + 1)

    return {
      id: channel.id,
      name: channel.name,
      slug: channel.slug,
      toneClass: channel.toneClass,
      programmes: [
        {
          ...withProgrammeVisual(firstProgram),
          startsAt: timeBlocks[0],
          endsAt: addMinutes(timeBlocks[0], firstProgram.durationMinutes),
        },
        {
          ...withProgrammeVisual(secondProgram),
          startsAt: timeBlocks[1],
          endsAt: addMinutes(timeBlocks[1], secondProgram.durationMinutes),
        },
      ],
    }
  })
}
