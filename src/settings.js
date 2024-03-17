import { ipcRenderer } from "./ipcrenderer";
import { objectEqual } from "./utils";

/** @typedef {import("./state.js").NoteInfo} NoteInfo */

/**
 * @typedef {Object} Settings
 * @property {boolean} bracketClosing
 * @property {string} currentNoteName
 * @property {string} emacsMetaKey
 * @property {string} [fontFamily]
 * @property {number} [fontSize]
 * @property {string} keymap
 * @property {boolean} showFoldGutter
 * @property {boolean} showLineNumberGutter
 * @property {NoteInfo} [currentNoteInfo] // TODO: obsolete, delete
 */

export const kEventOpenSettings = "open-settings";
export const kEventSettingsChange = "settings-change";

export let kDefaultFontFamily = "Hack";
// TODO: not sure mobile should be so big. Looked big on iPhone
export const isMobileDevice = window.matchMedia("(max-width: 600px)").matches;
export let kDefaultFontSize = isMobileDevice ? 16 : 12;

const kSettingsPath = "settings.json";

// current settings, kept in sync with persisted settings
// shouldn't be modified directly but via setSetting)
/** @type {Settings} */
let settings;

/**
 * @returns {Settings}
 */
export function getSettings() {
  return settings;
}

/**
 * @returns {Settings}
 */
export function loadSettings() {
  let d = localStorage.getItem(kSettingsPath) || "{}";
  // also set settings to the latest version
  let settings = d === null ? {} : JSON.parse(d);
  return settings;
}

/**
 * @param {Settings} newSettings
 */
export function saveSettings(newSettings) {
  // console.log("saveSettings:", newSettings);
  if (objectEqual(settings, newSettings)) {
    console.log("saveSettings: no change");
    return;
  }
  let s = JSON.stringify(newSettings, null, 2);
  localStorage.setItem(kSettingsPath, s);
  settings = newSettings;
  ipcRenderer.send(kEventSettingsChange, newSettings);
}

export function loadInitialSettings() {
  /** @type {Settings} */
  let initialSettings = {
    bracketClosing: false,
    currentNoteName: "scratch",
    emacsMetaKey: "alt",
    keymap: "default",
    showFoldGutter: true,
    showLineNumberGutter: true,
  };
  let settings = loadSettings();
  // console.log("settings loaded:", s);
  let updatedSettings = Object.assign(initialSettings, settings);
  if (updatedSettings.currentNoteInfo) {
    updatedSettings.currentNoteInfo = undefined; // temporary, delete obsolete field
  }
  saveSettings(updatedSettings);
}

/**
 * @param {string} key
 * @param {any} value
 */
export function setSetting(key, value) {
  console.log("setSetting:", key, value);
  let s = { ...settings };
  s[key] = value;
  saveSettings(s);
}

export function onOpenSettings(callback) {
  ipcRenderer.on(kEventOpenSettings, callback);
}

export function onSettingsChange(callback) {
  ipcRenderer.on(kEventSettingsChange, (event, settings) => callback(settings));
}

/**
 * @returns {string}
 */
export function getVersion() {
  // __APP_VERSION__ and __GIT_HASH__ are set in vite.config.js
  // @ts-ignore
  return __APP_VERSION__ + " (" + __GIT_HASH__ + ")";
}

const mediaMatch = window.matchMedia("(prefers-color-scheme: dark)");
let themeCallback = null;

export const themeMode = {
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
};

mediaMatch.addEventListener("change", async (event) => {
  if (themeCallback) {
    themeCallback((await themeMode.get()).computed);
  }
});
