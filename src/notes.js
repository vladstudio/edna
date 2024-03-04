import { getInitialContent } from "../webapp/initial-content";

export const scratchNotePath = "note:scratch";
export const journalNotePath = "note:daily journal";

export const isDev = location.host.startsWith("localhost")

// migrate "buffer" => "note:scratch"
export function migrateDefaultNote() {
  const d = localStorage.getItem("buffer")
  if (d !== null) {
      localStorage.setItem(scratchNotePath, d)
      localStorage.removeItem("buffer")
      console.log("migrated default note from buffer to note:scratch")
  }
}

export function createDefaultNotes() {
  function createNote(notePath, content) {
      if (localStorage.getItem(notePath) === null) {
          localStorage.setItem(notePath, content)
      }
  }
  const { initialContent, initialDevContent } = getInitialContent()
  const s = isDev ? initialDevContent : initialContent;
  createNote(scratchNotePath, s)
  createNote(journalNotePath, "")
}

export function loadNotePaths() {
  const res = [];
  let nKeys = localStorage.length
  for (let i = 0; i < nKeys; i++) {
      const key = localStorage.key(i)
      if (key.startsWith("note:")) {
          res.push(key)
      }
  }
  return res;
}
