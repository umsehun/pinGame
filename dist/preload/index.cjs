"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  getSongData: () => electron.ipcRenderer.invoke("get-song-data")
});
