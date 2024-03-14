import { SETTINGS_CHANGE_EVENT } from "./constants";
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
