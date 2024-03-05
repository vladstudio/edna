import { keyHelpStr, modChar } from "../shared-utils/key-helper";
import { platformName } from "../shared-utils/utils"

export function getHelp() {
  const help = `
∞∞∞markdown
# Welcome to Edna

Edna is a scratchpad for quickly taking notes.

This is a help note. To switch to a different note, press \`${modChar} + O\`.

∞∞∞markdown
# Keyboard shortcuts

${keyHelpStr(platformName)}

∞∞∞markdown
# Why Edna?

Edna is optimized for speed of note taking.

We have keyboard shortcuts for quickly navigating between blocks and notes.

We have syntax highlighting for markdown and multiple programming languages.

∞∞∞markdown
# Blocks and notes

Each note consists of multiple blocks. They are like sub-notes so that you can divide your scratchpad into logical parts.

Each block has its own type for syntax highlighting.

You can efficiently move between blocks, create new blocks and delete them with keyboard shortcuts.

∞∞∞markdown
# Multiple notes

You can create multiple notes:
- default, always available note is 'scratch'. Press \`Alt-1\` to quickly switch to it
- press \'${modChar} + O\' to switch to another note or create / delete a note
- or click on the note name in the bottom left corner

It's up to you to how to divide your writing into blocks and notes.

A \`scratch\` note is always available and cannot be deleted.

∞∞∞markdown
# Daily journal

By default we create a 'daily journal' note.

Daily journal is for keeping track of what you do daily.

By convention each block represents a day.

We recommend that first line is date in the format: \`#YYYY-MM-DD <day of week>\`.

We automatically create a new block for each day when you open journal note.

You can delete it if you don't want to use it.

∞∞∞markdown
# Accessing notes on multiple devices

You can login with GitHub and we'll store the notes as GitHub gists. They will be encrypted with a password.

∞∞∞markdown
# Privacy and security

Your notes are private and secure.

Your notes are stored:
- locally in the browser if you don't login with GitHub
- encrypted with a password if you login with GitHub. The password is only stored in the browser.

The code is [open source]() so you can audit it.

∞∞∞markdown
In Markdown blocks, lists with [x] and [ ] are rendered as checkboxes:

- [ ] Try out Edna
- [ ] Do laundry

∞∞∞math
This is a Math block. Here, rows are evaluated as math expressions.

radius = 5
area = radius^2 * PI
sqrt(9)

It also supports some basic unit conversions, including currencies:

13 inches in cm
time = 3900 seconds to minutes
time * 2

1 EUR in USD

∞∞∞javascript
// this is a javascript block
let x = 5
console.log("x is", x)

∞∞∞markdown
# How I use Edna

- I use \`scratch\` note for temporary notes
- I use \`daily journal\` for keeping track of what I do
- I have \`todo\` note for keeping track of short term todos
- I have a note for each project I work on
- I have a note for each programming language / technology I use. I keep code snippets and notes about it
- I have \`ideas\` note for jotting down ideas

∞∞∞markdown
# More info

You can find more software by [me](https://blog.kowalczyk.info/) on https://arslexis.io

Edna is open source: https://github.com/kjk/edna

To report a bug or request a feature, please use https://github.com/kjk/edna

∞∞∞markdown
# Credits

Edna is a for of [Heynote](https://github.com/heyman/heynote) with the following differences:
* web first (no desktop apps)
* multiple notes
* ability to access notes on multiple devices by storing them in GitHub Gists

There's a spirit of Notational Velocity and Simplenote in Edna in how it allows quickly switching between notes.

Edna is built upon [CodeMirror](https://codemirror.net/), [Vue](https://vuejs.org/), [Math.js](https://mathjs.org/), [Prettier](https://prettier.io/) and other great open-source projects.
`
  return help;
}

export function getInitialContent() {
  const initialContent = `
∞∞∞markdown
Welcome to Edna - a scratchpad for quickly taking notes.

${keyHelpStr(platformName)}
∞∞∞math
This is a Math block. Here, rows are evaluated as math expressions.

radius = 5
area = radius^2 * PI
sqrt(9)

It also supports some basic unit conversions, including currencies:

13 inches in cm
time = 3900 seconds to minutes
time * 2

1 EUR in USD
∞∞∞markdown
In Markdown blocks, lists with [x] and [ ] are rendered as checkboxes:

- [ ] Try out Edna
- [ ] Do laundry
∞∞∞text-a
`

  const initialDevContent = initialContent + `
∞∞∞python-a
# hmm
def my_func():
  print("hejsan")

∞∞∞javascript-a
import {basicSetup} from "codemirror"
import {EditorView, keymap} from "@codemirror/view"
import {javascript} from "@codemirror/lang-javascript"
import {indentWithTab, insertTab, indentLess, indentMore} from "@codemirror/commands"
import {nord} from "./nord.mjs"

let editor = new EditorView({
  //extensions: [basicSetup, javascript()],
  extensions: [
    basicSetup,
    javascript(),
    //keymap.of([indentWithTab]),
    keymap.of([
      {
          key: 'Tab',
          preventDefault: true,
          //run: insertTab,
          run: indentMore,
      },
      {
          key: 'Shift-Tab',
          preventDefault: true,
          run: indentLess,
      },
    ]),
    nord,
  ],
  parent: document.getElementById("editor"),
})
∞∞∞json
{
    "name": "heynote-codemirror",
    "type": "module",
    "version": "1.0.0",
    "description": "",
    "main": "index.js",
    "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1",
        "build": "rollup -c"
    },
    "keywords": [],
    "author": "",
    "license": "ISC",
    "dependencies": {
        "@codemirror/commands": "^6.1.2",
        "@codemirror/lang-javascript": "^6.1.2",
        "@codemirror/lang-json": "^6.0.1",
        "@codemirror/lang-python": "^6.1.1",
        "@rollup/plugin-node-resolve": "^15.0.1",
        "codemirror": "^6.0.1",
        "i": "^0.3.7",
        "npm": "^9.2.0",
        "rollup": "^3.8.1",
        "rollup-plugin-typescript2": "^0.34.1",
        "typescript": "^4.9.4"
    }
}
∞∞∞html
<html>
    <head>
        <title>Test</title>
    </head>
    <body>
        <h1>Test</h1>
        <script>
            console.log("hej")
        </script>
    </body>
</html>
∞∞∞sql
SELECT * FROM table WHERE id = 1;
∞∞∞text
Shopping list:

- Milk
- Eggs
- Bread
- Cheese`

  return {initialContent, initialDevContent}
}
