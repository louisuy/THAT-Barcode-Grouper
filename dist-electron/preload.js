"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('api', {
    selectExcel: () => electron_1.ipcRenderer.invoke('dialog:openFile'),
    selectFolder: () => electron_1.ipcRenderer.invoke('dialog:openDirectory'),
    organize: (paths) => electron_1.ipcRenderer.invoke('app:organize', paths),
    getVersion: () => electron_1.ipcRenderer.invoke('app:getVersion'),
    checkForUpdates: () => electron_1.ipcRenderer.invoke('app:checkForUpdates'),
    downloadUpdate: () => electron_1.ipcRenderer.invoke('app:downloadUpdate'),
    installUpdate: () => electron_1.ipcRenderer.invoke('app:installUpdate'),
    onUpdateStatus: (callback) => electron_1.ipcRenderer.on('update-status', (_, data) => callback(data)),
});
