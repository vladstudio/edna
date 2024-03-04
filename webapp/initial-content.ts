import { keyHelpStr } from "../shared-utils/key-helper";
import { platformName } from "../shared-utils/utils"

export function getHelp() {
  const help = `
∞∞∞markdown
Welcome to Edna - a scratchpad for quickly taking notes.

Keyboard shortcuts:

${keyHelpStr(platformName)}

Edna is private and secure. Your notes are stored in the browser.

If you want to access your notes on multiple devices, login with GitHub and we'll store the notes as GitHub gists. They will be encrypted with a password.

Edna is optimized for speed of note taking.

Each note consists of multiple blocks. They are like sub-notes so that you can divide your scratchpad into logical parts.

Each block has its own type for syntax highlighting.

You can efficiently move between blocks, create new blocks and delete them with keyboard shortcuts.

You can create multiple notes:
* default, always available note is 'scratch'. Press 'Alt-1' to quickly switch to it
* press 'Alt-0' to switch to another note or create a new note
* or click on the note name in the bottom left corner

It's up to you to decide if you want to put your text as new block in current note or in a separate note.

By default we also create a 'daily journal' note.

You can delete it if you don't want to use it but the idea is that it's for keeping track of what you did.

By convention each block represents a day, and we recommend to put date in 'YYYY-MM-DD' format as the first line.

We automatically create a new block for each day when you open 'daily journal' note.

TODO: add more help here about math blocks.

You can find by software by me on https://arslexis.io

Edna is open source: https://github.com/kjk/edna
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

- [x] Download Heynote
- [ ] Try out Heynote
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
