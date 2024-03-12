import { ref } from "vue";

/**
 * @typedef {Object} NoteInfo
 * @property {string} name
 * @property {string} path
 */

export let isDocDirty = ref(false);
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
