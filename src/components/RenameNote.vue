<script>
import { getLatestNoteNames, sanitizeNoteName } from '../notes'

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
    sanitizedNewName() {
      return sanitizeNoteName(this.newName)
    },

    canRename() {
      let name = this.sanitizedNewName
      if (name === "") {
        return false
      }
      let noteNames = getLatestNoteNames()
      return !noteNames.includes(name)
    },

    renameError() {
      let name = this.sanitizedNewName
      if (name === "") {
        return "name cannot be empty"
      }
      let noteNames = getLatestNoteNames()
      if (noteNames.includes(name)) {
        return "name already exists"
      }
      return ""
    }
  },

  methods: {
    onKeydown(event) {
      if (event.key === "Escape") {
        this.$emit("close")
      }
      if (this.canRename) {
        if (event.key === "Enter") {
          this.emitRename();
        }
      }
    },

    focusInput() {
      console.log("focusInput")
      let input = /** @type {HTMLElement} */(this.$refs.input);
      input.focus();
    },

    emitRename() {
      this.$emit("rename", this.sanitizedNewName)
    }
  },

  mounted() {
    console.log("RenameNote mounted: oldName:", this.oldName)
    this.newName = this.oldName
    this.focusInput()
  },

}
</script>

<template>
  <div class="fixed inset-0">
    <form @keydown="onKeydown" tabindex="-1"
      class="text-base gray-700 absolute z-20 flex flex-col bg-white max-w-full max-h-full rounded shadow-xl w-[640px] center-with-translate overflow-y-auto no-border-outline px-4 py-4">
      <div>Rename <span class="font-bold">{{ oldName }}</span> to:</div>
      <input ref="input" v-model="newName" class="p-2 border mt-2"></input>
      <div class="text-sm mt-2">New name: <span class="font-bold">"{{ sanitizedNewName }}"</span> <span
          v-if="!canRename" class="text-red-500 font-bold">{{ renameError }}</span></div>
      <div class="flex justify-end mt-2">
        <button @click="$emit('close')" class="mr-4 px-4 py-1 border border-black hover:bg-gray-100">Cancel</button>
        <button @click="emitRename" :disabled="!canRename"
          class="px-4 py-1 border border-black hover:bg-gray-100 disabled:text-gray-200 disabled:border-gray-200 disabled:hover:bg-white default:bg-slate-700"
          default>Rename</button>
      </div>
    </form>
    <div class="bg-black opacity-50 absolute inset-0 z-10">
    </div>
  </div>
</template>