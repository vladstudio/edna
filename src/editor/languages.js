import {
  javascriptLanguage,
  jsxLanguage,
  tsxLanguage,
  typescriptLanguage,
} from "@codemirror/lang-javascript";
import {
  lazyLoadBabelPrettierPlugin,
  lazyLoadCssPrettierPlugin,
  lazyLoadHtmlPrettierPlugin,
  lazyLoadMarkdownPrettierPlugin,
  lazyLoadPrettierPluginEstree,
  lazyLoadTypescriptPlugin,
  lazyLoadYamlPrettierPlugin,
} from "../lazyimport";

import { StandardSQL } from "@codemirror/lang-sql";
import { StreamLanguage } from "@codemirror/language";
import { clojure } from "@codemirror/legacy-modes/mode/clojure";
import { cppLanguage } from "@codemirror/lang-cpp";
import { csharpLanguage } from "@replit/codemirror-lang-csharp";
import { cssLanguage } from "@codemirror/lang-css";
import { diff } from "@codemirror/legacy-modes/mode/diff";
import { erlang } from "@codemirror/legacy-modes/mode/erlang";
import { go } from "@codemirror/legacy-modes/mode/go";
import { groovy } from "@codemirror/legacy-modes/mode/groovy";
import { htmlLanguage } from "@codemirror/lang-html";
import { javaLanguage } from "@codemirror/lang-java";
import { jsonLanguage } from "@codemirror/lang-json";
import { kotlin } from "@codemirror/legacy-modes/mode/clike";
import { lezerLanguage } from "@codemirror/lang-lezer";
import { markdownLanguage } from "@codemirror/lang-markdown";
import { phpLanguage } from "@codemirror/lang-php";
import { powerShell } from "@codemirror/legacy-modes/mode/powershell";
import { pythonLanguage } from "@codemirror/lang-python";
import { ruby } from "@codemirror/legacy-modes/mode/ruby";
import { rustLanguage } from "@codemirror/lang-rust";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { svelteLanguage } from "@replit/codemirror-lang-svelte";
import { swift } from "@codemirror/legacy-modes/mode/swift";
import { toml } from "@codemirror/legacy-modes/mode/toml";
import { vueLanguage } from "@codemirror/lang-vue";
import { xmlLanguage } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/legacy-modes/mode/yaml";

class Language {
  constructor({ token, name, guesslang }) {
    this.token = token;
    this.name = name;
    this.guesslang = guesslang;
  }
}

/** @type {Language[]} */
export const LANGUAGES = [
  new Language({
    token: "text",
    name: "Plain Text",
    guesslang: null,
  }),
  new Language({
    token: "math",
    name: "Math",
    guesslang: null,
  }),
  new Language({
    token: "json",
    name: "JSON",
    guesslang: "json",
  }),
  new Language({
    token: "python",
    name: "Python",
    guesslang: "py",
  }),
  new Language({
    token: "html",
    name: "HTML",
    guesslang: "html",
  }),
  new Language({
    token: "sql",
    name: "SQL",
    guesslang: "sql",
  }),
  new Language({
    token: "markdown",
    name: "Markdown",
    guesslang: "md",
  }),
  new Language({
    token: "java",
    name: "Java",
    guesslang: "java",
  }),
  new Language({
    token: "lezer",
    name: "Lezer",
    guesslang: null,
  }),
  new Language({
    token: "php",
    name: "PHP",
    guesslang: "php",
  }),
  new Language({
    token: "css",
    name: "CSS",
    guesslang: "css",
  }),
  new Language({
    token: "xml",
    name: "XML",
    guesslang: "xml",
  }),
  new Language({
    token: "vue",
    name: "Vue",
    guesslang: null,
  }),
  new Language({
    token: "cpp",
    name: "C++",
    guesslang: "cpp",
  }),
  new Language({
    token: "rust",
    name: "Rust",
    guesslang: "rs",
  }),
  new Language({
    token: "csharp",
    name: "C#",
    guesslang: "cs",
  }),
  new Language({
    token: "svelte",
    name: "Svelte",
    guesslang: null,
  }),
  new Language({
    token: "ruby",
    name: "Ruby",
    guesslang: "rb",
  }),
  new Language({
    token: "shell",
    name: "Shell",
    guesslang: "sh",
  }),
  new Language({
    token: "yaml",
    name: "YAML",
    guesslang: "yaml",
  }),
  new Language({
    token: "toml",
    name: "TOML",
    guesslang: "toml",
  }),
  new Language({
    token: "golang",
    name: "Go",
    guesslang: "go",
  }),
  new Language({
    token: "clojure",
    name: "Clojure",
    guesslang: "clj",
  }),
  new Language({
    token: "erlang",
    name: "Erlang",
    guesslang: "erl",
  }),
  new Language({
    token: "javascript",
    name: "JavaScript",
    guesslang: "js",
  }),
  new Language({
    token: "jsx",
    name: "JSX",
    guesslang: null,
  }),
  new Language({
    token: "typescript",
    name: "TypeScript",
    guesslang: "ts",
  }),
  new Language({
    token: "tsx",
    name: "TSX",
    guesslang: null,
  }),
  new Language({
    token: "swift",
    name: "Swift",
    guesslang: "swift",
  }),
  new Language({
    token: "kotlin",
    name: "Kotlin",
    guesslang: "kt",
  }),
  new Language({
    token: "groovy",
    name: "Groovy",
    guesslang: "groovy",
  }),
  new Language({
    token: "diff",
    name: "Diff",
    guesslang: null,
  }),
  new Language({
    token: "powershell",
    name: "PowerShell",
    guesslang: "ps1",
  }),
];

