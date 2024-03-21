<script>
export default {
  props: [
    "message",
    "undoAction",
    "undoText",
  ],
}
</script>
<template>
  <div class="flex self-center grow justify-between items-center my-1 pl-2">
    <div class="">
      {{ message }}
    </div>
    <button @click="undoAction()" class="border border-white px-2 py-1 hover:bg-white hover:text-blue-600">
      {{ undoText || "Undo" }}
    </button>
  </div>
</template>
