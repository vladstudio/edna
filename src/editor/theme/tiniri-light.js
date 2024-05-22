import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

const lightTheme = EditorView.theme({
  "&": {
    color: "#333231",
    backgroundColor: "#FCFBFA",
  },
  ".cm-content": {
    caretColor: "#AD514CCC",
  },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#AD514CCC" },
  ".cm-panels .cm-button": {
    background: "#538A8A",
    color: "#fff",
  },
  ".cm-panels .cm-button:focus": {
    background: "#538A8ACC",
  },
  ".cm-panels .cm-button:hover": {
    background: "#538A8ACC",
  },
  ".cm-panels .cm-textfield:focus": {
    border: "1px solid #33323166",
    outline: "2px solid #356B9433",
  },
  ".cm-panel.cm-search [name=close]": {
    color: "rgba(0,0,0, 0.8)",
  },
  ".cm-gutters": {
    backgroundColor: "#FCFBFA",
    color: "#33323155",
    border: "none",
    fontSize: "0.88em",
    borderRight: "1px solid #80797420",
  },
  ".cm-foldGutter .cm-gutterElement": {
    color: "#807974",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "rgba(0,0,0, 0.6)",
  },
  ".cm-activeLine": {
    backgroundColor: "#0000",
  },
  ".cm-selectionBackground": {
    background: "#538A8A22",
  },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
    background: "#538A8A24",
  },
  ".cm-activeLine.heynote-empty-block-selected": {
    "background-color": "#538A8A24",
  },
  ".cm-searchMatch": {
    backgroundColor: "transparent",
    outline: `2px solid #538A8A33`,
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "#538A8A33",
  },
  ".cm-selectionMatch": {
    backgroundColor: "#E5979333",
  },
  "&.cm-focused .cm-matchingBracket": {
    backgroundColor: "#E5979355",
    color: "inherit",
  },

  ".heynote-blocks-layer .block-even": {
    background: "#FCFBFA",
    borderTop: "1px solid #80797420",
  },
  ".heynote-blocks-layer .block-odd": {
    background: "#FAF9F7",
    borderTop: "1px solid #80797420",
  },
});

const highlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#AD514C" },
  {
    tag: [
      tags.name,
      tags.deleted,
      tags.character,
      tags.propertyName,
      tags.macroName,
    ],
    color: "#333231",
  },
  { tag: [tags.variableName], color: "#AD514C" },
  { tag: [tags.function(tags.variableName)], color: "#AD514C" },
  { tag: [tags.labelName], color: "#AD514C" },
  {
    tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)],
    color: "#333231",
  },
  { tag: [tags.definition(tags.name), tags.separator], color: "#zzz" },
  { tag: [tags.brace], color: "#80797488" },
  {
    tag: [tags.annotation],
    color: "#AD514C",
  },
  {
    tag: [
      tags.number,
      tags.changed,
      tags.annotation,
      tags.modifier,
      tags.self,
      tags.namespace,
    ],
    color: "#333231",
  },
  {
    tag: [tags.typeName, tags.className],
    color: "#333231",
  },
  {
    tag: [tags.operator, tags.operatorKeyword],
    color: "#807974",
  },
  {
    tag: [tags.tagName],
    color: "#807974",
  },
  {
    tag: [tags.squareBracket],
    color: "#807974",
  },
  {
    tag: [tags.angleBracket],
    color: "#807974",
  },
  {
    tag: [tags.attributeName],
    color: "#356B94",
  },
  {
    tag: [tags.regexp],
    color: "#333231",
  },
  {
    tag: [tags.quote],
    color: "#807974",
  },
  { tag: [tags.string], color: "#333231" },
  {
    tag: tags.link,
    color: "#AD514C",
    textDecoration: "underline",
    textUnderlinePosition: "under",
  },
  {
    tag: [tags.url, tags.escape, tags.special(tags.string)],
    color: "#AD514C",
  },
  { tag: [tags.meta], color: "#807974" },
  { tag: [tags.monospace], color: "#333231" },
  { tag: [tags.comment], color: "#80797499" },
  { tag: tags.strong, fontWeight: "bold", color: "#333231" },
  { tag: tags.emphasis, color: "#333231" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
  { tag: tags.heading, fontWeight: "bold", color: "#333231" },
  { tag: tags.special(tags.heading1), fontWeight: "bold", color: "#333231" },
  { tag: tags.heading1, fontWeight: "bold", color: "#zzz" },
  {
    tag: [tags.heading2, tags.heading3, tags.heading4],
    fontWeight: "bold",
    color: "#333231",
  },
  {
    tag: [tags.heading5, tags.heading6],
    color: "#807974",
  },
  {
    tag: [tags.atom, tags.bool, tags.special(tags.variableName)],
    color: "#AD514C",
  },
  {
    tag: [tags.processingInstruction, tags.inserted],
    color: "#AD514C",
  },
  {
    tag: [tags.contentSeparator],
    color: "#80797499",
  },
  { tag: tags.invalid, color: "#AD514C", borderBottom: `1px dotted #AD514C` },
]);

const heynoteLight = [lightTheme, syntaxHighlighting(highlightStyle)];

export { heynoteLight };
