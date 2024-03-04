<script>
    import { loadNotePaths } from '../notes'

    function rebuildNotesInfo() {
        const notePaths = loadNotePaths()
        console.log("rebuildNotesInfo", notePaths)
        let res = notePaths.map(path => {
            let name = path.split(":")[1]
            return {
                "token": path,
                "name": name,
                "nameLC": name.toLowerCase(),
            }
            }).sort((a, b) => {
                return a.name.localeCompare(b.name)
            })
        return res
    }

    export default {
        data() {
            console.log("data NoteSelector")
            return {
                items: rebuildNotesInfo(),
                selected: 0,
                filter: "",
            }
        },

        mounted() {
            // console.log("mounted NoteSelector")
            // items = rebuildNotesInfo();
            this.$refs.container.focus()
            this.$refs.input.focus()
        },

        computed: {
            filteredItems() {
                const filterLC = this.filter.toLowerCase()
                return this.items.filter((noteInfo) => {
                    return noteInfo.nameLC.indexOf(filterLC) !== -1
                })
            },
            canDeleteSelected() {
                if (this.filteredItems.length === 0) {
                    return false
                }
                if (this.selected < 0) {
                    return false
                }
                const noteInfo = this.filteredItems[this.selected]
                // can't delete scratch note
                if (noteInfo.name === "scratch") {
                    return false
                }
                return true
            },
        },

        methods: {
            trunc(name) {
                const maxLen = 24
                if (name.length > maxLen) {
                    return name.substring(0, maxLen) + "..."
                }
                return name
            },

            onKeydown(event) {
                if (event.key === "ArrowDown") {
                    this.selected = Math.min(this.selected + 1, this.filteredItems.length - 1)
                    event.preventDefault()
                    if (this.selected === this.filteredItems.length - 1) {
                        this.$refs.container.scrollIntoView({block: "end"})
                    } else {
                        this.$refs.item[this.selected].scrollIntoView({block: "nearest"})
                    }
                    
                } else if (event.key === "ArrowUp") {
                    this.selected = Math.max(this.selected - 1, 0)
                    event.preventDefault()
                    if (this.selected === 0) {
                        this.$refs.container.scrollIntoView({block: "start"})
                    } else {
                        this.$refs.item[this.selected].scrollIntoView({block: "nearest"})
                    }
                } else if (event.key === "Enter") {
                    if (event.ctrlKey) {
                        console.log("Ctrl+Enter, filter:", this.filter)
                        if (this.filter.length > 0) {
                            this.createNote(this.filter)
                        }
                        return;
                    }
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
                this.$emit("selectNote", token)
            },

            createNote(name) {
                console.log("create note", name)
                this.$emit("createNote", name)
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
            <input
                type="text"
                ref="input"
                @keydown="onKeydown"
                @input="onInput"
                v-model="filter"
            />
            <ul class="items">
                <li
                    v-for="item, idx in filteredItems"
                    :key="item.token"
                    :class="idx === selected ? 'selected' : ''"
                    @click="selectItem(item.token)"
                    ref="item"
                >
                    {{ item.name }}
                </li>
            </ul>
            <div v-if="filter.length > 0" class="create-help"><span class="dim"><span class="tt">Ctrl + Enter</span> to create note</span> <span class="bold">{{ trunc(filter) }}</span></div>
            <div v-if="canDeleteSelected" class="delete-help"><span class="dim"><span class="tt">Ctrl + Delete</span> to delete </span><span class="bold">{{ trunc(filteredItems[selected].name) }}</span></div>
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
            background: #fff
            padding: 4px 5px
            border: 1px solid #ccc
            box-sizing: border-box
            border-radius: 2px
            width: 400px
            margin-bottom: 10px
            &:focus
                outline: none
                border: 1px solid #fff
                outline: 2px solid #48b57e
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
                    background: #48b57e
                    color: #fff
                +dark-mode
                    color: rgba(255,255,255, 0.53)
                    &:hover
                        background: #29292a
                    &.selected
                        background: #1b6540
                        color: rgba(255,255,255, 0.87)
        .create-help
            margin-top: 4px
            padding: 4px 12px
            +dark-mode
                    color: rgba(255,255,255, 0.53)
        .delete-help
            margin-top: 4px
            padding: 4px 12px
            +dark-mode
                    color: rgba(255,255,255, 0.53)
        .dim
            color: gray
        .tt
            font-family: monospace
        .bold
            font-weight: bold
</style>
