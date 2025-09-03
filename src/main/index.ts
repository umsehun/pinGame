import { app, ipcMain, BrowserWindow, dialog } from 'electron';
import { createWindow } from './core/window';
import fs from 'fs/promises';
import path from 'path';


function bootstrap() {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.whenReady().then(() => {
    // File selection handler
    ipcMain.handle('dialog:openFile', async () => {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'StepMania Files', extensions: ['sm'] }],
      });
      if (!canceled) {
        return filePaths[0];
      }
      return undefined;
    });

    // File loading handler
    ipcMain.handle('file:load', async (event, filePath: string) => {
      try {
        const smText = await fs.readFile(filePath, 'utf-8');
        const dir = path.dirname(filePath);
        const files = await fs.readdir(dir);
        const audioFile = files.find(f => f.endsWith('.ogg') || f.endsWith('.mp3'));

        let audioDataUrl = null;
        if (audioFile) {
          const audioPath = path.join(dir, audioFile);
          const audioBuffer = await fs.readFile(audioPath);
          const mimeType = audioFile.endsWith('.ogg') ? 'audio/ogg' : 'audio/mpeg';
          audioDataUrl = `data:${mimeType};base64,${audioBuffer.toString('base64')}`;
        }

        return { smText, audioDataUrl };
      } catch (error) {
        console.error('Failed to read file:', error);
        return null;
      }
    });

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

bootstrap();
