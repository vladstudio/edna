import { scratchNotePath } from "../src/notes";

const settingsPath = "settings.json";

let initialSettings = {
  keymap: "default",
  emacsMetaKey: "alt",
  showLineNumberGutter: true,
  showFoldGutter: true,
  bracketClosing: false,
  currentNotePath: scratchNotePath,
};

export async function loadSettings() {
  let res = initialSettings;
  let d = localStorage.getItem(settingsPath);
  if (d !== null) {
    let o = JSON.parse(d);
    res = Object.assign(initialSettings, o);
  }
  saveSettings(res); // in case they changed
  return res;
}

/**
 * @param {Object} settings
 */
export async function saveSettings(settings) {
  localStorage.setItem(settingsPath, JSON.stringify(settings));
}

export async function setSetting(key, value) {
  let currSettings = await loadSettings();
  currSettings[key] = value;
  await saveSettings(currSettings);
  return currSettings;
}

export async function setSettings(settings) {
  await saveSettings(settings);
  return settings;
}
