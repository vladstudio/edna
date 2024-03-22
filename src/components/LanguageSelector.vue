<script>
import { LANGUAGES } from '../editor/languages.js'

const items = LANGUAGES.map(l => {
  return {
    "token": l.token,
    "name": l.name,
    "nameLC": l.name.toLowerCase(),
  }
}).sort((a, b) => {
  return a.name.localeCompare(b.name)
})
items.unshift({ token: "auto", name: "Auto-detect", nameLC: "auto-detect" })

export default {
  data() {
    return {
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
      const filterLC = this.filter.toLowerCase()
      return items.filter((lang) => {
        return lang.nameLC.indexOf(filterLC) !== -1
      })
    },
  },

  methods: {
    onKeydown(event) {
      let container = /** @type {HTMLElement} */(this.$refs.container);
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
        const selected = this.filteredItems[this.selected]
        if (selected) {
          this.selectItem(selected.token)
        } else {
          this.$emit("close")
        }
        event.preventDefault()
      } else if (event.key === "Escape") {
        this.$emit("close")
        event.preventDefault()
      }
    },

    selectItem(token) {
      this.$emit("selectLanguage", token)
    },

    onInput(event) {
      // reset selection
      this.selected = 0
    },

    onFocusOut(event) {
      let container = /** @type {HTMLElement} */(this.$refs.container);
      if (container !== event.relatedTarget && !container.contains(event.relatedTarget)) {
        this.$emit("close")
      }
    },
  }
}
</script>

<template>
  <div class="fixed inset-0 overflow-auto">
    <form class="language-selector left-1/2 -translate-x-1/2 max-h-[94vh] flex flex-col absolute top-0 p-3"
      tabindex="-1" @focusout="onFocusOut" ref="container">
      <input type="text" ref="input" @keydown="onKeydown" @input="onInput" v-model="filter"
        class="py-1 px-2 bg-white w-[400px] mb-2 rounded-sm" />
      <ul class="items overflow-y-auto">
        <li v-for="item, idx in filteredItems" :key="item.token" :class="idx === selected ? 'selected' : ''"
          class="cursor-pointer py-0.5 px-2 rounded-sm leading-5" @click="selectItem(item.token)" ref="item">
          {{ item.name }}
        </li>
      </ul>
    </form>
  </div>
</template>

<style scoped lang="sass">
    .language-selector
        font-size: 12px
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
</style>
