import { EditorView } from "@codemirror/view";

export function getFontTheme(fontFamily, fontSize) {
  fontSize = fontSize || window.edna.defaultFontSize;
  return EditorView.theme({
    ".cm-scroller": {
      fontFamily: fontFamily || window.edna.defaultFontFamily,
      fontSize: fontSize + "px",
    },
  });
}
