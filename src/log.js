import { getSessionDurationInMs, getStats } from "./state";
import { len, throwIf } from "./util";

import { getLatestNoteNames } from "./notes";

/**
 * @param {Object} o
 */
export function logEvent(o) {
  fetch("/event", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(o),
  })
    .then((response) => {
      if (!response.ok) {
        console.error("failed to log event:", response.statusText);
      } else {
        console.log("event logged:", o);
      }
    })
    .catch((err) => {
      console.error("failed to log event:", err);
    });
}

export function logAppOpen() {
  let e = {
    name: "appOpen",
    notesCount: len(getLatestNoteNames()),
    stats: getStats(),
  };
  logEvent(e);
}

export function logAppExit() {
  let e = {
    name: "appExit",
    notesCount: len(getLatestNoteNames()),
    sessionDurMs: getSessionDurationInMs(),
    stats: getStats(),
  };
  logEvent(e);
}

const validOps = [
  "noteCreate",
  "noteDelete",
  "noteRename",
  "noteFormatBlock",
  "noteRunBlock",
];
function validateNoteOp(op) {
  throwIf(!validOps.includes(op), `invalid op: ${op}`);
}
export function logNoteOp(op) {
  validateNoteOp(op);
  let e = {
    name: op,
  };
  logEvent(e);
}
