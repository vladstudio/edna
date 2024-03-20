
∞∞∞markdown
# Welcome to Edna

Edna is a scratchpad and note taker for developers and power users.

This is a help note. To switch to a different note, press `Mod + P`.

To see help in HTML, press `?` at the bottom right or visit https://edna.arslexis.io/help

∞∞∞markdown
# Keyboard shortcuts

{{keyHelp}}

∞∞∞markdown
# Why Edna?

## Speed

Edna is optimized for speed of note taking:

- `Mod + P` to switch between notes, create new notes, delete existing notes or assigning a quick access shortcut
- `Alt + N` - a quick access shortcut. You can assign `Alt + 0` to `Alt + 9` for quickly accessing your notes:
  - use `Mod + P`, select a note and press `Alt + N` shortcut
  - default shortcuts are:
    - `Alt + 1` : scratch
    - `Alt + 2` : daily journal
    - `Alt + 3` : inbox

## Blocks and notes

Notes consists of blocks.

Each block has a type: plain text, markdown, JavaScript code, Go code etc.

## Features for developers

We have syntax highlighting for markdown and many programming languages.

You can format many types of blocks:
- `Alt + Shift + F`
- right-click and use context menu
- press format icon in status bar (bottom right)

∞∞∞markdown
# Multiple notes

## Create a new note

- `Mod + P` to open note selector
- type name of the note to create
- `Enter` to create if the name doesn't match any existing note
- `Mod + Enter` to create if the name partially matches an existing note

## Create a new scratch note

`Alt + N` if you just want a temporary scratch note.

We'll auto-create a unique name `scratch-N`

## Delete a note

- right-click for context menu, `Note / Delete current note`

or:

- `Mod + P`
- select a note with arrow key or by typing a partial name match
- `Mod + Delete` or `Mod + Backspace` to delete selected note

A `scratch` note is always available. If you delete it, we'll re-create an empty note.

## Rename a note

- right-click for context menu, `Note / Rename current note`

Each note consists of multiple blocks. They are like sub-notes so that you can divide your scratchpad into logical parts.

Each block has its own type for syntax highlighting.

You can efficiently move between blocks, create new blocks and delete them with keyboard shortcuts.

## Open a different note

- `Mod + P`
- click on note to open or
- enter text to narrow down list of notes
- `up` / `down` arrow keys to select a note
- `Enter` to open selected note

## Quick access shortcut

You can assign `Alt + 0` to `Alt + 9` keyboard shortcuts for quickly opening up to 10 notes.

- `Mod + P`
- select a note
- press `Alt + N` shortcut to re-assign it to selected note

Notes with assigned shortcut show up at the top of note selector (`Mod + P`).

∞∞∞markdown
# Default notes

We create 3 default notes for you:
- `scratch`, `Alt + 1`
- `daily journal`, `Alt + 2`
- `inbox`, `Alt + 3`

∞∞∞markdown
# Storing notes on disk

By default notes are stored in the browser (localStorage).

In browsers that support file system access (currently Chrome) you can store notes on disk instead.

You can do one-time export from localStorage to a folder on disk:
- right click for context menu, `Notes storage / Move notes from browser to directory`
- pick a directory on disk
- we save notes on disk as `${name}.edna.txt` files in chosen directory and delete notes in localStorage

You can have multiple folders with notes. Use context menu `Notes storage / Open notes in directory` to open a different directory.

It could be a new directory, without existing notes, in which case we'll create default `scratch` note.

You can go back to storing in browser with context menu `Notes storage / Open notes in browser (localStorage)`. Note that unlike going from browser => directory, it doesn't import the notes from directory. If you moved notes from localStorage to directory, we deleted them from localStorage.

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
# Lists
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
# How to use Edna

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
# Code, feedback, more software

Edna is open source: https://github.com/kjk/edna

To report a bug or request a feature: https://github.com/kjk/edna

You can find more software by [me](https://blog.kowalczyk.info/) on https://arslexis.io

∞∞∞markdown
# Credits

Edna is a fork of [Heynote](https://github.com/heyman/heynote) with the following differences:
* web first (no desktop apps)
* multiple notes
* ability to access notes on multiple devices by storing them on folder managed by Dropbox / One Drive / Google Drive

There's a spirit of Notational Velocity and Simplenote in Edna in how it allows quickly creating notes and switching between them.

Edna is built on [CodeMirror](https://codemirror.net/), [Vue](https://vuejs.org/), [Math.js](https://mathjs.org/), [Prettier](https://prettier.io/).
