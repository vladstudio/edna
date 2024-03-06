# Edna

[Edna](https://edna.arslexis.io) is a scratchpad for developers. It's a large persistent text buffer where you can write down anything you like. Works great for that Slack message you don't want to accidentally send, a JSON response from an API you're working with, notes from a meeting, daily to-do list, etc.

The Edna buffer is divided into blocks, and each block can have its own Language set (e.g. JavaScript, JSON, Markdown, etc.). This gives you syntax highlighting and lets you auto-format that JSON response.

Available on the web under https://edna.arslexis.io

## Features

-   Persistent text buffer
-   Block-based
-   Syntax highlighting:

    C++, C#, Clojure, CSS, Erlang, Go, Groovy, HTML, Java, JavaScript, JSX, Kotlin, TypeScript, TOML, TSX, JSON, Lezer, Markdown, PHP, Python, Ruby, Rust, Shell, SQL, Swift, XML, YAML

-   Language auto-detection
-   Auto-formatting
-   Math/Calculator mode
-   Currency conversion
-   Multi-cursor editing
-   Dark & Light themes
-   Default or Emacs-like key bindings


## Development

To develop Edna you need Go, Node.js. Check out the code and then run:

```
go run ./server/ -run-dev
```

### Run Tests

To run the tests:

```
> npm run test
```

To run the tests in the Playwright UI:

```
> npm run test:ui
```

### Contributions

I'm happy to merge contributions that fit my vision for the app. Bug fixes are always welcome.

## Math Blocks

Edna's Math blocks are powered by [Math.js expressions](https://mathjs.org/docs/expressions). Checkout their [documentation](https://mathjs.org/docs/) to see what [syntax](https://mathjs.org/docs/expressions/syntax.html), [functions](https://mathjs.org/docs/reference/functions.html), and [constants](https://mathjs.org/docs/reference/constants.html) are available.

### Accessing the previous result

The variable `prev` can be used to access the previous result. For example:

```
128
prev * 2 # 256
```

### Changing how the results of Math blocks are formatted?

You can define a custom `format` function within the Math block like this:

```
_format = format # store reference to the built in format
format(x) = _format(x, {notation:"exponential"})
```

See the [Math.js format()](https://mathjs.org/docs/reference/functions/format.html) function for more info on what's supported.

### Default keyboard shortcuts?

**On Mac**

```
⌘ + Enter           Add new block below the current block
⌥ + Enter           Add new block before the current block
⌘ + Shift + Enter   Add new block at the end of the buffer
⌥ + Shift + Enter   Add new block at the start of the buffer
⌘ + ⌥ + Enter      Split the current block at cursor position
⌘ + L               Change block language
⌘ + Down            Goto next block
⌘ + Up              Goto previous block
⌘ + A               Select all text in a note block. Press again to select the whole buffer
⌘ + ⌥ + Up/Down    Add additional cursor above/below
⌥ + Shift + F       Format block content (works for Go, JSON, JavaScript, HTML, CSS and Markdown)
⌥ + Shift + R       Execute block code (works for Go)
```

**On Windows and Linux**

```
Ctrl + Enter           Add new block below the current block
Alt + Enter            Add new block before the current block
Ctrl + Shift + Enter   Add new block at the end of the buffer
Alt + Shift + Enter    Add new block at the start of the buffer
Ctrl + Alt + Enter     Split the current block at cursor position
Ctrl + L               Change block language
Ctrl + Down            Goto next block
Ctrl + Up              Goto previous block
Ctrl + A               Select all text in a note block. Press again to select the whole buffer
Ctrl + Alt + Up/Down   Add additional cursor above/below
Alt + Shift + F        Format block content (works for Go, JSON, JavaScript, HTML, CSS and Markdown)
Alt + Shift + R        Execute block code (works for Go)
```

## Thanks!

Edna is a for of [Heynote](https://github.com/heyman/heynote) with the following differences:
* web first (no desktop apps)
* multiple files
* 2 ways of sharing notes between computers:
  * store files on disk in DropBox/OneDrive/etc. folder
  * login with GitHub and store as encrypted Gist (each note is a separate gist)
* not opposed to adding lots of features (while still preserving the character of the app)

Edna is built upon [CodeMirror](https://codemirror.net/), [Vue](https://vuejs.org/), [Math.js](https://mathjs.org/), [Prettier](https://prettier.io/) and other great open-source projects.

