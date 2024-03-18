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
