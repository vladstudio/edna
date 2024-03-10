import {
  OPEN_SETTINGS_EVENT,
  SETTINGS_CHANGE_EVENT,
} from "../electron/constants";
import {
  createDefaultNotes,
  fixUpNote,
  getSystemNoteContent,
  isSystemNote,
  journalNotePath,
  loadNotePaths,
  migrateDefaultNote,
  scratchNotePath,
} from "../src/notes";
import { loadSettings, saveSettings } from "../src/settings";

import { platform } from "../shared-utils/utils";
import { getDateYYYYMMDDDay } from "../src/utils";

const mediaMatch = window.matchMedia("(prefers-color-scheme: dark)");
let themeCallback = null;
mediaMatch.addEventListener("change", async (event) => {
  if (themeCallback) {
    themeCallback((await Heynote.themeMode.get()).computed);
  }
});

const isMobileDevice = window.matchMedia("(max-width: 600px)").matches;

let currencyData = null;

class IpcRenderer {
  constructor() {
    this.callbacks = {};
  }

  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  send(event, ...args) {
    if (this.callbacks[event]) {
      for (const callback of this.callbacks[event]) {
        callback(null, ...args);
      }
    }
  }
}

const ipcRenderer = new IpcRenderer();

document.addEventListener("keydown", (e) => {
  // Prevent the default Save dialog from opening.
  if (e.ctrlKey && e.key === "s") {
    e.preventDefault();
    // console.log('CTRL + S pressed');
  }
});

migrateDefaultNote();
createDefaultNotes();

let initialSettings = await loadSettings();

// make sure currentNotePath points to a valid note
let currentNotePath = initialSettings.currentNotePath;
let notePaths = loadNotePaths();
if (!notePaths.includes(currentNotePath)) {
  currentNotePath = scratchNotePath;
  initialSettings.currentNotePath = currentNotePath;
}
console.log("currentNotePath:", currentNotePath);

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
      console.log("Heynote.buffer.load: loading from ", notePath);
      const content = localStorage.getItem(notePath);
      return fixUpNote(content);
    },

    async openNote(notePath) {
      console.log("Heynote.buffer.openNote:", notePath);
      let self = Heynote;
      if (isSystemNote(notePath)) {
        self.setOneSetting("currentNotePath", notePath);
        return getSystemNoteContent(notePath);
      }
      let content = localStorage.getItem(notePath);
      self.setOneSetting("currentNotePath", notePath);
      if (notePath === journalNotePath) {
        console.log("Heynote.buffer.openNote:");
        // create block for a current day
        const dt = getDateYYYYMMDDDay();
        console.log("Heynote.buffer.openNote: dt:", dt);
        if (content === null) {
          content = "\n∞∞∞markdown\n" + "# " + dt + "\n";
          // console.log("Heynote.buffer.openNote: content:", content)
        } else {
          if (!content.includes(dt)) {
            content = "\n∞∞∞markdown\n" + "# " + dt + "\n" + content;
            // console.log("Heynote.buffer.openNote: content:", content)
          }
        }
      }
      return fixUpNote(content);
    },

    async save(content) {
      let self = Heynote;
      const notePath = self.settings.currentNotePath;
      console.log("Heynote.buffer.save:", notePath);
      if (isSystemNote(notePath)) {
        console.log("skipped saving system note");
        return;
      }
      localStorage.setItem(notePath, content);
    },

    async saveAndQuit(content) {},

    onChangeCallback(callback) {},
  },

  onWindowClose(callback) {
    //ipcRenderer.on(WINDOW_CLOSE_EVENT, callback)
  },

  onOpenSettings(callback) {
    ipcRenderer.on(OPEN_SETTINGS_EVENT, callback);
  },

  onSettingsChange(callback) {
    console.log("onSettingsChange");
    ipcRenderer.on(SETTINGS_CHANGE_EVENT, (event, settings) =>
      callback(settings)
    );
  },

  async setOneSetting(key, value) {
    console.log("setOneSetting:", key, value);
    let currSettings = await setSetting(key, value);
    await this.setSettings(currSettings);
  },

  async setSettings(settings) {
    let self = Heynote;
    console.log("setSettings:", settings);
    await saveSettings(settings);
    self.settings = settings;
    // TODO: move to saveSettings()
    ipcRenderer.send(SETTINGS_CHANGE_EVENT, settings);
  },

  themeMode: {
    set: (mode) => {
      localStorage.setItem("theme", mode);
      themeCallback(mode);
      // console.log("set theme to", mode)
    },
    get: async () => {
      const theme = localStorage.getItem("theme") || "system";
      const systemTheme = mediaMatch.matches ? "dark" : "light";
      return {
        theme: theme,
        computed: theme === "system" ? systemTheme : theme,
      };
    },
    onChange: (callback) => {
      themeCallback = callback;
    },
    removeListener() {
      themeCallback = null;
    },
    initial: localStorage.getItem("theme") || "system",
  },

  getCurrencyData: async () => {
    if (currencyData !== null) {
      return currencyData;
    }
    // currencyData = JSON.parse(cachedCurrencies)
    const response = await fetch("/api/currency_rates.json", {
      cache: "no-cache",
    });
    let s = await response.text();
    // console.log(`currencyData: '${s}'`)
    currencyData = JSON.parse(s);
    // console.log("currencyData:", currencyData)
    console.log("got currency data:");
    return currencyData;
  },

  async getVersion() {
    return __APP_VERSION__ + " (" + __GIT_HASH__ + ")";
  },
};

export { Heynote, ipcRenderer };
