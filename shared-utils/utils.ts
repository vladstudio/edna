
const utf8Encoder = new TextEncoder(); // perf: a single globar encoder

export function toUtf8(text: string): Uint8Array {
  return utf8Encoder.encode(text);
}

// Maybe(perf): if text.length > 1 MB, return text.length
// TODO(perf): don't allocate utf8Bytes, iterate over chars and count bytes
export function stringSizeInUtf8Bytes(text: string): number {
  let utf8Bytes = toUtf8(text)
  return utf8Bytes.length;
}

/**
 * @param {number} n
 * @returns {string}
 */
export function fmtSize(n : number) : string {
  const a : [number, string][] = [
    [1024 * 1024 * 1024 * 1024, "TB"],
    [1024 * 1024 * 1024, "GB"],
    [1024 * 1024, "MB"],
    [1024, "kB"],
  ];
  for (const el of a) {
    const size = el[0];
    if (n >= size) {
      let s = (n / size).toFixed(2);
      return s.replace(".00", "") + " " + el[1];
    }
  }
  return `${n} B`;
}
