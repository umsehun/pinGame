import { BrowserWindow } from 'electron';
import path from 'path';

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

export function createWindow(): BrowserWindow {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: process.env.NODE_ENV === 'production',
        },
    });

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
        // DevTools를 새 창에서 열기
        win.webContents.once('did-finish-load', () => {
            const devToolsWindow = new BrowserWindow({
                width: 1000,
                height: 600,
                title: 'DevTools',
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });
            win.webContents.setDevToolsWebContents(devToolsWindow.webContents);
            win.webContents.openDevTools({ mode: 'detach' });
        });
    } else {
        win.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    return win;
}
