import { getInitialContent, getHelp } from "../webapp/initial-content";

export const scratchNotePath = "note:scratch";
export const journalNotePath = "note:daily journal";
export const inboxNotePath = "note:inbox";
export const helpNotePath = "system:help";

export const blockHdrPlainTex = "\n∞∞∞text-a\n"
export const blockHdrMarkdown = "\n∞∞∞markdown\n"

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

const journalInitial = `# Daily Journal

The daily journal is where you can record what you did every day or write your daily thoughts and ideas.

The format is up to you but we suggest to use a block for each day.

Put the date in format YYYY-MM-DD DayOfWeek at the beginning of the block.

To make it easy, when you open daily journal, we auto-create a block for the current day (if it doesn't exist).

If you don't care about daily journal, \`Ctrl + O\` and delete it.

You can re-create it in the future as long as you name it 'daily journal'.
`

const inboxInitial = `# Inbox

Inbox is for storing links to web pages you want to read later, videos you want to watch later etc.

Then you can process them later and clear up inbox.

If you don't care about inbox, \`Ctrl + O\` and delete it.

You can re-create it in the future.
`
export function createDefaultNotes() {
  function createNote(notePath, content) {
      if (localStorage.getItem(notePath) === null) {
          localStorage.setItem(notePath, content)
      }
  }
  const { initialContent, initialDevContent } = getInitialContent()
  const s = isDev ? initialDevContent : initialContent;
  createNote(scratchNotePath, s)
  createNote(journalNotePath, blockHdrMarkdown + journalInitial)
  createNote(inboxNotePath, blockHdrMarkdown + inboxInitial)
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

// in case somehow a note doesn't start with the block header, fix it up
export function fixUpNote(content) {
  // console.log("fixUpNote:", content)
  if (content === null) {
      // console.log("fixUpNote: null content")
      return blockHdrPlainTex;
  }
  if (!content.startsWith("\n∞∞∞")) {
      content = blockHdrPlainTex + content;
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
  return blockHdrPlainTex + "error: unknown system note:" + notePath + "\n"
}
