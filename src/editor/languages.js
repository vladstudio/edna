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
  constructor({ token, name, parser, guesslang, getParser = null }) {
    this.token = token;
    this.name = name;
    this._parser = parser || null;
    this._getParser = getParser;
    this.guesslang = guesslang;
  }
}

/** @type {Language[]} */
export const LANGUAGES = [
  new Language({
    token: "text",
    name: "Plain Text",
    parser: null,
    guesslang: null,
  }),
  new Language({
    token: "math",
    name: "Math",
    parser: null,
    guesslang: null,
  }),
  new Language({
    token: "json",
    name: "JSON",
    parser: null,
    getParser: () => {
      return jsonLanguage.parser;
    },
    guesslang: "json",
  }),
  new Language({
    token: "python",
    name: "Python",
    parser: pythonLanguage.parser,
    guesslang: "py",
  }),
  new Language({
    token: "html",
    name: "HTML",
    parser: htmlLanguage.parser,
    guesslang: "html",
  }),
  new Language({
    token: "sql",
    name: "SQL",
    parser: StandardSQL.language.parser,
    guesslang: "sql",
  }),
  new Language({
    token: "markdown",
    name: "Markdown",
    parser: markdownLanguage.parser,
    guesslang: "md",
  }),
  new Language({
    token: "java",
    name: "Java",
    parser: javaLanguage.parser,
    guesslang: "java",
  }),
  new Language({
    token: "lezer",
    name: "Lezer",
    parser: lezerLanguage.parser,
    guesslang: null,
  }),
  new Language({
    token: "php",
    name: "PHP",
    parser: phpLanguage.parser,
    guesslang: "php",
  }),
  new Language({
    token: "css",
    name: "CSS",
    parser: cssLanguage.parser,
    guesslang: "css",
  }),
  new Language({
    token: "xml",
    name: "XML",
    parser: xmlLanguage.parser,
    guesslang: "xml",
  }),
  new Language({
    token: "vue",
    name: "Vue",
    parser: vueLanguage.parser,
    guesslang: null,
  }),
  new Language({
    token: "cpp",
    name: "C++",
    parser: cppLanguage.parser,
    guesslang: "cpp",
  }),
  new Language({
    token: "rust",
    name: "Rust",
    parser: rustLanguage.parser,
    guesslang: "rs",
  }),
  new Language({
    token: "csharp",
    name: "C#",
    parser: csharpLanguage.parser,
    guesslang: "cs",
  }),
  new Language({
    token: "svelte",
    name: "Svelte",
    parser: svelteLanguage.parser,
    guesslang: null,
  }),
  new Language({
    token: "ruby",
    name: "Ruby",
    parser: StreamLanguage.define(ruby).parser,
    guesslang: "rb",
  }),
  new Language({
    token: "shell",
    name: "Shell",
    parser: StreamLanguage.define(shell).parser,
    guesslang: "sh",
  }),
  new Language({
    token: "yaml",
    name: "YAML",
    parser: StreamLanguage.define(yaml).parser,
    guesslang: "yaml",
  }),
  new Language({
    token: "toml",
    name: "TOML",
    parser: StreamLanguage.define(toml).parser,
    guesslang: "toml",
  }),
  new Language({
    token: "golang",
    name: "Go",
    parser: StreamLanguage.define(go).parser,
    guesslang: "go",
  }),
  new Language({
    token: "clojure",
    name: "Clojure",
    parser: StreamLanguage.define(clojure).parser,
    guesslang: "clj",
  }),
  new Language({
    token: "erlang",
    name: "Erlang",
    parser: StreamLanguage.define(erlang).parser,
    guesslang: "erl",
  }),
  new Language({
    token: "javascript",
    name: "JavaScript",
    parser: javascriptLanguage.parser,
    guesslang: "js",
  }),
  new Language({
    token: "jsx",
    name: "JSX",
    parser: jsxLanguage.parser,
    guesslang: null,
  }),
  new Language({
    token: "typescript",
    name: "TypeScript",
    parser: typescriptLanguage.parser,
    guesslang: "ts",
  }),
  new Language({
    token: "tsx",
    name: "TSX",
    parser: tsxLanguage.parser,
    guesslang: null,
  }),
  new Language({
    token: "swift",
    name: "Swift",
    parser: StreamLanguage.define(swift).parser,
    guesslang: "swift",
  }),
  new Language({
    token: "kotlin",
    name: "Kotlin",
    parser: StreamLanguage.define(kotlin).parser,
    guesslang: "kt",
  }),
  new Language({
    token: "groovy",
    name: "Groovy",
    parser: StreamLanguage.define(groovy).parser,
    guesslang: "groovy",
  }),
  new Language({
    token: "diff",
    name: "Diff",
    parser: StreamLanguage.define(diff).parser,
    guesslang: null,
  }),
  new Language({
    token: "powershell",
    name: "PowerShell",
    parser: StreamLanguage.define(powerShell).parser,
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
/**
 * @param {Language} lang
 * @returns
 */
export function langGetParser(lang) {
  if (lang._parser) {
    return lang._parser;
  }
  if (lang._getParser) {
    lang._parser = lang._getParser();
    return lang._parser;
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
