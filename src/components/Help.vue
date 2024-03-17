<script>
import { platformName } from "../utils"

export default {
  data() {
    let helpURL = platformName === "mac" ? "/help-mac.html" : "/help-win.html"
    return {
      helpURL: helpURL,
    }
  },

  mounted() {
    console.log("Help mounted")
    // @ts-ignore
    this.$refs.container.focus()
  },

  methods: {
    onFocusOut(event) {
      let container = this.$refs.container
      // @ts-ignore
      if (container !== event.relatedTarget && !container.contains(event.relatedTarget)) {
        this.$emit("close")
      }
    },
  }
}
</script>

<template>
  <form tabindex="-1" @focusout="onFocusOut" ref="container"
    class="fixed bottom-[28px] right-[28px] w-[80%] h-[80%] bg-yellow-50 shadow-md">
    <iframe :src="helpURL" width="100%" height="100%"></iframe>
  </form>
</template>
