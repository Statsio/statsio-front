export type FormulaToolGroup = {
  id: 'math' | 'text'
  label: string
  items: { label: string; insert: string }[]
}

export const formulaToolGroups: FormulaToolGroup[] = [
  {
    id: 'math',
    label: 'Mathématique',
    items: [
      { label: '+', insert: '+' },
      { label: '−', insert: '-' },
      { label: '×', insert: '*' },
      { label: '÷', insert: '/' },
      { label: '(', insert: '(' },
      { label: ')', insert: ')' },
      { label: '100', insert: '100' },
    ],
  },
  {
    id: 'text',
    label: 'Textuelle',
    items: [
      { label: 'concat(…)', insert: 'concat(' },
      { label: 'upper(…)', insert: 'upper(' },
      { label: 'lower(…)', insert: 'lower(' },
      { label: 'upperFirst(…)', insert: 'upperFirst(' },
      { label: 'upperLast(…)', insert: 'upperLast(' },
      { label: 'first(…)', insert: 'first(' },
      { label: 'last(…)', insert: 'last(' },
    ],
  },
]

