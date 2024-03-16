import { kDefaultFontFamily, kDefaultFontSize } from "../../settings";

import { EditorView } from "@codemirror/view";

export function getFontTheme(fontFamily, fontSize) {
  fontSize = fontSize || kDefaultFontSize;
  return EditorView.theme({
    ".cm-scroller": {
      fontFamily: fontFamily || kDefaultFontFamily,
      fontSize: fontSize + "px",
    },
  });
}
