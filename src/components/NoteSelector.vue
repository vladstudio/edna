<script>
import { getLatestNoteNames, getMetadataForNote, isSystemNoteName, reassignNoteShortcut } from '../notes'
import sanitize from "sanitize-filename"
import { getAltChar, isAltNumEvent, len } from '../utils'

/**
 * @typedef {Object} Item
 * @property {string} name
 * @property {string} [nameLC]
 * @property {number} [altShortcut] - -1 if no shortcut, 0 to 9 for Alt-0 to Alt-9
 */

let altChar = getAltChar();

/**
* @returns {Item[]}
*/
function rebuildNotesInfo() {
  const noteNames = getLatestNoteNames()
  // console.log("rebuildNotesInfo, notes", noteInfos)
  /** @type {Item[]} */
  let res = Array(len(noteNames))
  // let res = [];
  for (let i = 0; i < len(noteNames); i++) {
    let name = noteNames[i]
    let item = {
      name: name,
      nameLC: name.toLowerCase()
    }
    let m = getMetadataForNote(item.name);
    if (m && m.altShortcut) {
      item.altShortcut = parseInt(m.altShortcut)
    }
    res[i] = item
  }
  // -1 if a < b
  // 0 if a = b
  // 1 if a > b
  res.sort((a, b) => {
    // those with shortcut are before (<) those without
    if (a.altShortcut && !b.altShortcut) {
      return -1
    }
    // those without shortcut are after (>) those with
    if (!a.altShortcut && b.altShortcut) {
      return 1
    }
    // if both have shortcut, sort by shortcut
    if (a.altShortcut && b.altShortcut) {
      return a.altShortcut - b.altShortcut
    }
    let isSysA = isSystemNoteName(a.name)
    let isSysB = isSystemNoteName(b.name)
    // system are last
    if (isSysA && !isSysB) {
      return 1
    }
    if (!isSysA && isSysB) {
      return -1
    }
    // if both have no shortcut, sort by name
    return a.name.localeCompare(b.name)
  })
  return res
}

