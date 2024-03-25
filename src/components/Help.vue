<script>
import { platformName } from "../util"

export default {
  props: [
    "anchor",
  ],

  data() {
    let helpURL = platformName === "mac" ? "/help-mac.html" : "/help-win.html"
    if (this.anchor) {
      helpURL += `#${this.anchor}`
    }
    console.log("Help URL", helpURL)
    return {
      helpURL: helpURL,
    }
  },

  mounted() {
    console.log("Help.vue: mounted")
    window.addEventListener("keydown", this.onKeydown)
    let container = /** @type {HTMLElement} */ (this.$refs.container);
    container.focus()
  },

  beforeUnmount() {
    console.log("Help.veu: beforeUnmount")
    window.removeEventListener("keydown", this.onKeydown)
  },

  methods: {
    onKeydown(event) {
      if (event.key === "Escape") {
        this.$emit("close");
        event.preventDefault();
      }
    },

    onFocusOut(event) {
      let container = /** @type{HTMLElement} */(this.$refs.container);
      if (!container) {
        return;
      }
      if (!event.relatedTarget) {
        // this means the focus is going to iframe. We re-focus the container to
        // not loose the focus ring and the ability to close the help with escape key
        setTimeout(() => {
          container.focus();
        }, 0);
        return;
      }
      if (container !== event.relatedTarget && !container.contains(event.relatedTarget)) {
        this.$emit("close")
        return;
      }
    },
  }
}
</script>

<template>
  <form tabindex="-1" @focusout="onFocusOut" ref="container"
    class="fixed bottom-[28px] right-[28px] w-[80%] h-[80%] bg-slate-50 shadow-md focus-within:outline-slate-300">
    <iframe :src="helpURL" width="100%" height="100%"></iframe>
  </form>
</template>
