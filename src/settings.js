import { cloneObjectDeep, objectEqualDeep, platform } from "./util";

import { ipcRenderer } from "./ipcrenderer";

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
 * @property {string} [theme] // "system", "light", "dark"
 */

export const kEventOpenSettings = "open-settings";
export const kEventSettingsChange = "settings-change";

// Note: was "Hack" but it requires custom font which takes time to load
// To re-enable Hack we also have to un-comment font.sass
// TODO: should be "Consolas" instead of "Cacadia Code"?
// TODO: something else for Linux?
export let kDefaultFontFamily = platform.isMac ? "Menlo" : "Cascadia Code";

// TODO: not sure mobile should be so big. Looked big on iPhone
export const isMobileDevice = window.matchMedia("(max-width: 600px)").matches;
export let kDefaultFontSize = isMobileDevice ? 16 : 12;

export const kSettingsPath = "settings.json";

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
  localStorage.removeItem("theme"); // TODO: temporary, theme moved to settings object
  return settings;
}

const mediaMatch = window.matchMedia("(prefers-color-scheme: dark)");
export function updateWebsiteTheme() {
  console.log("updateWebsiteTheme, settings.theme:", settings.theme);
  let theme = settings.theme || "system";
  if (theme === "system") {
    theme = mediaMatch.matches ? "dark" : "light";
  }
  document.documentElement.setAttribute("theme", theme);
}

mediaMatch.addEventListener("change", async () => {
  if (settings.theme === "system") {
    console.log("change event listener");
    updateWebsiteTheme();
  }
});

/**
 * @param {Settings} newSettings
 * @returns {boolean}
 */
export function saveSettings(newSettings) {
  // console.log("saveSettings:", newSettings);
  if (objectEqualDeep(settings, newSettings)) {
    console.log("saveSettings: no change");
    return false;
  }
  let s = JSON.stringify(newSettings, null, 2);
  localStorage.setItem(kSettingsPath, s);
  settings = newSettings;
  updateWebsiteTheme();
  ipcRenderer.send(kEventSettingsChange, newSettings);
  return true;
}

export function loadInitialSettings() {
  let settings = loadSettings();
  // console.log("settings loaded:", s);

  // ensure all possible settings are present. Start with defaults and overwrite with persisted settings
  /** @type {Settings} */
  let initialSettings = {
    bracketClosing: false,
    currentNoteName: "scratch",
    emacsMetaKey: "alt",
    keymap: "default",
    showFoldGutter: true,
    showLineNumberGutter: true,
    theme: "system",
  };
  let updatedSettings = Object.assign(initialSettings, settings);
  saveSettings(updatedSettings);
}

/**
 * @param {string} key
 * @param {any} value
 */
export function setSetting(key, value) {
  console.log("setSetting:", key, value);
  let s = cloneObjectDeep(settings);
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
