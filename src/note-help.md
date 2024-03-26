
∞∞∞markdown
# Welcome to Edna

[Edna](https://edna.arslexis.io) is a scratchpad and note taker for developers and power users.

This is a help note. To switch to a different note, press `Mod + K`.

To see help in HTML, press `?` at the bottom right or visit https://edna.arslexis.io/help

∞∞∞markdown
# Keyboard shortcuts

{{keyHelp}}

∞∞∞markdown
# Why Edna?

## Speed

[Edna](https://edna.arslexis.io) is optimized for speed of note taking.

Use `Mod + K` to show note selector and:
- switch between notes
- create new note
- delete a note
- assign a quick access `Alt + N` shortcut

## Quick access shortcut

You can assign `Alt + 0` to `Alt + 9` for quickly accessing notes:
- `Mod + K` for note selector dialog
- select a note
- press `Alt + 0` to `Alt + 9` to assign it as quick access shortcut

 Default shortcuts are:
- `Alt + 1` : scratch note
- `Alt + 2` : daily journal
- `Alt + 3` : inbox

Notes with quick access shortcut are shown at the top of note selector (`Ctrl + K`).

## Blocks and notes

Notes consists of blocks.

Each block has a type: plain text, markdown, JavaScript code, Go code etc.

Use `Mod + L` to assign a type for current block.

## Features for developers

### Syntax highlighting of blocks

Blocks are syntax highlighted based on their type.

### Formatting of blocks

You can format current block using:
- `Alt + Shift + F` keyboard shortcut
- right-click and use context menu `Block / Format as ${type}`
- press format icon in status bar (bottom right)

We support formatting of Go, JSON, JavaScript, HTML, CSS and Markdown blocks.

### Executing of code blocks

We support execution of Go blocks:
- `Alt + Shift + R` keyboard shortcut
- right-click and use context menu `Block / Run`

The output of execution will be shown in a new block created below the executed block.

We have the same capabilities as https://tools.arslexis.io/goplayground/

The code block must be a valid Go program.

∞∞∞markdown
# Multiple notes

## Create a new note

- `Mod + K` to open note selector
- type name of the note to create
- `Enter` to create if the name doesn't match any existing note
- `Mod + Enter` to create if the name partially matches an existing note

## Create a new scratch note

`Alt + N` if you just want a temporary scratch note.

We'll auto-create a unique name `scratch-N`

## Delete a note

Right-click for context menu, `Note / Delete current note`, or:

- `Mod + K`
- select a note with arrow key or by typing a partial name match
- `Mod + Delete` or `Mod + Backspace` to delete selected note

A `scratch` note is always available. If you delete it, we'll re-create an empty note.

## Rename a note

Right-click for context menu, `Note / Rename current note`

Each note consists of multiple blocks. They are like sub-notes so that you can divide your scratchpad into logical parts.

Each block has its own type for syntax highlighting.

You can efficiently move between blocks, create new blocks and delete them with keyboard shortcuts.

## Open a different note

- `Mod + K`
- click on note to open or
- enter text to narrow down list of notes
- `up` / `down` arrow keys to select a note
- `Enter` to open selected note

## Quick access shortcut

You can assign `Alt + 0` to `Alt + 9` keyboard shortcuts for quickly opening up to 10 notes.

- `Mod + K`
- select a note
- press `Alt + N` shortcut to re-assign it to selected note

Notes with assigned shortcut show up at the top of note selector (`Mod + K`).

∞∞∞markdown
# Default notes

We create 3 default notes for you:
- `scratch`, `Alt + 1`
- `daily journal`, `Alt + 2`
- `inbox`, `Alt + 3`

∞∞∞markdown
# Storing notes on disk

By default notes are stored in the browser (localStorage).

If your browser supports file system access (currently Chrome) you can store notes on disk.

You can do one time export from localStorage to a directory on disk:
- right click for context menu, `Notes storage / Move notes from browser to directory`
- pick a directory on disk
- we save notes on disk as `${name}.edna.txt` files in chosen directory and delete notes in localStorage

You can have multiple directories with notes. Use context menu `Notes storage / Open notes in directory` to open notes in a different directory. If it's a new directory, without existing notes, we'll create default `scratch` note.

You can go back to storing in browser with context menu `Notes storage / Open notes in browser (localStorage)`. Note that unlike going from browser => directory, it doesn't import the notes from directory. If you moved notes from localStorage to directory, we deleted them from localStorage.

∞∞∞markdown
# Accessing notes on multiple computers

If you pick a directory managed by Dropbox or One Drive or Google Drive etc. then you'll be able to access notes on multiple computers.

On the first computer export notes from browser to disk:
- right click for context menu, `Notes storage / Move notes from browser to directory`
- pick a directory shared by Dropbox / One Drive / Google Drive etc.

On other computers:
- right click for context menu, `Notes storage / Open notes in directory`
- pick the same directory

Please note that that the last written version wins. If you switch really quickly between computers, before the directory with notes has been replicated, you might over-write previous content.

∞∞∞markdown
# Exporting notes to a .zip file

There's no lock in with Edna.

You can export all the notes to a .zip file.

Use right-click context menu and `Export notes to zip file` menu.

We pack all the notes into a .zip file and initiate auto-download as `edna.notes.export-YYYY-MM-DD.zip` file.

Look in the browser downloads directory.

∞∞∞markdown
# Context menu

Right-click for context menu.

For native context menu do `Ctrl + right-click`. This is especially useful when spell checking to correct mis-spellings.

∞∞∞markdown
# Lists with TODO items

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
// Edna is great for storing code snippets
// this is a javascript block
// change type of block with `Mod + L`
  // you can format it with `Alt + Shift + F`
let x = 5
console.log("x is", x)

∞∞∞markdown
# Privacy and security

Your notes are private and secure.

Your notes are stored in the browser or on your computer.

The code is [open source](https:/github.com/kjk/edna) so you can audit it.

∞∞∞markdown
# No lock in

The notes are stored in plain text files on disk (or in localStorage under `note:${name}` key)

Blocks are marked with `\n∞∞∞${type}\n` e.g. `\n∞∞∞markdown\n` marks the beginning of markdown block.

You can edit the notes in any text editor (just be mindful of the above block markers).

You can back them up, store in git repositories, write scripts to process them.

They are not locked in a proprietary Edna format.

∞∞∞markdown
# How I use Edna

Edna is flexible and you should find your own way of using it.

I use Edna daily::

- I use `scratch` note for temporary notes
- I use `daily journal` for keeping track of what I do
- I have `todo` note for keeping track of short term todos
- I have a note for each project I work on
- I have a note for each programming language / technology I use. I keep code snippets and notes about it
- I have `ideas` note for jotting down ideas
- I have `investing` note for keeping track of various stock investment ideas

∞∞∞markdown
# Open source

[Edna](https://edna.arslexis.io) is open source: https://github.com/kjk/edna

To report a bug or request a feature: https://github.com/kjk/edna/issues

∞∞∞markdown
# Contact

You can contact me via https://blog.kowalczyk.info/contactme

You can find more software by [me](https://blog.kowalczyk.info/) on https://arslexis.io

∞∞∞markdown
# Credits

Edna is a fork of [Heynote](https://github.com/heyman/heynote) with the following differences:
- web first (no desktop apps)
- multiple notes
- ability to access notes on multiple devices by storing them on folder managed by Dropbox / One Drive / Google Drive

There's a spirit of Notational Velocity and Simplenote in Edna in how it allows quickly creating notes and switching between them.

Edna is built on [CodeMirror](https://codemirror.net/), [Vue](https://vuejs.org/), [Math.js](https://mathjs.org/), [Prettier](https://prettier.io/).
