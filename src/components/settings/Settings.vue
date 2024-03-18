<script>
import TabListItem from "./TabListItem.vue"
import TabContent from "./TabContent.vue"
import { kDefaultFontFamily, kDefaultFontSize, getVersion, saveSettings, setSetting } from "../../settings"
import { platform } from "../../utils"

export default {
  props: {
    initialKeymap: String,
    initialSettings: Object,
  },
  components: {
    TabListItem,
    TabContent,
  },

  data() {
    return {
      keymaps: [
        { name: "Default", value: "default" },
        { name: "Emacs", value: "emacs" },
      ],
      keymap: this.initialSettings.keymap,
      metaKey: this.initialSettings.emacsMetaKey,
      isMac: platform.isMac,
      showLineNumberGutter: this.initialSettings.showLineNumberGutter,
      showFoldGutter: this.initialSettings.showFoldGutter,
      bracketClosing: this.initialSettings.bracketClosing,
      fontFamily: this.initialSettings.fontFamily || kDefaultFontFamily,
      fontSize: this.initialSettings.fontSize || kDefaultFontSize,
      theme: this.initialSettings.theme,

      activeTab: "general",
      systemFonts: [[kDefaultFontFamily, kDefaultFontFamily + " (default)"]],
      themes: [["system", "System"], ["light", "Light"], ["dark", "Dark"]],
      defaultFontSize: kDefaultFontSize,
      appVersion: "",
      currentNoteName: this.initialSettings.currentNoteName,

      lastTheme: this.initialSettings.theme,
    }
  },

  async mounted() {
    // @ts-ignore
    let qlf = window.queryLocalFonts;
    if (qlf !== undefined) {
      let localFonts = [... new Set((await qlf()).map(f => f.family))].filter(f => f !== "Hack")
      localFonts = [...new Set(localFonts)].map(f => [f, f])
      this.systemFonts = [[kDefaultFontFamily, kDefaultFontFamily + " (default)"], ...localFonts]
    }

    window.addEventListener("keydown", this.onKeyDown);
    // @ts-ignore
    this.$refs.keymapSelector.focus()

    this.appVersion = getVersion()
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
  },

  methods: {
    onKeyDown(event) {
      if (event.key === "Escape") {
        this.$emit("closeSettings")
      }
    },

    updateTheme() {
      console.log("updateTheme", this.theme)
      this.$emit("setTheme", this.theme)
      setSetting("theme", this.theme)
    },

    updateSettings() {
      saveSettings({
        bracketClosing: this.bracketClosing,
        currentNoteName: this.currentNoteName,
        emacsMetaKey: platform.isMac ? this.metaKey : "alt",
        fontFamily: this.fontFamily === kDefaultFontFamily ? undefined : this.fontFamily,
        fontSize: this.fontSize === kDefaultFontSize ? undefined : this.fontSize,
        keymap: this.keymap,
        showFoldGutter: this.showFoldGutter,
        showLineNumberGutter: this.showLineNumberGutter,
        theme: this.theme,
      })
    },
  }
}
</script>

