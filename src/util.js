export const isDev = location.host.startsWith("localhost");

export function len(o) {
  return o ? o.length : 0;
}

/**
 * @param {boolean} cond
 * @param {string} [msg]
 */
export function throwIf(cond, msg) {
  if (cond) {
    throw new Error(msg || "invalid condition");
  }
}

export function objectEqualDeep(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function cloneObjectShallow(o) {
  // could also be return { ...o };
  return Object.assign({}, o);
}

export function cloneObjectDeep(o) {
  return JSON.parse(JSON.stringify(o));
}

export let platform = {
  // default to windows
  isMac: false,
  isWindows: true,
  isLinux: false,
};

/** @type {string} */
export let platformName;

let uadPlat, navPlat;
let nav = typeof window !== "undefined" ? window.navigator : null;
if (nav) {
  // @ts-ignore
  uadPlat = nav.userAgentData?.platform;
  navPlat = nav.platform;
}
// in Deno there is window.navigator but no window.navigator.platform so we default to "Win"
// it doesn't matter, it's only so we can run gen.js script in deno because node refuses to run it
const uaPlatform = uadPlat || navPlat || "Win";
if (uaPlatform.indexOf("Win") !== -1) {
  platformName = "windows";
} else if (uaPlatform.indexOf("Linux") !== -1) {
  platform = {
    isMac: false,
    isWindows: false,
    isLinux: true,
  };
  platformName = "linux";
} else {
  platform = {
    isMac: true,
    isWindows: false,
    isLinux: false,
  };
  platformName = "darwin";
}

export function getModChar(platform = platformName) {
  return platform === "darwin" ? "⌘" : "Ctrl";
}
export function getAltChar(platform = platformName) {
  return platform === "darwin" ? "⌥" : "Alt";
}

const utf8Encoder = new TextEncoder(); // perf: a single globar encoder

export function toUtf8(text) {
  return utf8Encoder.encode(text);
}

// Maybe(perf): if text.length > 1 MB, return text.length
// TODO(perf): don't allocate utf8Bytes, iterate over chars and count bytes
export function stringSizeInUtf8Bytes(text) {
  let utf8Bytes = toUtf8(text);
  return utf8Bytes.length;
}

/**
 * @param {number} n
 * @returns {string}
 */
export function fmtSize(n) {
  // @type {[][number, string]}
  const a = [
    [1024 * 1024 * 1024 * 1024, "TB"],
    [1024 * 1024 * 1024, "GB"],
    [1024 * 1024, "MB"],
    [1024, "kB"],
  ];
  for (const el of a) {
    const size = Number(el[0]); // cast just to appease TS
    if (n >= size) {
      let s = (n / size).toFixed(2);
      return s.replace(".00", "") + " " + el[1];
    }
  }
  return `${n} B`;
}

/**
 * returns a function that, when called, returns number of elapsed milliseconds
 * @returns {function(): number}
 */
export function startTimer() {
  const timeStart = performance.now();
  return function () {
    return Math.round(performance.now() - timeStart);
  };
}

/**
 * @param {Date} date
 * @returns {string}
 */
export function formatDateYYYYMMDD(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * @param {Date} date
 * @returns {string}
 */
export function formatDateYYYYMMDDDay(date = new Date()) {
  let year = date.getFullYear();
  let month = ("0" + (date.getMonth() + 1)).slice(-2); // Months are zero based
  let day = ("0" + date.getDate()).slice(-2);
  let dayOfWeek = date.getDay();
  let dayName = daysOfWeek[dayOfWeek];
  let formattedDate = `${year}-${month}-${day} ${dayName}`;
  return formattedDate;
}

/**
 * "foo.TxT" => ".txt"
 * @param {string} fileName
 * @returns {string}
 */
export function fileExt(fileName) {
  const idx = fileName.lastIndexOf(".");
  if (idx === -1) {
    return "";
  }
  const ext = fileName.substring(idx);
  return ext.toLowerCase();
}

/**
 * Alt +
 * @param {KeyboardEvent} e
 * @returns {string|null} - returns "0" - "9" or null
 */
export function isAltNumEvent(e) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || !e.altKey) {
    return null;
  }
  // on Mac we can't use e.key because it ends up some composed character
  // we can use e.code whch is "Digit0" => "Digit9"
  // or e.keyCode (48-57) or e.which (48-57)
  if (e.keyCode < 48 || e.keyCode > 57) {
    return null;
  }
  return String.fromCharCode(e.keyCode);
}

/**
 * @param {string} hash
 */
export function setURLHashNoReload(hash) {
  // @ts-ignore
  let url = new URL(window.location);
  url.hash = hash;
  // update browser's URL without reloading the page
  window.history.pushState({}, "", url);
}

let sleepSetTimeout_ctrl;

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  clearInterval(sleepSetTimeout_ctrl);
  return new Promise(
    (resolve) => (sleepSetTimeout_ctrl = setTimeout(resolve, ms))
  );
}
