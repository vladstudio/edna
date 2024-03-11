import { ref } from "vue";

export let isDocDirty = ref(false);

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

export function getOpenCount() {
  return getLSCount(keyOpenCount);
}

export function incSaveCount() {
  return incLSCount(keySaveCount);
}

export function incNoteCreateCount() {
  return incLSCount(keyNoteCreateCount);
}

let openCount = incLSCount();
console.log(
  "openCount:",
  openCount,
  "noteCreateCount:",
  getLSCount(keyNoteCreateCount),
  "saveCount",
  getLSCount(keySaveCount)
);
