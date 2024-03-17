import { throwIf } from "./utils";

/**
 * permissions expire after a while, so we need to re-check them before doing file operations
 * otherwise the operation might fail with an exception
 * if permissions are still valid, this is a no-op (from user point of view)
 * if permissions expired, this shows the "can I read/write here" dialog
 * @param {any} fileHandle
 * @param {boolean} withWrite
 * @returns {Promise<boolean>}
 */
export async function verifyHandlePermission(fileHandle, withWrite) {
  const opts = {};
  if (withWrite) {
    opts.mode = "readwrite";
  }

  // Check if we already have permission, if so, return true.
  if ((await fileHandle.queryPermission(opts)) === "granted") {
    return true;
  }

  // Request permission to the file, if the user grants permission, return true.
  if ((await fileHandle.requestPermission(opts)) === "granted") {
    return true;
  }

  // The user did not grant permission, return false.
  return false;
}

/**
 * @param {any} fileHandle
 * @param {boolean} withWrite
 * @returns {Promise<boolean>}
 */
export async function requestHandlePermission(fileHandle, withWrite) {
  const opts = {};
  if (withWrite) {
    opts.mode = "readwrite";
  }
  return (await fileHandle.requestPermission(opts)) === "granted";
}

/**
 * @param {any} fileHandle
 * @param {boolean} withWrite
 * @returns {Promise<boolean>}
 */
export async function hasHandlePermission(fileHandle, withWrite) {
  const opts = {};
  if (withWrite) {
    opts.mode = "readwrite";
  }
  return (await fileHandle.queryPermission(opts)) === "granted";
}

/**
 * @returns {boolean}
 */
export function isIFrame() {
  let isIFrame = false;
  try {
    // in iframe, those are different
    isIFrame = window.self !== window.top;
  } catch {
    // do nothing
  }
  return isIFrame;
}

// a directory tree. each element is either a file:
// [file,      dirHandle, name, path, size, null]
// or directory:
// [[entries], dirHandle, name, path, size, null]
// extra null value is for the caller to stick additional data
// without the need to re-allocate the array
// if you need more than 1, use an object

// handle (file or dir), parentHandle (dir), size, path, dirEntries, meta
const handleIdx = 0;
const parentHandleIdx = 1;
const sizeIdx = 2;
const pathIdx = 3;
const dirEntriesIdx = 4;
const metaIdx = 5;

export class FsEntry extends Array {
  /**
   * @returns {string}
   */
  get name() {
    return this[handleIdx].name;
  }

  /**
   * @returns {boolean}
   */
  get isDir() {
    return this[handleIdx].kind === "directory";
  }

  /**
   * @returns {number}
   */
  get size() {
    return this[sizeIdx];
  }

  /**
   * @param {number} n
   */
  set size(n) {
    throwIf(!this.isDir);
    this[sizeIdx] = n;
  }

  /**
   * @returns {string}
   */
  get path() {
    return this[pathIdx];
  }

  /**
   * @param {string} v
   */
  set path(v) {
    this[pathIdx] = v;
  }

  /**
   * @return any
   */
  get meta() {
    return this[metaIdx];
  }

  set meta(o) {
    this[metaIdx] = o;
  }

  /**
   * @returns {Promise<File>}
   */
  async getFile() {
    throwIf(this.isDir);
    let h = this[handleIdx];
    return await h.getFile();
  }

  /**
   * @param {string} key
   * @retruns {any}
   */
  getMeta(key) {
    let m = this[metaIdx];
    return m ? m[key] : undefined;
  }

  /**
   * @param {string} key
   * @param {any} val
   */
  setMeta(key, val) {
    let m = this[metaIdx] || {};
    m[key] = val;
    this[metaIdx] = m;
  }

  get handle() {
    return this[handleIdx];
  }

  get parentDirHandle() {
    return this[parentHandleIdx];
  }

  /**
   * @returns {FsEntry[]}
   */
  get dirEntries() {
    throwIf(!this.isDir);
    return this[dirEntriesIdx];
  }

  /**
   * @param {FsEntry[]} v
   */
  set dirEntries(v) {
    throwIf(!this.isDir);
    this[dirEntriesIdx] = v;
  }

  /**
   * @param {any} handle
   * @param {any} parentHandle
   * @param {string} path
   * @returns {Promise<FsEntry>}
   */
  static async fromHandle(handle, parentHandle, path) {
    let size = 0;
    if (handle.kind === "file") {
      let file = await handle.getFile();
      size = file.size;
    }
    return new FsEntry(handle, parentHandle, size, path, [], null);
  }
}

