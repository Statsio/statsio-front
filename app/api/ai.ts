import { apiHttp } from '@/lib/http'
import { unwrapStatsioResponseData } from '@/lib/api-envelope'
import { STATSIO_API } from './statsio-endpoints'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentRunStatus = 'pending' | 'running' | 'done' | 'failed'

/** Op d'un patch renvoyé par l'agent — appliquée 1:1 sur le store du Studio (phase 3). */
export interface AgentPatchOp {
  op: string
  [key: string]: unknown
}

export interface AgentRun {
  id: number
  status: AgentRunStatus
  message: string | null
  patch: AgentPatchOp[]
  attachedDatasetIds: number[]
  error: string | null
}

export interface AgentMessage {
  id: number
  role: 'user' | 'model'
  text: string | null
  createdAt?: string
}

export interface AgentConversation {
  id: number
  studioContentId: number
  title: string | null
  updatedAt?: string
  messages: AgentMessage[]
  runs: AgentRun[]
}

export interface AgentConversationSummary {
  id: number
  title: string | null
  messageCount: number
  updatedAt?: string
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapRun(raw: Record<string, unknown>): AgentRun {
  return {
    id: Number(raw.id),
    status: (raw.status as AgentRunStatus) ?? 'pending',
    message: (raw.message as string | null) ?? null,
    patch: Array.isArray(raw.patch) ? (raw.patch as AgentPatchOp[]) : [],
    attachedDatasetIds: Array.isArray(raw.attached_dataset_ids)
      ? (raw.attached_dataset_ids as number[])
      : [],
    error: (raw.error as string | null) ?? null,
  }
}

function mapConversation(raw: Record<string, unknown>): AgentConversation {
  return {
    id: Number(raw.id),
    studioContentId: Number(raw.studio_content_id),
    title: (raw.title as string | null) ?? null,
    updatedAt: raw.updated_at as string | undefined,
    messages: Array.isArray(raw.messages)
      ? (raw.messages as Record<string, unknown>[]).map((m) => ({
          id: Number(m.id),
          role: (m.role as 'user' | 'model') ?? 'model',
          text: (m.text as string | null) ?? null,
          createdAt: m.created_at as string | undefined,
        }))
      : [],
    runs: Array.isArray(raw.runs) ? (raw.runs as Record<string, unknown>[]).map(mapRun) : [],
  }
}

// ─── Calls ────────────────────────────────────────────────────────────────────

export async function listAgentConversations(
  contentId: string | number,
): Promise<AgentConversationSummary[]> {
  const res = await apiHttp.get(STATSIO_API.ai.conversations(contentId))
  const rows = unwrapStatsioResponseData<Record<string, unknown>[]>(res) ?? []
  return rows.map((r) => ({
    id: Number(r.id),
    title: (r.title as string | null) ?? null,
    messageCount: Number(r.message_count ?? 0),
    updatedAt: r.updated_at as string | undefined,
  }))
}

/** Crée une nouvelle conversation vide. */
export async function createAgentConversation(
  contentId: string | number,
): Promise<AgentConversation> {
  const res = await apiHttp.post(STATSIO_API.ai.conversations(contentId))
  return mapConversation(unwrapStatsioResponseData<Record<string, unknown>>(res))
}

export async function deleteAgentConversation(conversationId: string | number): Promise<void> {
  await apiHttp.delete(STATSIO_API.ai.deleteConversation(conversationId))
}

export async function fetchAgentConversation(
  contentId: string | number,
  conversationId: string | number,
): Promise<AgentConversation> {
  const res = await apiHttp.get(STATSIO_API.ai.conversation(contentId, conversationId))
  return mapConversation(unwrapStatsioResponseData<Record<string, unknown>>(res))
}

export async function sendAgentMessage(
  conversationId: string | number,
  text: string,
): Promise<{ runId: number; conversationId: number }> {
  const res = await apiHttp.post(STATSIO_API.ai.messages(conversationId), { text })
  const data = unwrapStatsioResponseData<{ run_id: number; conversation_id: number }>(res)
  return { runId: data.run_id, conversationId: data.conversation_id }
}

export async function fetchAgentRun(runId: string | number): Promise<AgentRun> {
  const res = await apiHttp.get(STATSIO_API.ai.run(runId))
  return mapRun(unwrapStatsioResponseData<Record<string, unknown>>(res))
}
