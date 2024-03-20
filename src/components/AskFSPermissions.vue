<script>
import { dbGetDirHandle, dbDelDirHandle, pickAnotherDirectory, setStorageFS } from '../notes';
import App from "./App.vue";
import { requestHandlePermission } from '../fileutil';
import { boot } from '../webapp-boot';

export default {
  components: { App },

  data() {
    return {
      dirName: "",
    }
  },

  async mounted() {
    let dh = await dbGetDirHandle();
    this.dirName = dh.name;
  },

  methods: {
    async requestPermissions() {
      let dh = await dbGetDirHandle();
      let ok = await requestHandlePermission(dh, true);
      if (ok) {
        console.log("trying to mount app now")
        await boot()
      } else {
        setStorageFS(null);
      }
    },

    async pickAnotherDirectory() {
      let ok = await pickAnotherDirectory();
      if (ok) {
        await boot()
      }
    },

    async switchToBrowserStorage() {
      await dbDelDirHandle();
      await boot();
    },
  },

}
</script>

<template>
  <div class="mt-8 mx-8 flex flex-col justify-center items-center shadow-xl2 bg-white text-base">
    <div class="mt-2 self-center">Your're storing notes on disk in directory <span class="font-bold">{{ dirName
        }}</span>
    </div>

    <div class="self-center">Due to browser limitations, we need to re-request permission to access the directory.
    </div>
    <div class="flex flex-col mt-4 mb-8 text-sm">
      <button @click="requestPermissions()" class="mt-4 px-4 py-1 border border-black hover:bg-gray-100">Request
        permission for directory <span class="font-bold">{{
      dirName
    }}</span></button>
      <button @click="pickAnotherDirectory()" class="mt-4 px-2 py-1 border border-black hover:bg-gray-100">Pick another
        directory with notes</button>
      <button @click="switchToBrowserStorage()" class="mt-4 px-2 py-1 border border-black hover:bg-gray-100">Switch to
        storing notes in browser</button>
      <a class="mt-4 self-center underline" target="_blank" href="/help-storage.html">learn more</a>
    </div>
  </div>
</template>
