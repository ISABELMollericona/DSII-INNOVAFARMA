const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  // Load the local index.html from the same folder and ensure hash route is present.
  // Use a proper file:// URL so fragments (hash) don't make electron try to load a directory path
  // Load index.html normally and then set the hash fragment from the renderer
  // once the page finishes loading. This avoids Electron trying to resolve
  // `file:///.../#/...` which can produce ERR_FILE_NOT_FOUND on some platforms.
  try{
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    mainWindow.webContents.once('did-finish-load', () => {
      try{ mainWindow.webContents.executeJavaScript("location.hash = '#/inicio'"); }catch(_){ }
    });
  }catch(e){
    // fallback - try loadURL with file URL
    try{ const { pathToFileURL } = require('url'); mainWindow.loadURL(pathToFileURL(path.join(__dirname, 'index.html')).toString()); }catch(_){ }
  }

  // Optionally open DevTools when running in dev mode
  if (process.env.ELECTRON_DEV) {
    mainWindow.webContents.openDevTools({ mode: 'undocked' });
  }

  // Open links with target="_blank" in external browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  ipcMain.on('open-external', (event, url) => {
    if (typeof url === 'string' && url.startsWith('http')) shell.openExternal(url);
  });

  return mainWindow;
}

// Single-instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  app.on('second-instance', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w) {
      if (w.isMinimized()) w.restore();
      w.focus();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
