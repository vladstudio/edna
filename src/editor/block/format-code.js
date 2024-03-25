import {
  getLanguage,
  getPrettierInfo,
  langSupportsFormat,
} from "../languages.js";

import { EditorSelection } from "@codemirror/state";
import { findEditorByView } from "../../state.js";
import { getActiveNoteBlock } from "./block.js";
import { lazyLoadPrettier } from "../../lazyimport.js";

async function formatGo(s) {
  // setProcessingMessage("Formatting code...");
  // const uri = "play.golang.org/fmt";
  const uri = "/api/goplay/fmt";
  const rsp = await fetch(uri, {
    method: "POST",
    body: s,
  });
  // clearProcessingMessage();
  if (!rsp.ok) {
    //   setErrorMessage("Error:" + (await rsp.text()));
    return null;
  }
  const res = await rsp.json();
  if (res.Error) {
    //   setErrorMessage("Error:" + res.Error);
    return null;
  }
  if (res.Body === s) {
    return null;
  }
  return res.Body;
}

export async function formatBlockContent(view) {
  const { state, dispatch } = view;
  if (state.readOnly) return false;
  const block = getActiveNoteBlock(state);
  console.log("formatBlockContent:", block);
  const language = getLanguage(block.language.name);
  if (!langSupportsFormat(language)) {
    return false;
  }

  // get current cursor position
  const cursorPos = state.selection.asSingle().ranges[0].head;
  // get block content
  const content = state.sliceDoc(block.content.from, block.content.to);

  // console.log("prettier supports:", getSupportInfo());
  let editor = findEditorByView(view);
  if (language.token == "golang") {
    // formatGo() is async so we need to prevent changes to the state of the editor
    // we make it read-only
    // TODO: maybe show some indication that we're doing an operation
    let s;
    try {
      editor.setReadOnly(true);
      s = await formatGo(content);
    } catch (e) {
      console.log("error formatting go:", e);
      return false;
    } finally {
      editor.setReadOnly(false);
    }

    if (!s) {
      console.log("failed to format go");
      return false;
    }
    // console.log("formatted go:", s)
    // console.log("block:", block)
    let cursorOffset = cursorPos - block.content.from;
    // console.log("cursorOffset:", cursorOffset)
    // TODO: this probably might fail. For some reason during formatGo()
    // view.state is changed so we might be updating incorrect part
    // would have to disable
    const tr = view.state.update(
      {
        changes: {
          from: block.content.from,
          to: block.content.to,
          insert: s,
        },
        selection: EditorSelection.cursor(
          block.content.from + Math.min(cursorOffset, s.length)
        ),
      },
      {
        userEvent: "input",
        scrollIntoView: true,
      }
    );
    console.log("state == view.state:", state == view.state);
    console.log("state == tr.startState:", state == tr.startState);
    view.dispatch(tr);
    return true;
  }

  console.log("formatting with prettier");
  // There is a performance bug in prettier causing formatWithCursor() to be extremely slow in some cases (https://github.com/prettier/prettier/issues/4801)
  // To work around this we use format() when the cursor is in the beginning or the end of the block.
  // This is not a perfect solution, and once the following PR is merged and released, we should be abe to remove this workaround:
  // https://github.com/prettier/prettier/pull/15709
  let useFormat = false;
  if (cursorPos == block.content.from || cursorPos == block.content.to) {
    useFormat = true;
  }

  const prettier = await lazyLoadPrettier();
  const { parser, plugins } = await getPrettierInfo(language);

  let formattedContent;
  try {
    if (useFormat) {
      formattedContent = {
        formatted: await prettier.format(content, {
          parser: parser,
          plugins: plugins,
          tabWidth: state.tabSize,
        }),
        cursorOffset: 0,
      };
      formattedContent.cursorOffset =
        cursorPos == block.content.from ? 0 : formattedContent.formatted.length;
    } else {
      formattedContent = await prettier.formatWithCursor(content, {
        cursorOffset: cursorPos - block.content.from,
        parser: parser,
        plugins: plugins,
        tabWidth: state.tabSize,
      });
    }
  } catch (e) {
    const hyphens =
      "----------------------------------------------------------------------------";
    console.log(
      `Error when trying to format block:\n${hyphens}\n${e.message}\n${hyphens}`
    );
    return false;
  }
  // console.log("formattedContent.formatted:", formattedContent.formatted);
  const tr = view.state.update(
    {
      changes: {
        from: block.content.from,
        to: block.content.to,
        insert: formattedContent.formatted,
      },
      selection: EditorSelection.cursor(
        block.content.from +
          Math.min(
            formattedContent.cursorOffset,
            formattedContent.formatted.length
          )
      ),
    },
    {
      userEvent: "input",
      scrollIntoView: true,
    }
  );
  view.dispatch(tr);
  return true;
}

function getError(res) {
  // TODO: don't get why there are Error and Errors
  // maybe can improve backend code?
  if (res.Error && res.Error !== "") {
    return res.Error;
  }
  if (res.Errors && res.Errors !== "") {
    return res.Errors;
  }
  return "";
}

async function runGo(code) {
  const uri = "/api/goplay/compile";
  const rsp = await fetch(uri, {
    method: "POST",
    body: code,
  });
  if (!rsp.ok) {
    return `Error: ${rsp.status} ${rsp.statusText}`;
  }
  const res = await rsp.json();
  //console.log("res:", res);
  const err = getError(res);
  if (err != "") {
    return err;
  }
  let s = "";
  for (const ev of res.Events) {
    if (s !== "") {
      s += "\n";
    }
    if (ev.Kind === "stderr") {
      s += "Stderr:\n";
    }
    s += ev.Message;
  }
  return s;
}

export async function runBlockContent(view) {
  const { state } = view;
  if (state.readOnly) {
    return false;
  }
  const block = getActiveNoteBlock(state);
  console.log("runBlockContent:", block);
  const language = getLanguage(block.language.name);
  if (!language.supportsRun) {
    return false;
  }

  let editor = findEditorByView(view);

  const content = state.sliceDoc(block.content.from, block.content.to);

  let output = "";
  if (language.token == "golang") {
    // formatGo() is async so we need to prevent changes to the state of the editor
    // we make it read-only
    // TODO: maybe show some indication that we're doing an operation
    let s;
    try {
      editor.setReadOnly(true);
      s = await runGo(content);
    } catch (e) {
      console.log("error formatting go:", e);
      return false;
    } finally {
      editor.setReadOnly(false);
    }

    if (!s) {
      console.log("failed to run go");
      return false;
    }
    output = s;
  }

  console.log("output of running go:", output);
  // const block = getActiveNoteBlock(state)
  const delimText = "\n∞∞∞text-a\n" + "output of running the code:\n" + output;

  view.dispatch(
    view.state.update(
      {
        changes: {
          from: block.content.to,
          insert: delimText,
        },
        selection: EditorSelection.cursor(block.content.to + delimText.length),
      },
      {
        scrollIntoView: true,
        userEvent: "input",
      }
    )
  );

  return true;
}
