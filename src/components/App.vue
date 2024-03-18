<script>
import Editor from './Editor.vue'
import Help from './Help.vue'
import LanguageSelector from './LanguageSelector.vue'
import NoteSelector from './NoteSelector.vue'
import StatusBar from './StatusBar.vue'
import TopNav from './TopNav.vue'
import RenameNote from './RenameNote.vue'

import Settings from './settings/Settings.vue'
import { isAltNumEvent, stringSizeInUtf8Bytes } from '../utils'
import { createNewScratchNote, createNoteWithName, dbDelDirHandle, deleteNote, findNoteInfoByName, getNotesMetadata, getMetadataForNote, getScratchNoteInfo, getStorageFS, pickAnotherDirectory, switchToStoringNotesOnDisk, kScratchNoteName, canDeleteNote } from '../notes'
import { getModChar, getAltChar } from "../../src/utils"
import ContextMenu from '@imengyu/vue3-context-menu'
import { supportsFileSystem, openDirPicker } from '../fileutil'
import { onOpenSettings, getSettings, onSettingsChange } from '../settings'
import { boot } from '../webapp-boot'
import { langSupportsFormat, langSupportsRun } from '../editor/languages'

/** @typedef {import("../notes.js").NoteInfo} NoteInfo */

/** @typedef {import("@imengyu/vue3-context-menu/lib/ContextMenuDefine").MenuItem} MenuItem */

