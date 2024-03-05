import { getInitialContent, getHelp } from "../webapp/initial-content";

export const scratchNotePath = "note:scratch";
export const journalNotePath = "note:daily journal";
export const helpNotePath = "system:help";

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

export function fixUpNote(content) {
  // console.log("fixUpNote:", content)
  if (content === null) {
      // console.log("fixUpNote: null content")
      return "\n∞∞∞text-a\n";
  }
  if (!content.startsWith("\n∞∞∞")) {
      content = "\n∞∞∞text-a\n" + content;
      // console.log('fixUpNote: added block to content', content)
  }
  return content
}

export function splitNotePath(notePath) {
  const i = notePath.indexOf(":")
  return [notePath.substring(0, i), notePath.substring(i+1)]
}

export function getNoteName(notePath) {
  console.log("getNoteName:", notePath)
  const i = notePath.indexOf(":")
  return notePath.substring(i+1)
}

export function isSystemNote(notePath) {
  // console.log("isSystemNote:", notePath)
  return notePath.startsWith("system:")
}

export function getSystemNotes() {
  return ["system:help"]
}

export function getSystemNoteContent(notePath) {
  console.log("getSystemNoteContent:", notePath)
  if (notePath === "system:help") {
      return getHelp()
  }
  return "\n∞∞∞text-a\n" + "error: unknown system note:" + notePath + "\n"
}
