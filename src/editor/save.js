import { ViewPlugin } from "@codemirror/view";
import { debounce } from "debounce";
import { isDocDirty } from "../state";

export const autoSaveContent = (saveFunction, interval) => {
  const save = debounce((view) => {
    //console.log("saving buffer")
    saveFunction(view.state.sliceDoc());
  }, interval);

  return ViewPlugin.fromClass(
    class {
      update(update) {
        if (update.docChanged) {
          isDocDirty.value = true;
          save(update.view);
        }
      }
    }
  );
};
