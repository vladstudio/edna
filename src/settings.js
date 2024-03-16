import { OPEN_SETTINGS_EVENT, SETTINGS_CHANGE_EVENT } from "./constants";
import { fsReadTextFile, fsWriteTextFile } from "./fileutil";

import { getStorageFS } from "./notes";
import { ipcRenderer } from "./ipcrenderer";

/** @typedef {import("./state.js").NoteInfo} NoteInfo */

/**
 * @typedef {Object} Settings
 * @property {string} keymap
 * @property {string} emacsMetaKey
 * @property {boolean} showLineNumberGutter
 * @property {boolean} showFoldGutter
 * @property {boolean} bracketClosing
 * @property {NoteInfo} currentNoteInfo
 * @property {string} [fontFamily]
 * @property {number} [fontSize]
 */

export const isMobileDevice = window.matchMedia("(max-width: 600px)").matches;

export let defaultFontFamily = "Hack";
// TODO: not sure mobile should be so big. Looked big on iPhone
export let defaultFontSize = isMobileDevice ? 16 : 12;

const settingsPath = "settings.json";

// TODO: not happy have to pass dh but don't want circular imports
/**
 * @param {FileSystemDirectoryHandle} dh
 * @returns {Promise<Settings>}
 */
export async function loadSettings(dh) {
  let d = null;
  if (dh) {
    d = await fsReadTextFile(dh, settingsPath);
  } else {
    d = localStorage.getItem(settingsPath);
  }
  return d === null ? {} : JSON.parse(d);
}

/**
 * @param {FileSystemDirectoryHandle} dh
 * @param {Settings} settings
 */
export async function saveSettings(settings, dh) {
  let s = JSON.stringify(settings);
  if (dh) {
    await fsWriteTextFile(dh, settingsPath, s);
  } else {
    localStorage.setItem(settingsPath, s);
  }
}

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
 * @param {Settings} newSettings
 */
export async function setSettings(newSettings) {
  // console.log("setSettings:", newSettings);
  let dh = getStorageFS();
  await saveSettings(newSettings, dh);
  settings = newSettings;
  ipcRenderer.send(SETTINGS_CHANGE_EVENT, newSettings);
}

export async function setSetting(key, value) {
  console.log("setSetting:", key, value);
  let s = { ...settings };
  s[key] = value;
  await setSettings(s);
}

export function onOpenSettings(callback) {
  ipcRenderer.on(OPEN_SETTINGS_EVENT, callback);
}

export function onSettingsChange(callback) {
  console.log("onSettingsChange");
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
