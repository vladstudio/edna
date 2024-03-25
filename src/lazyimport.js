let lazyPrettier;
export async function lazyLoadPrettier() {
  if (!lazyPrettier) {
    const m = await import("prettier/standalone");
    console.log("lazyLoadPrettier:", m);
    lazyPrettier = m;
  }
  return lazyPrettier;
}

let lazyCssPrettierPlugin;
export async function lazyLoadCssPrettierPlugin() {
  if (!lazyCssPrettierPlugin) {
    const m = await import("prettier/plugins/postcss.mjs");
    console.log("lazyLoadCssPrettierPlugin:", m);
    lazyCssPrettierPlugin = m.default;
  }
  return lazyCssPrettierPlugin;
}

let babelPrettierPlugin;
export async function lazyLoadBabelPrettierPlugin() {
  if (!babelPrettierPlugin) {
    const m = await import("prettier/plugins/babel.mjs");
    console.log("lazyLoadBabelPrettierPlugin:", m);
    babelPrettierPlugin = m.default;
  }
  return babelPrettierPlugin;
}

let typescriptPlugin;
export async function lazyLoadTypescriptPlugin() {
  if (!typescriptPlugin) {
    const m = await import("prettier/plugins/typescript.mjs");
    console.log("lazyLoadTypescriptPlugin:", m);
    typescriptPlugin = m.default;
  }
  return typescriptPlugin;
}

// import * as prettierPluginEstree from "prettier/plugins/estree.mjs";
let prettierPluginEstree;
export async function lazyLoadPrettierPluginEstree() {
  if (!prettierPluginEstree) {
    const m = await import("prettier/plugins/estree.mjs");
    console.log("lazyLoadPrettierPluginEstree:", m);
    prettierPluginEstree = m;
  }
  return prettierPluginEstree;
}

// import htmlPrettierPlugin from "prettier/esm/parser-html.mjs";
let htmlPrettierPlugin;
export async function lazyLoadHtmlPrettierPlugin() {
  if (!htmlPrettierPlugin) {
    const m = await import("prettier/plugins/html.mjs");
    console.log("lazyLoadHtmlPrettierPlugin:", m);
    htmlPrettierPlugin = m.default;
  }
  return htmlPrettierPlugin;
}

// import markdownPrettierPlugin from "prettier/esm/parser-markdown.mjs";
let markdownPrettierPlugin;
export async function lazyLoadMarkdownPrettierPlugin() {
  if (!markdownPrettierPlugin) {
    const m = await import("prettier/plugins/markdown.mjs");
    console.log("lazyLoadMarkdownPrettierPlugin:", m);
    markdownPrettierPlugin = m.default;
  }
  return markdownPrettierPlugin;
}

// import yamlPrettierPlugin from "prettier/plugins/yaml.mjs";
let yamlPrettierPlugin;
export async function lazyLoadYamlPrettierPlugin() {
  if (!yamlPrettierPlugin) {
    const m = await import("prettier/plugins/yaml.mjs");
    console.log("lazyLoadYamlPrettierPlugin:", m);
    yamlPrettierPlugin = m.default;
  }
  return yamlPrettierPlugin;
}
