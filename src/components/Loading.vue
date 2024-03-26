<script>
export default {
  props: [
    "loadingNoteName",
  ],

  data() {
    return {
      showing: false,
      timerID: null,
    }
  },
  methods: {
  },

  mounted() {
    console.log("Loading.vue: mounted")
    // delay showing the loading screen to prevent flickering for short loads
    this.timerID = setTimeout(
      () => {
        this.showing = true
        this.timerID = setTimeout(
          () => {
            // @ts-ignore
            this.$refs.container.focus()
            // @ts-ignore
            this.$refs.input.focus()
          },
          0
        )
      },
      100
    )
    // window.addEventListener("keydown", this.preventEvent)
    // window.addEventListener("mousedown", this.preventEvent)
  },

  beforeUnmount() {
    console.log("Loading.vue: beforeUnmount")
    clearTimeout(this.timerID)
    this.showing = false
    // window.removeEventListener("keydown", this.preventEvent)
    // window.removeEventListener("mousedown", this.preventEvent)
  },
}
</script>
<template>
  <form v-if="showing" tabindex="-1" ref="container"
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[999] pointer-events-none select-none">
    <input hidden ref="input">
    <button class="bg-white" ref="btn">
      <div class="text-lg text-black px-4 py-2">Loading <span class="font-bold">{{ loadingNoteName
          }}</span>...</div>
    </button>
  </form>
</template>