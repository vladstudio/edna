import "./css/tailwind.css";
import "./css/application.sass";

import {
  createDefaultNotes,
  dbGetDirHandle,
  getLatestNoteNames,
  isSystemNoteName,
  kScratchNoteName,
  loadNoteNames,
  loadNotesMetadata,
  preLoadAllNotes,
  setStorageFS,
} from "./notes";
import { getSettings, loadInitialSettings } from "./settings";
import { isDev, len } from "./util";
import { logAppOpen, logEvent } from "./log";

import App from "./components/App.vue";
import AskFSPermissions from "./components/AskFSPermissions.vue";
import Toast from "vue-toastification/dist/index.mjs";
import { createApp } from "vue";
import { hasHandlePermission } from "./fileutil";
import { startLoadCurrencies } from "./currency";

/** @typedef {import("./settings").Settings} Settings */

startLoadCurrencies();

let app;

export async function boot() {
  console.log("booting");
  loadInitialSettings();

  let dh = await dbGetDirHandle();
  if (dh) {
    console.log("storing data in the file system");
    let ok = await hasHandlePermission(dh, true);
    if (!ok) {
      console.log("no permission to write files in directory", dh.name);
      setStorageFS(null);
      app = createApp(AskFSPermissions);
      app.mount("#app");
      return;
    }
  } else {
    console.log("storing data in localStorage");
  }

  let noteNames = await loadNoteNames();
  let createdNotes = await createDefaultNotes(noteNames);
  await loadNotesMetadata(); // pre-load

  let settings = getSettings();
  // console.log("settings:", settings);

  // pick the note to open at startup:
  // - #${name} from the url
  // - settings.currentNoteName if it exists
  // - fallback to scratch note
  let toOpenAtStartup = kScratchNoteName; // default if nothing else matches
  let hashName = window.location.hash.slice(1);
  hashName = decodeURIComponent(hashName);
  let settingsName = settings.currentNoteName;

  // re-do because could have created default notes
  if (len(createdNotes) > 0) {
    noteNames = await loadNoteNames();
  }

  /**
   * @param {string} name
   * @returns {boolean}
   */
  function isValidNote(name) {
    return noteNames.includes(name) || isSystemNoteName(name);
  }

  // need to do this twice to make sure hashName takes precedence over settings.currentNoteName
  if (isValidNote(settingsName)) {
    toOpenAtStartup = settingsName;
    console.log("will open note from settings.currentNoteName:", settingsName);
  }
  if (isValidNote(hashName)) {
    toOpenAtStartup = hashName;
    console.log("will open note from url #hash:", hashName);
  }

  // will open this note in Editor.vue on mounted()
  settings.currentNoteName = toOpenAtStartup;
  console.log("mounting App");
  if (app) {
    app.unmount();
  }
  app = createApp(App);
  app.use(Toast, {
    // transition: "Vue-Toastification__bounce",
    transition: "none",
    maxToasts: 20,
    newestOnTop: true,
  });
  app.mount("#app");
}

boot().then(() => {
  console.log("finished booting");
  preLoadAllNotes().then((n) => {
    console.log(`finished pre-loading ${n} notes`);
  });
});

if (isDev) {
  // @ts-ignore
  window.resetApp = function () {
    console.log("unmounting app");
    app.unmount();
    console.log("clearing localStorage");
    localStorage.clear();
    console.log("reloading");
    window.location.reload();
  };
}
