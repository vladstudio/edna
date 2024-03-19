import { getAltChar, getModChar, platformName } from "./utils.js";

import dailyJournalRaw from "./note-daily-journal.md?raw";
import helpRaw from "./note-help.md?raw";
import inboxRaw from "./note-inbox.md?raw";
import initialDevRaw from "./note-initial-dev.md?raw";
import initialRaw from "./note-initial.md?raw";
import { keyHelpStr } from "./key-helper.js";

function fixUpShortcuts(s, platform = platformName) {
  let modChar = getModChar(platform);
  let altChar = getAltChar(platform);
  s = s.replace(/Alt/g, altChar);
  s = s.replace(/Mod/g, modChar);
  return s;
}

export function getHelp(platform = platformName, forHTML = false) {
  let keyHelp = keyHelpStr(platform);
  if (forHTML) {
    keyHelp = "```\n" + keyHelp + "\n```";
  }

  let help = fixUpShortcuts(helpRaw, platform);
  help = help.replace("{{keyHelp}}", keyHelp);
  if (forHTML) {
    // link Edna to website
    help = help.replace(/Edna/g, "[Edna](https://edna.arslexis.io)");
  }
  return help;
}

export function getInitialContent(platform = platformName) {
  let keyHelp = keyHelpStr(platform);
  let initial = fixUpShortcuts(initialRaw);
  initial = initial.replace("{{keyHelp}}", keyHelp);

  let initialDev = fixUpShortcuts(initialDevRaw);
  const initialDevContent = initial + initialDev;
  let initialJournal = fixUpShortcuts(dailyJournalRaw);
  let initialInbox = fixUpShortcuts(inboxRaw);

  return {
    initialContent: initial,
    initialDevContent,
    initialJournal,
    initialInbox,
  };
}