export default {
  data() {
    let items = rebuildNotesInfo()
    return {
      items: items,
      selected: 0,
      filter: "",
    }
  },

  mounted() {
    // @ts-ignore
    this.$refs.container.focus()
    // @ts-ignore
    this.$refs.input.focus()
  },

  computed: {
    sanitizedFilter() {
      return sanitize(this.filter).trim()
    },


    filteredItems() {
      const nameLC = this.sanitizedFilter.toLowerCase()
      return this.items.filter((noteInfo) => {
        return noteInfo.nameLC.indexOf(nameLC) !== -1
      })
    },
    /**
     * @returns {Item | null}
     */
    selectedNote() {
      if (this.filteredItems.length === 0) {
        return null
      }
      if (this.selected >= 0 && this.selected < this.filteredItems.length) {
        return this.filteredItems[this.selected]
      }
      return null;
    },
    /**
     * @returns {string}
     */
    selectedName() {
      let selected = this.selectedNote
      if (selected === null) {
        return ""
      }
      return selected.name
    },
    /**
     * @returns {boolean}
     */
    canOpenSelected() {
      if (this.filteredItems.length === 0) {
        return false
      }
      if (this.selected < 0) {
        return false
      }
      return true
    },
    /**
     * @returns {boolean}
     */
    canCreate() {
      // TODO: use lowerCase name?
      let name = this.sanitizedFilter
      if (name.length === 0) {
        return false
      }
      for (let item of this.items) {
        if (item.name === name) {
          return false
        }
      }
      return true
    },
    /**
     * @returns {boolean}
     */
    canCreateWithEnter() {
      // if there are no matches for the filter, we can create with just Enter
      // otherwise we need Ctrl + Enter
      let name = this.sanitizedFilter
      if (name.length === 0) {
        return false
      }
      return !this.canOpenSelected;
    },
    /**
     * @returns {boolean}
     */
    canDeleteSelected() {
      if (!this.canOpenSelected) {
        return false
      }
      const item = this.filteredItems[this.selected]
      if (!item) {
        return false
      }
      // can't delete scratch note
      if (item.name === "scratch") {
        return false
      }
      if (isSystemNoteName(item.name)) {
        return false
      }
      return true
    },
    showDelete() {
      return this.canOpenSelected
    },
  },

  methods: {
    /**
     * @param {string} name
     * @returns {string}
     */
    sanitizeNoteName(name) {
      let res = sanitize(name);
      // console.log(`sanitizeNoteName: ${name} -> ${res}`);
      return res;
    },

    /**
     * @param {string} name
     * @returns {string}
     */
    cleanNoteName(name) {
      return `"` + this.sanitizeNoteName(name) + `"`
    },

    /**
     * @param {Item} note
     * @returns {string}
     */
    isSysNote(note) {
      return isSystemNoteName(note.name) ? "italic" : ""
    },

    /**
     * @param {KeyboardEvent} event
     * @returns {boolean}
     */
    isCtrlDelete(event) {
      return (event.key === "Delete" || event.key === "Backspace") && event.ctrlKey
    },

    /**
     * @param {Item} note
     * @returns {string}
     */
    noteShortcut(note) {
      return note.altShortcut ? altChar + " + " + note.altShortcut : ""
    },

    /**
     * @param {KeyboardEvent} event
     */
    onKeydown(event) {
      // console.log("onKeyDown:", event);
      let container = /** @type {HTMLElement} */(this.$refs.container);
      let altN = isAltNumEvent(event);
      if (altN !== null) {
        event.preventDefault()
        let note = this.selectedNote
        if (note) {
          reassignNoteShortcut(note.name, altN).then(() => {
            this.items = rebuildNotesInfo()
          })
          return;
        }
      }

      if (event.key === "ArrowDown") {
        this.selected = Math.min(this.selected + 1, this.filteredItems.length - 1)
        event.preventDefault()
        if (this.selected === this.filteredItems.length - 1) {
          container.scrollIntoView({ block: "end" })
        } else {
          this.$refs.item[this.selected].scrollIntoView({ block: "nearest" })
        }
      } else if (event.key === "ArrowUp") {
        this.selected = Math.max(this.selected - 1, 0)
        event.preventDefault()
        if (this.selected === 0) {
          container.scrollIntoView({ block: "start" })
        } else {
          this.$refs.item[this.selected].scrollIntoView({ block: "nearest" })
        }
      } else if (event.key === "Enter") {
        event.preventDefault()
        let name = this.sanitizedFilter;
        console.log("selected:", this.selected, "name:", name);
        if (this.canCreateWithEnter) {
          this.createNote(name);
          return;
        }
        if (event.ctrlKey && this.canCreate) {
          this.createNote(this.sanitizedFilter)
          return;
        }
        const selected = this.filteredItems[this.selected]
        if (selected) {
          this.openNote(selected)
        } else {
          this.$emit("close")
        }
      } else if (this.isCtrlDelete(event)) {
        event.preventDefault()
        if (!this.canDeleteSelected) {
          return
        }
        const selected = this.selectedNote;
        if (selected) {
          this.deleteNote(selected.name)
        } else {
          this.$emit("close")
        }
      } else if (event.key === "Escape") {
        // TODO: we also call onFocusOut() and emit "close" event twice
        this.$emit("close")
        event.preventDefault()
      }
    },

    /**
     * @param {Item} item
     */
    openNote(item) {
      console.log("openNote", item)
      this.$emit("openNote", item.name)
    },

    createNote(name) {
      console.log("create note", name)
      this.$emit("createNote", name)
    },

    /**
     * @param {string} name
     */
    deleteNote(name) {
      console.log("deleteNote", name)
      this.$emit("deleteNote", name)
    },

    onInput(event) {
      // reset selection
      this.selected = 0
    },

    onFocusOut(event) {
      let container = /** @type {HTMLElement} */ (this.$refs.container);
      if (container !== event.relatedTarget && !container.contains(event.relatedTarget)) {
        this.$emit("close")
      }
    },
  }
}
</script>

