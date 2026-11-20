import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import DocumentInspector from './DocumentInspector.vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioMetaStore } from '@/stores/studio-meta'

const stubs = { RouterLink: { template: '<a><slot /></a>' } }

beforeEach(() => setActivePinia(createPinia()))

describe('DocumentInspector', () => {
  it('lists the pre-publish checks and selects the faulty block on « Voir »', async () => {
    const studio = useStudioStore()
    studio.initPage({ id: 'c1', type: 'article', title: 'Incendies de forêt en France', slug: 'incendies' })
    const img = studio.addBlock('image', `${studio.sections[0]!.id}-0`)
    studio.updateBlockConfig(img.id, { imageUrl: '/pinede.jpg' })
    studio.selectBlock(null)
    useStudioMetaStore().init({ id: 'c1', slug: 'incendies', title: 'Incendies', description: 'Neuf feux ont brûlé 45 712 hectares depuis 2016.' })

    const w = mount(DocumentInspector, { global: { stubs } })

    expect(w.text()).toContain('Avant de publier')
    expect(w.text()).toContain('Une image n’a pas de texte alternatif')
    expect(w.text()).toContain('Image de couverture')
    await w.findAll('.st-check button').find((b) => b.text() === 'Voir')!.trigger('click')
    expect(studio.selectedBlockId).toBe(img.id)
  })

  it('shows the public address and the domain selector', () => {
    const studio = useStudioStore()
    studio.initPage({ id: 'c1', type: 'statsdata', title: 'Prix des carburants', slug: 'prix-carburants' })
    useStudioMetaStore().init({ id: 'c1', slug: 'prix-carburants', title: 'Prix', sub_brand: 'statsio' })

    const w = mount(DocumentInspector, { global: { stubs } })

    expect(w.text()).toContain('statsio.fr/statsdata/prix-carburants')
    expect(w.find('[aria-label="Domaine"] [aria-pressed="true"]').text()).toBe('Statsio')
  })
})
