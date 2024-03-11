<script>
import { loadNotePaths, splitNotePath, getSystemNotes } from '../notes'

function mkNoteInfo(path) {
  let [_, name] = splitNotePath(path)
  return {
    "path": path,
    "name": name,
    "nameLC": name.toLowerCase(),
  }
}

function rebuildNotesInfo() {
  const notePaths = loadNotePaths()
  console.log("rebuildNotesInfo, notes", notePaths.length)
  let res = [];
  for (let path of notePaths) {
    res.push(mkNoteInfo(path))
  }
  res.sort((a, b) => {
    return a.name.localeCompare(b.name)
  })
  const systemNotes = getSystemNotes()
  for (let path of systemNotes) {
    res.push(mkNoteInfo(path))
  }
  return res
}

export default {
  data() {
    return {
      items: rebuildNotesInfo(),
      selected: 0,
      filter: "",
    }
  },

  mounted() {
    this.$refs.container.focus()
    this.$refs.input.focus()
  },

  computed: {
    filteredItems() {
      const nameLC = this.filter.toLowerCase().trim()
      return this.items.filter((noteInfo) => {
        return noteInfo.nameLC.indexOf(nameLC) !== -1
      })
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
      for (let noteInfo of this.items) {
        if (noteInfo.name === name) {
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
    // TODO: filter help note
    canDeleteSelected() {
      if (!this.canOpenSelected) {
        return false
      }
      const noteInfo = this.filteredItems[this.selected]
      // can't delete scratch note
      if (noteInfo.name === "scratch") {
        return false
      }
      if (noteInfo.path.startsWith("system:")) {
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
          this.$refs.container.scrollIntoView({ block: "end" })
        } else {
          this.$refs.item[this.selected].scrollIntoView({ block: "nearest" })
        }

      } else if (event.key === "ArrowUp") {
        this.selected = Math.max(this.selected - 1, 0)
        event.preventDefault()
        if (this.selected === 0) {
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
          this.openNote(selected.path)
        } else {
          this.$emit("close")
        }
      } else if (this.isCtrlDelete(event)) {
        const selected = this.filteredItems[this.selected]
        if (selected) {
          this.deleteNote(selected.path)
        } else {
          this.$emit("close")
        }
        event.preventDefault()
      } else if (event.key === "Escape") {
        // TODO: we also call onFocusOut() and emit "close" event twice
        this.$emit("close")
        event.preventDefault()
      }
    },

    openNote(path) {
      this.$emit("openNote", path)
    },

    createNote(name) {
      console.log("create note", name)
      this.$emit("createNote", name)
    },

    deleteNote(notePath) {
      console.log("deleteNote", notePath)
      this.$emit("deleteNote", notePath)
    },

    onInput(event) {
      // reset selection
      this.selected = 0
    },

    onFocusOut(event) {
      let container = this.$refs.container
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
          @click="openNote(item.path)" ref="item">
          {{ item.name }}
        </li>
      </ul>
      <hr v-if="canOpenSelected || canDeleteSelected || filter.length > 0" />
      <div class="kbd-grid">
        <div v-if="canOpenSelected"><span class="kbd">Enter</span></div>
        <div v-if="canOpenSelected">open note</div>
        <div v-if="canOpenSelected" class="bold truncate">{{ cleanNoteName(filteredItems[selected].name) }}</div>

        <div v-if="canCreateWithEnter"><span class="kbd">Enter</span></div>
        <div v-if="canCreate && !canCreateWithEnter"><span class="kbd">Ctrl + Enter</span></div>
        <div v-if="canCreate">create note</div>
        <div v-if="canCreate" class="bold truncate">{{ cleanNoteName(filter) }}</div>

        <div v-if="showDelete"><span class="kbd">Ctrl + Delete</span></div>
        <div v-if="showDelete" class="red">delete note</div>
        <div v-if="showDelete && canDeleteSelected" class="bold truncate">{{ cleanNoteName(filteredItems[selected].name)
          }}
        </div>
        <div v-if="showDelete && !canDeleteSelected">can't delete <span class="bold truncate">{{
      cleanNoteName(filteredItems[selected].name) }}</span></div>

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
                border-radius: 3px
                padding: 5px 12px
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
