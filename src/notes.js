import {
  fsReadTextFile,
  fsWriteTextFile,
  openDirPicker,
  readDir,
} from "./fileutil";
import { getDateYYYYMMDDDay, throwIf } from "./utils";
import { getHelp, getInitialContent } from "./initial-content";
import {
  getSettings,
  loadSettings,
  saveSettings,
  setSetting,
} from "./settings";
import {
  getStats,
  incNoteCreateCount,
  incNoteDeleteCount,
  incNoteSaveCount,
  isDocDirty,
} from "./state";

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

export async function dbDelDirHandle() {
  await db.del(kStorageDirHandleKey);
}

/**
 * @param {NoteInfo} a
 * @param {NoteInfo} b
 * @returns {boolean}
 */
export function isNoteInfoEqual(a, b) {
  return a.path === b.path && a.name === b.name;
}

const kEdnaFileExt = ".edna.txt";
const kEdnaEncrFileExt = ".edna.encr.txt";

/**
 * @param {string} name
 * @returns {boolean}
 */
function isEdnaFile(name) {
  return name.endsWith(kEdnaFileExt) || name.endsWith(kEdnaEncrFileExt);
}

function notePathFromNameFS(name, encrypted = false) {
  if (encrypted) {
    return name + kEdnaEncrFileExt;
  }
  return name + kEdnaFileExt;
}

