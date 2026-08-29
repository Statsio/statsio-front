import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import AxiosMockAdapter from 'axios-mock-adapter'
import { apiHttp } from '@/lib/http'
import {
  createAgentConversation,
  listAgentConversations,
  deleteAgentConversation,
  sendAgentMessage,
  fetchAgentRun,
  fetchAgentConversation,
} from './ai'

describe('app/api/ai', () => {
  let apiMock: AxiosMockAdapter

  beforeEach(() => {
    apiMock = new AxiosMockAdapter(apiHttp)
  })

  afterEach(() => {
    apiMock.restore()
  })

  it('createAgentConversation maps the envelope', async () => {
    apiMock.onPost('/ai/studio/contents/42/conversations').reply(200, {
      success: true,
      data: {
        id: 7,
        studio_content_id: 42,
        title: null,
        messages: [{ id: 1, role: 'user', text: 'salut', created_at: '2026-08-27' }],
        runs: [],
      },
    })

    const conv = await createAgentConversation(42)

    expect(conv.id).toBe(7)
    expect(conv.studioContentId).toBe(42)
    expect(conv.messages[0]).toMatchObject({ role: 'user', text: 'salut' })
  })

  it('listAgentConversations maps the summaries', async () => {
    apiMock.onGet('/ai/studio/contents/42/conversations').reply(200, {
      success: true,
      data: [
        { id: 3, title: 'Graphique population', message_count: 4, updated_at: '2026-08-28' },
        { id: 1, title: null, message_count: 0, updated_at: '2026-08-27' },
      ],
    })

    const list = await listAgentConversations(42)

    expect(list).toHaveLength(2)
    expect(list[0]).toEqual({
      id: 3,
      title: 'Graphique population',
      messageCount: 4,
      updatedAt: '2026-08-28',
    })
  })

  it('deleteAgentConversation calls DELETE', async () => {
    apiMock.onDelete('/ai/studio/conversations/9').reply(200, { success: true })
    await expect(deleteAgentConversation(9)).resolves.toBeUndefined()
  })

  it('sendAgentMessage posts text and returns the run id', async () => {
    apiMock.onPost('/ai/studio/conversations/7/messages').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ text: 'ajoute un titre' })
      return [202, { success: true, data: { run_id: 99, conversation_id: 7 } }]
    })

    const res = await sendAgentMessage(7, 'ajoute un titre')

    expect(res).toEqual({ runId: 99, conversationId: 7 })
  })

  it('fetchAgentRun normalizes patch and attached ids', async () => {
    apiMock.onGet('/ai/studio/runs/99').reply(200, {
      success: true,
      data: {
        id: 99,
        status: 'done',
        message: 'C’est fait.',
        patch: [{ op: 'addBlock', ref: 'b1', type: 'heading' }],
        attached_dataset_ids: [3, 5],
        error: null,
      },
    })

    const run = await fetchAgentRun(99)

    expect(run.status).toBe('done')
    expect(run.patch).toHaveLength(1)
    expect(run.attachedDatasetIds).toEqual([3, 5])
  })

  it('fetchAgentRun tolerates a missing patch', async () => {
    apiMock.onGet('/ai/studio/runs/1').reply(200, {
      success: true,
      data: { id: 1, status: 'running' },
    })

    const run = await fetchAgentRun(1)

    expect(run.patch).toEqual([])
    expect(run.attachedDatasetIds).toEqual([])
  })

  it('fetchAgentConversation reads the history', async () => {
    apiMock.onGet('/ai/studio/contents/42/conversations/7').reply(200, {
      success: true,
      data: { id: 7, studio_content_id: 42, messages: [], runs: [] },
    })

    const conv = await fetchAgentConversation(42, 7)
    expect(conv.id).toBe(7)
  })
})
