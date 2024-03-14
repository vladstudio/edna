import { OPEN_SETTINGS_EVENT, SETTINGS_CHANGE_EVENT } from "../src/constants";
import {
  createDefaultNotes,
  loadNotePaths,
  migrateDefaultNote,
  scratchNotePath,
} from "../src/notes";
import { getSettings, loadSettings, setSettings } from "./settings";

const mediaMatch = window.matchMedia("(prefers-color-scheme: dark)");
let themeCallback = null;
mediaMatch.addEventListener("change", async (event) => {
  if (themeCallback) {
    themeCallback((await Edna.themeMode.get()).computed);
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
};

export { Edna };