<template>
  <div class="fixed inset-0 overflow-auto">
    <form class="note-selector left-1/2 -translate-x-1/2 max-h-[94vh] flex flex-col w-[32em] top-0 absolute p-3 "
      tabindex="-1" @focusout="onFocusOut" ref="container">
      <input type="text" ref="input" @keydown="onKeydown" @input="onInput" v-model="filter"
        class="py-1 px-2 bg-white w-[400px] mb-2 rounded-sm" />
      <ul class="items overflow-y-auto">
        <li v-for="item, idx in filteredItems" :key="item.name"
          class="flex cursor-pointer py-0.5 px-2 rounded-sm leading-5" :class="idx === selected ? 'selected' : ''"
          @click="openNote(item)" ref="item">
          <div :class="this.isSysNote(item) ? 'italic' : ''">
            {{ item.name }}
          </div>
          <div class="grow"></div>
          <div>{{ noteShortcut(item) }}</div>
        </li>
      </ul>
      <hr class="mt-1 mb-1 border-gray-400" v-if="canOpenSelected || canDeleteSelected || filter.length > 0" />
      <div
        class="kbd-grid grid grid-cols-[auto_auto_1fr] gap-x-3 gap-y-3 mt-4 text-gray-700 text-size-[11px] leading-[1em]">
        <div v-if="canOpenSelected"><span class="kbd">Enter</span></div>
        <div v-if="canOpenSelected">open note</div>
        <div v-if="canOpenSelected" class="font-bold truncate">{{ cleanNoteName(selectedName) }}
        </div>

        <div v-if="canCreateWithEnter"><span class="kbd">Enter</span></div>
        <div v-if="canCreate && !canCreateWithEnter"><span class="kbd">Ctrl + Enter</span></div>
        <div v-if="canCreate">create note</div>
        <div v-if="canCreate" class="font-bold truncate">{{ cleanNoteName(filter) }}</div>

        <div v-if="showDelete"><span class="kbd">Ctrl + Delete</span></div>
        <div v-if="showDelete" class="red">delete note</div>
        <div v-if="showDelete && canDeleteSelected" class="font-bold truncate">{{
        cleanNoteName(selectedName)
      }}
        </div>
        <div v-if="showDelete && !canDeleteSelected"><span class="red">can't delete <span class="font-bold truncate">{{
        cleanNoteName(selectedName) }}</span></span></div>

        <div><span class="kbd">Alt + 0...9</span></div>
        <div class="col-span-2">assign quick access shortcut</div>

        <div><span class="kbd">Esc</span></div>
        <div>dismiss</div>
        <div class="italic"></div>
      </div>
    </form>
  </div>
</template>

<style scoped lang="sass">
  .note-selector
      font-size: 13px
      //background: #48b57e
      background: #efefef
      box-shadow: 0 0 10px rgba(0,0,0,0.3)
      +dark-mode
          background: #151516
          box-shadow: 0 0 10px rgba(0,0,0,0.5)
      +webapp-mobile
          max-width: calc(100% - 80px)

      input
          border: 1px solid #ccc
          &:focus
              outline: none
              border: 1px solid #fff
              // outline: 2px solid #48b57e
              outline: 2px solid #487eb5
          +dark-mode
              background: #3b3b3b
              color: rgba(255,255,255, 0.9)
              border: 1px solid #5a5a5a
              &:focus
                  border: 1px solid #3b3b3b
          +webapp-mobile
              font-size: 16px
              max-width: 100%
      .items
          > li
              &:hover
                  background: #e2e2e2
              &.selected
                  // background: #48b57e
                  background: #487eb5
                  color: #fff
              +dark-mode
                  color: rgba(255,255,255, 0.53)
                  &:hover
                      background: #29292a
                  &.selected
                      background: #1b6540
                      color: rgba(255,255,255, 0.87)
      .kbd-grid
          +dark-mode
                  color: rgba(255,255,255, 0.53)
      .kbd
          font-family: monospace
          font-size: 10px
          border: 1px solid #ccc
          border-radius: 4px
          padding: 3px 5px
          background-color: white
          +dark-mode
              background-color: #3b3b3b
              color: rgba(255,255,255, 0.9)
      .red
          color: red
          +dark-mode
              color: #ff7b72
</style>
