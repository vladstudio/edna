import { getHelp, getInitialContent } from "./initial-content";
import {
  getOpenCount,
  incNoteCreateCount,
  incSaveCount,
  isDocDirty,
} from "./state";
import { getSettings, setSetting } from "./settings";

import { getDateYYYYMMDDDay } from "./utils";

/** @typedef {import("./state.js").NoteInfo} NoteInfo */

/**
 * @returns {NoteInfo}
 */
export function getScratchNoteInfo() {
  /** @type {NoteInfo} */
  const scratchNoteInfo = {
    path: "note:scratch",
    name: "scratch",
  };
  return scratchNoteInfo;
}

/**
 * @returns {NoteInfo}
 */
export function getJournalNoteInfo() {
  /** @type {NoteInfo} */
  const journalNoteInfo = {
    path: "note:daily journal",
    name: "daily journal",
  };
  return journalNoteInfo;
}

/**
 * @returns {NoteInfo}
 */
export function getInboxNoteInfo() {
  /** @type {NoteInfo} */
  const inboxNoteInfo = {
    path: "note:inbox",
    name: "inbox",
  };
  return inboxNoteInfo;
}

/**
 * @returns {NoteInfo}
 */
export function getHelpNoteInfo() {
  /** @type {NoteInfo} */
  const helpNoteInfo = {
    path: "system:help",
    name: "help",
  };
  return helpNoteInfo;
}

export const blockHdrPlainText = "\n∞∞∞text-a\n";
export const blockHdrMarkdown = "\n∞∞∞markdown\n";

export const isDev = location.host.startsWith("localhost");

export function createDefaultNotes() {
  function createNote(notePath, content) {
    if (localStorage.getItem(notePath) === null) {
      localStorage.setItem(notePath, content);
    }
  }
  const { initialContent, initialDevContent, initialJournal, initialInbox } =
    getInitialContent();
  const s = isDev ? initialDevContent : initialContent;
  createNote(getScratchNoteInfo().path, s);

  // scratch note must always exist but the user can delete inbox / daily journal notes
  let n = getOpenCount();
  if (n > 1) {
    // console.log("skipping creating inbox / journal because openCount:", n);
    return;
  }
  createNote(getJournalNoteInfo().path, blockHdrMarkdown + initialJournal);
  createNote(getInboxNoteInfo().path, blockHdrMarkdown + initialInbox);
}

/**
 * @returns {NoteInfo[]}
 */
function loadNoteInfosLS() {
  /**
   * @param {string} notePath
   * @returns {string}
   */
  function getNoteNameLS(notePath) {
    const i = notePath.indexOf(":");
    return notePath.substring(i + 1);
  }

  const res = [];
  let nKeys = localStorage.length;
  for (let i = 0; i < nKeys; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("note:")) {
      /** @type {NoteInfo} */
      let o = {
        path: key,
        name: getNoteNameLS(key),
      };
      res.push(o);
    }
  }
  return res;
}

/**
 * @param {NoteInfo} a
 * @param {NoteInfo} b
 * @returns {boolean}
 */
export function isNoteInfoEqual(a, b) {
  return a.path === b.path && a.name === b.name;
}

/**
 * @returns {NoteInfo[]}
 */
export function loadNoteInfos() {
  // TODO: hanndle directory
  return loadNoteInfosLS();
}

// in case somehow a note doesn't start with the block header, fix it up
export function fixUpNoteContent(s) {
  // console.log("fixUpNote:", content)
  if (s === null) {
    // console.log("fixUpNote: null content")
    return blockHdrPlainText;
  }
  if (!s.startsWith("\n∞∞∞")) {
    s = blockHdrPlainText + s;
    // console.log('fixUpNote: added block to content', content)
  }
  return s;
}

/**
 * @param {NoteInfo} noteInfo
 * @returns {boolean}
 */
export function isSystemNote(noteInfo) {
  // console.log("isSystemNote:", notePath)
  return noteInfo.path.startsWith("system:");
}

/**
 * @param {NoteInfo} noteInfo
 * @returns {boolean}
 */
export function isJournalNote(noteInfo) {
  return noteInfo.name == "daily journal";
}

/**
 * @returns {NoteInfo[]}
 */
export function getSystemNoteInfos() {
  return [
    {
      path: "system:help",
      name: "help",
    },
  ];
}

export function getSystemNoteContent(notePath) {
  console.log("getSystemNoteContent:", notePath);
  if (notePath === "system:help") {
    return getHelp();
  }
  return blockHdrPlainText + "error: unknown system note:" + notePath + "\n";
}

export async function loadCurrentNote() {
  // let self = Heynote;
  let settings = getSettings();
  // console.log("Heynote:", settings);
  const noteInfo = settings.currentNoteInfo;
  // console.log("loadCurrentNote: from ", notePath);
  const s = localStorage.getItem(noteInfo.path);
  return fixUpNoteContent(s);
}

/**
 * @param {string} content
 * @returns
 */
export async function saveCurrentNote(content) {
  let settings = getSettings();
  const noteInfo = settings.currentNoteInfo;
  console.log("notePath:", noteInfo);
  if (isSystemNote(noteInfo)) {
    console.log("skipped saving system note", noteInfo.name);
    return;
  }
  localStorage.setItem(noteInfo.path, content);
  // TODO: or do it in save.js?
  isDocDirty.value = false;
  incSaveCount();
}

/**
 * @param {string} name
 * @returns {NoteInfo}
 */
function createNoteWithNameLS(name) {
  // TODO: do I need to sanitize name for localStorage keys?
  const path = "note:" + name;
  if (localStorage.getItem(path) == null) {
    localStorage.setItem(path, fixUpNoteContent(null));
    console.log("created note", name);
    incNoteCreateCount();
  } else {
    console.log("note already exists", name);
  }
  return {
    path: path,
    name: name,
  };
}

/**
 * @param {string} name
 * @returns {Promise<NoteInfo>}
 */
export async function createNoteWithName(name) {
  return createNoteWithNameLS(name);
}

/**
 *
 * @param {NoteInfo} noteInfo
 * @returns {Promise<string>}
 */
export async function loadNote(noteInfo) {
  console.log("openNote:", noteInfo);
  if (isSystemNote(noteInfo)) {
    await setSetting("currentNoteInfo", noteInfo);
    return getSystemNoteContent(noteInfo);
  }
  let key = noteInfo.path;
  let content = localStorage.getItem(key);
  await setSetting("currentNoteInfo", noteInfo);
  if (isJournalNote(noteInfo)) {
    console.log("openNote:");
    // create block for a current day
    const dt = getDateYYYYMMDDDay();
    console.log("openNote: dt:", dt);
    if (content === null) {
      content = blockHdrMarkdown + "# " + dt + "\n";
      // console.log("openNote: content:", content)
    } else {
      if (!content.includes(dt)) {
        content = blockHdrMarkdown + "# " + dt + "\n" + content;
        // console.log("openNote: content:", content)
      }
    }
  }
  return fixUpNoteContent(content);
}

/**
 * @param {NoteInfo} noteInfo
 */
export async function deleteNote(noteInfo) {
  // TODO: need layer of indirection when saving to disk
  localStorage.removeItem(noteInfo.path);
  // TODO: need to update list of notes?
}
