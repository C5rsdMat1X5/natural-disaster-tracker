const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');

ipcMain.on('close-app', (event) => {
  app.quit();
});

let backendProcess;

function createWindow() {
  const isDev = !app.isPackaged;
  const win = new BrowserWindow({
    width: 1400,
    height: 850,
    transparent: true,
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    frame: false,
    resizable: true,
    hasShadow: false,
    vibrancy: 'fullscreen-ui',
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  const { spawn } = require('child_process');
  const backendPath = isDev
    ? path.join(__dirname, '..', 'backend', 'dist', 'backend')
    : path.join(process.resourcesPath, 'backend');

  backendProcess = spawn(backendPath);
  console.log(`[backend] started with PID ${backendProcess.pid}`);

  backendProcess.stdout.on('data', (data) => {
    console.log(`[backend] ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`[backend error] ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend exited with code ${code}`);
  });

  win.loadFile(path.join(__dirname, '..', 'frontend', 'index.html'));
}


app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});

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