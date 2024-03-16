<script>
import { getLatestNoteInfos, isSystemNote } from '../notes'

/** @typedef {import("../state.js").NoteInfo} NoteInfo */

/**
 * @param {NoteInfo} noteInfo
 * @returns {NoteInfo}
 */
function mkNoteInfo2(noteInfo) {
  if (noteInfo.nameLC === undefined) {
    noteInfo.nameLC = noteInfo.name.toLowerCase()
  }
  return noteInfo
}

/**
 * @returns {NoteInfo[]}
 */
function rebuildNotesInfo() {
  const noteInfos = getLatestNoteInfos()
  console.log("rebuildNotesInfo, notes", noteInfos.length)
  /** @type {NoteInfo[]} */
  let res = [];
  for (let noteInfo of noteInfos) {
    res.push(mkNoteInfo2(noteInfo))
  }
  res.sort((a, b) => {
    return a.name.localeCompare(b.name)
  })
  return res
}

export default {
  data() {
    let items = rebuildNotesInfo()
    console.log("NoteSelector data", items)
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
    filteredItems() {
      const nameLC = this.filter.toLowerCase().trim()
      return this.items.filter((noteInfo) => {
        return noteInfo.nameLC.indexOf(nameLC) !== -1
      })
    },
    /**
     * @returns {NoteInfo | null}
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
    selectedName() {
      let selected = this.selectedNote
      if (selected === null) {
        return ""
      }
      return selected.name
    },
    canOpenSelected() {
      if (this.filteredItems.length === 0) {
        return false
      }
      if (this.selected < 0) {
        return false
      }
      return true
    },
    canCreate() {
      // TODO: use lowerCase name?
      let name = this.filter.trim()
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
    canCreateWithEnter() {
      // if there are no matches for the filter, we can create with just Enter
      // otherwise we need Ctrl + Enter
      let name = this.filter.trim()
      if (name.length === 0) {
        return false
      }
      return !this.canOpenSelected;
    },
    canDeleteSelected() {
      if (!this.canOpenSelected) {
        return false
      }
      const item = this.filteredItems[this.selected]
      // can't delete scratch note
      if (item.name === "scratch") {
        return false
      }
      if (isSystemNote(item)) {
        return false
      }
      return true
    },
    showDelete() {
      return this.canOpenSelected
    },
  },

  methods: {
    cleanNoteName(name) {
      // TODO: sanitize for file name
      return `"` + name.trim() + `"`
    },

    isCtrlDelete(event) {
      return (event.key === "Delete" || event.key === "Backspace") && event.ctrlKey
    },

    onKeydown(event) {
      if (event.key === "ArrowDown") {
        this.selected = Math.min(this.selected + 1, this.filteredItems.length - 1)
        event.preventDefault()
        if (this.selected === this.filteredItems.length - 1) {
          // @ts-ignore
          this.$refs.container.scrollIntoView({ block: "end" })
        } else {
          this.$refs.item[this.selected].scrollIntoView({ block: "nearest" })
        }

      } else if (event.key === "ArrowUp") {
        this.selected = Math.max(this.selected - 1, 0)
        event.preventDefault()
        if (this.selected === 0) {
          // @ts-ignore
          this.$refs.container.scrollIntoView({ block: "start" })
        } else {
          this.$refs.item[this.selected].scrollIntoView({ block: "nearest" })
        }
      } else if (event.key === "Enter") {
        event.preventDefault()
        let name = this.filter.trim();
        console.log("selected:", this.selected, "name:", name);
        if (this.canCreateWithEnter) {
          this.createNote(name);
          return;
        }
        if (event.ctrlKey && this.canCreate) {
          this.createNote(this.filter)
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
          this.deleteNote(selected)
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
     * @param {NoteInfo} noteInfo
     */
    openNote(noteInfo) {
      this.$emit("openNote", noteInfo)
    },

    createNote(name) {
      console.log("create note", name)
      this.$emit("createNote", name)
    },

    /**
     * @param {NoteInfo} noteInfo
     */
    deleteNote(noteInfo) {
      console.log("deleteNote", noteInfo)
      this.$emit("deleteNote", noteInfo)
    },

    onInput(event) {
      // reset selection
      this.selected = 0
    },

    onFocusOut(event) {
      let container = this.$refs.container
      // @ts-ignore
      if (container !== event.relatedTarget && !container.contains(event.relatedTarget)) {
        this.$emit("close")
      }
    },
  }
}
</script>

<template>
  <div class="scroller">
    <form class="note-selector" tabindex="-1" @focusout="onFocusOut" ref="container">
      <input type="text" ref="input" @keydown="onKeydown" @input="onInput" v-model="filter" />
      <ul class="items">
        <li v-for="item, idx in filteredItems" :key="item.path" :class="idx === selected ? 'selected' : ''"
          @click="openNote(item)" ref="item">
          {{ item.name }}
        </li>
      </ul>
      <hr class="mt-1 mb-1 border-gray-400" v-if="canOpenSelected || canDeleteSelected || filter.length > 0" />
      <div class="kbd-grid">
        <div v-if="canOpenSelected"><span class="kbd">Enter</span></div>
        <div v-if="canOpenSelected">open note</div>
        <div v-if="canOpenSelected" class="bold truncate">{{ cleanNoteName(selectedName) }}
        </div>

        <div v-if="canCreateWithEnter"><span class="kbd">Enter</span></div>
        <div v-if="canCreate && !canCreateWithEnter"><span class="kbd">Ctrl + Enter</span></div>
        <div v-if="canCreate">create note</div>
        <div v-if="canCreate" class="bold truncate">{{ cleanNoteName(filter) }}</div>

        <div v-if="showDelete"><span class="kbd">Ctrl + Delete</span></div>
        <div v-if="showDelete" class="red">delete note</div>
        <div v-if="showDelete && canDeleteSelected" class="bold truncate">{{
      cleanNoteName(selectedName)
    }}
        </div>
        <div v-if="showDelete && !canDeleteSelected"><span class="red">can't delete <span class="bold truncate">{{
      cleanNoteName(selectedName) }}</span></span></div>

        <div><span class="kbd">Esc</span></div>
        <div>dismiss</div>
        <div></div>
      </div>
    </form>
  </div>
</template>

<style scoped lang="sass">
    .scroller
        overflow: auto
        position: fixed
        top: 0
        left: 0
        bottom: 0
        right: 0

    .note-selector
        width: 32em
        font-size: 13px
        padding: 10px
        //background: #48b57e
        background: #efefef
        position: absolute
        top: 0
        left: 50%
        transform: translateX(-50%)
        border-radius: 0 0 5px 5px
        box-shadow: 0 0 10px rgba(0,0,0,0.3)
        +dark-mode
            background: #151516
            box-shadow: 0 0 10px rgba(0,0,0,0.5)
        +webapp-mobile
            max-width: calc(100% - 80px)

        input
            width: 100%
            background: #fff
            padding: 4px 5px
            border: 1px solid #ccc
            box-sizing: border-box
            border-radius: 2px
            margin-bottom: 10px
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
                line-height: 1.5
                border-radius: 3px
                padding: 2px 8px
                cursor: pointer
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
            display: grid
            grid-template-columns: auto auto 1fr
            grid-column-gap: 1em
            grid-row-gap: 1em
            margin-top: 1em
            font-size: 11px
            padding-left: 8px
            padding-right: 8px
            color: gray
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
        .bold
            font-weight: bold
        .red
            color: red
            +dark-mode
                color: #ff7b72
</style>
