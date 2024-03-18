import * as prettierPluginEstree from "prettier/plugins/estree.mjs";

import {
  javascriptLanguage,
  jsxLanguage,
  tsxLanguage,
  typescriptLanguage,
} from "@codemirror/lang-javascript";

import { StandardSQL } from "@codemirror/lang-sql";
import { StreamLanguage } from "@codemirror/language";
import babelPrettierPlugin from "prettier/plugins/babel.mjs";
import { clojure } from "@codemirror/legacy-modes/mode/clojure";
import { cppLanguage } from "@codemirror/lang-cpp";
import { csharpLanguage } from "@replit/codemirror-lang-csharp";
import { cssLanguage } from "@codemirror/lang-css";
import cssPrettierPlugin from "prettier/esm/parser-postcss.mjs";
import { diff } from "@codemirror/legacy-modes/mode/diff";
import { erlang } from "@codemirror/legacy-modes/mode/erlang";
import { go } from "@codemirror/legacy-modes/mode/go";
import { groovy } from "@codemirror/legacy-modes/mode/groovy";
import { htmlLanguage } from "@codemirror/lang-html";
import htmlPrettierPlugin from "prettier/esm/parser-html.mjs";
import { javaLanguage } from "@codemirror/lang-java";
import { jsonLanguage } from "@codemirror/lang-json";
import { kotlin } from "@codemirror/legacy-modes/mode/clike";
import { lezerLanguage } from "@codemirror/lang-lezer";
import { markdownLanguage } from "@codemirror/lang-markdown";
import markdownPrettierPlugin from "prettier/esm/parser-markdown.mjs";
import { phpLanguage } from "@codemirror/lang-php";
import { powerShell } from "@codemirror/legacy-modes/mode/powershell";
import { pythonLanguage } from "@codemirror/lang-python";
import { ruby } from "@codemirror/legacy-modes/mode/ruby";
import { rustLanguage } from "@codemirror/lang-rust";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { svelteLanguage } from "@replit/codemirror-lang-svelte";
import { swift } from "@codemirror/legacy-modes/mode/swift";
import { toml } from "@codemirror/legacy-modes/mode/toml";
import typescriptPlugin from "prettier/plugins/typescript.mjs";
import { vueLanguage } from "@codemirror/lang-vue";
import { xmlLanguage } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/legacy-modes/mode/yaml";
import yamlPrettierPlugin from "prettier/plugins/yaml.mjs";

class Language {
  constructor({ token, name, parser, guesslang, prettier }) {
    this.token = token;
    this.name = name;
    this.parser = parser;
    this.guesslang = guesslang;
    this.prettier = prettier;
  }

  get supportsFormat() {
    if (this.token == "golang") {
      return true;
    }
    return !!this.prettier;
  }

  get supportsRun() {
    if (this.token == "golang") {
      return true;
    }
    return false;
  }
}

