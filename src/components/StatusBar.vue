<script>
import { LANGUAGES, getLanguage, getLanguageNameFromToken, langSupportsFormat, langSupportsRun } from '../editor/languages.js'
import { fmtSize, platform } from '../util'
import { isDocDirty } from '../state'

export default {
  props: [
    "noteName",
    "line",
    "column",
    "docSize",
    "selectionSize",
    "language",
    "languageAuto",
    "isSpellChecking",
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
      return getLanguageNameFromToken(this.language);
    },

    supportsFormat() {
      const lang = getLanguage(this.language)
      return langSupportsFormat(lang)
    },

    supportsRun() {
      const lang = getLanguage(this.language)
      return langSupportsRun(lang)
    },

    cmdKey() {
      return platform.isMac ? "⌘" : "Ctrl"
    },

    formatBlockTitle() {
      return `Format Block (Alt + Shift + F)`
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
  <div
    class="w-full h-[22px] px-0 flex items-center select-none text-sm text-[var(--status-bar-color)] bg-[var(--status-bar-background)]">
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
    <div class="grow"></div>
    <div @click="$emit('toggleSpellCheck')" class="status-block clickable">
      <span v-if="isSpellChecking">Disable
        spell checking</span>
      <span v-else>Enable spell checking</span>
    </div>
    <div @click="$emit('openLanguageSelector')" class="status-block lang clickable" :title="changeLanguageTitle">
      {{ languageName }}
      <span v-if="languageAuto" class="auto">(auto)</span>
    </div>
    <div v-if="supportsRun" @click="$emit('runCurrentBlock')" class="status-block run clickable" :title="runBlockTitle">
      Run
    </div>
    <div v-if="supportsFormat" @click="$emit('formatCurrentBlock')" class="status-block py-0 clickable"
      :title="formatBlockTitle">
      <div class="icon flex items-center"><svg width="14px" height="22px" fill="none" viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2.75 4.5a.75.75 0 0 0 0 1.5h14.5a.75.75 0 0 0 0-1.5H2.75ZM2.75 7.5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5ZM2.75 10.5a.75.75 0 0 0 0 1.5h6.633a1.496 1.496 0 0 1-.284-1.5H2.75ZM2.75 13.5h6.628L7.876 15H2.75a.75.75 0 0 1 0-1.5ZM14.496 7.439a.5.5 0 0 0-.992 0l-.098.791a2.5 2.5 0 0 1-2.176 2.176l-.791.098a.5.5 0 0 0 0 .992l.791.098a2.5 2.5 0 0 1 2.176 2.176l.098.791a.5.5 0 0 0 .992 0l.098-.791a2.5 2.5 0 0 1 2.176-2.176l.791-.098a.5.5 0 0 0 0-.992l-.791-.098a2.5 2.5 0 0 1-2.176-2.176l-.098-.791ZM11.853 13.147a.5.5 0 0 1 0 .707l-4 3.996a.5.5 0 0 1-.706-.707l3.999-3.997a.5.5 0 0 1 .707 0Z"
            fill="#ffffff" class="fill-212121"></path>
        </svg></div>
    </div>
    <div @click="$emit('openSettings')" class="status-block py-0 clickable" title="Settings">
      <div class="icon flex items-center"><svg width="14px" height="22px" viewBox="0 0 512 512"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M262.29 192.31a64 64 0 1 0 57.4 57.4 64.13 64.13 0 0 0-57.4-57.4ZM416.39 256a154.34 154.34 0 0 1-1.53 20.79l45.21 35.46a10.81 10.81 0 0 1 2.45 13.75l-42.77 74a10.81 10.81 0 0 1-13.14 4.59l-44.9-18.08a16.11 16.11 0 0 0-15.17 1.75A164.48 164.48 0 0 1 325 400.8a15.94 15.94 0 0 0-8.82 12.14l-6.73 47.89a11.08 11.08 0 0 1-10.68 9.17h-85.54a11.11 11.11 0 0 1-10.69-8.87l-6.72-47.82a16.07 16.07 0 0 0-9-12.22 155.3 155.3 0 0 1-21.46-12.57 16 16 0 0 0-15.11-1.71l-44.89 18.07a10.81 10.81 0 0 1-13.14-4.58l-42.77-74a10.8 10.8 0 0 1 2.45-13.75l38.21-30a16.05 16.05 0 0 0 6-14.08c-.36-4.17-.58-8.33-.58-12.5s.21-8.27.58-12.35a16 16 0 0 0-6.07-13.94l-38.19-30A10.81 10.81 0 0 1 49.48 186l42.77-74a10.81 10.81 0 0 1 13.14-4.59l44.9 18.08a16.11 16.11 0 0 0 15.17-1.75A164.48 164.48 0 0 1 187 111.2a15.94 15.94 0 0 0 8.82-12.14l6.73-47.89A11.08 11.08 0 0 1 213.23 42h85.54a11.11 11.11 0 0 1 10.69 8.87l6.72 47.82a16.07 16.07 0 0 0 9 12.22 155.3 155.3 0 0 1 21.46 12.57 16 16 0 0 0 15.11 1.71l44.89-18.07a10.81 10.81 0 0 1 13.14 4.58l42.77 74a10.8 10.8 0 0 1-2.45 13.75l-38.21 30a16.05 16.05 0 0 0-6.05 14.08c.33 4.14.55 8.3.55 12.47Z"
            fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="32px"
            class="stroke-000000"></path>
        </svg></div>
    </div>
    <div @click="$emit('toggleHelp')" class="status-block clickable" title="Help">?</div>
  </div>
</template>

<style scoped lang="sass">
  .status-block
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
</style>
