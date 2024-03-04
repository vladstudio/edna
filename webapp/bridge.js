import { SETTINGS_CHANGE_EVENT, OPEN_SETTINGS_EVENT } from "../electron/constants";
import { getInitialContent } from "./initial-content";

const isDev = location.host.startsWith("localhost")

const mediaMatch = window.matchMedia('(prefers-color-scheme: dark)')
let themeCallback = null
mediaMatch.addEventListener("change", async (event) => {
    if (themeCallback) {
        themeCallback((await Heynote.themeMode.get()).computed)
    }
})

const isMobileDevice = window.matchMedia("(max-width: 600px)").matches

let autoUpdateCallbacks = null
let currencyData = null

let platform
const uaPlatform = window.navigator?.userAgentData?.platform || window.navigator.platform
if (uaPlatform.indexOf("Win") !== -1) {
    platform = {
        isMac: false,
        isWindows: true,
        isLinux: false,
    }
}  else if (uaPlatform.indexOf("Linux") !== -1) {
    platform = {
        isMac: false,
        isWindows: false,
        isLinux: true,
    }
} else {
    platform = {
        isMac: true,
        isWindows: false,
        isLinux: false,
    }
}
platform.isWebApp = true
const platformString = platform.isMac ? "darwin" : platform.isWindows ? "windows" : "linux"

class IpcRenderer {
    constructor() {
        this.callbacks = {}
    }

    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = []
        }
        this.callbacks[event].push(callback)
    }

    send(event, ...args) {
        if (this.callbacks[event]) {
            for (const callback of this.callbacks[event]) {
                callback(null, ...args)
            }
        }
    }
}

const ipcRenderer = new IpcRenderer()

document.addEventListener('keydown', (e) => {
    // Prevent the default Save dialog from opening.
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        // console.log('CTRL + S pressed');
    }
});

const scratchNotePath = "note:scratch";

// get initial settings
let settingsData = localStorage.getItem("settings")
let initialSettings = {
    keymap: "default",
    emacsMetaKey: "alt",
    showLineNumberGutter: true,
    showFoldGutter: true,
    bracketClosing: false,
    currentNotePath: scratchNotePath,
}
if (settingsData !== null) {
    initialSettings = Object.assign(initialSettings, JSON.parse(settingsData))
}

// migrate "buffer" => "note:scratch"
function migrateDefaultNote() {
    const d = localStorage.getItem("buffer")
    if (d !== null) {
        localStorage.setItem(scratchNotePath, d)
        localStorage.removeItem("buffer")
        console.log("migrated default note from buffer to note:scratch")
    }
}
migrateDefaultNote()
function loadNotePaths() {
    const res = [];
    let nKeys = localStorage.length
    for (let i = 0; i < nKeys; i++) {
        const key = localStorage.key(i)
        if (key.startsWith("note:")) {
            res.push(key)
        }
    }
    return res;
}

let currentNotePath = initialSettings.currentNotePath;

// make sure currentNotePath points to a valid note
if (!currentNotePath.startsWith("note:")) {
    // shouldn't happen but jic
    currentNotePath = scratchNotePath;
}

if (localStorage.getItem(scratchNotePath) === null) {
    const { initialContent, initialDevContent } = getInitialContent(platformString)
    console.log("initialContent:", initialContent)
    console.log("initialDevContent:", initialDevContent)
    const s = isDev ? initialDevContent : initialContent;
    localStorage.setItem(scratchNotePath, s)
}

let notePaths = loadNotePaths()
if (!notePaths.includes(currentNotePath)) {
    currentNotePath = scratchNotePath
}
initialSettings.currentNotePath = currentNotePath
console.log("currentNotePath:", currentNotePath)

function getNoteName(notePath) {
    if (notePath.startsWith("note:")) {
        return notePath.substring(5)
    }
    return notePath;
}
// TODO: make it a function? Not sure when this would update the status bar
initialSettings.currentNoteName = getNoteName(currentNotePath)

const Heynote = {

    platform: platform,
    defaultFontFamily: "Hack",
    defaultFontSize: isMobileDevice ? 16 : 12,

    settings: initialSettings,

    buffer: {
        async load() {
            let self = Heynote;
            // console.log("Heynote:", self.settings);
            const notePath = self.settings.currentNotePath;
            console.log("Heynote.buffer.load: loading from ", notePath)
            const content = localStorage.getItem(notePath)
            return content === null ? "\n∞∞∞text-a\n" : content
        },

        async save(content) {
            let self = Heynote;
            const notePath = self.settings.currentNotePath
            console.log("Heynote.buffer.save: saving to ", notePath)
            localStorage.setItem(notePath, content)
        },

        async saveAndQuit(content) {

        },

        onChangeCallback(callback) {

        },
    },

    onWindowClose(callback) {
        //ipcRenderer.on(WINDOW_CLOSE_EVENT, callback)
    },

    onOpenSettings(callback) {
        ipcRenderer.on(OPEN_SETTINGS_EVENT, callback)
    },

    onSettingsChange(callback) {
        ipcRenderer.on(SETTINGS_CHANGE_EVENT, (event, settings) => callback(settings))
    },

    setSettings(settings) {
        localStorage.setItem("settings", JSON.stringify(settings))
        ipcRenderer.send(SETTINGS_CHANGE_EVENT, settings)
    },

    themeMode: {
        set: (mode) => {
            localStorage.setItem("theme", mode)
            themeCallback(mode)
            console.log("set theme to", mode)
        },
        get: async () => {
            const theme = localStorage.getItem("theme") || "system"
            const systemTheme = mediaMatch.matches ? "dark" : "light"
            return {
                theme: theme,
                computed: theme === "system" ? systemTheme : theme,
            }
        },
        onChange: (callback) => {
            themeCallback = callback
        },
        removeListener() {
            themeCallback = null
        },
        initial: localStorage.getItem("theme") || "system",
    },

    getCurrencyData: async () => {
        if (currencyData !== null) {
            return currencyData
        }
        const response = await fetch("https://currencies.heynote.com/rates.json", {cache: "no-cache"})
        currencyData = JSON.parse(await response.text())
        return currencyData
    },

    async getVersion() {
        return __APP_VERSION__ + " (" + __GIT_HASH__ + ")"
    },
}

export { Heynote, ipcRenderer}
