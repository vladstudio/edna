<script>
import { LANGUAGES } from '../editor/languages.js'
import { fmtSize } from '../utils'
import { isDocDirty } from '../state'

const LANGUAGE_MAP = Object.fromEntries(LANGUAGES.map(l => [l.token, l]))
const LANGUAGE_NAMES = Object.fromEntries(LANGUAGES.map(l => [l.token, l.name]))

export default {
  props: [
    "noteName",
    "line",
    "column",
    "docSize",
    "selectionSize",
    "language",
    "languageAuto",
  ],

  components: {
  },

  setup() {
    return {
      isDocDirty
    }
  },

  data() {
    return {

    }
  },

  mounted() {

  },

  computed: {
    languageName() {
      return LANGUAGE_NAMES[this.language] || this.language
    },

    supportsFormat() {
      const lang = LANGUAGE_MAP[this.language]
      return !!lang ? lang.supportsFormat : false
    },

    supportsRun() {
      const lang = LANGUAGE_MAP[this.language]
      return !!lang ? lang.supportsRun : false
    },

    cmdKey() {
      return window.edna.platform.isMac ? "⌘" : "Ctrl"
    },

    formatBlockTitle() {
      return `Format Block Content (Alt + Shift + F)`
    },

    runBlockTitle() {
      return `Run Block Code (Alt + Shift + R)`
    },

    formatSize() {
      return fmtSize(this.docSize);
    },

    changeLanguageTitle() {
      return `Change language for current block (${this.cmdKey} + L)`
    },
  },
}
</script>

<template>
  <div class="status">
    <div class="status-block clickable" @click="$emit('openNoteSelector')" title="Change or create new note">{{ noteName
      }}<span class="ml-1 w-[1em]" v-if="isDocDirty">&bull;</span><span class="ml-1 w-[1em]" v-else>&nbsp;</span>
    </div>

    <div class="status-block line-number">
      Ln <span class="num">{{ line }}</span>
      &nbsp;Col <span class="num">{{ column }}</span>
      <template v-if="selectionSize > 0">
        Sel <span class="num">{{ selectionSize }}</span>
      </template>
    </div>
    <div class="status-block doc-size">{{ formatSize }}</div>
    <div class="spacer"></div>
    <div @click="$emit('openLanguageSelector')" class="status-block lang clickable" :title="changeLanguageTitle">
      {{ languageName }}
      <span v-if="languageAuto" class="auto">(auto)</span>
    </div>
    <div v-if="supportsRun" @click="$emit('runCurrentBlock')" class="status-block run clickable" :title="runBlockTitle">
      Run
    </div>
    <div v-if="supportsFormat" @click="$emit('formatCurrentBlock')" class="status-block format clickable"
      :title="formatBlockTitle">
      <span class="icon icon-format"></span>
    </div>
    <div @click="$emit('openSettings')" class="status-block settings clickable" title="Settings">
      <span class="icon icon-format"></span>
    </div>
    <div @click="$emit('openHelp')" class="status-block clickable" title="Help">?</div>
  </div>
</template>

<style scoped lang="sass">
    .status
        box-sizing: border-box
        height: 22px
        width: 100%
        background: var(--status-bar-background)
        color: var(--status-bar-color)
        font-family: "Open Sans"
        font-size: 12px
        padding-left: 0px
        padding-right: 0px
        display: flex
        flex-direction: row
        align-items: center
        user-select: none

        .spacer
            flex-grow: 1
        
        .status-block
            box-sizing: border-box
            padding: 4px 10px
            cursor: default
            &:first-child
                padding-left: 12px
            &:last-child
                padding-right: 12px
            &.clickable
                cursor: pointer
                &:hover
                    background-color: rgba(255,255,255, 0.1)
            .icon
                display: block
                width: 14px
                height: 22px
                +dark-mode
                    opacity: 0.9
        .line-number
            color: rgba(255, 255, 255, 0.7)
            .num
                color: rgba(255, 255, 255, 1.0)
            +dark-mode
                color: rgba(255, 255, 255, 0.55)
                .num
                    color: rgba(255, 255, 255, 0.75)
        .lang .auto
            color: rgba(255, 255, 255, 0.7)
            +dark-mode
                color: rgba(255, 255, 255, 0.55)
        .theme
            padding-top: 0
            padding-bottom: 0
            .icon
                background-size: 14px
                background-repeat: no-repeat
                background-position: center center
                &.dark
                    background-image: url("@/assets/icons/dark-mode.png")
                &.light
                    background-image: url("@/assets/icons/light-mode.png")
                &.system
                    background-image: url("@/assets/icons/both-mode.png")
        
        .format
            padding-top: 0
            padding-bottom: 0
            .icon
                background-size: 16px
                background-repeat: no-repeat
                background-position: center center
                background-image: url("@/assets/icons/format.svg")
        
        .settings
            padding-top: 0
            padding-bottom: 0
            .icon
                background-size: 13px
                background-repeat: no-repeat
                background-position: center center
                background-image: url("@/assets/icons/settings.svg")

</style>
