import { formatDateYYYYMMDDDay, isDev, len, throwIf } from "./util";
import {
  fsReadTextFile,
  fsWriteTextFile,
  openDirPicker,
  readDir,
} from "./fileutil";
import { getHelp, getInitialContent, getReleaseNotes } from "./initial-content";
import { getSettings, loadSettings, saveSettings } from "./settings";
import {
  getStats,
  incNoteCreateCount,
  incNoteDeleteCount,
  incNoteSaveCount,
  isDocDirty,
} from "./state";
import { historyPush, removeFromHistory, renameInHistory } from "./history";

import { KV } from "./dbutil";
import sanitize from "sanitize-filename";

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

// some things, like FilesystemDirectoryHandle, we need to store in indexedDb
const db = new KV("edna", "keyval");

const kStorageDirHandleKey = "storageDirHandle";

/**
 * @returns {Promise<FileSystemDirectoryHandle>}
 */
export async function dbGetDirHandle() {
  let dh = await db.get(kStorageDirHandleKey);
  storageFS = dh ? dh : null;
  return storageFS;
}

/**
 * @param {FileSystemDirectoryHandle} dh
 */
export async function dbSetDirHandle(dh) {
  await db.set(kStorageDirHandleKey, dh);
  storageFS = dh;
}

export async function dbDelDirHandle() {
  await db.del(kStorageDirHandleKey);
  storageFS = null;
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

export function notePathFromNameFS(name, encrypted = false) {
  if (encrypted) {
    return name + kEdnaEncrFileExt;
  }
  return name + kEdnaFileExt;
}

const kLSKeyPrefix = "note:";
const kLSKeyEncrPrefix = "note.encr:";

function notePathFromNameLS(name, encrypted = false) {
  if (encrypted) {
    return kLSKeyEncrPrefix + name;
  }
  return kLSKeyPrefix + name;
}

export function notePathFromName(name, encrypted = false) {
  let dh = getStorageFS();
  if (dh) {
    return notePathFromNameFS(name, encrypted);
  } else {
    return notePathFromNameLS(name, encrypted);
  }
}

export const kScratchNoteName = "scratch";
export const kDailyJournalNoteName = "daily journal";
export const kInboxNoteName = "inbox";

export const kHelpSystemNoteName = "system:help";
export const kReleaseNotesSystemNoteName = "system:Release Notes";

const systemNotes = [kHelpSystemNoteName, kReleaseNotesSystemNoteName];
/**
 * @param {string} name
 * @returns {boolean}
 */
export function isSystemNoteName(name) {
  return systemNotes.includes(name);
}

export const blockHdrPlainText = "\n∞∞∞text-a\n";
export const blockHdrMarkdown = "\n∞∞∞markdown\n";

/**
 * @param {string[]} existingNotes
 * @returns {Promise<string[]>}
 */
export async function createDefaultNotes(existingNotes) {
  /**
   * @param {string} name
   * @param {string} md - markdown content
   * @returns {Promise<number>}
   */
  async function createIfNotExists(name, md) {
    if (existingNotes.includes(name)) {
      console.log("skipping creating note", name);
      return 0;
    }
    let content = blockHdrMarkdown + md;
    await createNoteWithName(name, content);
    return 1;
  }
  let isFirstRun = getStats().appOpenCount < 2;
  console.log("isFirstRun:", isFirstRun);

  const { initialContent, initialDevContent, initialJournal, initialInbox } =
    getInitialContent();

  const s = false && isDev ? initialDevContent : initialContent;
  let nCreated = await createIfNotExists(kScratchNoteName, s);
  // scratch note must always exist but the user can delete inbox / daily journal notes
  if (isFirstRun) {
    // re-create those notes if the user hasn't deleted them
    nCreated += await createIfNotExists(kDailyJournalNoteName, initialJournal);
    nCreated += await createIfNotExists(kInboxNoteName, initialInbox);
  }
  if (nCreated > 0) {
    await updateLatestNoteNames();
  }
  if (isFirstRun) {
    await loadNotesMetadata(); // must pre-load to make them available
    reassignNoteShortcut("scratch", "1");
    reassignNoteShortcut("daily journal", "2");
    reassignNoteShortcut("inbox", "3");
  }
  return latestNoteNames;
}

/**
 * @returns {string[]}
 */
function loadNoteNamesLS() {
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
      res.push(name);
    }
  }
  return res;
}

