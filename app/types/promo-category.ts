import type { CategorySubBrand } from '@/types/sub-brand'

export type PromoCategoryInfo = {
  title: string
  description?: string | null
  cta_label?: string | null
  cta_link?: string | null
}

/** Alignement d'une ligne de titre flash — voir App\Domain\Marketing\Enums\PromoTitleAlignEnum. */
export type PromoTitleAlign = 'stagger' | 'left' | 'center'

/** Catégorie de promotion affichée en flash dans le bandeau promo — voir App\Models\Marketing\PromoCategory. */
export type PromoCategory = {
  id: number
  name: string
  title_line_1?: string | null
  title_line_1_stroke_color?: string | null
  title_line_1_align?: PromoTitleAlign | null
  title_line_2?: string | null
  title_line_2_stroke_color?: string | null
  title_line_2_align?: PromoTitleAlign | null
  title_line_3?: string | null
  title_line_3_stroke_color?: string | null
  title_line_3_align?: PromoTitleAlign | null
  infos: PromoCategoryInfo[]
  ticker_duration_seconds: number
  info_duration_seconds: number
  always_visible: boolean
  position: number
  sub_brand: CategorySubBrand
}
