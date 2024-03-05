/**
 * try real hard to put focus in EditorView
 * @param {import("@codemirror/view").EditorView} editorView
 */
export function focusEditorView(editorView) {
  if (!editorView || editorView.hasFocus) {
    // console.log("focusEditorView: no editorView or already has focus")
    return;
  }
  let max = 10; // limit to 1 sec
  const timer = setInterval(() => {
    editorView.focus();
    max -= 1;
    if (editorView.hasFocus || max < 0) {
      // if (max < 0) {
      //   console.log("focusEditorView: failed to focus")
      // }
      // if (editorView.hasFocus) {
      //   console.log("focusEditorView: focused")
      // }
      clearInterval(timer);
    }
  }, 100);
}
