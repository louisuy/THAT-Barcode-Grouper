import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    selectExcel: () => ipcRenderer.invoke('dialog:openFile'),
    selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
    organize: (paths: { excelPath: string; folderPath: string }) => ipcRenderer.invoke('app:organize', paths),
});
