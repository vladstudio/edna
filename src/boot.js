import { OPEN_SETTINGS_EVENT, SETTINGS_CHANGE_EVENT } from "../src/constants";
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
import { editorGlobal, isDocDirty } from "./state";
import { getDateYYYYMMDDDay, platform } from "../src/utils";
import { getSettings, loadSettings, setSetting, setSettings } from "./settings";

import { ipcRenderer } from "./ipcrenderer";

const mediaMatch = window.matchMedia("(prefers-color-scheme: dark)");
let themeCallback = null;
mediaMatch.addEventListener("change", async (event) => {
  if (themeCallback) {
    themeCallback((await Edna.themeMode.get()).computed);
  }
});

const isMobileDevice = window.matchMedia("(max-width: 600px)").matches;

let currencyData = null;

// TODO: maybe capture this on editor level and no need for editorGlobal
document.addEventListener("keydown", (e) => {
  // prevent the default Save dialog from opening and save if dirty
  if (e.ctrlKey && e.key === "s") {
    e.preventDefault();
    if (isDocDirty.value) {
      console.log("saving because dirty");
      console.log("editorGlobal.value:", editorGlobal.value);
      editorGlobal.value.saveForce();
    } else {
      console.log("not saving");
    }
  }
});

export async function boot() {
  let initialSettings = {
    keymap: "default",
    emacsMetaKey: "alt",
    showLineNumberGutter: true,
    showFoldGutter: true,
    bracketClosing: false,
    currentNotePath: scratchNotePath,
  };

  let s = await loadSettings();
  console.log("settings loaded:", s);
  s = Object.assign(initialSettings, s);
  await setSettings(s);

  migrateDefaultNote();
  createDefaultNotes();

  let settings = getSettings();
  console.log("settings:", settings);
  // make sure currentNotePath points to a valid note
  let currentNotePath = settings.currentNotePath;
  let notePaths = loadNotePaths();
  if (!notePaths.includes(currentNotePath)) {
    currentNotePath = scratchNotePath;
    initialSettings.currentNotePath = currentNotePath;
  }
  console.log("currentNotePath:", currentNotePath);
}

const Edna = {
  platform: platform,
  defaultFontFamily: "Hack",
  defaultFontSize: isMobileDevice ? 16 : 12,

  buffer: {
    async load() {
      // let self = Heynote;
      let settings = getSettings();
      // console.log("Heynote:", settings);
      const notePath = settings.currentNotePath;
      console.log("Heynote.buffer.load: loading from ", notePath);
      const content = localStorage.getItem(notePath);
      return fixUpNote(content);
    },

    async openNote(notePath) {
      console.log("Heynote.buffer.openNote:", notePath);
      if (isSystemNote(notePath)) {
        await setSetting("currentNotePath", notePath);
        return getSystemNoteContent(notePath);
      }
      let content = localStorage.getItem(notePath);
      await setSetting("currentNotePath", notePath);
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
      let settings = getSettings();
      const notePath = settings.currentNotePath;
      console.log("Heynote.buffer.save:", notePath);
      if (isSystemNote(notePath)) {
        console.log("skipped saving system note");
        return;
      }
      localStorage.setItem(notePath, content);
      // TODO: or do it in save.js?
      isDocDirty.value = false;
    },

    async saveAndQuit(content) {},

    onChangeCallback(callback) {},
  },

  // TODO: hook it up to document unload
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

export { Edna };