// TODO: take encyrption into account
export function notePathFromName(name, encrypted = false) {
  let dh = getStorageFS();
  if (dh) {
    return notePathFromNameFS(name, encrypted);
  }
  if (encrypted) {
    return "note.encr:" + name;
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

export const kScratchNoteName = "scratch";
export const kDailyJournalNoteName = "daily journal";
export const kInboxNoteName = "inbox";

/**
 * @returns {NoteInfo}
 */
export function getScratchNoteInfo() {
  return mkNoteInfoFromName(kScratchNoteName);
}

/**
 * @returns {NoteInfo}
 */
export function getJournalNoteInfo() {
  return mkNoteInfoFromName(kDailyJournalNoteName);
}

/**
 * @returns {NoteInfo}
 */
export function getInboxNoteInfo() {
  return mkNoteInfoFromName(kInboxNoteName);
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
 *
 * @param {string} name
 * @returns {boolean}
 */
export function isSystemNoteName(name) {
  return name === "help";
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
function getSystemNoteInfos() {
  return [
    {
      path: "system:help",
      name: "help",
    },
  ];
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

// is set if we store notes on disk, null if in localStorage
/** @type {FileSystemDirectoryHandle | null} */
let storageFS = null;

/**
 * if we're storing notes on disk, returns dir handle
 * returns null if we're storing in localStorage
 * @returns {FileSystemDirectoryHandle | null}
 */
export function getStorageFS() {
  return storageFS;
}

/**
 * @param {FileSystemDirectoryHandle} dh
 */
export function setStorageFS(dh) {
  storageFS = dh;
}

/**
 * @param {NoteInfo[]} existingNoteInfos
 * @returns {Promise<NoteInfo[]>}
 */
export async function createDefaultNotes(existingNoteInfos) {
  /**
   * @param {string} name
   * @param {string} md
   * @returns {Promise<number>}
   */
  async function createIfNotExists(name, md) {
    if (existingNoteInfos.some((ni) => ni.name === name)) {
      console.log("skipping creating note", name);
      return 0;
    }
    let content = blockHdrMarkdown + md;
    await createNoteWithName(name, content);
    return 1;
  }

  const { initialContent, initialDevContent, initialJournal, initialInbox } =
    getInitialContent();

  const s = isDev ? initialDevContent : initialContent;
  let nCreated = await createIfNotExists(kScratchNoteName, s);
  // scratch note must always exist but the user can delete inbox / daily journal notes
  let n = getStats().appOpenCount;
  if (n < 2) {
    // re-create those notes if the user hasn't deleted them
    nCreated += await createIfNotExists(kDailyJournalNoteName, initialJournal);
    nCreated += await createIfNotExists(kInboxNoteName, initialInbox);
  }
  if (nCreated > 0) {
    await updateLatestNoteInfos();
  }
  return latestNoteInfos;
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

function nameFromFileName(name) {
  // strip edna file extensions
  if (name.endsWith(kEdnaFileExt)) {
    return name.substring(0, name.length - kEdnaFileExt.length);
  }
  if (name.endsWith(kEdnaEncrFileExt)) {
    return name.substring(0, name.length - kEdnaEncrFileExt.length);
  }
  throwIf(true, `invalid file name '${name}'`);
}

async function loadNoteInfosFS(dh = null) {
  if (dh === null) {
    dh = getStorageFS();
    throwIf(dh === null, "unknown storage");
  }
  let skipEntryFn = (entry, dir) => {
    if (entry.kind === "directory") {
      return true;
    }
    let name = entry.name;
    return !isEdnaFile(name);
  };
  let fsEntries = await readDir(dh, skipEntryFn);
  console.log("files", fsEntries);

  /** @type {NoteInfo[]} */
  let res = [];
  for (let e of fsEntries.dirEntries) {
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
  let dh = getStorageFS();
  /** @type {NoteInfo[]} */
  let res = [];
  if (dh === null) {
    res = loadNoteInfosLS();
  } else {
    res = await loadNoteInfosFS(dh);
  }
  const systemNotes = getSystemNoteInfos();
  res = res.concat(systemNotes);
  latestNoteInfos = res;
  return res;
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
    return blockHdrMarkdown;
  }
  if (!s.startsWith("\n∞∞∞")) {
    s = blockHdrMarkdown + s;
    console.log("fixUpNote: added header to content", s);
  }
  return s;
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

/**
 * @param {string} name
 * @returns {NoteInfo}
 */
export function findNoteInfoByName(name) {
  for (let ni of latestNoteInfos) {
    if (ni.name === name) {
      return ni;
    }
  }
  throwIf(true, "note not found:" + name);
  return null;
}

/**
 * @param {string} content
 * @returns
 */
export async function saveCurrentNote(content) {
  let settings = getSettings();
  let name = settings.currentNoteName;
  console.log("note name:", name);
  if (isSystemNoteName(name)) {
    console.log("skipped saving system note", name);
    return;
  }
  const noteInfo = findNoteInfoByName(name);
  let dh = getStorageFS();
  if (dh === null) {
    localStorage.setItem(noteInfo.path, content);
  } else {
    await fsWriteTextFile(dh, noteInfo.path, content);
  }
  isDocDirty.value = false;
  incNoteSaveCount();
}

/**
 * @param {string} name
 * @param {string} content
 * @returns {Promise<NoteInfo>}
 */
export async function createNoteWithName(name, content = null) {
  let dh = getStorageFS();
  content = fixUpNoteContent(content);
  if (dh === null) {
    // TODO: do I need to sanitize name for localStorage keys?
    const path = "note:" + name;
    // TODO: should it happen that note already exists?
    if (localStorage.getItem(path) == null) {
      localStorage.setItem(path, content);
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

  let fileName = notePathFromName(name);
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
 * @returns {string}
 */
function loadNoteLS(noteInfo) {
  return localStorage.getItem(noteInfo.path);
}

async function loadNoteFS(dh, noteInfo) {
  return await fsReadTextFile(dh, noteInfo.path);
}

/**
 * @param {NoteInfo} noteInfo
 * @returns {Promise<string>}
 */
async function loadNoteRaw(noteInfo) {
  console.log("loadNoteRaw:", noteInfo);
  if (isSystemNote(noteInfo)) {
    return getSystemNoteContent(noteInfo);
  }
  let dh = getStorageFS();
  if (dh === null) {
    return loadNoteLS(noteInfo);
  }
  return await loadNoteFS(dh, noteInfo);
}

export async function loadCurrentNote() {
  let settings = getSettings();
  let name = settings.currentNoteName;
  console.log("loadCurrentNote:", name);
  const noteInfo = findNoteInfoByName(name);
  let s = await loadNoteRaw(noteInfo);
  return fixUpNoteContent(s);
}

/**
 * @param {NoteInfo} noteInfo
 * @returns {Promise<string>}
 */
export async function loadNote(noteInfo) {
  console.log("loadNote:", noteInfo);
  let content = await loadNoteRaw(noteInfo);
  setSetting("currentNoteName", noteInfo.name);
  content = autoCreateDayInJournal(noteInfo, content);
  return fixUpNoteContent(content);
}

/**
 * @param {NoteInfo} noteInfo
 * @returns {Promise<NoteInfo[]>}
 */
export async function deleteNote(noteInfo) {
  let dh = getStorageFS();
  if (dh === null) {
    let key = noteInfo.path;
    localStorage.removeItem(key);
  } else {
    let fileName = noteInfo.path;
    await dh.removeEntry(fileName);
  }
  incNoteDeleteCount();
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
  let content = loadNoteLS(noteInfo);
  if (!noteInfoOnDisk) {
    // didn't find a note with the same name so create
    let fileName = notePathFromNameFS(name);
    await fsWriteTextFile(dh, fileName, content);
    console.log(
      "migrateNote: created new note",
      fileName,
      "from note with name",
      name
    );
    return;
  }
  let diskContent = await fsReadTextFile(dh, noteInfoOnDisk.path);
  if (content === diskContent) {
    console.log("migrateNote: same content, skipping", noteInfo.path);
    return;
  }
  // if the content is different, create a new note with a different name
  let newName = pickUniqueNameInNoteInfos(name, diskNoteInfos);
  let fileName = notePathFromName(newName);
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
  let diskNoteInfos = await loadNoteInfosFS(dh);

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

  storageFS = dh;
  // save in indexedDb so that it persists across sessions
  await dbSetDirHandle(dh);
  let noteInfos = await updateLatestNoteInfos();

  // migrate settings, update currentNoteName
  let settings = loadSettings();
  let name = settings.currentNoteName;
  let newCurrNote = noteInfos.filter((ni) => ni.name === name)[0];
  if (newCurrNote) {
    settings.currentNoteName = newCurrNote.name;
  } else {
    settings.currentNoteName = kScratchNoteName;
  }
  saveSettings(settings);

  return noteInfos;
}

export async function pickAnotherDirectory() {
  try {
    let newDh = await openDirPicker(true);
    if (newDh === null) {
      return;
    }
    await dbSetDirHandle(newDh);
    return true;
  } catch (e) {
    console.error("pickAnotherDirectory", e);
  }
  return false;
}
