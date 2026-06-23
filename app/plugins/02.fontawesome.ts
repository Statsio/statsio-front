import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faItalic,
  faUnderline,
  faStrikethrough,
  faAlignLeft,
  faAlignCenter,
  faAlignRight,
  faAlignJustify,
  faHighlighter,
  faPalette,
  faFont,
  faBold,
} from '@fortawesome/free-solid-svg-icons'

export default defineNuxtPlugin((nuxtApp) => {
  library.add(
    faItalic,
    faUnderline,
    faStrikethrough,
    faAlignLeft,
    faAlignCenter,
    faAlignRight,
    faAlignJustify,
    faHighlighter,
    faPalette,
    faFont,
    faBold,
  )
  nuxtApp.vueApp.component('FontAwesomeIcon', FontAwesomeIcon)
})
