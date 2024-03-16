import {
  createDefaultNotes,
  dbGetDirHandle,
  loadNoteInfos,
  setStorageFS,
} from "../src/notes";
import { getSettings, loadSettings, saveSettings } from "./settings";

/** @typedef {import("./settings").Settings} Settings */

export async function boot() {
  let dh = await dbGetDirHandle();
  if (dh) {
    console.log("we're storing data in the file system");
    setStorageFS(dh);
  } else {
    console.log("we're storing data in localStorage");
  }

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
  await saveSettings(updatedSettings);

  let noteInfos = await loadNoteInfos();
  createDefaultNotes(noteInfos);

  settings = getSettings();
  // console.log("settings:", settings);
  // make sure currentNoteName points to a valid note
  let name = settings.currentNoteName;
  noteInfos = await loadNoteInfos(); // re-do because could have created default notes
  for (let ni of noteInfos) {
    if (ni.name === name) {
      console.log("currentNoteName:", name);
      return;
    }
  }
  initialSettings.currentNoteName = "scratch";
  console.log(`didn't find currentNoteName '${name}' so set to 'scratch'`);
}
