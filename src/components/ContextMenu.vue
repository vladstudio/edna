<script>
export default {
  props: [
    "x",
    "y",
  ],

  data() {
    console.log("ContextMenu data")
    return {
    }
  },

  mounted() {
    console.log("ContextMenu mounted")
    this.$refs.container.focus()
  },

  computed: {
    style() {
      console.log("ContextMenu style: x:", this.x, "y:", this.y)
      return {
          top: this.y + 'px',
          left: this.x + 'px',
      };
    },
  },

  methods: {
    onFocusOut(event) {
      console.log("onFocusOut")
        let container = this.$refs.container
        if (container !== event.relatedTarget && !container.contains(event.relatedTarget)) {
            this.$emit("close")
        }
    },
  }
}
</script>

<template>
    <div class="scroller" :style="style">
        <form class="context-menu" tabindex="-1" @focusout="onFocusOut" ref="container">
          <div>
            Hello
          </div>
        </form>
  </div>
</template>

<style scoped lang="sass">
    .scroller
        background-color: white
        width: 320px
        height: 320px
        overflow: auto
        position: fixed
    .context-menu
        font-size: 13px
        padding: 10px
        //background: #48b57e
        background: #efefef
        position: absolute
        top: 0
        left: 50%
        transform: translateX(-50%)
        border-radius: 0 0 5px 5px
        box-shadow: 0 0 10px rgba(0,0,0,0.3)
        +dark-mode
            background: #151516
            box-shadow: 0 0 10px rgba(0,0,0,0.5)
        +webapp-mobile
            max-width: calc(100% - 80px)

</style>
