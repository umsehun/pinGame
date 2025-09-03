import { BrowserWindow, app, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: process.env.NODE_ENV === "production"
    }
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.once("did-finish-load", () => {
      const devToolsWindow = new BrowserWindow({
        width: 1e3,
        height: 600,
        title: "DevTools",
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });
      win.webContents.setDevToolsWebContents(devToolsWindow.webContents);
      win.webContents.openDevTools({ mode: "detach" });
    });
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  return win;
}
class GameController {
  static instance;
  simfile = null;
  constructor() {
    console.log("GameController initialized");
  }
  static getInstance() {
    if (!GameController.instance) {
      GameController.instance = new GameController();
    }
    return GameController.instance;
  }
  getSong() {
    return this.simfile;
  }
  async loadSong() {
    try {
      const __filename2 = fileURLToPath(import.meta.url);
      const __dirname2 = path.dirname(__filename2);
      const projectRoot = path.resolve(__dirname2, "../..");
      const songDir = path.join(projectRoot, "public", "Bad Apple!! feat. nomico");
      const smPath = path.join(songDir, "Bad Apple!! feat. nomico.sm");
      console.log(`Attempting to load simfile from: ${smPath}`);
      if (!fs.existsSync(smPath)) {
        console.error("Simfile not found at path:", smPath);
        return;
      }
      const fileContent = await fs.promises.readFile(smPath, "utf-8");
      this.simfile = this.parseSmFile(fileContent);
      if (this.simfile) {
        console.log("Simfile loaded successfully:");
        console.log(`Title: ${this.simfile.title}`);
        console.log(`Artist: ${this.simfile.artist}`);
        console.log(`BPMs: ${this.simfile.bpms.map((b) => b.value).join(", ")}`);
        console.log(`Found ${this.simfile.notes.length} note sections.`);
      }
    } catch (error) {
      console.error("Failed to load or parse simfile:", error);
    }
  }
  parseSmFile(content) {
    try {
      const lines = content.split(";");
      const data = {};
      let notesData = [];
      lines.forEach((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("#")) {
          const match = trimmedLine.match(/^#([^:]+):([^;]*)/);
          if (match) {
            const key = match[1].toUpperCase();
            const value = match[2];
            if (key === "NOTES") {
              notesData.push(value);
            } else {
              data[key] = value;
            }
          }
        }
      });
      const bpms = (data.BPMS || "").split(",").map((s) => {
        const [beat, value] = s.split("=").map(Number);
        return { beat, value };
      });
      return {
        title: data.TITLE || "",
        artist: data.ARTIST || "",
        bpms,
        notes: notesData
      };
    } catch (error) {
      console.error("Failed to parse .sm file content:", error);
      return null;
    }
  }
}
function bootstrap() {
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
  app.whenReady().then(async () => {
    ipcMain.handle("get-song-data", () => {
      const gameController2 = GameController.getInstance();
      return gameController2.getSong();
    });
    console.log("Main process started.");
    const gameController = GameController.getInstance();
    await gameController.loadSong();
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}
bootstrap();
