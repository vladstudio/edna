import fs from "node:fs";
import { getHelp } from "./initial-content.js";
import markdownIt from "markdown-it";
import path from "node:path";

console.log("This is gen script");

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
function genHTMLFromMarkdown() {
  let md = markdownIt();
  {
    let mdText = cleanMd(getHelp("windows", true));
    let htmlText = md.render(mdText);
    htmlText = htmlStart + htmlText + htmlEnd;
    let fpath = path.join("public", "help-win.html");
    fs.writeFileSync(fpath, htmlText);
    console.log("wrote", fpath);
  }
  {
    let mdText = cleanMd(getHelp("darwin", true));
    let htmlText = md.render(mdText);
    htmlText = htmlStart + htmlText + htmlEnd;
    let fpath = path.join("public", "help-mac.html");
    fs.writeFileSync(fpath, htmlText);
    console.log("wrote", fpath);
  }
}

genHTMLFromMarkdown();
