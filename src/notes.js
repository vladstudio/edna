import { getHelp, getInitialContent } from "./initial-content";
import { getOpenCount, incSaveCount, isDocDirty } from "./state";
import { getSettings, setSetting } from "./settings";

import { getDateYYYYMMDDDay } from "./utils";

export const scratchNotePath = "note:scratch";
export const journalNotePath = "note:daily journal";
export const inboxNotePath = "note:inbox";
export const helpNotePath = "system:help";

export const blockHdrPlainTex = "\n∞∞∞text-a\n";
export const blockHdrMarkdown = "\n∞∞∞markdown\n";

export const isDev = location.host.startsWith("localhost");

// migrate "buffer" (Heynote) => "note:scratch"
// TODO: probably not needed anymore because no-one has used Edna
// when we used "buffer"
export function migrateDefaultNote() {
  const d = localStorage.getItem("buffer");
  if (d !== null) {
    localStorage.setItem(scratchNotePath, d);
    localStorage.removeItem("buffer");
    console.log("migrated default note from buffer to note:scratch");
  }
}

export function createDefaultNotes() {
  function createNote(notePath, content) {
    if (localStorage.getItem(notePath) === null) {
      localStorage.setItem(notePath, content);
    }
  }
  const { initialContent, initialDevContent, initialJournal, initialInbox } =
    getInitialContent();
  const s = isDev ? initialDevContent : initialContent;
  createNote(scratchNotePath, s);

  // scratch note must always exist but the user can delete inbox / daily journal notes
  let n = getOpenCount();
  if (n > 1) {
    // console.log("skipping creating inbox / journal because openCount:", n);
    return;
  }
  createNote(journalNotePath, blockHdrMarkdown + initialJournal);
  createNote(inboxNotePath, blockHdrMarkdown + initialInbox);
}

export function loadNotePaths() {
  const res = [];
  let nKeys = localStorage.length;
  for (let i = 0; i < nKeys; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("note:")) {
      res.push(key);
    }
  }
  return res;
}

// in case somehow a note doesn't start with the block header, fix it up
export function fixUpNote(content) {
  // console.log("fixUpNote:", content)
  if (content === null) {
    // console.log("fixUpNote: null content")
    return blockHdrPlainTex;
  }
  if (!content.startsWith("\n∞∞∞")) {
    content = blockHdrPlainTex + content;
    // console.log('fixUpNote: added block to content', content)
  }
  return content;
}

export function splitNotePath(notePath) {
  const i = notePath.indexOf(":");
  return [notePath.substring(0, i), notePath.substring(i + 1)];
}

export function getNoteName(notePath) {
  console.log("getNoteName:", notePath);
  const i = notePath.indexOf(":");
  return notePath.substring(i + 1);
}

export function isSystemNote(notePath) {
  // console.log("isSystemNote:", notePath)
  return notePath.startsWith("system:");
}

export function isJournalNote(notePath) {
  return notePath === journalNotePath;
}

export function getSystemNotes() {
  return ["system:help"];
}

export function getSystemNoteContent(notePath) {
  console.log("getSystemNoteContent:", notePath);
  if (notePath === "system:help") {
    return getHelp();
  }
  return blockHdrPlainTex + "error: unknown system note:" + notePath + "\n";
}

export async function loadCurrentNote() {
  // let self = Heynote;
  let settings = getSettings();
  // console.log("Heynote:", settings);
  const notePath = settings.currentNotePath;
  // console.log("loadCurrentNote: from ", notePath);
  const content = localStorage.getItem(notePath);
  return fixUpNote(content);
}

export async function saveCurrentNote(content) {
  let settings = getSettings();
  const notePath = settings.currentNotePath;
  console.log("notePath:", notePath);
  if (isSystemNote(notePath)) {
    console.log("skipped saving system note");
    return;
  }
  localStorage.setItem(notePath, content);
  // TODO: or do it in save.js?
  isDocDirty.value = false;
  incSaveCount();
}

export async function loadNote(notePath) {
  console.log("openNote:", notePath);
  if (isSystemNote(notePath)) {
    await setSetting("currentNotePath", notePath);
    return getSystemNoteContent(notePath);
  }
  let content = localStorage.getItem(notePath);
  await setSetting("currentNotePath", notePath);
  if (isJournalNote(notePath)) {
    console.log("openNote:");
    // create block for a current day
    const dt = getDateYYYYMMDDDay();
    console.log("openNote: dt:", dt);
    if (content === null) {
      content = "\n∞∞∞markdown\n" + "# " + dt + "\n";
      // console.log("openNote: content:", content)
    } else {
      if (!content.includes(dt)) {
        content = "\n∞∞∞markdown\n" + "# " + dt + "\n" + content;
        // console.log("openNote: content:", content)
      }
    }
  }
  return fixUpNote(content);
}
