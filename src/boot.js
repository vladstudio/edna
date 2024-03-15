import {
  createDefaultNotes,
  getScratchNoteInfo,
  isNoteInfoEqual,
  loadNoteInfos,
} from "../src/notes";
import { getSettings, loadSettings, setSettings } from "./settings";

/** @typedef {import("./settings").Settings} Settings */
export async function boot() {
  /** @type {Settings} */
  let initialSettings = {
    keymap: "default",
    emacsMetaKey: "alt",
    showLineNumberGutter: true,
    showFoldGutter: true,
    bracketClosing: false,
    currentNoteInfo: getScratchNoteInfo(),
  };

  let s = await loadSettings();
  // console.log("settings loaded:", s);
  s = Object.assign(initialSettings, s);
  await setSettings(s);

  createDefaultNotes();

  let settings = getSettings();
  // console.log("settings:", settings);
  // make sure currentNoteInfopoints to a valid note
  let currentNoteInfo = settings.currentNoteInfo;
  let noteInfos = await loadNoteInfos();
  for (let i = 0; i < noteInfos.length; i++) {
    if (isNoteInfoEqual(noteInfos[i], currentNoteInfo)) {
      currentNoteInfo = noteInfos[i];
      initialSettings.currentNoteInfo = currentNoteInfo;
      break;
    }
  }
  console.log("currentNoteInfo:", currentNoteInfo);
}
