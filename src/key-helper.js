import { getAltChar, getModChar, platformName } from "./utils.js";

function getKeyHelp(platform = platformName) {
  const modChar = getModChar(platform);
  const altChar = getAltChar(platform);
  return [
    [`${modChar} + O`, "Open, create or delete a note"],
    [`${modChar} + Enter`, "Add new block below the current block"],
    [`${altChar} + Enter`, "Add new block before the current block"],
    [`${modChar} + Shift + Enter`, "Add new block at the end of the buffer"],
    [`${altChar} + Shift + Enter`, "Add new block at the start of the buffer"],
    [
      `${modChar} + ${altChar} + Enter`,
      "Split the current block at cursor position",
    ],
    [`${modChar} + L`, "Change block language"],
    [`${modChar} + Down`, "Goto next block"],
    [`${modChar} + Up`, "Goto previous block"],
    [
      `${modChar} + A`,
      "Select all text in a note block. Press again to select the whole buffer",
    ],
    [`${modChar} + ${altChar} + Up/Down`, "Add additional cursor above/below"],
    [
      `${altChar} + Shift + F`,
      "Format block content (works for Go, JSON, JavaScript, HTML, CSS and Markdown)",
    ],
    [`${altChar} + Shift + R`, "Execute block code (works for Go)"],
    [`${modChar} + F`, "Search / replace within a note"],
  ];
}

export function keyHelpStr(platform = platformName) {
  const keyHelp = getKeyHelp(platform);
  const keyMaxLength = keyHelp
    .map(([key]) => key.length)
    .reduce((a, b) => Math.max(a, b));

  return keyHelp
    .map(([key, help]) => `${key.padEnd(keyMaxLength)}   ${help}`)
    .join("\n");
}
