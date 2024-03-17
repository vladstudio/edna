<script>
import { platformName } from "../utils"

export default {
  data() {
    let helpURL = platformName === "mac" ? "/help-mac.html" : "/help-win.html"
    return {
      helpURL: helpURL,
    }
  },
}
</script>

<template>
  <div class="fixed bottom-[28px] right-[28px] w-[80%] h-[80%] bg-yellow-50 shadow-md">
    <iframe :src="helpURL" width="100%" height="100%"></iframe>
  </div>
</template>
