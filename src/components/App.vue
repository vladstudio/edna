<script>
import TopNav from './TopNav.vue'
import StatusBar from './StatusBar.vue'
import Editor from './Editor.vue'
import LanguageSelector from './LanguageSelector.vue'
import NoteSelector from './NoteSelector.vue'
import Settings from './settings/Settings.vue'
import { stringSizeInUtf8Bytes } from '../utils'
import { fixUpNote, getNoteName, scratchNotePath, helpNotePath } from '../notes'
import { modChar, altChar } from "../../src/key-helper"
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import ContextMenu from '@imengyu/vue3-context-menu'
import { supportsFileSystem, openDirPicker, readDir } from '../fileutil'
import { getSettings } from '../settings'
import { incNoteCreateCount } from '../state'

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
    console.log("setting:", settings)
    return {
      noteName: getNoteName(settings.currentNotePath),
      line: 1,
      column: 1,
      docSize: 0,
      selectionSize: 0,
      language: "plaintext",
      languageAuto: true,
      theme: window.edna.themeMode.initial,
      initialTheme: window.edna.themeMode.initial,
      themeSetting: 'system',
      development: window.location.href.indexOf("dev=1") !== -1,
      showLanguageSelector: false,
      showNoteSelector: false,
      showSettings: false,
      settings: settings,
      showingMenu: false,
    }
  },

  mounted() {
    window.edna.themeMode.get().then((mode) => {
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
    onThemeChange(window.edna.themeMode.initial)
    window.edna.themeMode.onChange(onThemeChange)
    window.edna.onSettingsChange((settings) => {
      console.log("onSettingsChange callback", settings)
      this.settings = settings;
      this.noteName = getNoteName(settings.currentNotePath)
      console.log("noteName", this.noteName)
    })
    window.edna.onOpenSettings(() => {
      this.showSettings = true
    })
    window.addEventListener("keydown", this.onKeyDown)
  },

  beforeUnmount() {
    window.edna.themeMode.removeListener()
    window.removeEventListener("keydown", this.onKeyDown);
  },

  computed: {
    mcStyle() {
      return {
        display: this.showingMenu ? "block" : "none"
      }
    }
  },

  methods: {
    onKeyDown(e) {
      // hack: stop Ctrl + O unless it originates from code mirror (because then it
      // triggers NoteSelector.vue)
      if (e.key == "o" && e.ctrlKey && !e.altKey && !e.shiftKey) {
        let fromCodeMirror = e.target && e.target.className.includes("cm-content")
        if (!fromCodeMirror) {
          e.preventDefault()
        }
      }
    },

    async storeNotesOnDisk() {
      console.log("storeNotesOnDisk")
      let dh = await openDirPicker(true)
      if (!dh) {
        return;
      }
      let skipEntryFn = (entry, dir) => {
        if (entry.kind === "directory") {
          return true
        }
        let name = entry.name.toLowerCase()
        return !(name.endsWith(".edna.txt") || name.endsWith("edna.encr.txt"))
      }
      let files = await readDir(dh, skipEntryFn)
      console.log("files", files)
    },

    onContextMenu(e) {
      // console.log("onContextMenu")
      if (this.showNoteSelector || this.showLanguageSelector || this.showSettings) {
        return
      }

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
          label: "Open note",
          onClick: () => { this.openNoteSelector() },
          shortcut: `${modChar} + O`,
        },
        {
          label: "And block after current",
          onClick: () => { editor.addNewBlockAfterCurrent() },
          shortcut: `${modChar} + Enter`,
        },
        {
          label: "Add block before current",
          onClick: () => { this.$refs.editor.addNewBlockBeforeCurrent() },
          shortcut: `${altChar} + Enter`,
        },
        {
          label: "Add block at end",
          onClick: () => { this.$refs.editor.addNewBlockAfterLast() },
          shortcut: `${modChar} + Shift + Enter`,
        },
        {
          label: "Add block at start",
          onClick: () => { this.$refs.editor.addNewBlockBeforeFirst() },
          shortcut: `${altChar} + Shift + Enter`,
        },
        {
          label: "Split block at cursor position",
          onClick: () => { this.$refs.editor.insertNewBlockAtCursor() },
          shortcut: `${modChar} + ${altChar} + Enter`,
        },
        {
          label: "Change block language",
          onClick: () => { this.openLanguageSelector() },
          shortcut: `${modChar} + L`,
        },
        {
          label: "Select all text in block",
          onClick: () => { this.$refs.editor.selectAll() },
          shortcut: `${modChar} + A`,
        },
        // TODO: format if supports format
        // TODO: run  if supports run
        // TODO: set plain text, markdown
        // {
        //     label: "Goto next block",
        //     onClick: () => { this.$refs.editor.gotoNextBlock() },
        //     shortcut: `${modChar} + Down`,
        // },
        // {
        //     label: "Goto previous block",
        //     onClick: () => { this.$refs.editor.gotoPreviousBlock() },
        //     shortcut: `${modChar} + Up`,
        // },
        // {
        //     label: "Format",
        //     onClick: () => { this.$refs.editor.formatCurrentBlock() }
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

      if (supportsFileSystem) {
        items.push({
          label: "Store notes on disk",
          onClick: () => { this.storeNotesOnDisk() },
        })
      }

      ContextMenu.showContextMenu({
        x: e.x,
        y: e.y,
        theme: menuTheme,
        preserveIconWidth: false,
        keyboardControl: true,
        zIndex: 40,
        getContainer: () => {
          const o = this.$refs.menuContainer;
          // const o = document.body;
          console.log("getContainer:", o)
          return o
        },
        onClose: (lastClicked) => {
          // console.log("onClose: lastClicked:", lastClicked)
          this.showingMenu = false
        },
        items: items,
      });

      this.$refs.menuContainer.focus()
    },

    openSettings() {
      this.showSettings = true
    },
    closeSettings() {
      this.showSettings = false
      this.$refs.editor.focus()
    },

    toggleTheme() {
      let newTheme
      // when the "system" theme is used, make sure that the first click always results in an actual theme change
      if (this.initialTheme === "light") {
        newTheme = this.themeSetting === "system" ? "dark" : (this.themeSetting === "dark" ? "light" : "system")
      } else {
        newTheme = this.themeSetting === "system" ? "light" : (this.themeSetting === "light" ? "dark" : "system")
      }
      window.edna.themeMode.set(newTheme)
      this.themeSetting = newTheme
      this.$refs.editor.focus()
    },

    onCursorChange(e) {
      this.line = e.cursorLine.line
      this.column = e.cursorLine.col
      this.selectionSize = e.selectionSize
      this.language = e.language
      this.languageAuto = e.languageAuto
    },

    openLanguageSelector() {
      this.showLanguageSelector = true
    },

    closeLanguageSelector() {
      this.showLanguageSelector = false
      this.$refs.editor.focus()
    },

    onSelectLanguage(language) {
      this.showLanguageSelector = false
      this.$refs.editor.setLanguage(language)
    },

    openNoteSelector() {
      this.showNoteSelector = true
    },

    closeNoteSelector() {
      this.showNoteSelector = false
      this.$refs.editor.focus()
      // console.log("closeNoteSelector")
    },

    onOpenNote(notePath) {
      this.showNoteSelector = false
      this.$refs.editor.openNote(notePath)
    },

    openHelp() {
      this.$refs.editor.openNote(helpNotePath)
    },

    onCreateNote(name) {
      this.showNoteSelector = false
      // TODO: do I need to sanitize name for localStorage keys?
      const notePath = "note:" + name
      if (localStorage.getItem(notePath) == null) {
        localStorage.setItem(notePath, fixUpNote(null))
        console.log("created note", name)
        incNoteCreateCount();
      } else {
        console.log("note already exists", name)
      }
      this.onOpenNote(notePath)
    },

    onDeleteNote(notePath) {
      this.showNoteSelector = false
      let settings = getSettings()
      if (notePath === settings.currentNotePath) {
        console.log("deleted current note, opening scratch note")
        this.$refs.editor.openNote(scratchNotePath)
      }
      // must delete after openNote() because openNote() saves
      // current note
      // TODO: could pass a "doNotSave" flag
      // TODO: need layer of indirection when saving to disk
      localStorage.removeItem(notePath)
      console.log("deleted note", notePath)
    },

    docChanged() {
      const c = this.$refs.editor.getContent() || ""
      this.docSize = stringSizeInUtf8Bytes(c);
    },

    formatCurrentBlock() {
      this.$refs.editor.formatCurrentBlock()
    },

    runCurrentBlock() {
      this.$refs.editor.runCurrentBlock()
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
      class="editor" ref="editor" @openLanguageSelector="openLanguageSelector" @openNoteSelector="openNoteSelector"
      @docChanged="docChanged" />
    <StatusBar :noteName="noteName" :line="line" :column="column" :docSize="docSize" :selectionSize="selectionSize"
      :language="language" :languageAuto="languageAuto" :theme="theme" :themeSetting="themeSetting"
      :autoUpdate="settings.autoUpdate" :allowBetaVersions="settings.allowBetaVersions" @toggleTheme="toggleTheme"
      @openLanguageSelector="openLanguageSelector" @openNoteSelector="openNoteSelector"
      @formatCurrentBlock="formatCurrentBlock" @runCurrentBlock="runCurrentBlock" @openSettings="showSettings = true"
      @openHelp="openHelp" class="status" />
    <div class="overlay">
      <LanguageSelector v-if="showLanguageSelector" @selectLanguage="onSelectLanguage" @close="closeLanguageSelector" />
      <NoteSelector v-if="showNoteSelector" @openNote="onOpenNote" @createNote="onCreateNote" @deleteNote="onDeleteNote"
        @close="closeNoteSelector" />
      <Settings v-if="showSettings" :initialSettings="settings" @closeSettings="closeSettings" />
    </div>
  </div>
  <div style="mcStyle" class="menu-overlay">
    <form class="menu-container" ref="menuContainer" tabIndex="-1"></form>
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