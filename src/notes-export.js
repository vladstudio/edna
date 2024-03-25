import {
  kMetadataName,
  loadNote,
  loadNoteNames,
  loadNotesMetadata,
  notePathFromNameFS,
} from "./notes";
import { kSettingsPath, loadSettings } from "./settings";

import { formatDateYYYYMMDD } from "./util";
import { lazyLoadZipJs } from "./lazyimport";

/**
 * @param {any} zipWriter
 * @param {string} fileName
 * @param {string} text
 */
async function addTextFile(zipWriter, fileName, text) {
  let zip = await lazyLoadZipJs();
  let fileBlob = new Blob([text], { type: "text/plain" });
  let blobReader = new zip.BlobReader(fileBlob);
  let opts = {
    level: 9,
  };
  await zipWriter.add(fileName, blobReader, opts);
}

export async function exportNotesToZip() {
  console.log("exportNotesToZip");
  let zip = await lazyLoadZipJs();
  let blobWriter = new zip.BlobWriter("application/zip");
  let zipWriter = new zip.ZipWriter(blobWriter);
  let noteNames = await loadNoteNames();
  for (let name of noteNames) {
    let s = await loadNote(name);
    let fileName = notePathFromNameFS(name);
    await addTextFile(zipWriter, fileName, s);
  }
  {
    let meta = await loadNotesMetadata();
    let s = JSON.stringify(meta, null, 2);
    await addTextFile(zipWriter, kMetadataName, s);
  }
  {
    // note: note sure if I should export this
    let settings = await loadSettings();
    let s = JSON.stringify(settings, null, 2);
    await addTextFile(zipWriter, kSettingsPath, s);
  }
  let blob = await zipWriter.close();
  let name = "edna.notes.export-" + formatDateYYYYMMDD() + ".zip";
  browserDownloadBlob(blob, name);
}

/**
 * @param {Blob} blob
 * @param {string} name
 */
function browserDownloadBlob(blob, name) {
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
