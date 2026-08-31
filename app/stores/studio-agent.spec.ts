import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import AxiosMockAdapter from 'axios-mock-adapter'
import { apiHttp } from '@/lib/http'
import { useStudioAgentStore } from './studio-agent'

describe('useStudioAgentStore', () => {
  let apiMock: AxiosMockAdapter

  beforeEach(() => {
    setActivePinia(createPinia())
    apiMock = new AxiosMockAdapter(apiHttp)
  })

  afterEach(() => {
    apiMock.restore()
  })

  /** Contenu sans conversation → l'ouverture en crée une (id 3). */
  function mockFreshOpen() {
    apiMock.onGet('/ai/studio/contents/12/conversations').reply(200, { success: true, data: [] })
    apiMock.onPost('/ai/studio/contents/12/conversations').reply(200, {
      success: true,
      data: { id: 3, studio_content_id: 12, title: null, messages: [], runs: [] },
    })
  }

  it('opens the most recent conversation and hydrates its history', async () => {
    apiMock.onGet('/ai/studio/contents/12/conversations').reply(200, {
      success: true,
      data: [{ id: 5, title: 'Ancienne', message_count: 2, updated_at: '2026-08-28' }],
    })
    apiMock.onGet('/ai/studio/contents/12/conversations/5').reply(200, {
      success: true,
      data: {
        id: 5,
        studio_content_id: 12,
        title: 'Ancienne',
        messages: [
          { id: 1, role: 'user', text: 'bonjour' },
          { id: 2, role: 'model', text: 'salut' },
        ],
        runs: [],
      },
    })

    const store = useStudioAgentStore()
    await store.openForContent(12)

    expect(store.conversationId).toBe(5)
    expect(store.messages.map((m) => m.role)).toEqual(['user', 'assistant'])
    expect(store.conversations).toHaveLength(1)
  })

  it('creates a conversation when the content has none', async () => {
    mockFreshOpen()

    const store = useStudioAgentStore()
    await store.openForContent(12)

    expect(store.conversationId).toBe(3)
    expect(store.messages).toHaveLength(0)
  })

  it('send() posts the message, polls the run and appends the reply', async () => {
    mockFreshOpen()
    apiMock.onPost('/ai/studio/conversations/3/messages').reply(202, {
      success: true,
      data: { run_id: 55, conversation_id: 3 },
    })
    apiMock.onGet('/ai/studio/runs/55').reply(200, {
      success: true,
      data: { id: 55, status: 'done', message: 'Titre ajouté.', patch: [], attached_dataset_ids: [] },
    })

    const store = useStudioAgentStore()
    await store.openForContent(12)
    await store.send('ajoute un titre')

    expect(store.status).toBe('idle')
    expect(store.messages).toHaveLength(2)
    expect(store.messages[1]).toMatchObject({ role: 'assistant', text: 'Titre ajouté.', runId: 55 })
    // Titre local dérivé du premier message.
    expect(store.currentConversation?.title).toBe('ajoute un titre')
  })

  it('applies a run patch to the studio store and supports undo', async () => {
    const { useStudioStore } = await import('@/stores/studio')
    const studio = useStudioStore()

    mockFreshOpen()
    apiMock.onPost('/ai/studio/conversations/3/messages').reply(202, {
      success: true,
      data: { run_id: 8, conversation_id: 3 },
    })
    apiMock.onGet('/ai/studio/runs/8').reply(200, {
      success: true,
      data: {
        id: 8,
        status: 'done',
        message: 'Titre ajouté.',
        patch: [
          { op: 'addSection', ref: 's1', pageRef: 'default', layout: '1-col' },
          { op: 'addBlock', ref: 'b1', sectionRef: 's1', col: 0, type: 'heading' },
        ],
        attached_dataset_ids: [],
      },
    })

    const store = useStudioAgentStore()
    await store.openForContent(12)
    const blocksBefore = studio.blocks.length
    await store.send('ajoute un titre')

    expect(studio.blocks.length).toBe(blocksBefore + 1)
    expect(store.messages[1]!.undoSteps).toBe(1)

    store.undoRun(8)
    expect(studio.blocks.length).toBe(blocksBefore)
    expect(store.messages[1]!.reverted).toBe(true)
  })

  it('send() shows `text` in the bubble but posts `apiText` (contexte des mentions @) to the backend', async () => {
    mockFreshOpen()
    let postedText: string | undefined
    apiMock.onPost('/ai/studio/conversations/3/messages').reply((config) => {
      postedText = JSON.parse(config.data).text
      return [202, { success: true, data: { run_id: 91, conversation_id: 3 } }]
    })
    apiMock.onGet('/ai/studio/runs/91').reply(200, {
      success: true,
      data: { id: 91, status: 'done', message: 'ok', patch: [], attached_dataset_ids: [] },
    })

    const store = useStudioAgentStore()
    await store.openForContent(12)
    await store.send('lie le graphique', 'lie le graphique\n\n---\nContenus référencés : carburants')

    expect(postedText).toContain('Contenus référencés')
    expect(store.messages[0]).toMatchObject({ role: 'user', text: 'lie le graphique' })
  })

  it('surfaces a failed run as an error message', async () => {
    mockFreshOpen()
    apiMock.onPost('/ai/studio/conversations/3/messages').reply(202, {
      success: true,
      data: { run_id: 7, conversation_id: 3 },
    })
    apiMock.onGet('/ai/studio/runs/7').reply(200, {
      success: true,
      data: { id: 7, status: 'failed', message: null, error: 'quota dépassé', patch: [], attached_dataset_ids: [] },
    })

    const store = useStudioAgentStore()
    await store.openForContent(12)
    await store.send('fais un truc')

    expect(store.status).toBe('error')
    expect(store.messages[1]).toMatchObject({ role: 'assistant', text: 'quota dépassé' })
  })

  it('newConversation() adds a fresh conversation and clears the transcript', async () => {
    apiMock.onGet('/ai/studio/contents/12/conversations').reply(200, {
      success: true,
      data: [{ id: 5, title: 'Une', message_count: 2, updated_at: '2026-08-28' }],
    })
    apiMock.onGet('/ai/studio/contents/12/conversations/5').reply(200, {
      success: true,
      data: { id: 5, studio_content_id: 12, title: 'Une', messages: [{ id: 1, role: 'user', text: 'x' }], runs: [] },
    })
    apiMock.onPost('/ai/studio/contents/12/conversations').reply(200, {
      success: true,
      data: { id: 9, studio_content_id: 12, title: null, messages: [], runs: [] },
    })

    const store = useStudioAgentStore()
    await store.openForContent(12)
    await store.newConversation()

    expect(store.conversationId).toBe(9)
    expect(store.messages).toHaveLength(0)
    expect(store.conversations.map((c) => c.id)).toEqual([9, 5])
  })

  it('deleteConversation() removes it and falls back to another', async () => {
    apiMock.onGet('/ai/studio/contents/12/conversations').reply(200, {
      success: true,
      data: [
        { id: 5, title: 'Une', message_count: 1, updated_at: '2026-08-28' },
        { id: 4, title: 'Deux', message_count: 1, updated_at: '2026-08-27' },
      ],
    })
    apiMock.onGet('/ai/studio/contents/12/conversations/5').reply(200, {
      success: true,
      data: { id: 5, studio_content_id: 12, title: 'Une', messages: [], runs: [] },
    })
    apiMock.onGet('/ai/studio/contents/12/conversations/4').reply(200, {
      success: true,
      data: { id: 4, studio_content_id: 12, title: 'Deux', messages: [], runs: [] },
    })
    apiMock.onDelete('/ai/studio/conversations/5').reply(200, { success: true })

    const store = useStudioAgentStore()
    await store.openForContent(12)
    expect(store.conversationId).toBe(5)

    await store.deleteConversation(5)

    expect(store.conversations.map((c) => c.id)).toEqual([4])
    expect(store.conversationId).toBe(4)
  })

  it('ignores empty input', async () => {
    mockFreshOpen()

    const store = useStudioAgentStore()
    await store.openForContent(12)
    await store.send('   ')

    expect(store.messages).toHaveLength(0)
  })
})
