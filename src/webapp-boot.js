import "./css/tailwind.css";
import "./css/application.sass";

import {
  createDefaultNotes,
  dbGetDirHandle,
  loadNoteInfos,
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

export async function boot() {
  console.log("booting");
  let dh = await dbGetDirHandle();
  if (dh) {
    console.log("we're storing data in the file system");
    let ok = await hasHandlePermission(dh, true);
    if (!ok) {
      console.log("no permission to write files in directory", dh.name);
      const app = createApp(AskFSPermissions);
      app.mount("#app");
      return;
    }
    setStorageFS(dh);
  } else {
    console.log("we're storing data in localStorage");
  }

  loadInitialSettings();

  let noteInfos = await loadNoteInfos();
  createDefaultNotes(noteInfos);

  let settings = getSettings();
  // console.log("settings:", settings);
  // make sure currentNoteName points to a valid note
  let name = settings.currentNoteName;
  noteInfos = await loadNoteInfos(); // re-do because could have created default notes
  for (let ni of noteInfos) {
    if (ni.name === name) {
      console.log("currentNoteName:", name);
      break;
    }
  }
  // initialSettings.currentNoteName = "scratch";
  console.log(`didn't find currentNoteName '${name}' so set to 'scratch'`);
  console.log("mounting App");
  const app = createApp(App);
  app.mount("#app");
}

boot().then(() => {
  console.log("finished booting");
});
