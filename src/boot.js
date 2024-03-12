import { OPEN_SETTINGS_EVENT, SETTINGS_CHANGE_EVENT } from "../src/constants";
import {
  createDefaultNotes,
  fixUpNote,
  getSystemNoteContent,
  isJournalNote,
  isSystemNote,
  loadNotePaths,
  migrateDefaultNote,
  scratchNotePath,
} from "../src/notes";
import { getDateYYYYMMDDDay, platform } from "../src/utils";
import { getSettings, loadSettings, setSetting, setSettings } from "./settings";
import { incSaveCount, isDocDirty } from "./state";

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
  // console.log("settings loaded:", s);
  s = Object.assign(initialSettings, s);
  await setSettings(s);

  migrateDefaultNote();
  createDefaultNotes();

  let settings = getSettings();
  // console.log("settings:", settings);
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
