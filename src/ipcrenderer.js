// TODO: this is remnant on electron codebase, there's probably a better way

class IpcRenderer {
  constructor() {
    this.callbacks = {};
  }

  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  send(event, ...args) {
    if (this.callbacks[event]) {
      for (const callback of this.callbacks[event]) {
        callback(null, ...args);
      }
    }
  }
}

export const ipcRenderer = new IpcRenderer();
