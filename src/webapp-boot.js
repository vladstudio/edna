import "./css/tailwind.css";
import "./css/application.sass";

import {
  createDefaultNotes,
  dbGetDirHandle,
  loadNoteInfos,
  loadNotesMetadata,
  setStorageFS,
} from "./notes";
import { getSettings, loadInitialSettings } from "./settings";

import App from "./components/App.vue";
import AskFSPermissions from "./components/AskFSPermissions.vue";
import { createApp } from "vue";
import { hasHandlePermission } from "./fileutil";
import { loadCurrencies } from "./currency";

/** @typedef {import("./settings").Settings} Settings */

loadCurrencies();
setInterval(loadCurrencies, 1000 * 3600 * 4);

let app;

export async function boot() {
  console.log("booting");
  loadInitialSettings();

  let dh = await dbGetDirHandle();
  if (dh) {
    console.log("we're storing data in the file system");
    let ok = await hasHandlePermission(dh, true);
    if (!ok) {
      console.log("no permission to write files in directory", dh.name);
      app = createApp(AskFSPermissions);
      app.mount("#app");
      return;
    }
    setStorageFS(dh);
  } else {
    console.log("we're storing data in localStorage");
  }

  let noteInfos = await loadNoteInfos();
  createDefaultNotes(noteInfos);
  await loadNotesMetadata(); // pre-load

  let settings = getSettings();
  // console.log("settings:", settings);
  // make sure currentNoteName points to a valid note
  let name = settings.currentNoteName;
  noteInfos = await loadNoteInfos(); // re-do because could have created default notes
  let found = false;
  for (let ni of noteInfos) {
    if (ni.name === name) {
      console.log("currentNoteName:", name);
      found = true;
      break;
    }
  }
  if (!found) {
    settings.currentNoteName = "scratch";
    console.log(`didn't find currentNoteName '${name}' so set to 'scratch'`);
  }
  console.log("mounting App");
  if (app) {
    app.unmount();
  }
  app = createApp(App);
  app.mount("#app");
}

boot().then(() => {
  console.log("finished booting");
});