<template>
  <div class="fixed inset-0">
    <div
      class="dialog gray-700 absolute z-20 flex flex-col bg-white max-w-full max-h-full rounded shadow-xl w-[640px] h-[460px] center-with-translate overflow-y-auto no-border-outline">
      <div class="flex grow">
        <nav class="sidebar w-[140px] pt-[20px] border-r border-gray-300 border-solid">
          <h1 class="text-[16px] font-bold mb-[20px] py-0 px-[20px]">Settings</h1>
          <ul>
            <TabListItem name="General" tab="general" :activeTab="activeTab" @click="activeTab = 'general'" />
            <TabListItem name="Editing" tab="editing" :activeTab="activeTab" @click="activeTab = 'editing'" />
            <TabListItem name="Appearance" tab="appearance" :activeTab="activeTab" @click="activeTab = 'appearance'" />
            <TabListItem name="Version" tab="updates" :activeTab="activeTab" @click="activeTab = 'updates'" />
          </ul>
        </nav>
        <div class="settings-content flex-grow overflow-y-auto p-[40px]">
          <TabContent tab="general" :activeTab="activeTab">
            <div class="row">
              <div class="entry">
                <h2>Keymap</h2>
                <select ref="keymapSelector" v-model="keymap" @change="updateSettings"
                  class="keymap border border-black">
                  <template v-for="km in keymaps" :key="km.value">
                    <option :selected="km.value === keymap" :value="km.value">{{ km.name }}</option>
                  </template>
                </select>
              </div>
              <div class="entry" v-if="keymap === 'emacs' && isMac">
                <h2>Meta Key</h2>
                <select v-model="metaKey" @change="updateSettings" class="metaKey border border-black">
                  <option :selected="metaKey === 'meta'" value="meta">Command</option>
                  <option :selected="metaKey === 'alt'" value="alt">Option</option>
                </select>
              </div>
            </div>
          </TabContent>

          <TabContent tab="editing" :activeTab="activeTab">
            <div class="row">
              <div class="entry">
                <h2>Input settings</h2>
                <label>
                  <input type="checkbox" v-model="bracketClosing" @change="updateSettings" />
                  Auto-close brackets and quotation marks
                </label>
              </div>
            </div>
          </TabContent>

          <TabContent tab="appearance" :activeTab="activeTab">
            <div class="row flex">
              <div class="entry">
                <h2>Gutters</h2>
                <label>
                  <input type="checkbox" v-model="showLineNumberGutter" @change="updateSettings" />
                  Show line numbers
                </label>

                <label>
                  <input type="checkbox" v-model="showFoldGutter" @change="updateSettings" />
                  Show fold gutter
                </label>
              </div>
            </div>
            <div class="row flex">
              <div class="entry">
                <h2>Theme</h2>
                <select v-model="theme" @change="updateTheme" class="width-[280px] border border-black">
                  <option v-for="[theme, label] in themes" :selected="theme === this.theme" :value="theme">{{ label }}
                  </option>
                </select>
              </div>
            </div>
            <div class="row flex">
              <div class="entry">
                <h2>Font Family</h2>
                <select v-model="fontFamily" @change="updateSettings" class="width-[280px] border border-black">
                  <option v-for="[font, label] in systemFonts" :selected="font === fontFamily" :value="font">{{ label }}
                  </option>
                </select>
              </div>
              <div class="entry">
                <h2>Font Size</h2>
                <select v-model="fontSize" @change="updateSettings" class="width-[120px] border border-black">
                  <option v-for="size in [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]"
                    :selected="size === fontSize" :value="size">{{ size }}px{{ size ===
              defaultFontSize ? " (default)" : "" }}</option>
                </select>
              </div>
            </div>
          </TabContent>

          <TabContent tab="updates" :activeTab="activeTab">
            <div class="row">
              <div class="entry">
                <h2>Current Version</h2>
                <b>{{ appVersion }}</b>
              </div>
            </div>
          </TabContent>
        </div>
      </div>

      <div class="bottom-bar text-right py-[10px] px-[20px] bg-gray-100">
        <button @click="$emit('closeSettings')" class="close border-gray-500 px-4 border">Close</button>
      </div>
    </div>
    <div class="bg-black opacity-50 absolute inset-0 z-10"></div>
  </div>
</template>

<style lang="sass" scoped>
  .dialog
    +dark-mode
        background: #333
        color: #eee
        box-shadow: 0 0 25px rgba(0, 0, 0, 0.3)
  .sidebar
      +dark-mode
          border-right: 1px solid #222
  .settings-content
      select
          height: 22px
          +dark-mode
              background: #222
              color: #eee
      .row
          display: flex
          .entry
              margin-bottom: 24px
              margin-right: 20px
              &:last-child
                  margin-right: 0
              h2
                  font-weight: 600
                  margin-bottom: 10px
                  font-size: 14px
              select
                  width: 200px
                  &:focus
                      outline: none
              label
                  display: block
                  user-select: none
                  > input[type=checkbox]
                      position: relative
                      top: 2px
                      left: -3px

  .bottom-bar
      +dark-mode
          background: #222
      .close
          height: 28px
          &:hover
            background-color: lightgray
            +dark-mode
                background: #333
                color: #eee
</style>
