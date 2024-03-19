// history of opened files

const kMaxHistory = 10;

/** @type {string[]} */
let openedHistory = [];

export function historyPush(name) {
  let i = openedHistory.indexOf(name);
  if (i >= 0) {
    openedHistory.splice(i, 1);
  }
  openedHistory.unshift(name);
  if (openedHistory.length > kMaxHistory) {
    openedHistory.pop();
  }
}

export function getHistory() {
  return openedHistory;
}

/**
 * @param {string} oldName
 * @param {string} newName
 */
export function renameInHistory(oldName, newName) {
  let i = openedHistory.indexOf(oldName);
  if (i >= 0) {
    openedHistory[i] = newName;
  }
}