/** @type {Language[]} */
export const LANGUAGES = [
  new Language({
    token: "text",
    name: "Plain Text",
    parser: null,
    guesslang: null,
    prettier: null,
  }),
  new Language({
    token: "math",
    name: "Math",
    parser: null,
    guesslang: null,
    prettier: null,
  }),
  new Language({
    token: "json",
    name: "JSON",
    parser: jsonLanguage.parser,
    guesslang: "json",
    prettier: {
      parser: "json-stringify",
      plugins: [babelPrettierPlugin, prettierPluginEstree],
    },
  }),
  new Language({
    token: "python",
    name: "Python",
    parser: pythonLanguage.parser,
    guesslang: "py",
    prettier: null,
  }),
  new Language({
    token: "html",
    name: "HTML",
    parser: htmlLanguage.parser,
    guesslang: "html",
    prettier: { parser: "html", plugins: [htmlPrettierPlugin] },
  }),
  new Language({
    token: "sql",
    name: "SQL",
    parser: StandardSQL.language.parser,
    guesslang: "sql",
    prettier: null,
  }),
  new Language({
    token: "markdown",
    name: "Markdown",
    parser: markdownLanguage.parser,
    guesslang: "md",
    prettier: { parser: "markdown", plugins: [markdownPrettierPlugin] },
  }),
  new Language({
    token: "java",
    name: "Java",
    parser: javaLanguage.parser,
    guesslang: "java",
    prettier: null,
  }),
  new Language({
    token: "lezer",
    name: "Lezer",
    parser: lezerLanguage.parser,
    guesslang: null,
    prettier: null,
  }),
  new Language({
    token: "php",
    name: "PHP",
    parser: phpLanguage.parser,
    guesslang: "php",
    prettier: null,
  }),
  new Language({
    token: "css",
    name: "CSS",
    parser: cssLanguage.parser,
    guesslang: "css",
    prettier: { parser: "css", plugins: [cssPrettierPlugin] },
  }),
  new Language({
    token: "xml",
    name: "XML",
    parser: xmlLanguage.parser,
    guesslang: "xml",
    prettier: null,
  }),
  new Language({
    token: "vue",
    name: "Vue",
    parser: vueLanguage.parser,
    guesslang: null,
    prettier: null,
  }),
  new Language({
    token: "cpp",
    name: "C++",
    parser: cppLanguage.parser,
    guesslang: "cpp",
    prettier: null,
  }),
  new Language({
    token: "rust",
    name: "Rust",
    parser: rustLanguage.parser,
    guesslang: "rs",
    prettier: null,
  }),
  new Language({
    token: "csharp",
    name: "C#",
    parser: csharpLanguage.parser,
    guesslang: "cs",
    prettier: null,
  }),
  new Language({
    token: "svelte",
    name: "Svelte",
    parser: svelteLanguage.parser,
    guesslang: null,
    prettier: null,
  }),
  new Language({
    token: "ruby",
    name: "Ruby",
    parser: StreamLanguage.define(ruby).parser,
    guesslang: "rb",
    prettier: null,
  }),
  new Language({
    token: "shell",
    name: "Shell",
    parser: StreamLanguage.define(shell).parser,
    guesslang: "sh",
    prettier: null,
  }),
  new Language({
    token: "yaml",
    name: "YAML",
    parser: StreamLanguage.define(yaml).parser,
    guesslang: "yaml",
    prettier: { parser: "yaml", plugins: [yamlPrettierPlugin] },
  }),
  new Language({
    token: "toml",
    name: "TOML",
    parser: StreamLanguage.define(toml).parser,
    guesslang: "toml",
    prettier: null,
  }),
  new Language({
    token: "golang",
    name: "Go",
    parser: StreamLanguage.define(go).parser,
    guesslang: "go",
    prettier: null,
  }),
  new Language({
    token: "clojure",
    name: "Clojure",
    parser: StreamLanguage.define(clojure).parser,
    guesslang: "clj",
    prettier: null,
  }),
  new Language({
    token: "erlang",
    name: "Erlang",
    parser: StreamLanguage.define(erlang).parser,
    guesslang: "erl",
    prettier: null,
  }),
  new Language({
    token: "javascript",
    name: "JavaScript",
    parser: javascriptLanguage.parser,
    guesslang: "js",
    prettier: {
      parser: "babel",
      plugins: [babelPrettierPlugin, prettierPluginEstree],
    },
  }),
  new Language({
    token: "jsx",
    name: "JSX",
    parser: jsxLanguage.parser,
    guesslang: null,
    prettier: {
      parser: "babel",
      plugins: [babelPrettierPlugin, prettierPluginEstree],
    },
  }),
  new Language({
    token: "typescript",
    name: "TypeScript",
    parser: typescriptLanguage.parser,
    guesslang: "ts",
    prettier: {
      parser: "typescript",
      plugins: [typescriptPlugin, prettierPluginEstree],
    },
  }),
  new Language({
    token: "tsx",
    name: "TSX",
    parser: tsxLanguage.parser,
    guesslang: null,
    prettier: {
      parser: "typescript",
      plugins: [typescriptPlugin, prettierPluginEstree],
    },
  }),
  new Language({
    token: "swift",
    name: "Swift",
    parser: StreamLanguage.define(swift).parser,
    guesslang: "swift",
    prettier: null,
  }),
  new Language({
    token: "kotlin",
    name: "Kotlin",
    parser: StreamLanguage.define(kotlin).parser,
    guesslang: "kt",
    prettier: null,
  }),
  new Language({
    token: "groovy",
    name: "Groovy",
    parser: StreamLanguage.define(groovy).parser,
    guesslang: "groovy",
    prettier: null,
  }),
  new Language({
    token: "diff",
    name: "Diff",
    parser: StreamLanguage.define(diff).parser,
    guesslang: null,
    prettier: null,
  }),
  new Language({
    token: "powershell",
    name: "PowerShell",
    parser: StreamLanguage.define(powerShell).parser,
    guesslang: "ps1",
    prettier: null,
  }),
];

const languageMapping = Object.fromEntries(LANGUAGES.map((l) => [l.token, l]));

export function getLanguage(token) {
  return languageMapping[token];
}

export function langSupportsFormat(token) {
  return getLanguage(token).supportsFormat;
}

export function langSupportsRun(token) {
  return getLanguage(token).supportsRun;
}
