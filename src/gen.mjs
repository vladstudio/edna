import fs from "node:fs";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import path from "node:path";

console.log("Generting html-win.html and html-mac.html from note-help.md");

export function getModChar(platform) {
  return platform === "darwin" ? "⌘" : "Ctrl";
}
export function getAltChar(platform) {
  return platform === "darwin" ? "⌥" : "Alt";
}

// TODO: duplicated in key-helper.js
function getKeyHelp(platform) {
  const modChar = getModChar(platform);
  const altChar = getAltChar(platform);
  return [
    [`${modChar} + P`, "Open, create or delete a note"],
    [`${altChar} + N`, "Create a new scratch note"],
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
    [`${modChar} + A`, "Select all text in a note block"],
    [``, "Press again to select the whole buffer"],
    [`${modChar} + ${altChar} + Up/Down`, "Add additional cursor above/below"],
    [`${altChar} + Shift + F`, "Format block content"],
    [``, "Supports Go, JSON, JavaScript, HTML, CSS and Markdown"],
    [`${altChar} + Shift + R`, "Execute block code"],
    [``, "Supports Go"],
    [`${modChar} + F`, "Search / replace within a note"],
  ];
}

/**
 * @param {string} platform
 * @returns {string}
 */
export function keyHelpStr(platform) {
  const keyHelp = getKeyHelp(platform);
  const keyMaxLength = keyHelp
    .map(([key]) => key.length)
    .reduce((a, b) => Math.max(a, b));

  return keyHelp
    .map(([key, help]) => `${key.padEnd(keyMaxLength)}   ${help}`)
    .join("\n");
}

function fixUpShortcuts(s, platform) {
  let modChar = getModChar(platform);
  let altChar = getAltChar(platform);
  s = s.replace(/Alt/g, altChar);
  s = s.replace(/Mod/g, modChar);
  return s;
}

function removeMathBlock(s) {
  // remove text between "∞∞∞math" and "∞∞∞"
  // that part is not appropriate for HTML
  return s.replace(/(\n)(∞∞∞math[\s\S]*)(∞∞∞markdown)/gm, "$1$3");
}

function removeLineStartingWith(lines, s) {
  return lines.filter((line) => !line.startsWith(s));
}

function collapseMultipleEmptyLines(lines) {
  let newLines = [];
  let lastLineWasEmpty = false;
  for (let line of lines) {
    if (line === "") {
      if (!lastLineWasEmpty) {
        newLines.push(line);
        lastLineWasEmpty = true;
      }
    } else {
      newLines.push(line);
      lastLineWasEmpty = false;
    }
  }
  return newLines;
}

function getHelp(platform) {
  let path = "./src/note-help.md";
  let helpRaw = fs.readFileSync(path, "utf8");
  helpRaw = removeMathBlock(helpRaw);

  let lines = helpRaw.split("\n");
  lines = removeLineStartingWith(lines, "This is a help note");
  lines = removeLineStartingWith(lines, "To see help in HTML");
  lines = collapseMultipleEmptyLines(lines);
  helpRaw = lines.join("\n");

  let keyHelp = keyHelpStr(platform);
  keyHelp = "```\n" + keyHelp + "\n```";

  let help = fixUpShortcuts(helpRaw, platform);
  help = help.replace("{{keyHelp}}", keyHelp);
  // link Edna to website
  help = help.replace(/Edna/g, "[Edna](https://edna.arslexis.io)");

  return help;
}

function cleanMd(str) {
  return str
    .split("\n")
    .filter((line) => !line.startsWith("∞∞∞"))
    .join("\n");
}

let htmlStart = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline';" />
    <meta name="color-scheme" content="light dark">
    <title>About Heynote</title>
    <link rel="stylesheet" href="help.css">
  </head>
  <body>
    <div class="content">
  `;

let htmlEnd = `
    </div>
  </body>
</html>
`;

function addTargetBlank(md) {
  // Remember old renderer, if overridden, or proxy to default renderer
  var defaultRender =
    md.renderer.rules.link_open ||
    function (tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };

  md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    // If you are using linkify to automatically detect links, you might want to
    // check if it's an external link here. You can do so based on tokens[idx].href

    // Add target="_blank" to all links
    var aIndex = tokens[idx].attrIndex("target");
    if (aIndex < 0) {
      tokens[idx].attrPush(["target", "_blank"]); // add new attribute
    } else {
      tokens[idx].attrs[aIndex][1] = "_blank"; // replace existing attribute
    }

    // pass token to default renderer.
    return defaultRender(tokens, idx, options, env, self);
  };
}

function genHTMLFromMarkdown() {
  let md = markdownIt();
  md.use(markdownItAnchor, {
    // Here you can pass options to markdown-it-anchor
    // For example, setting the permalink option:
    permalink: markdownItAnchor.permalink.headerLink(),
  });

  md.use(addTargetBlank);

  {
    let mdText = cleanMd(getHelp("windows"));
    let htmlText = md.render(mdText);
    htmlText = htmlStart + htmlText + htmlEnd;
    let fpath = path.join("public", "help-win.html");
    fs.writeFileSync(fpath, htmlText);
    console.log("wrote", fpath);
  }
  {
    let mdText = cleanMd(getHelp("darwin"));
    let htmlText = md.render(mdText);
    htmlText = htmlStart + htmlText + htmlEnd;
    let fpath = path.join("public", "help-mac.html");
    fs.writeFileSync(fpath, htmlText);
    console.log("wrote", fpath);
  }
}

genHTMLFromMarkdown();
