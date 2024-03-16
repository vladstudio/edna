import { fsReadTextFile, fsWriteTextFile, readDir } from "./fileutil";
import { getDateYYYYMMDDDay, throwIf } from "./utils";
import { getHelp, getInitialContent } from "./initial-content";
import {
  getOpenCount,
  incNoteCreateCount,
  incSaveCount,
  isDocDirty,
} from "./state";
import {
  getSettings,
  loadSettings,
  saveSettings,
  setSetting,
} from "./settings";

import { KV } from "./dbutil";

/** @typedef {import("./state.js").NoteInfo} NoteInfo */

// some things, like FilesystemDirectoryHandle, we need to store in indexedDb
const db = new KV("edna", "keyval");

const kStorageDirHandleKey = "storageDirHandle";

/**
 * @returns {Promise<FileSystemDirectoryHandle>}
 */
export async function dbGetDirHandle() {
  return await db.get(kStorageDirHandleKey);
}

/**
 * @param {FileSystemDirectoryHandle} dh
 */
export async function dbSetDirHandle(dh) {
  await db.set(kStorageDirHandleKey, dh);
}

/**
 * @param {NoteInfo} a
 * @param {NoteInfo} b
 * @returns {boolean}
 */
export function isNoteInfoEqual(a, b) {
  return a.path === b.path && a.name === b.name;
}

// TODO: take encyrption into account
export function notePathFromName(name) {
  let dh = getStorageDirHandle();
  if (dh) {
    return name + ".edna.txt";
  }
  return "note:" + name;
}

/**
 * @param {string} name
 * @returns {NoteInfo}
 */
function mkNoteInfoFromName(name) {
  return {
    path: notePathFromName(name),
    name: name,
    nameLC: name.toLowerCase(),
  };
}

/**
 * @returns {NoteInfo}
 */
export function getScratchNoteInfo() {
  return mkNoteInfoFromName("scratch");
}

/**
 * @returns {NoteInfo}
 */
export function getJournalNoteInfo() {
  return mkNoteInfoFromName("daily journal");
}

/**
 * @returns {NoteInfo}
 */
export function getInboxNoteInfo() {
  return mkNoteInfoFromName("inbox");
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

// set if we store
/** @type {FileSystemDirectoryHandle | null} */
let storageDirHandle = null;

/**
 * if we're storing notes on disk, returns dir handle
 * returns null if we're storing in localStorage
 * @returns {FileSystemDirectoryHandle | null}
 */
export function getStorageDirHandle() {
  return storageDirHandle;
}

export function setStorageDirHandle(dh) {
  storageDirHandle = dh;
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
      let name = getNoteNameLS(key);
      /** @type {NoteInfo} */
      let o = {
        path: key,
        name: name,
        nameLC: name.toLowerCase(),
      };
      res.push(o);
    }
  }
  return res;
}

// we must cache those because loadNoteInfos() is async and we can't always call it
// note: there's a potential of getting out of sync
/** @type {NoteInfo[]} */
let latestNoteInfos = [];

// strip .enda.txt or .edna.encr.txt
function nameFromFileName(name) {
  let pos = name.lastIndexOf(".edna.");
  throwIf(pos === -1, `invalid file name '${name}'`);
  return name.substring(0, pos);
}

async function loadNoteInfosDirHandle(dh = null) {
  if (dh === null) {
    dh = getStorageDirHandle();
    throwIf(dh === null, "unknown storage");
  }
  let skipEntryFn = (entry, dir) => {
    if (entry.kind === "directory") {
      return true;
    }
    let name = entry.name.toLowerCase();
    return !(name.endsWith(".edna.txt") || name.endsWith(".edna.encr.txt"));
  };
  let fsEntries = await readDir(dh, skipEntryFn);
  console.log("files", fsEntries);

  /** @type {NoteInfo[]} */
  let res = [];
  for (let e of fsEntries) {
    let fileName = e.name;
    let name = nameFromFileName(fileName);
    let o = {
      name: name,
      nameLC: name.toLowerCase(),
      path: fileName,
    };
    res.push(o);
  }
  return res;
}

