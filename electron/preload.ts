import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    selectExcel: () => ipcRenderer.invoke('dialog:openFile'),
    selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
    organize: (paths: { excelPath: string; folderPath: string; destinationPath?: string }) => ipcRenderer.invoke('app:organize', paths),
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),
    downloadUpdate: () => ipcRenderer.invoke('app:downloadUpdate'),
    installUpdate: () => ipcRenderer.invoke('app:installUpdate'),
    onUpdateStatus: (callback: (data: { text: string; type: string }) => void) => ipcRenderer.on('update-status', (_, data) => callback(data)),
});