// we must cache those because loadNoteNames() is async and we can't always call it
// note: there's a potential of getting out of sync
/** @type {string[]} */
let latestNoteNames = [];

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

/**
 * @param {FileSystemDirectoryHandle} dh
 * @returns {Promise<string[]>}
 */
async function loadNoteNamesFS(dh = null) {
  if (!dh) {
    dh = getStorageFS();
    throwIf(!dh, "unknown storage");
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

  /** @type {string[]} */
  let res = [];
  for (let e of fsEntries.dirEntries) {
    let fileName = e.name;
    let name = nameFromFileName(fileName);
    res.push(name);
  }
  // console.log("loadNoteNamesFS() res:", res);
  return res;
}
/**
 * @returns {Promise<string[]>}
 */
export async function loadNoteNames() {
  let dh = getStorageFS();
  /** @type {string[]} */
  let res = [];
  if (!dh) {
    res = loadNoteNamesLS();
  } else {
    res = await loadNoteNamesFS(dh);
  }
  latestNoteNames = res;
  // console.log("loadNoteNames() res:", res);
  return res;
}

/**
 * after creating / deleting / renaming a note we need to update
 * cached latestNoteNames
 * @returns {Promise<string[]>}
 */
async function updateLatestNoteNames() {
  return await loadNoteNames();
}

export function getLatestNoteNames() {
  return latestNoteNames;
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
 * @param {string} name
 * @returns {string}
 */
function getSystemNoteContent(name) {
  console.log("getSystemNoteContent:", name);
  switch (name) {
    case kHelpSystemNoteName:
      return getHelp();
    case kReleaseNotesSystemNoteName:
      return getReleaseNotes();
  }
  throw new Error("unknown system note:" + name);
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
 * @param {string[]} noteNames
 * @returns {string}
 */
function pickUniqueNameInNoteNames(base, noteNames) {
  return pickUniqueName(base, noteNames);
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
  let path = notePathFromName(name);
  let dh = getStorageFS();
  if (!dh) {
    localStorage.setItem(path, content);
  } else {
    await fsWriteTextFile(dh, path, content);
  }
  isDocDirty.value = false;
  incNoteSaveCount();
}

/**
 * @param {string} name
 * @param {string} content
 * @returns {Promise<void>}
 */
export async function createNoteWithName(name, content = null) {
  const path = notePathFromName(name);
  let dh = getStorageFS();
  content = fixUpNoteContent(content);
  if (!dh) {
    // TODO: should it happen that note already exists?
    if (localStorage.getItem(path) == null) {
      localStorage.setItem(path, content);
      console.log("created note", name);
      incNoteCreateCount();
    } else {
      console.log("note already exists", name);
    }
    await updateLatestNoteNames();
    return;
  }

  // TODO: check if exists
  await fsWriteTextFile(dh, path, content);
  incNoteCreateCount();
  await updateLatestNoteNames();
}

/**
 * creates a new scratch-${N} note
 * @returns {Promise<string>}
 */
export async function createNewScratchNote() {
  console.log("createNewScratchNote");
  let noteInfos = await loadNoteNames();
  // generate a unique "scratch-${N}" note name
  let scratchName = pickUniqueNameInNoteNames("scratch", noteInfos);
  createNoteWithName(scratchName);
  return scratchName;
}

/**
 * @param {string} name
 * @param {string} content
 * @returns {string}
 */
function autoCreateDayInJournal(name, content) {
  if (name != kDailyJournalNoteName) {
    return content;
  }
  // create block for a current day
  const dt = formatDateYYYYMMDDDay();
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
 * @param {string} name
 * @returns {string}
 */
function loadNoteLS(name) {
  // TODO: encrypted notes
  let key = "note:" + name;
  return localStorage.getItem(key);
}

/**
 * @param {string} name
 * @returns {Promise<string>}
 */
export async function loadNote(name, preLoad = false) {
  console.log("loadNote:", name);
  let content;
  if (isSystemNoteName(name)) {
    content = getSystemNoteContent(name);
  } else {
    let dh = getStorageFS();
    if (!dh) {
      content = loadNoteLS(name);
    } else {
      let path = notePathFromNameFS(name);
      content = await fsReadTextFile(dh, path);
    }
  }
  if (preLoad) {
    return content;
  }
  historyPush(name);
  // TODO: this should happen in App.vue:onDocChange(); this was easier to write
  content = autoCreateDayInJournal(name, content);
  return fixUpNoteContent(content);
}

/**
 * @returns {Promise<string>}
 */
export async function loadCurrentNote() {
  let settings = getSettings();
  return loadNote(settings.currentNoteName);
}

/**
 * @param {string} name
 * @returns {boolean}
 */
export function canDeleteNote(name) {
  if (name === kScratchNoteName) {
    return false;
  }
  return !isSystemNoteName(name);
}

/**
 * @param {string} name
 */
export async function deleteNote(name) {
  let dh = getStorageFS();
  if (!dh) {
    let key = notePathFromName(name);
    localStorage.removeItem(key);
  } else {
    let fileName = notePathFromNameFS(name);
    await dh.removeEntry(fileName);
  }
  incNoteDeleteCount();
  removeFromHistory(name);
  await updateLatestNoteNames();
}

/**
 * @param {string} oldName
 * @param {string} newName
 * @param {string} content
 */
export async function renameNote(oldName, newName, content) {
  await createNoteWithName(newName, content);
  await deleteNote(oldName);
  await renameInMetadata(oldName, newName);
  renameInHistory(oldName, newName);
  await updateLatestNoteNames();
}

/**
 * @param {string} noteName
 * @param {string[]} diskNoteNames
 * @param {FileSystemDirectoryHandle} dh
 * @returns
 */
async function migrateNote(noteName, diskNoteNames, dh) {
  let name = noteName;
  /** @type {string} */
  let noteInfoOnDisk;
  for (let ni of diskNoteNames) {
    if (ni === name) {
      noteInfoOnDisk = ni;
      break;
    }
  }
  let content = loadNoteLS(noteName);
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
  let path = notePathFromNameFS(name);
  let diskContent = await fsReadTextFile(dh, path);
  if (content === diskContent) {
    console.log("migrateNote: same content, skipping", noteName);
    return;
  }
  // if the content is different, create a new note with a different name
  let newName = pickUniqueNameInNoteNames(name, diskNoteNames);
  let fileName = notePathFromName(newName);
  await fsWriteTextFile(dh, fileName, content);
  console.log(
    "migrateNote: created new note",
    fileName,
    "because of different content with",
    name
  );
}

// when notes are stored on disk, they can be stored on replicated online
// storage like OneDrive
// just in case we pre-load them to force downloading them to local drive
// to make future access faster
/**
 * @returns {Promise<number>}
 */
export async function preLoadAllNotes() {
  let dh = getStorageFS();
  if (dh === null) {
    return;
  }
  if (false) {
    // when testing delays due to replication
    return;
  }
  let noteNames = await loadNoteNames();
  for (let name of noteNames) {
    await loadNote(name, true);
  }
  return len(noteNames);
}

/**
 * @param {FileSystemDirectoryHandle} dh
 */
export async function switchToStoringNotesOnDisk(dh) {
  console.log("switchToStoringNotesOnDisk");
  let diskNoteNames = await loadNoteNamesFS(dh);

  // migrate notes
  for (let name of latestNoteNames) {
    if (isSystemNoteName(name)) {
      continue;
    }
    migrateNote(name, diskNoteNames, dh);
  }
  // remove migrated notes
  for (let name of latestNoteNames) {
    if (isSystemNoteName(name)) {
      continue;
    }
    let key = notePathFromNameLS(name);
    localStorage.removeItem(key);
  }

  storageFS = dh;
  // save in indexedDb so that it persists across sessions
  await dbSetDirHandle(dh);
  let noteNames = await updateLatestNoteNames();

  // migrate settings, update currentNoteName
  let settings = loadSettings();
  let name = settings.currentNoteName;
  if (!noteNames.includes(name)) {
    settings.currentNoteName = kScratchNoteName;
    saveSettings(settings);
  }
  return noteNames;
}

export async function pickAnotherDirectory() {
  try {
    let newDh = await openDirPicker(true);
    if (!newDh) {
      return;
    }
    await dbSetDirHandle(newDh);
    return true;
  } catch (e) {
    console.error("pickAnotherDirectory", e);
  }
  return false;
}

// meta-data about notes
export const kMetadataName = "notes.metadata.edna.json";

/**
 * @typedef {Object} NoteMetadata
 * @property {string} name
 * @property {string} [altShortcut]
 */

/** @type {NoteMetadata[]} */
let notesMetadata = [];

export function getNotesMetadata() {
  return notesMetadata;
}

/**
 * @param {string} noteName
 * @returns {NoteMetadata}
 */
export function getMetadataForNote(noteName) {
  let meta = notesMetadata;
  for (let m of meta) {
    if (m.name === noteName) {
      return m;
    }
  }
  return null;
}

export async function loadNotesMetadata() {
  let dh = getStorageFS();
  let s;
  if (!dh) {
    s = localStorage.getItem(kMetadataName);
  } else {
    try {
      s = await fsReadTextFile(dh, kMetadataName);
    } catch (e) {
      // it's ok if doesn't exist
      console.log("loadNotesMetadata: no metadata file", e);
      s = "[]";
    }
  }
  s = s || "[]";
  notesMetadata = JSON.parse(s);
  return notesMetadata;
}

/**
 * @param {NoteMetadata[]} m
 */
async function saveNotesMetadata(m) {
  let s = JSON.stringify(m, null, 2);
  let dh = getStorageFS();
  if (!dh) {
    localStorage.setItem(kMetadataName, s);
  } else {
    await fsWriteTextFile(dh, kMetadataName, s);
  }
  notesMetadata = m;
  return m;
}

/**
 * @param {string} oldName
 * @param {string} newName
 * @returns {Promise<NoteMetadata[]>}
 */
async function renameInMetadata(oldName, newName) {
  let m = notesMetadata;
  for (let o of notesMetadata) {
    if (o.name === oldName) {
      o.name = newName;
      break;
    }
  }
  return await saveNotesMetadata(m);
}

/**
 * @param {string} name
 * @param {string} altShortcut - "0" ... "9"
 * @returns {Promise<NoteMetadata[]>}
 */
export async function reassignNoteShortcut(name, altShortcut) {
  // console.log("reassignNoteShortcut:", name, altShortcut);
  let m = getNotesMetadata();
  for (let o of m) {
    if (o.altShortcut === altShortcut) {
      if (o.name === name) {
        // same note: just remove shortcut
        o.altShortcut = undefined;
        m = m.filter((o) => o.altShortcut);
        return await saveNotesMetadata(m);
      } else {
        // a different note: remove shortcut and then assign to the new note
        o.altShortcut = undefined;
        break;
      }
    }
  }

  /** @type {NoteMetadata} */
  let found;
  for (let o of m) {
    if (o.name === name) {
      found = o;
      console.log("reassignNoteShortcut: found note", name);
      break;
    }
  }
  if (!found) {
    found = { name: name };
    m.push(found);
    console.log("reassignNoteShortcut: created for note", name);
  }
  found.altShortcut = altShortcut;
  m = m.filter((o) => o.altShortcut);
  return await saveNotesMetadata(m);
}

/**
 * Sometimes we save the note in the filesystem so we must ensure that
 * the note name is a valid file name.
 * note: we could do something more sophisticated, like keeping real name
 * in metadata and picking a unique, sanitized file name, but not sure
 * if complications are worth it
 * @param {string} name
 * @returns {string}
 */
export function sanitizeNoteName(name) {
  let res = sanitize(name).trim();
  // console.log(`sanitizeNoteName: ${name} -> ${res}`);
  return res;
}
