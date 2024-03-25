import { loadNote, loadNoteNames, notePathFromNameFS } from "./notes";

import { formatDateYYYYMMDD } from "./util";
import { lazyLoadZipJs } from "./lazyimport";

export async function exportNotesToZip() {
  console.log("exportNotesToZip");
  let zip = await lazyLoadZipJs();
  // let opts = { bufferedWrite: true, useCompressionStream: true };
  let blobWriter = new zip.BlobWriter("application/zip");
  let zipWriter = new zip.ZipWriter(blobWriter);
  let opts = {
    level: 9,
  };
  let noteNames = await loadNoteNames();
  for (let name of noteNames) {
    let d = await loadNote(name);
    let fileBlob = new Blob([d], { type: "text/plain" });
    let blobReader = new zip.BlobReader(fileBlob);
    let fileName = notePathFromNameFS(name);
    await zipWriter.add(fileName, blobReader, opts);
  }
  let d = await zipWriter.close();
  console.log("d:", d);
  let name = "edna.notes.export-" + formatDateYYYYMMDD() + ".zip";
  browserDownloadBlob(d, name);
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
