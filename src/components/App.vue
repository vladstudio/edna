<script>
import TopNav from './TopNav.vue'
import StatusBar from './StatusBar.vue'
import Editor from './Editor.vue'
import LanguageSelector from './LanguageSelector.vue'
import NoteSelector from './NoteSelector.vue'
import Settings from './settings/Settings.vue'
import { stringSizeInUtf8Bytes, platformName } from '../utils'
import { createNewScratchNote, createNoteWithName, deleteNote, getScratchNoteInfo, getStorageFS, isNoteInfoEqual, switchToStoringNotesOnDisk } from '../notes'
import { getModChar, getAltChar } from "../../src/utils"
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import ContextMenu from '@imengyu/vue3-context-menu'
import { supportsFileSystem, openDirPicker, readDir } from '../fileutil'
import { onOpenSettings, getSettings, onSettingsChange, themeMode } from '../settings'

/** @typedef {import("../state.js").NoteInfo} NoteInfo */

export default {
  components: {
    TopNav,
    Editor,
    StatusBar,
    LanguageSelector,
    NoteSelector,
    Settings,
    ContextMenu,
  },

  data() {
    let settings = getSettings()
    // console.log("setting:", settings)
    return {
      noteName: settings.currentNoteInfo.name,
      line: 1,
      column: 1,
      docSize: 0,
      selectionSize: 0,
      language: "plaintext",
      languageAuto: true,
      theme: themeMode.initial,
      initialTheme: themeMode.initial,
      themeSetting: 'system',
      development: window.location.href.indexOf("dev=1") !== -1,
      showLanguageSelector: false,
      showNoteSelector: false,
      showSettings: false,
      settings: settings,
      showingMenu: false,
      showingHelp: false,
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
      console.log("onSettingsChange callback", settings)
      this.settings = settings;
      this.noteName = settings.currentNoteInfo.name
      console.log("noteName", this.noteName)
    })
    onOpenSettings(() => {
      this.showSettings = true
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
    helpURL() {
      if (platformName === "mac") {
        return "/help-mac.html"
      }
      return "/help-win.html"
    }
  },

  methods: {
    /**
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

    async storeNotesOnDisk() {
      let dh = await openDirPicker(true)
      if (!dh) {
        return;
      }
      await switchToStoringNotesOnDisk(dh);
      let settings = getSettings();
      let noteInfo = settings.currentNoteInfo
      console.log("storeNotesOnDisk: noteInfo:", noteInfo)
      this.getEditor().openNote(noteInfo)
      this.getEditor().focus()
    },

    onContextMenu(e) {
      // console.log("onContextMenu")
      if (this.showNoteSelector || this.showLanguageSelector || this.showSettings) {
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
      let editor = this.$refs.editor;
      e.preventDefault();
      this.showingMenu = true
      let items = [
        {
          label: "Open / create / delete note",
          onClick: () => { this.openNoteSelector() },
          shortcut: `${modChar} + P`,
        },
        {
          label: "And block after current",
          onClick: () => { this.getEditor().addNewBlockAfterCurrent() },
          shortcut: `${modChar} + Enter`,
        },
        {
          label: "Add block before current",
          onClick: () => { this.getEditor().addNewBlockBeforeCurrent() },
          shortcut: `${altChar} + Enter`,
        },
        {
          label: "Add block at end",
          onClick: () => { this.getEditor().addNewBlockAfterLast() },
          shortcut: `${modChar} + Shift + Enter`,
        },
        {
          label: "Add block at start",
          onClick: () => { this.getEditor().addNewBlockBeforeFirst() },
          shortcut: `${altChar} + Shift + Enter`,
        },
        {
          label: "Split block at cursor position",
          onClick: () => { this.getEditor().insertNewBlockAtCursor() },
          shortcut: `${modChar} + ${altChar} + Enter`,
        },
        {
          label: "Change block language",
          onClick: () => { this.openLanguageSelector() },
          shortcut: `${modChar} + L`,
        },
        {
          label: "Select all text in block",
          onClick: () => { this.getEditor().selectAll() },
          shortcut: `${modChar} + A`,
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
        // {
        // label: "A submenu",
        //     children: [
        //         { label: "Item1" },
        //         { label: "Item2" },
        //         { label: "Item3" },
        //     ]
        // },
      ]

      if (supportsFileSystem && (getStorageFS() == null)) {
        items.push({
          label: "Store notes on disk",
          onClick: () => { this.storeNotesOnDisk() },
          shortcut: "",
        })

        items.push({
          label: "Show help",
          onClick: () => { this.toggleHelp() },
          shortcut: "",
        })
      }

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
      this.showSettings = true
    },
    closeSettings() {
      this.showSettings = false
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
      this.showLanguageSelector = true
    },

    closeLanguageSelector() {
      this.showLanguageSelector = false
      this.getEditor().focus()
    },

    onSelectLanguage(language) {
      this.showLanguageSelector = false
      this.getEditor().setLanguage(language)
    },

    openNoteSelector() {
      this.showNoteSelector = true
    },

    closeNoteSelector() {
      this.showNoteSelector = false
      this.getEditor().focus()
      // console.log("closeNoteSelector")
    },

    /**
     * @param {NoteInfo} noteInfo
     */
    onOpenNote(noteInfo) {
      this.showNoteSelector = false
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
      this.showNoteSelector = false
      let noteInfo = await createNoteWithName(name)
      this.onOpenNote(noteInfo)
      // TODO: show a notification that allows to undo creation of the note
    },

    /**
     * @param {NoteInfo} noteInfo
     */
    async onDeleteNote(noteInfo) {
      this.showNoteSelector = false
      let settings = getSettings()
      if (isNoteInfoEqual(noteInfo, settings.currentNoteInfo)) {
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
      @openSettings="showSettings = true" @toggleHelp="toggleHelp" class="status" />
    <div class="overlay">
      <LanguageSelector v-if="showLanguageSelector" @selectLanguage="onSelectLanguage" @close="closeLanguageSelector" />
      <NoteSelector v-if="showNoteSelector" @openNote="onOpenNote" @createNote="onCreateNote" @deleteNote="onDeleteNote"
        @close="closeNoteSelector" />
      <Settings v-if="showSettings" :initialSettings="settings" :initialTheme="themeSetting" @setTheme="setTheme"
        @closeSettings="closeSettings" />
    </div>
  </div>
  <div style="mcStyle" class="menu-overlay">
    <form class="menu-container" ref="menuContainer" tabIndex="-1"></form>
  </div>
  <div v-if="showingHelp" class="fixed bottom-[28px] right-[28px] w-[80%] h-[80%] bg-yellow-50 shadow-md">
    <iframe :src="helpURL" width="100%" height="100%"></iframe>
  </div>
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