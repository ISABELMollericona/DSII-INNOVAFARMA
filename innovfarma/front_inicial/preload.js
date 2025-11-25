const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url) => ipcRenderer.send('open-external', url),
  env: {
    isElectron: true,
    platform: process.platform,
    // default backend URL expected when running Electron locally
    // the app can override this if needed
    backendUrl: process.env.BACKEND_URL || 'http://localhost:5000'
  }
});
