import {
  addNewBlockAfterCurrent,
  addNewBlockAfterLast,
  addNewBlockBeforeCurrent,
  addNewBlockBeforeFirst,
  gotoNextBlock,
  gotoNextParagraph,
  gotoPreviousBlock,
  gotoPreviousParagraph,
  insertNewBlockAtCursor,
  moveLineDown,
  moveLineUp,
  newCursorAbove,
  newCursorBelow,
  selectAll,
  selectNextBlock,
  selectNextParagraph,
  selectPreviousBlock,
  selectPreviousParagraph,
} from "./block/commands.js";
import { copyCommand, cutCommand, pasteCommand } from "./copy-paste.js";
import { formatBlockContent, runBlockContent } from "./block/format-code.js";
//import { EditorSelection, EditorState } from "@codemirror/state"
import { indentLess, indentMore } from "@codemirror/commands";

import { deleteLine } from "./block/delete-line.js";
import { keymap } from "@codemirror/view";

export function keymapFromSpec(specs) {
  return keymap.of(
    specs.map((spec) => {
      if (spec.run) {
        if ("preventDefault" in spec) {
          return spec;
        } else {
          return { ...spec, preventDefault: true };
        }
      } else {
        const [key, run] = spec;
        return {
          key,
          run,
          preventDefault: true,
        };
      }
    })
  );
}

/**
 * @param {import("./editor.js").EdnaEditor} editor
 */
export function heynoteKeymap(editor) {
  return keymapFromSpec([
    ["Mod-c", copyCommand(editor)],
    ["Mod-v", pasteCommand],
    ["Mod-x", cutCommand(editor)],
    ["Tab", indentMore],
    ["Shift-Tab", indentLess],
    ["Alt-n", () => editor.createNewScratchNote()],
    ["Alt-Shift-Enter", addNewBlockBeforeFirst],
    ["Mod-Shift-Enter", addNewBlockAfterLast],
    ["Alt-Enter", addNewBlockBeforeCurrent],
    ["Mod-Enter", addNewBlockAfterCurrent],
    ["Mod-Alt-Enter", insertNewBlockAtCursor],
    ["Mod-a", selectAll],
    ["Alt-ArrowUp", moveLineUp],
    ["Alt-ArrowDown", moveLineDown],
    ["Mod-l", () => editor.openLanguageSelector()],
    ["Alt-0", () => editor.openNoteSelector()],
    ["Mod-o", () => editor.openNoteSelector()],
    ["Mod-p", () => editor.openNoteSelector()],
    ["Alt-Shift-f", formatBlockContent],
    ["Alt-Shift-r", runBlockContent],
    ["Mod-Alt-ArrowDown", newCursorBelow],
    ["Mod-Alt-ArrowUp", newCursorAbove],
    ["Mod-Shift-k", deleteLine],
    {
      key: "Mod-ArrowUp",
      run: gotoPreviousBlock,
      shift: selectPreviousBlock,
    },
    { key: "Mod-ArrowDown", run: gotoNextBlock, shift: selectNextBlock },
    {
      key: "Ctrl-ArrowUp",
      run: gotoPreviousParagraph,
      shift: selectPreviousParagraph,
    },
    {
      key: "Ctrl-ArrowDown",
      run: gotoNextParagraph,
      shift: selectNextParagraph,
    },
  ]);
}