const languageMapping = Object.fromEntries(LANGUAGES.map((l) => [l.token, l]));

export function getLanguage(token) {
  return languageMapping[token];
}

/**
 * @param {Language} lang
 * @returns {boolean}
 */
export function langSupportsRun(lang) {
  if (!lang) {
    return false;
  }
  if (lang.token === "golang") {
    return true;
  }
  return false;
}

// TODO: should be async to support on-demand loading of parsers
// TODO: StreamLanguage.define() should only happen once
/**
 * @param {Language} lang
 * @returns
 */
export function langGetParser(lang) {
  let token = lang.token;
  if (token === "json") {
    return jsonLanguage.parser;
  }
  if (token === "python") {
    return pythonLanguage.parser;
  }
  if (token === "html") {
    return htmlLanguage.parser;
  }
  if (token === "markdown") {
    return markdownLanguage.parser;
  }
  if (token == "sql") {
    return StandardSQL.language.parser;
  }
  if (token === "java") {
    return javaLanguage.parser;
  }
  if (token === "lezer") {
    return lezerLanguage.parser;
  }
  if (token === "php") {
    return phpLanguage.parser;
  }
  if (token === "css") {
    return cssLanguage.parser;
  }
  if (token === "xml") {
    return xmlLanguage.parser;
  }
  if (token === "vue") {
    return vueLanguage.parser;
  }
  if (token === "cpp") {
    return cppLanguage.parser;
  }
  if (token === "rust") {
    return rustLanguage.parser;
  }
  if (token === "csharp") {
    return csharpLanguage.parser;
  }
  if (token === "svelte") {
    return svelteLanguage.parser;
  }
  if (token === "ruby") {
    return StreamLanguage.define(ruby).parser;
  }
  if (token === "shell") {
    return StreamLanguage.define(shell).parser;
  }
  if (token === "yaml") {
    return StreamLanguage.define(yaml).parser;
  }
  if (token === "toml") {
    return StreamLanguage.define(toml).parser;
  }
  if (token === "golang") {
    return StreamLanguage.define(go).parser;
  }
  if (token === "clojure") {
    return StreamLanguage.define(clojure).parser;
  }
  if (token === "erlang") {
    return StreamLanguage.define(erlang).parser;
  }
  if (token === "javascript") {
    return javascriptLanguage.parser;
  }
  if (token === "jsx") {
    return jsxLanguage.parser;
  }
  if (token === "typescript") {
    return typescriptLanguage.parser;
  }
  if (token === "tsx") {
    return tsxLanguage.parser;
  }
  if (token === "swift") {
    return StreamLanguage.define(swift).parser;
  }
  if (token === "kotlin") {
    return StreamLanguage.define(kotlin).parser;
  }
  if (token === "groovy") {
    return StreamLanguage.define(groovy).parser;
  }
  if (token === "diff") {
    return StreamLanguage.define(diff).parser;
  }
  if (token === "powershell") {
    return StreamLanguage.define(powerShell).parser;
  }
  return null;
}

/**
 * @typedef {Object} PrettierInfo
 * @property {string} parser
 * @property {any[]} plugins
 */

/**
 * @param {Language} lang
 * @returns {Promise<PrettierInfo>}
 */
export async function langGetPrettierInfo(lang) {
  console.log("getPrettierInfo:", lang.token);
  let token = lang.token;
  if (token == "json") {
    let babelPrettierPlugin = await lazyLoadBabelPrettierPlugin();
    let prettierPluginEstree = await lazyLoadPrettierPluginEstree();
    return {
      parser: "json-stringify",
      plugins: [babelPrettierPlugin, prettierPluginEstree],
    };
  }
  if (token === "html") {
    let htmlPrettierPlugin = await lazyLoadHtmlPrettierPlugin();
    return {
      parser: "html",
      plugins: [htmlPrettierPlugin],
    };
  }

  if (token === "markdown") {
    let markdownPrettierPlugin = await lazyLoadMarkdownPrettierPlugin();
    return {
      parser: "markdown",
      plugins: [markdownPrettierPlugin],
    };
  }

  if (token === "css") {
    let cssPrettierPlugin = lazyLoadCssPrettierPlugin();
    return {
      parser: "css",
      plugins: [cssPrettierPlugin],
    };
  }

  if (token === "yaml") {
    let yamlPrettierPlugin = await lazyLoadYamlPrettierPlugin();
    return {
      parser: "yaml",
      plugins: [yamlPrettierPlugin],
    };
  }

  if (token === "javascript" || token === "jsx") {
    let babelPrettierPlugin = await lazyLoadBabelPrettierPlugin();
    let prettierPluginEstree = await lazyLoadPrettierPluginEstree();
    return {
      parser: "babel",
      plugins: [babelPrettierPlugin, prettierPluginEstree],
    };
  }
  if (token === "typescript" || token === "tsx") {
    let typescriptPlugin = await lazyLoadTypescriptPlugin();
    let prettierPluginEstree = await lazyLoadPrettierPluginEstree();
    return {
      parser: "typescript",
      plugins: [typescriptPlugin, prettierPluginEstree],
    };
  }
  return null;
}

/**
 * @param {Language} lang
 * @returns {boolean}
 */
export function langSupportsFormat(lang) {
  if (lang.token == "golang") {
    return true;
  }
  switch (lang.token) {
    case "json":
    case "html":
    case "markdown":
    case "css":
    case "yaml":
    case "javascript":
    case "jsx":
    case "typescript":
    case "tsx":
      return true;
  }
  return false;
}
