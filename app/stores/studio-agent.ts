import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  listAgentConversations,
  createAgentConversation,
  deleteAgentConversation,
  fetchAgentConversation,
  sendAgentMessage,
  fetchAgentRun,
  type AgentRun,
  type AgentConversationSummary,
} from '@/api/ai'
import { useStudioStore } from '@/stores/studio'
import { applyAgentPatch } from '@/lib/studio-agent-patch'

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 180_000

export type AgentStatus = 'idle' | 'thinking' | 'applying' | 'error'

export interface AgentChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  /** Run associé — sert au bouton « Annuler ces changements ». */
  runId?: number
  pending?: boolean
  /** Nombre d'entrées d'historique posées par ce run (0 = rien à annuler). */
  undoSteps?: number
  reverted?: boolean
}

let localId = 0
const nextLocalId = () => `local-${++localId}`

export const useStudioAgentStore = defineStore('studio-agent', () => {
  const contentId = ref<string | number | null>(null)
  const conversationId = ref<number | null>(null)
  const conversations = ref<AgentConversationSummary[]>([])
  const messages = ref<AgentChatMessage[]>([])
  const status = ref<AgentStatus>('idle')
  const error = ref<string | null>(null)

  let pollTimer: ReturnType<typeof setTimeout> | null = null

  const currentConversation = computed(() =>
    conversations.value.find((c) => c.id === conversationId.value) ?? null,
  )

  function reset() {
    stopPolling()
    contentId.value = null
    conversationId.value = null
    conversations.value = []
    messages.value = []
    status.value = 'idle'
    error.value = null
  }

  function stopPolling() {
    if (pollTimer !== null) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
  }

  async function openForContent(id: string | number) {
    if (contentId.value === id && conversationId.value !== null) return
    reset()
    contentId.value = id
    try {
      conversations.value = await listAgentConversations(id)
      if (conversations.value.length > 0) {
        await switchConversation(conversations.value[0]!.id)
      } else {
        await newConversation()
      }
    } catch {
      error.value = "Impossible d'ouvrir l'assistant."
      status.value = 'error'
    }
  }

  async function switchConversation(id: number) {
    if (contentId.value === null || id === conversationId.value) return
    stopPolling()
    status.value = 'idle'
    error.value = null
    const conversation = await fetchAgentConversation(contentId.value, id)
    conversationId.value = conversation.id
    hydrate(conversation.messages)
  }

  async function newConversation() {
    if (contentId.value === null) return
    stopPolling()
    status.value = 'idle'
    error.value = null
    const conversation = await createAgentConversation(contentId.value)
    conversations.value.unshift({
      id: conversation.id,
      title: conversation.title,
      messageCount: 0,
      updatedAt: conversation.updatedAt,
    })
    conversationId.value = conversation.id
    messages.value = []
  }

  async function deleteConversation(id: number) {
    await deleteAgentConversation(id)
    conversations.value = conversations.value.filter((c) => c.id !== id)
    if (conversationId.value === id) {
      conversationId.value = null
      if (conversations.value.length > 0) {
        await switchConversation(conversations.value[0]!.id)
      } else {
        await newConversation()
      }
    }
  }

  async function refresh() {
    if (contentId.value === null || conversationId.value === null) return
    const conversation = await fetchAgentConversation(contentId.value, conversationId.value)
    hydrate(conversation.messages)
  }

  function hydrate(serverMessages: { role: 'user' | 'model'; text: string | null; id: number }[]) {
    messages.value = serverMessages
      .filter((m) => m.text)
      .map((m) => ({
        id: `srv-${m.id}`,
        role: m.role === 'user' ? 'user' : 'assistant',
        text: m.text as string,
      }))
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || conversationId.value === null || status.value === 'thinking') return

    error.value = null
    const firstMessage = messages.value.length === 0
    messages.value.push({ id: nextLocalId(), role: 'user', text: trimmed })
    const placeholder: AgentChatMessage = {
      id: nextLocalId(),
      role: 'assistant',
      text: '',
      pending: true,
    }
    messages.value.push(placeholder)
    status.value = 'thinking'

    // Titre local immédiat (le backend fait de même).
    if (firstMessage && currentConversation.value && !currentConversation.value.title) {
      currentConversation.value.title = trimmed.slice(0, 60)
    }

    try {
      const { runId } = await sendAgentMessage(conversationId.value, trimmed)
      const run = await pollRun(runId)
      finishRun(placeholder, run)
    } catch (e) {
      placeholder.pending = false
      placeholder.text = "L'assistant n'a pas pu répondre."
      status.value = 'error'
      error.value = e instanceof Error ? e.message : String(e)
    }
  }

  function pollRun(runId: number): Promise<AgentRun> {
    stopPolling()
    const startedAt = Date.now()

    return new Promise<AgentRun>((resolve, reject) => {
      const tick = async () => {
        try {
          const run = await fetchAgentRun(runId)
          if (run.status === 'done' || run.status === 'failed') {
            resolve(run)
            return
          }
          if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
            reject(new Error("Délai dépassé en attendant l'assistant."))
            return
          }
          pollTimer = setTimeout(tick, POLL_INTERVAL_MS)
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)))
        }
      }
      tick()
    })
  }

  function finishRun(placeholder: AgentChatMessage, run: AgentRun) {
    placeholder.pending = false
    placeholder.runId = run.id

    if (run.status === 'failed') {
      placeholder.text = run.error ?? "L'assistant a rencontré une erreur."
      status.value = 'error'
      error.value = run.error
      return
    }

    placeholder.text = run.message ?? '(réponse vide)'

    if (run.patch.length > 0) {
      status.value = 'applying'
      const result = applyAgentPatch(run.patch, useStudioStore())
      placeholder.undoSteps = result.undoSteps
      if (result.errors.length > 0) {
        placeholder.text += `\n\n⚠️ ${result.errors.length} op(s) non appliquée(s) : ${result.errors.join(' ; ')}`
      }
    }

    if (currentConversation.value) currentConversation.value.messageCount += 2

    status.value = 'idle'
  }

  function undoRun(runId: number) {
    const message = messages.value.find((m) => m.runId === runId)
    if (!message || !message.undoSteps || message.reverted) return

    const studio = useStudioStore()
    for (let i = 0; i < message.undoSteps; i++) {
      if (studio.canUndo) studio.undo()
    }
    message.reverted = true
  }

  return {
    contentId,
    conversationId,
    conversations,
    currentConversation,
    messages,
    status,
    error,
    openForContent,
    switchConversation,
    newConversation,
    deleteConversation,
    refresh,
    send,
    undoRun,
    reset,
  }
})
