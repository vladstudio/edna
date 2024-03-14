import { defaultFontFamily, defaultFontSize } from "../../settings";

import { EditorView } from "@codemirror/view";

export function getFontTheme(fontFamily, fontSize) {
  fontSize = fontSize || defaultFontSize;
  return EditorView.theme({
    ".cm-scroller": {
      fontFamily: fontFamily || defaultFontFamily,
      fontSize: fontSize + "px",
    },
  });
}
