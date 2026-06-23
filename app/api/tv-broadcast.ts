import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'

export type BroadcastCategory = {
  id: number
  name: string
  slug: string
  color: string | null
}

export type BroadcastDetail = {
  id: number
  channelId: string
  broadcastType: string | null
  startAt: string
  endAt: string
  startTime: string
  endTime: string
  date: string
  durationMin: number
  program: {
    id: number
    title: string
    type: string | null
    description: string | null
    imageUrl: string | null
    youtubeUrl: string | null
    isTvstatsPick: boolean
    categories: BroadcastCategory[]
  }
  audience: {
    viewers: number
    willWatch: number
    pda: number | null
    rank: number | null
    mediametrieViewers: number | null
  }
  scores: BroadcastScoreSummary[]
  userViewType: 'watched' | 'will_watch' | null
  userHasReviewed: boolean
}

export type BroadcastScoreSummary = {
  questionId: number
  label: string
  avgScore: number
  voteCount: number
}

export type ToggleViewResponse = {
  userViewType: 'watched' | 'will_watch' | null
  viewers: number
  willWatch: number
}

export type ProgrammeBroadcast = {
  id: number
  channelId: string
  broadcastType: string | null
  startAt: string
  startTime: string
  endTime: string
  date: string
  viewers: number
}

export type ProgrammeSchedule = {
  past: ProgrammeBroadcast[]
  upcoming: ProgrammeBroadcast[]
}

export type BroadcastReview = {
  id: number
  rating: number | null
  comment: string | null
  initials: string
  createdAt: string
}

export type ReviewsResponse = {
  reviews: BroadcastReview[]
  totalCount: number
  avgRating: number | null
}

export type ReviewQuestion = {
  id: number
  label: string
  description: string | null
}

export type ReviewSubmitPayload = {
  rating?: number | null
  comment?: string
  scores?: { question_id: number; score: number }[]
}

export async function fetchBroadcast(id: number): Promise<BroadcastDetail> {
  const { data } = await apiHttp.get<BroadcastDetail>(STATSIO_API.tv.broadcast(id))
  return data
}

export async function toggleBroadcastView(
  id: number,
  type: 'watched' | 'will_watch',
): Promise<ToggleViewResponse> {
  const { data } = await apiHttp.post<ToggleViewResponse>(STATSIO_API.tv.broadcastView(id), { type })
  return data
}

export async function fetchProgrammeSchedule(id: number): Promise<ProgrammeSchedule> {
  const { data } = await apiHttp.get<ProgrammeSchedule>(`/tv/broadcasts/${id}/schedule`)
  return data
}

export async function fetchBroadcastReviews(id: number): Promise<ReviewsResponse> {
  const { data } = await apiHttp.get<ReviewsResponse>(`/tv/broadcasts/${id}/reviews`)
  return data
}

export async function fetchReviewQuestions(id: number): Promise<ReviewQuestion[]> {
  const { data } = await apiHttp.get<ReviewQuestion[]>(`/tv/broadcasts/${id}/questions`)
  return data
}

export async function submitBroadcastReview(id: number, payload: ReviewSubmitPayload): Promise<ReviewsResponse> {
  const { data } = await apiHttp.post<ReviewsResponse>(`/tv/broadcasts/${id}/review`, payload)
  return data
}
