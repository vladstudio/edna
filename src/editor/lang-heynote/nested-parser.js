import { NoteContent, NoteLanguage } from "./parser.terms.js";

import { LANGUAGES } from "../languages.js";
import { parseMixed } from "@lezer/common";

const languageMapping = Object.fromEntries(
  LANGUAGES.map((l) => [l.token, l.parser])
);

export function configureNesting() {
  return parseMixed((node, input) => {
    let id = node.type.id;
    if (id == NoteContent) {
      let noteLang = node.node.parent.firstChild.getChildren(NoteLanguage)[0];
      let langName = input.read(noteLang?.from, noteLang?.to);
      //console.log("langName:", langName)
      if (langName in languageMapping && languageMapping[langName] !== null) {
        //console.log("found parser for language:", langName)
        return {
          parser: languageMapping[langName],
        };
      }
    }
    return null;
  });
}
