import type { StatsDataDocument } from '@/api/studio'
import { fetchBlockResponse } from '@/api/studio-responses'
import { isFormBlock, type StudioBlock } from '@/types/studio'
import { publicContentPath } from '@/lib/content-display'
import { getPollStatus, type PollStatus } from '@/lib/poll-status'
import { buildPollOptions, getQuestionTypeLabel } from '@/lib/poll-visuals'

export interface EnrichedPoll {
  poll: StatsDataDocument
  to: string
  category: string
  questionType: string
  options: { label: string; pct: number }[]
  totalVotes: number
  status: PollStatus
}

function primaryFormBlock(poll: StatsDataDocument): StudioBlock | undefined {
  const blocks = (poll.blocks ?? []).filter((b) => isFormBlock(b.type))
  return blocks.find((b) => b.type === 'choice' || b.type === 'checkboxes' || b.type === 'dropdown') ?? blocks[0]
}

function categoryLabel(poll: StatsDataDocument): string {
  const first = poll.categories?.[0]
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : 'Sondage'
}

/** Charge et normalise les pourcentages/votes d'un sondage — ces chiffres ne sont jamais stockés sur le document lui-même. */
export async function enrichPoll(poll: StatsDataDocument, basePath: string, token: string): Promise<EnrichedPoll> {
  const block = primaryFormBlock(poll)
  let options: { label: string; pct: number }[] = []
  let totalVotes = 0

  if (block && poll.slug) {
    try {
      const state = await fetchBlockResponse(poll.slug, block.id, token)
      options = buildPollOptions(state.aggregate, block)
      totalVotes = state.aggregate.totalResponses
    } catch {
      options = (block.config.formOptions ?? []).map((label) => ({ label, pct: 0 }))
    }
  }

  return {
    poll,
    to: publicContentPath('survey', poll.slug ?? '', basePath),
    category: categoryLabel(poll),
    questionType: getQuestionTypeLabel(block?.type),
    options,
    totalVotes,
    status: getPollStatus(poll),
  }
}