/**
 * @returns {Promise<NoteInfo[]>}
 */
export async function loadNoteInfos() {
  let dh = getStorageDirHandle();
  if (dh === null) {
    let res = loadNoteInfosLS();
    latestNoteInfos = res;
    return res;
  }
  return await loadNoteInfosDirHandle(dh);
}

/**
 * after creating / deleting / renaming a note we need to update
 * cached latestNoteInfos
 * @returns {Promise<NoteInfo[]>}
 */
async function updateLatestNoteInfos() {
  return await loadNoteInfos();
}

export function getLatestNoteInfos() {
  return latestNoteInfos;
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

/**
 * @param {NoteInfo} noteInfo
 * @returns {string}
 */
function getSystemNoteContent(noteInfo) {
  console.log("getSystemNoteContent:", noteInfo);
  if (noteInfo.path === "system:help") {
    return getHelp();
  }
  throw new Error("unknown system note:" + noteInfo);
}

/**
 * @param {string} base
 * @param {string[]} existingNames
 * @returns {string}
 */
function pickUniqueName(base, existingNames) {
  let name = base;
  let i = 1;
  while (existingNames.includes(name)) {
    name = base + "-" + i;
    i++;
  }
  return name;
}

/**
 * @param {string} base
 * @param {NoteInfo[]} noteInfos
 * @returns {string}
 */
function pickUniqueNameInNoteInfos(base, noteInfos) {
  let names = noteInfos.map((ni) => ni.name);
  return pickUniqueName(base, names);
}

export async function loadCurrentNote() {
  // let self = Heynote;
  let settings = getSettings();
  // console.log("Heynote:", settings);
  const noteInfo = settings.currentNoteInfo;
  // console.log("loadCurrentNote: from ", notePath);
  let dh = getStorageDirHandle();
  let s;
  if (dh === null) {
    s = localStorage.getItem(noteInfo.path);
  } else {
    s = await fsReadTextFile(dh, noteInfo.path);
  }
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
  let dh = getStorageDirHandle();
  if (dh === null) {
    localStorage.setItem(noteInfo.path, content);
  } else {
    await fsWriteTextFile(dh, noteInfo.path, content);
  }
  isDocDirty.value = false;
  incSaveCount();
}

/**
 * @param {string} name
 * @returns {Promise<NoteInfo>}
 */
export async function createNoteWithName(name) {
  let dh = getStorageDirHandle();
  let content = fixUpNoteContent(null);
  if (dh === null) {
    // TODO: do I need to sanitize name for localStorage keys?
    const path = "note:" + name;
    if (localStorage.getItem(path) == null) {
      localStorage.setItem(path, fixUpNoteContent(null));
      console.log("created note", name);
      incNoteCreateCount();
    } else {
      console.log("note already exists", name);
    }
    await updateLatestNoteInfos();
    return {
      path: path,
      name: name,
      nameLC: name.toLowerCase(),
    };
  }

  let fileName = name + ".edna.txt";
  // TODO: check if exists
  await fsWriteTextFile(dh, fileName, content);
  incNoteCreateCount();
  await updateLatestNoteInfos();
  return {
    path: fileName,
    name: name,
    nameLC: name.toLowerCase(),
  };
}

/**
 * @param {NoteInfo} noteInfo
 * @param {string} content
 * @returns {string}
 */
function autoCreateDayInJournal(noteInfo, content) {
  if (!isJournalNote(noteInfo)) {
    return content;
  }
  // create block for a current day
  const dt = getDateYYYYMMDDDay();
  if (content === null) {
    content = blockHdrMarkdown + "# " + dt + "\n";
  } else {
    if (!content.includes(dt)) {
      content = blockHdrMarkdown + "# " + dt + "\n" + content;
    }
  }
  return content;
}

/**
 * @param {NoteInfo} noteInfo
 * @returns {Promise<string>}
 */
export async function loadNote(noteInfo) {
  console.log("openNote:", noteInfo);
  if (isSystemNote(noteInfo)) {
    await setSetting("currentNoteInfo", noteInfo);
    return getSystemNoteContent(noteInfo);
  }
  let content;
  let dh = getStorageDirHandle();
  if (dh === null) {
    let key = noteInfo.path;
    content = localStorage.getItem(key);
  } else {
    let fileName = noteInfo.path;
    content = await fsReadTextFile(dh, fileName);
  }
  await setSetting("currentNoteInfo", noteInfo);
  content = autoCreateDayInJournal(noteInfo, content);
  return fixUpNoteContent(content);
}

/**
 * @param {NoteInfo} noteInfo
 * @returns {Promise<NoteInfo[]>}
 */
export async function deleteNote(noteInfo) {
  let dh = getStorageDirHandle();
  if (dh === null) {
    let key = noteInfo.path;
    localStorage.removeItem(key);
  } else {
    let fileName = noteInfo.path;
    await dh.removeEntry(fileName);
  }
  return await updateLatestNoteInfos();
}

/**
 * creates a new scratch-${N} note
 * @returns {Promise<NoteInfo>}
 */
export async function createNewScratchNote() {
  console.log("createNewScratchNote");
  let noteInfos = await loadNoteInfos();
  // generate a unique "scratch-${N}" note name
  let scratchName = pickUniqueNameInNoteInfos("scratch", noteInfos);
  let noteInfo = createNoteWithName(scratchName);
  return noteInfo;
}

/**
 * @param {NoteInfo} noteInfo
 * @param {NoteInfo[]} diskNoteInfos
 * @param {FileSystemDirectoryHandle} dh
 * @returns
 */
async function migrateNote(noteInfo, diskNoteInfos, dh) {
  let name = noteInfo.name;
  /** @type {NoteInfo} */
  let noteInfoOnDisk;
  for (let ni of diskNoteInfos) {
    if (ni.name === name) {
      noteInfoOnDisk = ni;
      break;
    }
  }
  let content = localStorage.getItem(noteInfo.path);
  if (!noteInfoOnDisk) {
    // didn't find a note with the same name so create
    let fileName = name + ".edna.txt";
    await fsWriteTextFile(dh, fileName, content);
    return;
  }
  let diskContent = await fsReadTextFile(dh, noteInfoOnDisk.path);
  if (content === diskContent) {
    console.log("migrateNote: same content, skipping", noteInfo.path);
    return;
  }
  // if the content is different, create a new note with a different name
  let newName = pickUniqueNameInNoteInfos(name, diskNoteInfos);
  let fileName = newName + ".edna.txt";
  await fsWriteTextFile(dh, fileName, content);
  console.log(
    "migrateNote: created new note",
    fileName,
    "because of different content with",
    name
  );
}

/**
 * @param {FileSystemDirectoryHandle} dh
 */
export async function switchToStoringNotesOnDisk(dh) {
  console.log("switchToStoringNotesOnDisk");
  let diskNoteInfos = await loadNoteInfosDirHandle(dh);

  // migrate notes
  for (let ni of latestNoteInfos) {
    if (isSystemNote(ni)) {
      continue;
    }
    migrateNote(ni, diskNoteInfos, dh);
  }
  // remove migrated notes
  for (let ni of latestNoteInfos) {
    if (isSystemNote(ni)) {
      continue;
    }
    localStorage.removeItem(ni.path);
  }
  // migrate settings
  let settings = await loadSettings(null);
  await saveSettings(settings, dh);
  storageDirHandle = dh;

  // save in indexedDb so that it persists across sessions
  await dbSetDirHandle(dh);

  let noteInfos = await updateLatestNoteInfos();
  return noteInfos;
}