function dontSkip(entry, dir) {
  return false;
}

/**
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {Function} skipEntryFn
 * @param {string} dir
 * @returns {Promise<FsEntry>}
 */
export async function readDirRecur(
  dirHandle,
  skipEntryFn = dontSkip,
  dir = dirHandle.name
) {
  /** @type {FsEntry[]} */
  let entries = [];
  // @ts-ignore
  for await (const handle of dirHandle.values()) {
    if (skipEntryFn(handle, dir)) {
      continue;
    }
    const path = dir == "" ? handle.name : `${dir}/${handle.name}`;
    if (handle.kind === "file") {
      let e = await FsEntry.fromHandle(handle, dirHandle, path);
      entries.push(e);
    } else if (handle.kind === "directory") {
      let e = await readDirRecur(handle, skipEntryFn, path);
      e.path = path;
      entries.push(e);
    }
  }
  let res = new FsEntry(dirHandle, null, dir);
  res.dirEntries = entries;
  return res;
}

/**
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {Function} skipEntryFn
 * @param {string} dir
 * @returns {Promise<FsEntry>}
 */
export async function readDir(
  dirHandle,
  skipEntryFn = dontSkip,
  dir = dirHandle.name
) {
  /** @type {FsEntry[]} */
  let entries = [];
  // @ts-ignore
  for await (const handle of dirHandle.values()) {
    if (skipEntryFn(handle, dir)) {
      continue;
    }
    const path = dir == "" ? handle.name : `${dir}/${handle.name}`;
    let e = await FsEntry.fromHandle(handle, dirHandle, path);
    entries.push(e);
  }
  let res = new FsEntry(dirHandle, null, dir);
  res.dirEntries = entries;
  return res;
}

/**
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {string} dir
 * @returns {Promise<File[]>}
 */
export async function readDirRecurFiles(dirHandle, dir = dirHandle.name) {
  const dirs = [];
  const files = [];
  // @ts-ignore
  for await (const entry of dirHandle.values()) {
    const path = dir == "" ? entry.name : `${dir}/${entry.name}`;
    if (entry.kind === "file") {
      files.push(
        entry.getFile().then((file) => {
          file.directoryHandle = dirHandle;
          file.handle = entry;
          return Object.defineProperty(file, "webkitRelativePath", {
            configurable: true,
            enumerable: true,
            get: () => path,
          });
        })
      );
    } else if (entry.kind === "directory") {
      dirs.push(readDirRecurFiles(entry, path));
    }
  }
  return [...(await Promise.all(dirs)).flat(), ...(await Promise.all(files))];
}

/**
 *
 * @param {FsEntry} dir
 * @param {Function} fn
 */
export function forEachFsEntry(dir, fn) {
  let entries = dir.dirEntries;
  for (let e of entries) {
    let skip = fn(e);
    if (!skip && e.isDir) {
      forEachFsEntry(e, fn);
    }
  }
  fn(dir);
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker
 * @param {boolean} writeAccess
 * @returns {Promise<FileSystemDirectoryHandle>}
 */
export async function openDirPicker(writeAccess) {
  const opts = {
    mutltiple: false,
  };
  if (writeAccess) {
    opts.mode = "readwrite";
  }
  try {
    // @ts-ignore
    const fh = await window.showDirectoryPicker(opts);
    return fh;
  } catch (e) {
    console.log("openDirPicker: showDirectoryPicker: e:", e);
  }
  return null;
}

/**
 * @returns {boolean}
 */
export function supportsFileSystem() {
  const ok = "showDirectoryPicker" in window && !isIFrame();
  return ok;
}

/**
 * chatgpt says the string is saved in utf-8
 * @param {FileSystemDirectoryHandle} dh
 * @param {string} fileName
 * @param {string} content
 */
export async function fsWriteTextFile(dh, fileName, content) {
  console.log("writing to file:", fileName, content.length);
  let ok = verifyHandlePermission(dh, true);
  throwIf(!ok, "no permission to write files in directory" + dh.name);
  let fileHandle = await dh.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

/**
 * @param {FileSystemDirectoryHandle} dh
 * @param {string} fileName
 * @returns {Promise<string>}
 */
export async function fsReadTextFile(dh, fileName) {
  console.log("reading file:", fileName);
  let ok = verifyHandlePermission(dh, true);
  throwIf(!ok, "no permission to write files in directory" + dh.name);
  let fileHandle = await dh.getFileHandle(fileName, { create: false });
  const file = await fileHandle.getFile();
  // I assume this reads utf-8
  const content = await file.text();
  return content;
}
