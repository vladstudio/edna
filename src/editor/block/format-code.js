import { EditorSelection } from "@codemirror/state"

import * as prettier from "prettier/standalone"
import { getActiveNoteBlock } from "./block.js"
import { getLanguage } from "../languages.js"

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

export const formatBlockContent = async ({ state, dispatch }) => {
    if (state.readOnly)
        return false
    const block = getActiveNoteBlock(state)
    console.log("formatBlockContent:", block)
    const language = getLanguage(block.language.name)
    const canFormat = language.prettier || language.token == "golang"
    if (!canFormat) {
        return false
    }

    // get current cursor position
    const cursorPos = state.selection.asSingle().ranges[0].head
    // get block content
    const content = state.sliceDoc(block.content.from, block.content.to)

    //console.log("prettier supports:", getSupportInfo())

    if (language.token == "golang") {
        console.log("formatting go")
        let s;
        try {
            s = await formatGo(content)
        } catch(e) {
            console.log("error formatting go:", e)
            return false
        }

        if (!s) {
            console.log("failed to format go")
            return false
        }
        console.log("formatted go:", s)
        console.log("block:", block)
        let cursorOffset = cursorPos - block.content.from
        console.log("cursorOffset:", cursorOffset)
        // TODO: the weirdest thing
        // this fails if we call await formatGo()
        // doesn't fail if we just set s to some value
        dispatch(state.update({
            changes: {
                from: block.content.from,
                to: block.content.to,
                insert: s,
            },
            selection: EditorSelection.cursor(block.content.from + Math.min(cursorOffset, s.length)),
        }, {
            userEvent: "input",
            scrollIntoView: true,
        }))
        return true
    }

    // There is a performance bug in prettier causing formatWithCursor() to be extremely slow in some cases (https://github.com/prettier/prettier/issues/4801)
    // To work around this we use format() when the cursor is in the beginning or the end of the block.
    // This is not a perfect solution, and once the following PR is merged and released, we should be abe to remove this workaround:
    // https://github.com/prettier/prettier/pull/15709
    let useFormat = false
    if (cursorPos == block.content.from || cursorPos == block.content.to) {
        useFormat = true
    }

    let formattedContent
    try {
        if (useFormat) {
            formattedContent = {
                formatted: await prettier.format(content, {
                    parser: language.prettier.parser,
                    plugins: language.prettier.plugins,
                    tabWidth: state.tabSize,
                }),
            }
            formattedContent.cursorOffset = cursorPos == block.content.from ? 0 : formattedContent.formatted.length
        } else {
            formattedContent = await prettier.formatWithCursor(content, {
                cursorOffset: cursorPos - block.content.from,
                parser: language.prettier.parser,
                plugins: language.prettier.plugins,
                tabWidth: state.tabSize,
            })
        }
    } catch (e) {
        const hyphens = "----------------------------------------------------------------------------"
        console.log(`Error when trying to format block:\n${hyphens}\n${e.message}\n${hyphens}`)
        return false
    }
    console.log("formattedContent.formatted:", formattedContent.formatted)

    dispatch(state.update({
        changes: {
            from: block.content.from,
            to: block.content.to,
            insert: formattedContent.formatted,
        },
        selection: EditorSelection.cursor(block.content.from + Math.min(formattedContent.cursorOffset, formattedContent.formatted.length)),
    }, {
        userEvent: "input",
        scrollIntoView: true,
    }))
    return true;
}

