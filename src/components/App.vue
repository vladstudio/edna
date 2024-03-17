<script>
import Editor from './Editor.vue'
import Help from './Help.vue'
import LanguageSelector from './LanguageSelector.vue'
import NoteSelector from './NoteSelector.vue'
import StatusBar from './StatusBar.vue'
import TopNav from './TopNav.vue'

import Settings from './settings/Settings.vue'
import { stringSizeInUtf8Bytes } from '../utils'
import { createNewScratchNote, createNoteWithName, deleteNote, findNoteInfoByName, getScratchNoteInfo, getStorageFS, switchToStoringNotesOnDisk } from '../notes'
import { getModChar, getAltChar } from "../../src/utils"
import ContextMenu from '@imengyu/vue3-context-menu'
import { supportsFileSystem, openDirPicker } from '../fileutil'
import { onOpenSettings, getSettings, onSettingsChange, themeMode } from '../settings'

/** @typedef {import("../state.js").NoteInfo} NoteInfo */

export default {
  components: {
    ContextMenu,
    Editor,
    Help,
    LanguageSelector,
    NoteSelector,
    Settings,
    StatusBar,
    TopNav,
  },

  data() {
    let settings = getSettings()
    // console.log("setting:", settings)
    return {
      column: 1,
      development: window.location.href.indexOf("dev=1") !== -1,
      docSize: 0,
      initialTheme: themeMode.initial,
      language: "plaintext",
      languageAuto: true,
      line: 1,
      noteName: settings.currentNoteName,
      selectionSize: 0,
      settings: settings,
      showingHelp: false,
      showingMenu: false,
      showingLanguageSelector: false,
      showingNoteSelector: false,
      showingSettings: false,
      theme: themeMode.initial,
      themeSetting: 'system',
    }
  },

  mounted() {
    themeMode.get().then((mode) => {
      this.theme = mode.computed
      this.themeSetting = mode.theme
    })
    const onThemeChange = (theme) => {
      this.theme = theme
      if (theme === "system") {
        document.documentElement.setAttribute("theme", window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      } else {
        document.documentElement.setAttribute("theme", theme)
      }
    }
    onThemeChange(themeMode.initial)
    themeMode.onChange(onThemeChange)
    onSettingsChange((settings) => {
      this.settings = settings;
      this.noteName = settings.currentNoteName
      console.log("onSettingsChange callback, noteName:", this.noteName)
    })
    onOpenSettings(() => {
      this.showingSettings = true
    })
    window.addEventListener("keydown", this.onKeyDown)
  },

  beforeUnmount() {
    themeMode.removeListener()
    window.removeEventListener("keydown", this.onKeyDown);
  },

  computed: {
    mcStyle() {
      return {
        display: this.showingMenu ? "block" : "none"
      }
    },
  },

  methods: {
    /**@c
     * @returns {Editor}
    */
    getEditor() {
      // @ts-ignore
      return this.$refs.editor
    },

    onKeyDown(e) {
      // hack: stop Ctrl + O unless it originates from code mirror (because then it
      // triggers NoteSelector.vue)
      if (e.key == "o" && e.ctrlKey && !e.altKey && !e.shiftKey) {
        let fromCodeMirror = e.target && e.target.className.includes("cm-content")
        if (!fromCodeMirror) {
          e.preventDefault()
        }
      }
      if (e.key == "Escape") {
        if (this.showingHelp) {
          this.toggleHelp();
        }
      }
    },

    onCloseHelp(e) {
      this.showingHelp = false
      this.getEditor().focus()
    },

    async storeNotesOnDisk() {
      let dh = await openDirPicker(true)
      if (!dh) {
        return;
      }
      await switchToStoringNotesOnDisk(dh);
      let settings = getSettings();
      let noteInfo = findNoteInfoByName(settings.currentNoteName)
      console.log("storeNotesOnDisk: noteInfo:", noteInfo)
      this.getEditor().openNote(noteInfo)
      this.getEditor().focus()
    },

    onContextMenu(e) {
      // console.log("onContextMenu")
      if (this.showingNoteSelector || this.showingLanguageSelector || this.showingSettings) {
        return
      }

      let modChar = getModChar();
      let altChar = getAltChar();
      let theme = document.documentElement.getAttribute("theme")
      console.log("theme:", theme)
      let menuTheme = "default"
      if (theme == "dark") {
        menuTheme = "default dark"
      }
      e.preventDefault();
      this.showingMenu = true
      let items = [
        {
          label: "Open / create / delete note",
          onClick: () => { this.openNoteSelector() },
          shortcut: `${modChar} + P`,
        },
        {
          label: "Block",
          children: [
            {
              label: "And after current",
              onClick: () => { this.getEditor().addNewBlockAfterCurrent() },
              shortcut: `${modChar} + Enter`,
            },
            {
              label: "Add before current",
              onClick: () => { this.getEditor().addNewBlockBeforeCurrent() },
              shortcut: `${altChar} + Enter`,
            },
            {
              label: "Add at end",
              onClick: () => { this.getEditor().addNewBlockAfterLast() },
              shortcut: `${modChar} + Shift + Enter`,
            },
            {
              label: "Add at start",
              onClick: () => { this.getEditor().addNewBlockBeforeFirst() },
              shortcut: `${altChar} + Shift + Enter`,
            },
            {
              label: "Split at cursor position",
              onClick: () => { this.getEditor().insertNewBlockAtCursor() },
              shortcut: `${modChar} + ${altChar} + Enter`,
            },
            {
              label: "Change language",
              onClick: () => { this.openLanguageSelector() },
              shortcut: `${modChar} + L`,
            },
            {
              label: "Select all text",
              onClick: () => { this.getEditor().selectAll() },
              shortcut: `${modChar} + A`,
            },
          ]
        },
        {
          label: "Create new scratch note",
          onClick: () => { this.createNewScratchNote() },
          shortcut: `${altChar} + N`,
        },
        // TODO: format if supports format
        // TODO: run  if supports run
        // TODO: set plain text, markdown
        // {
        //     label: "Goto next block",
        //     onClick: () => {this.getEditor().gotoNextBlock() },
        //     shortcut: `${modChar} + Down`,
        // },
        // {
        //     label: "Goto previous block",
        //     onClick: () => {this.getEditor().gotoPreviousBlock() },
        //     shortcut: `${modChar} + Up`,
        // },
        // {
        //     label: "Format",
        //     onClick: () => {this.getEditor().formatCurrentBlock() }
        // },
        // {
        //     label: "Execute block code",
        //     onClick: () => { this.openNoteSelector() }
        // },
      ]

      if (supportsFileSystem && (getStorageFS() == null)) {
        items.push({
          label: "Store notes on disk",
          onClick: () => { this.storeNotesOnDisk() },
          shortcut: "",
        })
      }
      items.push({
        label: "Show help",
        onClick: () => { this.toggleHelp() },
        shortcut: "",
      })

      ContextMenu.showContextMenu({
        x: e.x,
        y: e.y,
        theme: menuTheme,
        preserveIconWidth: false,
        keyboardControl: true,
        zIndex: 40,
        // @ts-ignore
        getContainer: () => {
          const o = this.$refs.menuContainer;
          // const o = document.body;
          return o
        },
        onClose: (lastClicked) => {
          // console.log("onClose: lastClicked:", lastClicked)
          this.showingMenu = false
          this.getEditor().focus()
        },
        items: items,
      });

      // @ts-ignore
      this.$refs.menuContainer.focus()
    },

    openSettings() {
      this.showingSettings = true
    },
    closeSettings() {
      this.showingSettings = false
      this.getEditor().focus()
    },

    setTheme(newTheme) {
      themeMode.set(newTheme)
      this.themeSetting = newTheme
    },

    toggleTheme() {
      let newTheme
      // when the "system" theme is used, make sure that the first click always results in an actual theme change
      if (this.initialTheme === "light") {
        newTheme = this.themeSetting === "system" ? "dark" : (this.themeSetting === "dark" ? "light" : "system")
      } else {
        newTheme = this.themeSetting === "system" ? "light" : (this.themeSetting === "light" ? "dark" : "system")
      }
      this.setTheme(newTheme)
      this.getEditor().focus()
    },

    onCursorChange(e) {
      this.line = e.cursorLine.line
      this.column = e.cursorLine.col
      this.selectionSize = e.selectionSize
      this.language = e.language
      this.languageAuto = e.languageAuto
    },

    async createNewScratchNote() {
      let noteInfo = await createNewScratchNote()
      this.onOpenNote(noteInfo)
      // TODO: show a notification that allows to undo creation of the note
    },

    openLanguageSelector() {
      this.showingLanguageSelector = true
    },

    closeLanguageSelector() {
      this.showingLanguageSelector = false
      this.getEditor().focus()
    },

    onSelectLanguage(language) {
      this.showingLanguageSelector = false
      this.getEditor().setLanguage(language)
    },

    openNoteSelector() {
      this.showingNoteSelector = true
    },

    closeNoteSelector() {
      this.showingNoteSelector = false
      this.getEditor().focus()
      // console.log("closeNoteSelector")
    },

    /**
     * @param {NoteInfo} noteInfo
     */
    onOpenNote(noteInfo) {
      this.showingNoteSelector = false
      this.getEditor().openNote(noteInfo)
    },

    toggleHelp() {
      this.showingHelp = !this.showingHelp
      if (!this.showingHelp) {
        this.getEditor().focus()
      }
    },

    /**
     * @param {string} name
     */
    async onCreateNote(name) {
      this.showingNoteSelector = false
      let noteInfo = await createNoteWithName(name)
      this.onOpenNote(noteInfo)
      // TODO: show a notification that allows to undo creation of the note
    },

    /**
     * @param {NoteInfo} noteInfo
     */
    async onDeleteNote(noteInfo) {
      this.showingNoteSelector = false
      let settings = getSettings()
      // if deleting current note, first switch to scratch note
      // TODO: maybe switch to the most recently opened
      if (noteInfo.name === settings.currentNoteName) {
        console.log("deleted current note, opening scratch note")
        this.getEditor().openNote(getScratchNoteInfo())
      }
      // must delete after openNote() because openNote() saves
      // current note
      await deleteNote(noteInfo)
      this.getEditor().focus()
      console.log("deleted note", noteInfo)
      // TODO: show a notification that allows to undo deletion of the note
    },

    docChanged() {
      const c = this.getEditor().getContent() || ""
      this.docSize = stringSizeInUtf8Bytes(c);
    },

    formatCurrentBlock() {
      this.getEditor().formatCurrentBlock()
    },

    runCurrentBlock() {
      this.getEditor().runCurrentBlock()
    },
  },
}

</script>

<template>
  <div class="app-container" @contextmenu="onContextMenu($event)">
    <!-- <TopNav /> -->
    <Editor @cursorChange="onCursorChange" :theme="theme" :development="development" :debugSyntaxTree="false"
      :keymap="settings.keymap" :emacsMetaKey="settings.emacsMetaKey"
      :showLineNumberGutter="settings.showLineNumberGutter" :showFoldGutter="settings.showFoldGutter"
      :bracketClosing="settings.bracketClosing" :fontFamily="settings.fontFamily" :fontSize="settings.fontSize"
      class="editor" ref="editor" @openLanguageSelector="openLanguageSelector"
      @createNewScratchNote="createNewScratchNote" @openNoteSelector="openNoteSelector" @docChanged="docChanged" />
    <StatusBar :noteName="noteName" :line="line" :column="column" :docSize="docSize" :selectionSize="selectionSize"
      :language="language" :languageAuto="languageAuto" @openLanguageSelector="openLanguageSelector"
      @openNoteSelector="openNoteSelector" @formatCurrentBlock="formatCurrentBlock" @runCurrentBlock="runCurrentBlock"
      @openSettings="showingSettings = true" @toggleHelp="toggleHelp" class="status" />
    <div class="overlay">
      <LanguageSelector v-if="showingLanguageSelector" @selectLanguage="onSelectLanguage"
        @close="closeLanguageSelector" />
      <NoteSelector v-if="showingNoteSelector" @openNote="onOpenNote" @createNote="onCreateNote"
        @deleteNote="onDeleteNote" @close="closeNoteSelector" />
      <Settings v-if="showingSettings" :initialSettings="settings" :initialTheme="themeSetting" @setTheme="setTheme"
        @closeSettings="closeSettings" />
    </div>
  </div>
  <div style="mcStyle" class="menu-overlay">
    <form class="menu-container " ref="menuContainer" tabIndex="-1"></form>
  </div>
  <Help @close="onCloseHelp" v-if="showingHelp" />
</template>

<style scoped lang="sass">
    .menu-overlay
        position: fixed
        top: 0
        left: 0
        width: 100%
        height: 100%
        z-index: 40
        pointer-events: none
        .menu-container
            position: relative
            width: 100%
            height: 100%
            pointer-events: none
            z-index: 45
            font-size: 8px
    .app-container
        width: 100%
        height: 100%
        position: relative
        .editor
            height: calc(100% - 21px - 21px)
        .status
            position: absolute
            bottom: 0
            left: 0
</style>