<script>
import Editor from './Editor.vue'
import Help from './Help.vue'
import LanguageSelector from './LanguageSelector.vue'
import NoteSelector from './NoteSelector.vue'
import StatusBar from './StatusBar.vue'
import TopNav from './TopNav.vue'
import RenameNote from './RenameNote.vue'
import ToastUndo from './ToastUndo.vue'

import Settings from './settings/Settings.vue'
import { isAltNumEvent, setURLHashNoReload, stringSizeInUtf8Bytes } from '../util'
import { createNewScratchNote, createNoteWithName, dbDelDirHandle, deleteNote, getNotesMetadata, getMetadataForNote, getStorageFS, pickAnotherDirectory, switchToStoringNotesOnDisk, kScratchNoteName, canDeleteNote, renameNote, isSystemNoteName, kDailyJournalNoteName, kHelpSystemNoteName, kReleaseNotesSystemNoteName } from '../notes'
import { getModChar, getAltChar } from "../../src/util"
import ContextMenu from '@imengyu/vue3-context-menu'
import { supportsFileSystem, openDirPicker } from '../fileutil'
import { onOpenSettings, getSettings, onSettingsChange, setSetting } from '../settings'
import { boot } from '../webapp-boot'
import { getLanguage, langSupportsFormat, langSupportsRun } from '../editor/languages'
import { useToast, POSITION } from "vue-toastification";
import { getHistory } from '../history';
import { exportNotesToZip } from '../notes-export'

/** @typedef {import("@imengyu/vue3-context-menu/lib/ContextMenuDefine").MenuItem} MenuItem */

