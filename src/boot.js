import {
  createDefaultNotes,
  dbGetDirHandle,
  getScratchNoteInfo,
  isNoteInfoEqual,
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
    currentNoteInfo: getScratchNoteInfo(),
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
  // make sure currentNoteInfopoints to a valid note
  let currentNoteInfo = settings.currentNoteInfo;
  noteInfos = await loadNoteInfos(); // re-do because could have created default notes
  for (let i = 0; i < noteInfos.length; i++) {
    if (isNoteInfoEqual(noteInfos[i], currentNoteInfo)) {
      currentNoteInfo = noteInfos[i];
      initialSettings.currentNoteInfo = currentNoteInfo;
      break;
    }
  }
  console.log("currentNoteInfo:", currentNoteInfo);
}
