import { ref } from "vue";

/**
 * @template T
 * @typedef {import('vue').Ref<T>} Ref<T>
 */

/**
 * @typedef {Object} NoteInfo
 * @property {string} name
 * @property {string} path
 */

export let isDocDirty = ref(false);
/** @type {Ref<NoteInfo[]>} */
export let noteInfos = ref([]);

const keyOpenCount = "edna:openCount";
const keySaveCount = "edna:saveCount";
const keyNoteCreateCount = "edna:noteCreateCount";

/**
 * @param {string} key
 * @returns {number}
 * */
function getLSCount(key) {
  let vs = localStorage.getItem(key);
  if (vs === null) {
    return 0;
  }
  // if parsing fails, returns NaN and NaN | 0 == 0
  return parseInt(vs) || 0;
}

/**
 * @param {string} key
 * @returns {number}
 * */
function incLSCount(key) {
  let v = getLSCount(key);
  v++;
  localStorage.setItem(key, v.toString());
  return v;
}

/**
 * @returns {number}
 */
export function getOpenCount() {
  return getLSCount(keyOpenCount);
}

/**
 * @returns {number}
 */
export function incSaveCount() {
  return incLSCount(keySaveCount);
}

/**
 * @returns {number}
 */
export function incNoteCreateCount() {
  return incLSCount(keyNoteCreateCount);
}

let openCount = incLSCount(keyOpenCount);
console.log(
  "openCount:",
  openCount,
  "noteCreateCount:",
  getLSCount(keyNoteCreateCount),
  "saveCount",
  getLSCount(keySaveCount)
);

let editors = [];

export function rememberEditor(editor) {
  editors = []; // TODO: for now we only have one editor
  editors.push(editor);
  // TODO: this is for tests
  // @ts-ignore
  window.ednaCurrentEditor = editor;
}

export function findEditorByView(view) {
  for (let e of editors) {
    if (e.view === view) {
      return e;
    }
  }
  return null;
}
