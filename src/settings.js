import { OPEN_SETTINGS_EVENT, SETTINGS_CHANGE_EVENT } from "./constants";

import { ipcRenderer } from "./ipcrenderer";

export const isMobileDevice = window.matchMedia("(max-width: 600px)").matches;

export let defaultFontFamily = "Hack";
// TODO: not sure mobile should be so big. Looked big on iPhone
export let defaultFontSize = isMobileDevice ? 16 : 12;

const settingsPath = "settings.json";

export async function loadSettings() {
  let d = localStorage.getItem(settingsPath);
  return d === null ? {} : JSON.parse(d);
}

/**
 * @param {Object} settings
 */
async function saveSettings(settings) {
  localStorage.setItem(settingsPath, JSON.stringify(settings));
}

// current settings, kept in sync with persisted settings
// shouldn't be modified directly but via setSetting)
let settings;

export function getSettings() {
  return settings;
}

export async function setSettings(newSettings) {
  // console.log("setSettings:", newSettings);
  await saveSettings(newSettings);
  settings = newSettings;
  ipcRenderer.send(SETTINGS_CHANGE_EVENT, newSettings);
}

// export async function setSetting(key, value) {
//   settings[key] = value;
//   await saveSettings(settings);
// }

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

// only for desktop app to change directory where files are
// TODO: can delete it because not needed and remove related Settings.vue code
export async function selectLocation() {
  //throw new Error("Not implemented.");
  return "";
}
