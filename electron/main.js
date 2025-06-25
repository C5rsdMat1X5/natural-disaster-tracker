const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');

ipcMain.on('close-app', (event) => {
  app.quit();
});

let backendProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    transparent: true,
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    frame: false,
    resizable: true,
    hasShadow: false,
    vibrancy: 'fullscreen-ui',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  const { spawn } = require('child_process');
  const backendPath = path.join(__dirname, '../backend/dist/backend');

  backendProcess = spawn(backendPath, {
    shell: true
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`[backend] ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`[backend error] ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend exited with code ${code}`);
  });

  win.loadFile(path.join(__dirname, '../frontend/index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, '..', 'assets', 'icon.png'));
  }
});