export default {
  components: {
    ContextMenu,
    Editor,
    Help,
    LanguageSelector,
    NoteSelector,
    RenameNote,
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
      helpAnchor: "",
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
      showingRenameNote: false,
      theme: settings.theme,
    }
  },

  mounted() {
    onSettingsChange((settings) => {
      this.settings = settings;
      this.noteName = settings.currentNoteName
      this.theme = settings.theme;
      console.log("onSettingsChange callback, noteName:", this.noteName, "theme:", this.theme)
    })
    onOpenSettings(() => {
      this.showingSettings = true
    })
    window.addEventListener("keydown", this.onKeyDown)
  },

  beforeUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
  },

  computed: {
    noteNameStatusBar() {
      let name = this.noteName
      let m = getMetadataForNote(name)
      if (m && m.altShortcut) {
        name = `${name} (Alt + ${m.altShortcut})`
      }
      return name
    },
    mcStyle() {
      return {
        display: this.showingMenu ? "block" : "none"
      }
    },
  },

  methods: {
    /**
     * @returns {Editor}
    */
    getEditor() {
      // @ts-ignore
      return this.$refs.editor
    },

    /**
     * @param {KeyboardEvent} e
     */
    onKeyDown(e) {
      // TODO: can I do this better? The same keydown event that sets the Alt-N shortcut
      // in NoteSelector also seems to propagate here and immediately opens the note.
      if (!this.showingNoteSelector) {
        let altN = isAltNumEvent(e)
        if (altN) {
          let meta = getNotesMetadata()
          for (let o of meta) {
            if (o.altShortcut == altN && o.name !== this.noteName) {
              console.log("onKeyDown: opening note: ", o.name, " altN:", altN, " e:", e)
              this.getEditor().openNote(o.name)
              this.getEditor().focus()
              e.preventDefault()
              return
            }
          }
        }
      }

      // hack: stop Ctrl + O unless it originates from code mirror (because then it
      // triggers NoteSelector.vue)
      if (e.key == "o" && e.ctrlKey && !e.altKey && !e.shiftKey) {
        let target = /** @type {HTMLElement} */ (e.target);
        let fromCodeMirror = target && target.className.includes("cm-content")
        if (!fromCodeMirror) {
          e.preventDefault()
        }
      }
    },

    onCloseRename() {
      this.showingRenameNote = false
      this.getEditor().focus()
    },

    onRename(newName) {
      console.log("onRename: newName:", newName)
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
      this.getEditor().openNote(settings.currentNoteName)
      this.getEditor().focus()
    },

    async pickAnotherDirectory() {
      let ok = pickAnotherDirectory();
      if (ok) {
        boot()
      }
    },

    async switchToBrowserStorage() {
      await dbDelDirHandle();
      boot();
    },

    onContextMenu(e) {
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
      let canDelete = this.canDeleteNote();
      /** @type {MenuItem[]} */
      let items = [
        {
          label: "Open / create / delete note",
          onClick: () => { this.openNoteSelector() },
          shortcut: `${modChar} + P`,
        },
        {
          label: "Note",
          children: [
            {
              label: "Rename current note",
              onClick: () => { this.renameCurrentNote() },
              disabled: !canDelete,
            },
            {
              label: "Delete current note",
              onClick: () => { this.deleteCurrentNote() },
              disabled: !canDelete,
            },
            {
              label: "Create new scratch note",
              onClick: () => { this.createNewScratchNote() },
              shortcut: `${altChar} + N`,
            },
          ]
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
              label: "Goto next",
              onClick: () => { this.getEditor().gotoNextBlock() },
              shortcut: `${modChar} + Down`,
            },
            {
              label: "Goto previous",
              onClick: () => { this.getEditor().gotoPreviousBlock() },
              shortcut: `${modChar} + Up`,
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
        // TODO: set plain text, markdown
      ]
      let blockChildren = items[2].children
      if (langSupportsFormat(this.language)) {
        blockChildren.push({
          label: "Format " + this.language,
          onClick: () => { this.getEditor().formatCurrentBlock() },
          shortcut: `${altChar} + Shift + F`,
        })
      }
      if (langSupportsRun(this.language)) {
        blockChildren.push({
          label: "Run " + this.language,
          onClick: () => { this.getEditor().runCurrentBlock() },
          shortcut: `${altChar} + Shift + R`,
        })
      }

      if (supportsFileSystem) {
        /** @type {MenuItem[]} */
        let children = [];
        if (getStorageFS() == null) {
          // if currently storing in browser
          children = [
            {
              label: "Move from browser to directory",
              onClick: () => { this.storeNotesOnDisk() },
              shortcut: "",
            },
            {
              label: "Open directory with notes",
              onClick: () => { this.pickAnotherDirectory() },
              shortcut: "",
            }
          ]
        } else {
          children = [
            {
              label: "Switch to storing in browser",
              onClick: () => { this.switchToBrowserStorage() },
              shortcut: "",
            },
            {
              label: "Open directory with notes",
              onClick: () => { this.pickAnotherDirectory() },
              shortcut: "",
            }
          ]
        }
        children.push({
          label: "Show help",
          onClick: () => { this.toggleHelp("storage") },
          divided: "up",
          shortcut: "",
        })
        items.push({
          label: "Notes storage",
          children: children,
        })
      }
      items.push({
        label: "Show help",
        onClick: () => { this.toggleHelp() },
        divided: "up",
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
          // this.getEditor().focus()
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

    onCursorChange(e) {
      this.line = e.cursorLine.line
      this.column = e.cursorLine.col
      this.selectionSize = e.selectionSize
      this.language = e.language
      this.languageAuto = e.languageAuto
    },

    renameCurrentNote() {
      console.log("renameNote:");
      this.showingRenameNote = true;
    },

    canDeleteNote() {
      let name = this.noteName
      if (name == "scratch" || name == "help") {
        return false
      }
      return true
    },

    async deleteCurrentNote() {
      let name = this.noteName
      console.log("deleteNote:", name);
      if (!canDeleteNote(name)) {
        console.log("cannot delete note:", name)
        return
      }
      this.getEditor().openNote(kScratchNoteName)
      await deleteNote(name)
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
      this.getEditor().openNote(noteInfo.name)
    },

    toggleHelp(anchor = "") {
      let willHide = this.showingHelp;
      if (willHide) {
        this.showingHelp = false;
        // this.getEditor().focus()
        return;
      }
      this.helpAnchor = anchor
      this.showingHelp = true
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
      let name = noteInfo.name
      // if deleting current note, first switch to scratch note
      // TODO: maybe switch to the most recently opened
      if (name === settings.currentNoteName) {
        console.log("deleted current note, opening scratch note")
        this.getEditor().openNote(kScratchNoteName)
      }
      // must delete after openNote() because openNote() saves
      // current note
      await deleteNote(name)
      this.getEditor().focus()
      console.log("deleted note", name)
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
    <StatusBar :noteName="noteNameStatusBar" :line="line" :column="column" :docSize="docSize"
      :selectionSize="selectionSize" :language="language" :languageAuto="languageAuto"
      @openLanguageSelector="openLanguageSelector" @openNoteSelector="openNoteSelector"
      @formatCurrentBlock="formatCurrentBlock" @runCurrentBlock="runCurrentBlock" @openSettings="showingSettings = true"
      @toggleHelp="toggleHelp" class="status" />
    <div class="overlay">
      <LanguageSelector v-if="showingLanguageSelector" @selectLanguage="onSelectLanguage"
        @close="closeLanguageSelector" />
      <NoteSelector v-if="showingNoteSelector" @openNote="onOpenNote" @createNote="onCreateNote"
        @deleteNote="onDeleteNote" @close="closeNoteSelector" />
      <Settings v-if="showingSettings" :initialSettings="settings" @closeSettings="closeSettings" />
    </div>
  </div>
  <div style="mcStyle" class="menu-overlay">
    <form class="menu-container " ref="menuContainer" tabIndex="-1"></form>
  </div>
  <Help @close="onCloseHelp" :anchor="helpAnchor" v-if="showingHelp" />
  <RenameNote @close="onCloseRename" @rename="onRename" :oldName="noteName" v-if="showingRenameNote" />
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
            height: calc(100% - 21px) // TODO: better way than hardcoding height of status bar
        .status
            position: absolute
            bottom: 0
            left: 0
</style>