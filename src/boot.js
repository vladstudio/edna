import { OPEN_SETTINGS_EVENT, SETTINGS_CHANGE_EVENT } from "../src/constants";
import {
  createDefaultNotes,
  loadNotePaths,
  migrateDefaultNote,
  scratchNotePath,
} from "../src/notes";
import { getSettings, loadSettings, setSettings } from "./settings";

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
