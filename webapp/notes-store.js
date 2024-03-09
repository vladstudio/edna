// store notes either in localstorage or on disk

/**
 * @interface
 * @description Interface representing a data storage mechanism.
 */
class IStore {
  /**
   * Saves content to the specified name.
   * @param {string} name - The name under which to save the content.
   * @param {*} content - The content to save.
   * @returns {Promise<void>} A Promise that resolves when the content is saved successfully.
   */
  save(name, content) {}

  /**
   * Loads content associated with the specified name.
   * @param {string} name - The name of the content to load.
   * @returns {Promise<*>} A Promise that resolves with the loaded content.
   */
  load(name) {}

  /**
   * @returns {[]string} A list of all note names.
   */
  getNotes() {}
}

function localStorageKeyFromName(name) {
  return "note:" + name;
}

/**
 * @implements {IStore}
 */
class LocalStorageStore extends IStore {

  /** @type {[]string} */
  noteNames = [];

  /**
   *
   * @returns {[]string} A list of all note names.
   */
  getNotes() {
    return this.noteNames;
  }

  save(name, content) {
    const key = localStorageKeyFromName(name)
    localStorage.setItem(key, content);
  }

  load(name) {
    const key = localStorageKeyFromName(name)
    return localStorage.getItem(key);
  }
}

/**
 * @implements {IStore}
 */
class DiskStore extends IStore {

  /** @type {[]string} */
  noteNames = [];

  /**
   *
   * @returns {[]string} A list of all note names.
   */
  getNotes() {
    return this.noteNames;
  }

  save(name, content) {
    const fs = require('fs');
    fs.writeFileSync(name, content);
  }
  load(name) {
    const fs = require('fs');
    return fs.readFileSync(name, 'utf8');
  }
}

export function createDefaultStore() {
  // TODO: if we have directory handle in indexdb, return DiskStore
  return new LocalStorageStore();
}