let toastOptions = {
  position: POSITION.TOP_RIGHT,
  timeout: 4000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  // draggable: true,
  // draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: true,
  closeButton: "button",
  icon: false,
  rtl: false
};

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
    ToastUndo
  },

  setup() {
    const toast = useToast();
    return { toast }
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
      isSpellChecking: false,
      spellcheckToastID: 0,
      lastEscTime: 0,
      altChar: getAltChar(),
    }
  },

  mounted() {
    console.log("App.vue mounted")
    onSettingsChange((settings) => {
      this.settings = settings;
      this.theme = settings.theme;
      //throwIf(this.noteName != settings.currentNoteName, "noteName != settings.currentNoteName")
      console.log(`onSettingsChange callback, noteName: ${this.noteName}, settings.currentNoteName: ${settings.currentNoteName}, theme: ${this.theme}`)
    })
    onOpenSettings(() => {
      this.showingSettings = true
    })
    this.getEditor().setSpellChecking(this.isSpellChecking)
    window.addEventListener("keydown", this.onKeyDown)
    console.log("App.vue mounted: showing toast")
  },

  beforeUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
  },

  computed: {
    noteNameStatusBar() {
      let name = this.noteName
      let m = getMetadataForNote(name)
      if (m && m.altShortcut) {
        name = `${name} (${this.altChar} + ${m.altShortcut})`
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

    toggleSpellCheck() {
      this.isSpellChecking = !this.isSpellChecking
      this.getEditor().setSpellChecking(this.isSpellChecking)
      // if (this.isSpellChecking) {
      //   this.toast("Press Shift + right mouse click for context menu when spell checking is enabled", toastOptions)
      // }
    },

    /**
     * @param {KeyboardEvent} e
     */
    onKeyDown(e) {

      if (e.key === "Escape") {
        let sinceLast = performance.now() - this.lastEscTime
        let shouldSwitchToPrev = sinceLast < 300
        // console.log("Escape: sinceLast:", sinceLast)
        let hist = getHistory()
        // console.log("Escape: hist:", hist)
        if (shouldSwitchToPrev && hist.length > 1) {
          let prev = hist[1];
          console.log("Escape: switching to previous note:", prev)
          this.getEditor().openNote(prev)
        }
        this.lastEscTime = performance.now()
      }

      // if (e.key === "F2") {
      //   console.log("F2");
      //   let undoAction = () => {
      //     console.log("undoAction")
      //   }
      //   this.toast({
      //     component: ToastUndo,
      //     props: {
      //       message: "F2 pressed",
      //       undoText: "Undo delete",
      //       undoAction: undoAction,
      //     },
      //   }, toastOptions)
      // }

      // TODO: can I do this better? The same keydown event that sets the Alt-N shortcut
      // in NoteSelector also seems to propagate here and immediately opens the note.
      if (!this.showingNoteSelector) {
        let altN = isAltNumEvent(e)
        // console.log("onKeyDown: e:", e, "altN:", altN)
        if (altN) {
          let meta = getNotesMetadata()
          for (let o of meta) {
            if (o.altShortcut == altN && o.name !== this.noteName) {
              // console.log("onKeyDown: opening note: ", o.name, " altN:", altN, " e:", e)
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

    async onRename(newName) {
      this.showingRenameNote = false
      let s = this.getEditor().getContent() || ""
      await renameNote(this.noteName, newName, s)
      this.getEditor().openNote(newName, true)
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
      // TODO: this.getEditor().saveCurrentNote() ?
      await switchToStoringNotesOnDisk(dh);
      let settings = getSettings();
      this.getEditor().openNote(settings.currentNoteName, true)
      this.getEditor().focus()
    },

    async pickAnotherDirectory() {
      let ok = await pickAnotherDirectory();
      if (ok) {
        await boot()
      }
    },

    async switchToBrowserStorage() {
      console.log("switchToBrowserStorage(): deleting dir handle")
      await dbDelDirHandle();
      await boot();
    },

    /**
     * @param {MouseEvent} e
     */
    onContextMenu(e) {
      if (this.showingNoteSelector || this.showingLanguageSelector || this.showingSettings) {
        return
      }
      // show native context menu if ctrl or shift is pressed
      // especially important for spell checking
      let forceNativeMenu = e.ctrlKey;
      if (forceNativeMenu) {
        return
      }

      let modChar = getModChar();
      let altChar = getAltChar();
      let theme = document.documentElement.getAttribute("theme")
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
          shortcut: `${modChar} + K`,
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
      let lang = getLanguage(this.language)
      if (langSupportsFormat(lang)) {
        blockChildren.push({
          label: "Format as " + this.language,
          onClick: () => { this.getEditor().formatCurrentBlock() },
          shortcut: `${altChar} + Shift + F`,
        })
      }
      if (langSupportsRun(lang)) {
        blockChildren.push({
          label: "Run " + this.language,
          onClick: () => { this.getEditor().runCurrentBlock() },
          shortcut: `${altChar} + Shift + R`,
        })
      }

      /** @type {MenuItem[]} */
      let children = [];
      let dh = getStorageFS();
      if (dh == null) {
        // if currently storing in browser
        children = [
          {
            label: "Current store: browser (localStorage)",
            disabled: true,
          }
        ]
      } else {
        children = [
          {
            label: `Current store: directory '${dh.name}'`,
            disabled: true,
          }
        ]
      }
      if (supportsFileSystem()) {
        if (dh === null) {
          children.push(
            {
              label: "Move notes from browser to directory",
              onClick: () => { this.storeNotesOnDisk() },
            }
          )
          children.push(
            {
              label: "Switch to notes in a directory",
              onClick: async () => { await this.pickAnotherDirectory() },
            }
          )
        } else {
          children.push(
            {
              label: "Switch to browser (localStorage)",
              onClick: async () => { await this.switchToBrowserStorage() },
            }
          )
          children.push(
            {
              label: "Switch to notes in a different directory",
              onClick: async () => { await this.pickAnotherDirectory() },
            }
          )
        }
      }
      children.push({
        label: "Export notes to .zip file",
        onClick: () => { this.exportNotesToZipFile() },
        divided: "up",
      })
      children.push({
        label: "Show help",
        onClick: () => { this.toggleHelp("storing-notes-on-disk") },
        divided: "up",
      })
      items.push({
        label: "Notes storage",
        children: children,
      })

      let s = this.isSpellChecking ? "Disable spell checking" : "Enable spell checking"
      items.push({
        label: s,
        onClick: () => {
          this.toggleSpellCheck();
        },
      })
      items.push({
        label: "Help",
        divided: "up",
        children: [
          {
            label: "Show help",
            onClick: () => { this.toggleHelp() },
          },
          {
            label: "Show help in new tab",
            onClick: () => { this.showHelpInNewTab() },
          },
          {
            label: "Show help as note",
            onClick: () => { this.showHelpAsNote() },
          },
          {
            label: "Release notes",
            onClick: () => { this.showReleaseNotes() },
          }
        ]
      })
      items.push({
        label: "Tip: Ctrl + click for native context menu",
        disabled: true,
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

    exportNotesToZipFile() {
      exportNotesToZip()
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
      this.getEditor().openNote(kScratchNoteName, true)
      await deleteNote(name)
      // TODO: add a way to undo deletion of the note
      this.toast(`Deleted note '${name}'`, toastOptions)
    },

    async createNewScratchNote() {
      let name = await createNewScratchNote()
      this.onOpenNote(name)
      // TODO: add a way to undo creation of the note
      this.toast(`Created scratch note '${name}'`, toastOptions)
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
     * @param {string} name
     */
    onOpenNote(name) {
      this.showingNoteSelector = false
      this.getEditor().openNote(name)
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

    showHelpInNewTab() {
      // let uri = window.location.origin + "/help"
      window.open("/help", "_blank");
    },

    showHelpAsNote() {
      this.getEditor().openNote(kHelpSystemNoteName);
    },

    showReleaseNotes() {
      this.getEditor().openNote(kReleaseNotesSystemNoteName);
    },

    /**
     * @param {string} name
     */
    async onCreateNote(name) {
      this.showingNoteSelector = false
      await createNoteWithName(name)
      this.onOpenNote(name)
      // TODO: add a way to undo creation of the note
      this.toast(`Created note '${name}'`, toastOptions)
    },

    /**
     * @param {string} name
     */
    async onDeleteNote(name) {
      this.showingNoteSelector = false
      let settings = getSettings()
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
      // TODO: add a way to undo deletion of the note
      this.toast(`Deleted note '${name}'`, toastOptions)
    },

    /**
     * called when a new document has been loaded or when a document has been modified
     * TODO: maybe needs separate event onDocLoaded
     * @param {string} name
     */
    onDocChanged(name) {
      let justOpened = name !== undefined;
      // console.log(`doc changed: name: ${name} this.noteName: ${this.noteName}, justOpened: ${justOpened}`)
      if (name === undefined) {
        name = this.noteName
      } else {
        this.noteName = name
      }

      let editorComp = this.getEditor()
      const c = editorComp.getContent() || ""
      this.docSize = stringSizeInUtf8Bytes(c);

      if (justOpened) {
        let readOnly = isSystemNoteName(name)
        editorComp.editor.setReadOnly(readOnly)
        if (name === kDailyJournalNoteName) {
          console.log("journal, so going to next block")
          editorComp.gotoNextBlock()
        }

        window.document.title = name;
        setURLHashNoReload(name)
        setSetting("currentNoteName", name);
      }
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
  <div class="grid w-screen max-h-screen h-screen fixed grid-rows-[1fr_auto]" @contextmenu="onContextMenu($event)">
    <!--TODO: show note name, a drop-down for switching, search icon, menu -->
    <!-- <div class="text-base hidden">
      <div>{{ noteName }}</div>
      <div>23 notes</div>
    </div> -->
    <Editor @cursorChange="onCursorChange" :theme="theme" :development="development" :debugSyntaxTree="false"
      :keymap="settings.keymap" :emacsMetaKey="settings.emacsMetaKey"
      :showLineNumberGutter="settings.showLineNumberGutter" :showFoldGutter="settings.showFoldGutter"
      :bracketClosing="settings.bracketClosing" :fontFamily="settings.fontFamily" :fontSize="settings.fontSize"
      class="overflow-hidden" ref="editor" @openLanguageSelector="openLanguageSelector"
      @createNewScratchNote="createNewScratchNote" @openNoteSelector="openNoteSelector" @docChanged="onDocChanged" />
    <StatusBar :noteName="noteNameStatusBar" :line="line" :column="column" :docSize="docSize"
      :selectionSize="selectionSize" :language="language" :languageAuto="languageAuto"
      :isSpellChecking="isSpellChecking" @openLanguageSelector="openLanguageSelector"
      @openNoteSelector="openNoteSelector" @formatCurrentBlock="formatCurrentBlock" @runCurrentBlock="runCurrentBlock"
      @toggleSpellCheck="toggleSpellCheck" @openSettings="showingSettings = true" @toggleHelp="toggleHelp" class="" />
  </div>
  <div class="overlay">
    <LanguageSelector v-if="showingLanguageSelector" @selectLanguage="onSelectLanguage"
      @close="closeLanguageSelector" />
    <NoteSelector v-if="showingNoteSelector" @openNote="onOpenNote" @createNote="onCreateNote"
      @deleteNote="onDeleteNote" @close="closeNoteSelector" />
    <Settings v-if="showingSettings" :initialSettings="settings" @closeSettings="closeSettings" />
  </div>
  <div style="mcStyle" class="fixed inset-0 z-40 pointer-events-none">
    <form class="relative w-full h-full pointer-events-none z-50 text-[8px]" ref="menuContainer" tabIndex="-1"></form>
  </div>
  <Help @close="onCloseHelp" :anchor="helpAnchor" v-if="showingHelp" />
  <RenameNote @close="onCloseRename" @rename="onRename" :oldName="noteName" v-if="showingRenameNote" />
</template>
../export../notes-export.js../notes-export