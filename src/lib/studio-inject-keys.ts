import type { InjectionKey, Ref } from 'vue'
import type { StudioDataSource } from '@/types/studio-data-source'

export const studioDataSourcesKey: InjectionKey<Ref<StudioDataSource[]>> = Symbol('studioDataSources')
