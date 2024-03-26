<script>
export default {
  props: [
    "loadingNoteName",
  ],

  methods: {
    // preventEvent(e) {
    //   e.preventDefault()
    // }
  },

  mounted() {
    console.log("Loading.vue: mounted")
    this.$refs.container.focus()
    this.$refs.input.focus()
    // setTimeout(
    //   () => {
    //     this.$refs.container.focus()
    //     this.$refs.input.focus()
    //   },
    //   0
    // )
    // window.addEventListener("keydown", this.preventEvent)
    // window.addEventListener("mousedown", this.preventEvent)
  },

  beforeUnmount() {
    console.log("Loading.vue: beforeUnmount")
    // window.removeEventListener("keydown", this.preventEvent)
    // window.removeEventListener("mousedown", this.preventEvent)
  },
}
</script>
<template>
  <form tabindex="-1" ref="container"
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[999] pointer-events-none select-none">
    <input hidden ref="input">
    <button class="bg-white" ref="btn">
      <div class="text-lg text-black px-4 py-2">Loading <span class="font-bold">{{ loadingNoteName
          }}</span>...</div>
    </button>
  </form>
</template>