import { OPEN_SETTINGS_EVENT, SETTINGS_CHANGE_EVENT } from "./constants";
import { fsReadTextFile, fsWriteTextFile } from "./fileutil";

import { getStorageFS } from "./notes";
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

// TODO: not happy have to pass dh but don't want circular imports
/**
 * @param {FileSystemDirectoryHandle} dh
 * @returns {Promise<Settings>}
 */
export async function loadSettings(dh) {
  let d = null;
  if (dh) {
    d = await fsReadTextFile(dh, kSettingsPath);
  } else {
    d = localStorage.getItem(kSettingsPath);
  }
  // also set settings to the latest version
  settings = d === null ? {} : JSON.parse(d);
  return settings;
}

/**
 * @param {FileSystemDirectoryHandle} dh
 * @param {Settings} newSettings
 */
export async function saveSettings(newSettings, dh = null) {
  // console.log("saveSettings:", newSettings);
  if (objectEqual(settings, newSettings)) {
    console.log("saveSettings: no change");
    return;
  }
  let s = JSON.stringify(newSettings, null, 2);
  if (!dh) {
    dh = getStorageFS();
  }
  if (dh) {
    await fsWriteTextFile(dh, kSettingsPath, s);
  } else {
    localStorage.setItem(kSettingsPath, s);
  }
  settings = newSettings;
  ipcRenderer.send(SETTINGS_CHANGE_EVENT, newSettings);
}

/**
 * @param {FileSystemDirectoryHandle} dh
 */
export async function loadInitialSettings(dh) {
  /** @type {Settings} */
  let initialSettings = {
    bracketClosing: false,
    currentNoteName: "scratch",
    emacsMetaKey: "alt",
    keymap: "default",
    showFoldGutter: true,
    showLineNumberGutter: true,
  };
  let settings = await loadSettings(dh);
  // console.log("settings loaded:", s);
  let updatedSettings = Object.assign(initialSettings, settings);
  if (updatedSettings.currentNoteInfo) {
    updatedSettings.currentNoteInfo = undefined; // temporary, delete obsolete field
  }
  await saveSettings(updatedSettings);
}

export async function setSetting(key, value) {
  console.log("setSetting:", key, value);
  let s = { ...settings };
  s[key] = value;
  await saveSettings(s);
}

export function onOpenSettings(callback) {
  ipcRenderer.on(OPEN_SETTINGS_EVENT, callback);
}

export function onSettingsChange(callback) {
  ipcRenderer.on(SETTINGS_CHANGE_EVENT, (event, settings) =>
    callback(settings)
  );
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
