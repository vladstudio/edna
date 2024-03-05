<script>
    import TopNav from './TopNav.vue'
    import StatusBar from './StatusBar.vue'
    import Editor from './Editor.vue'
    import LanguageSelector from './LanguageSelector.vue'
    import NoteSelector from './NoteSelector.vue'
    import Settings from './settings/Settings.vue'
    import { stringSizeInUtf8Bytes } from '../../shared-utils/utils'
    import { fixUpNote, getNoteName, scratchNotePath, helpNotePath } from '../notes'

    export default {
        components: {
            TopNav,
            Editor,
            StatusBar,
            LanguageSelector,
            NoteSelector,
            Settings,
        },

        data() {
            return {
                noteName: getNoteName(window.heynote.settings.currentNotePath),
                line: 1,
                column: 1,
                docSize: 0,
                selectionSize: 0,
                language: "plaintext",
                languageAuto: true,
                theme: window.heynote.themeMode.initial,
                initialTheme: window.heynote.themeMode.initial,
                themeSetting: 'system',
                development: window.location.href.indexOf("dev=1") !== -1,
                showLanguageSelector: false,
                showNoteSelector: false,
                showSettings: false,
                settings: window.heynote.settings,
            }
        },

        mounted() {
            window.heynote.themeMode.get().then((mode) => {
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
            onThemeChange(window.heynote.themeMode.initial)
            window.heynote.themeMode.onChange(onThemeChange)
            window.heynote.onSettingsChange((settings) => {
                console.log("onSettingsChange callback", settings)
                this.settings = settings
                this.noteName = getNoteName(settings.currentNotePath)
                console.log("noteName", this.noteName)
            })
            window.heynote.onOpenSettings(() => {
                this.showSettings = true
            })
        },

        beforeUnmount() {
            window.heynote.themeMode.removeListener()
        },

        methods: {
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
                window.heynote.themeMode.set(newTheme)
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
                } else {
                    console.log("note already exists", name)
                }
                this.onOpenNote(notePath)
            },

            onDeleteNote(notePath) {
                this.showNoteSelector = false
                localStorage.removeItem(notePath)
                console.log("deleted note", notePath)
                if (notePath === this.settings.currentNotePath) {
                    console.log("deleted current note, opening scratch note")
                    this.$refs.editor.openNote(scratchNotePath)
                }
            },

            docChanged() {
                const c = this.$refs.editor.getContent() || ""
                this.docSize = stringSizeInUtf8Bytes(c);
            },

            formatCurrentBlock() {
                this.$refs.editor.formatCurrentBlock()
            },
        },
    }

</script>

<template>
    <div class="container">
        <!-- <TopNav /> -->
        <Editor 
            @cursorChange="onCursorChange"
            :theme="theme"
            :development="development"
            :debugSyntaxTree="false"
            :keymap="settings.keymap"
            :emacsMetaKey="settings.emacsMetaKey"
            :showLineNumberGutter="settings.showLineNumberGutter"
            :showFoldGutter="settings.showFoldGutter"
            :bracketClosing="settings.bracketClosing"
            :fontFamily="settings.fontFamily"
            :fontSize="settings.fontSize"
            class="editor"
            ref="editor"
            @openLanguageSelector="openLanguageSelector"
            @openNoteSelector="openNoteSelector"
            @docChanged="docChanged"
        />
        <StatusBar
            :noteName="noteName"
            :line="line"
            :column="column"
            :docSize="docSize"
            :selectionSize="selectionSize"
            :language="language"
            :languageAuto="languageAuto"
            :theme="theme"
            :themeSetting="themeSetting"
            :autoUpdate="settings.autoUpdate"
            :allowBetaVersions="settings.allowBetaVersions"
            @toggleTheme="toggleTheme"
            @openLanguageSelector="openLanguageSelector"
            @openNoteSelector="openNoteSelector"
            @formatCurrentBlock="formatCurrentBlock"
            @openSettings="showSettings = true"
            @openHelp="openHelp"
            class="status" 
        />
        <div class="overlay">
            <LanguageSelector
                v-if="showLanguageSelector"
                @selectLanguage="onSelectLanguage"
                @close="closeLanguageSelector"
            />
            <NoteSelector
                v-if="showNoteSelector"
                @openNote="onOpenNote"
                @createNote="onCreateNote"
                @deleteNote="onDeleteNote"
                @close="closeNoteSelector"
            />
            <Settings
                v-if="showSettings"
                :initialSettings="settings"
                @closeSettings="closeSettings"
            />
        </div>
    </div>
</template>

<style scoped lang="sass">
    .container
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
