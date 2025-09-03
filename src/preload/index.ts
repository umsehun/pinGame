import { contextBridge, ipcRenderer } from 'electron';

const api = {
  selectFile: (): Promise<string | undefined> => ipcRenderer.invoke('dialog:openFile'),
  loadFile: (filePath: string): Promise<{ smText: string; audioDataUrl: string | null }> => ipcRenderer.invoke('file:load', filePath),
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (for non-context-isolated environments)
  window.electron = api;
}
