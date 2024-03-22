<script>
import { getLatestNoteNames } from '../notes'

export default {
  props: {
    oldName: String,
  },

  data() {
    return {
      newName: "",
    }
  },

  computed: {
    canRename() {
      let name = this.newName.trim()
      if (name === "") {
        return false
      }
      let noteNames = getLatestNoteNames()
      for (let noteName of noteNames) {
        if (noteName === name) {
          return false
        }
      }
      return true
    }
  },

  methods: {
    onKeydown(event) {
      if (event.key === "Escape") {
        this.$emit("close")
      }
    }
  },

  mounted() {
    console.log("RenameNote mounted: oldName:", this.oldName)
    this.newName = this.oldName
    let input = /** @type {HTMLElement} */(this.$refs.input);
    input.focus();
  }
}

</script>

<template>
  <div class="fixed inset-0">
    <div @keydown="onKeydown"
      class="text-base gray-700 absolute z-20 flex flex-col bg-white max-w-full max-h-full rounded shadow-xl w-[640px] center-with-translate overflow-y-auto no-border-outline px-4 py-4">
      <div>Rename <span class="font-bold">{{ oldName }}</span> to:</div>
      <input ref="input" v-model="newName" class="p-2 border mt-2"></input>
      <div class="flex justify-end mt-4">
        <button @click="$emit('close')" class="mr-4 px-4 py-1 border border-black hover:bg-gray-100">Cancel</button>
        <button @click="$emit('rename', newName)" :disabled="!canRename"
          class="px-4 py-1 border border-black hover:bg-gray-100 disabled:text-gray-200 disabled:border-gray-200 disabled:hover:bg-white">Rename</button>
      </div>
    </div>
    <div class="bg-black opacity-50 absolute inset-0 z-10"></div>
  </div>
</template>