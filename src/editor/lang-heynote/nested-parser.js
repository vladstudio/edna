import { NoteContent, NoteLanguage } from "./parser.terms.js";

import { langGetParser } from "../languages.js";
import { parseMixed } from "@lezer/common";

export function configureNesting() {
  // TODO: would have to by async to implement on-demand loading of parsers
  return parseMixed((node, input) => {
    let id = node.type.id;
    if (id == NoteContent) {
      let noteLang = node.node.parent.firstChild.getChildren(NoteLanguage)[0];
      let langName = input.read(noteLang?.from, noteLang?.to);
      // console.log("langName:", langName);
      let res = langGetParser(langName);
      if (res) {
        // console.log("found parser for language:", langName, "res:", res);
        return {
          parser: res,
        };
      }
    }
    return null;
  });
}
