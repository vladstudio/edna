<script>
import { kEventDocChanged, EdnaEditor, kEventOpenLanguageSelector, kEventOpenNoteSelector, kEventCreateNewScratchNote } from '../editor/editor.js'
import { syntaxTree } from "@codemirror/language"
import { kScratchNoteName, loadCurrentNote, loadNote, saveCurrentNote } from '../notes.js'
import { rememberEditor } from '../state.js'
import { getSettings } from '../settings.js'

export default {
  props: {
    theme: String,
    development: Boolean,
    debugSyntaxTree: Boolean,
    keymap: {
      type: String,
      default: "default",
    },
    emacsMetaKey: {
      type: String,
      default: "alt",
    },
    showLineNumberGutter: {
      type: Boolean,
      default: true,
    },
    showFoldGutter: {
      type: Boolean,
      default: true,
    },
    bracketClosing: {
      type: Boolean,
      default: false,
    },
    fontFamily: String,
    fontSize: Number,
  },

  components: {},

  data() {
    return {
      syntaxTreeDebugContent: null,
      diskContent: null,
    }
  },

  mounted() {
    let editor = /** @type {HTMLElement} */ (this.$refs.editor);
    editor.addEventListener("selectionChange", (ev) => {
      let e = /** @type {import("../editor/event.js").SelectionChangeEvent} */ (ev);
      this.$emit("cursorChange", {
        cursorLine: e.cursorLine,
        selectionSize: e.selectionSize,
        language: e.language,
        languageAuto: e.languageAuto,
      })
    })

    editor.addEventListener(kEventOpenLanguageSelector, (e) => {
      this.$emit(kEventOpenLanguageSelector)
    })
    editor.addEventListener(kEventOpenNoteSelector, (e) => {
      this.$emit(kEventOpenNoteSelector)
    })
    editor.addEventListener(kEventDocChanged, (e) => {
      this.$emit(kEventDocChanged)
    })
    editor.addEventListener(kEventCreateNewScratchNote, (e) => {
      this.$emit(kEventCreateNewScratchNote)
    })

    // load buffer content and create editor
    loadCurrentNote().then((content) => {
      this.diskContent = content
      this.editor = new EdnaEditor({
        element: this.$refs.editor,
        content: content,
        theme: this.theme,
        saveFunction: async (content) => {
          if (content === this.diskContent) {
            console.log("saveFunction: content unchanged, skipping save")
            return
          }
          console.log("saveFunction: saving content")
          this.diskContent = content
          await saveCurrentNote(content)
        },
        keymap: this.keymap,
        emacsMetaKey: this.emacsMetaKey,
        showLineNumberGutter: this.showLineNumberGutter,
        showFoldGutter: this.showFoldGutter,
        bracketClosing: this.bracketClosing,
        fontFamily: this.fontFamily,
        fontSize: this.fontSize,
      })
      let settings = getSettings();
      rememberEditor(this.editor)
      window.document.addEventListener("currenciesLoaded", this.onCurrenciesLoaded)
      let name = settings.currentNoteName;
      console.log("loadCurrentNote: triggering docChanged event, name:", name)
      this.$emit("docChanged", name)

      // setTimeout(() => {
      //   this.setSpellChecking(true);
      // }, 10)
    })

    // if debugSyntaxTree prop is set, display syntax tree for debugging
    if (this.debugSyntaxTree) {
      setInterval(() => {
        function render(tree) {
          let lists = ''
          tree.iterate({
            enter(type) {
              lists += `<ul><li>${type.name} (${type.from},${type.to})`
            },
            leave() {
              lists += '</ul>'
            }
          })
          return lists
        }
        this.syntaxTreeDebugContent = render(syntaxTree(this.editor.view.state))
      }, 1000)
    }
  },


  beforeUnmount() {
    window.document.removeEventListener("currenciesLoaded", this.onCurrenciesLoaded)
  },

  watch: {
    theme(newTheme) {
      this.editor.setTheme(newTheme)
    },

    keymap() {
      this.editor.setKeymap(this.keymap, this.emacsMetaKey)
    },

    emacsMetaKey() {
      this.editor.setKeymap(this.keymap, this.emacsMetaKey)
    },

    showLineNumberGutter(show) {
      this.editor.setLineNumberGutter(show)
    },

    showFoldGutter(show) {
      this.editor.setFoldGutter(show)
    },

    bracketClosing(value) {
      this.editor.setBracketClosing(value)
    },

    fontFamily() {
      this.editor.setFont(this.fontFamily, this.fontSize)
    },
    fontSize() {
      this.editor.setFont(this.fontFamily, this.fontSize)
    },
  },

  methods: {
    setSpellChecking(value) {
      // console.log("setSpellChecking:", value)
      let ce = document.querySelector('[contenteditable="true"]');
      if (!ce) {
        // console.log("no content editable found")
        return
      }
      // console.log("found content editable")
      if (value) {
        ce.setAttribute("spellcheck", "true")
      } else {
        ce.setAttribute("spellcheck", "false")
      }
    },

    isSpellChecking() {
      let ce = document.querySelector('[contenteditable="true"]');
      if (!ce) {
        return false
      }
      return ce.getAttribute("spellcheck") === "true"
    },
    setLanguage(language) {
      if (language === "auto") {
        this.editor.setCurrentLanguage("text", true)
      } else {
        this.editor.setCurrentLanguage(language, false)
      }
      this.editor.focus()
    },

    formatCurrentBlock() {
      this.editor.formatCurrentBlock()
      this.editor.focus()
    },

    runCurrentBlock() {
      this.editor.runCurrentBlock()
      this.editor.focus()
    },

    onCurrenciesLoaded() {
      this.editor.currenciesLoaded()
    },

    focus() {
      this.editor.focus();
    },

    addNewBlockAfterCurrent() {
      this.editor.addNewBlockAfterCurrent()
      this.editor.focus();
    },

    addNewBlockBeforeCurrent() {
      this.editor.addNewBlockBeforeCurrent()
      this.editor.focus();
    },

    addNewBlockAfterLast() {
      this.editor.addNewBlockAfterLast()
      this.editor.focus();
    },

    addNewBlockBeforeFirst() {
      this.editor.addNewBlockBeforeFirst()
      this.editor.focus();
    },

    insertNewBlockAtCursor() {
      this.editor.insertNewBlockAtCursor()
      this.editor.focus();
    },

    gotoNextBlock() {
      this.editor.gotoNextBlock()
      this.editor.focus();
    },

    gotoPreviousBlock() {
      this.editor.gotoPreviousBlock()
      this.editor.focus();
    },

    selectAll() {
      this.editor.selectAll()
      this.editor.focus();
    },

    getContent() {
      return this.editor.getContent()
    },

    // saving is debounced so ensure we save before opening a new note
    // TODO: we'll have a spurious save if there was a debounce, because
    // the debounce is still in progress, I think
    async saveCurrentNote() {
      await this.editor.saveFunction(this.editor.getContent())
    },

    /**
     * @param {string} name
     */
    async openNote(name, skipSave = false) {
      console.log("openNote:", name)
      if (!skipSave) {
        // TODO: this is async so let's hope it works
        await this.saveCurrentNote()
      }
      let content = await loadNote(name);
      console.log("Editor.openNote: loaded:", name)
      this.diskContent = content
      let newState = this.editor.createState(content)
      this.editor.view.setState(newState);
      // TODO: move this logic to App.onDocChanged
      // a bit magic: sometimes we open at the beginning, sometimes at the end
      // TODO: remember selection in memory so that we can restore during a session
      let pos = 0;
      if (name === kScratchNoteName) {
        pos = content.length
      }
      this.editor.view.dispatch({
        selection: { anchor: pos, head: pos },
        scrollIntoView: true,
      })
      this.focus()
      console.log("openNote: triggering docChanged event, name:", name)
      this.$emit("docChanged", name)
    }
  },
}
</script>

<template>
  <div>
    <div class="editor" ref="editor"></div>
    <div v-if="debugSyntaxTree" v-html="syntaxTreeDebugContent" class="debug-syntax-tree"></div>
  </div>
</template>

<style lang="sass" scoped>
    .debug-syntax-tree
        position: absolute
        top: 0
        bottom: 0
        right: 0
        width: 50%
        background-color: rgba(240, 240, 240, 0.85)
        color: #000
        font-size: 12px
        font-family: monospace
        padding: 10px
        overflow: auto

        ul
            padding-left: 20px
        > ul
            padding-left: 0
</style>
