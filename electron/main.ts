import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.autoDownload = false; // Don't download automatically, wait for user input

// Define strict types for our IPC events

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        show: false,
        backgroundColor: '#020617', // Match slate-950
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();

    // Check quietly in the background after 5 seconds
    setTimeout(() => {
        autoUpdater.checkForUpdates();
    }, 5000);
});

// Broadcast status to the renderer
const sendStatusToWindow = (text: string, type: 'status' | 'available' | 'downloaded' | 'error' = 'status') => {
    if (mainWindow) {
        mainWindow.webContents.send('update-status', { text, type });
    }
};

autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
});
autoUpdater.on('update-available', (info) => {
    sendStatusToWindow(`Version ${info.version} available.`, 'available');
});
autoUpdater.on('update-not-available', () => {
    log.info('Update not available.');
});
autoUpdater.on('error', (err) => {
    log.error('Update error:', err);
    // Only notify user of errors if it's important or manual check?
    // Let's keep it quiet for auto-checks via log, but if window is open maybe it's fine.
});
autoUpdater.on('download-progress', (progressObj) => {
    sendStatusToWindow(`Downloading: ${Math.round(progressObj.percent)}%`, 'status');
});
autoUpdater.on('update-downloaded', () => {
    sendStatusToWindow('Update ready to install.', 'downloaded');
});


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
    });
    return result.filePaths[0];
});

ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
    });
    return result.filePaths[0];
});

ipcMain.handle('app:organize', async (_, { excelPath, folderPath, destinationPath }: { excelPath: string; folderPath: string; destinationPath?: string }) => {
    try {
        if (!fs.existsSync(excelPath) || !fs.existsSync(folderPath)) {
            return { success: false, message: 'Invalid paths provided.' };
        }

        // 1. Read Excel
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }) as any[][];

        const prefixMap = new Map<string, string>();

        // Skip header if any, generally row 1
        // Heuristic: Check if first row looks like a header
        let startIndex = 0;
        if (data.length > 0 && typeof data[0][0] === 'string' && data[0][0].toLowerCase().includes('barcode')) {
            startIndex = 1;
        }

        for (let i = startIndex; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length < 2) continue;
            const barcode = String(row[0]).trim(); // Col A
            const prefix = String(row[1]).trim();  // Col B
            if (barcode && prefix) {
                prefixMap.set(prefix, barcode);
            }
        }

        // 2. Process Files
        // Use destination if provided, otherwise output inside source folder
        const outputBase = destinationPath && fs.existsSync(destinationPath) ? destinationPath : folderPath;
        const outputDir = path.join(outputBase, 'Sorted_Images');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        // Helper to recursively get files
        const getAllFiles = (dir: string, fileList: { fullPath: string; fileName: string }[] = []) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                try {
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        // Avoid scanning the output directory if it's inside our source
                        if (path.resolve(fullPath) !== path.resolve(outputDir)) {
                            getAllFiles(fullPath, fileList);
                        }
                    } else {
                        fileList.push({ fullPath, fileName: file });
                    }
                } catch (err) {
                    // Ignore access errors etc
                }
            }
            return fileList;
        };

        const allFiles = getAllFiles(folderPath);
        let moved = 0;
        let errors = 0;

        for (const fileObj of allFiles) {
            const { fullPath, fileName } = fileObj;

            // Skip if it somehow matches the output dir name check (though recursion handles it)
            if (fileName === 'Sorted_Images') continue;

            for (const [prefix, barcode] of prefixMap.entries()) {
                if (fileName.startsWith(prefix)) {
                    try {
                        const targetFolder = path.join(outputDir, barcode);
                        if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder, { recursive: true });

                        const dest = path.join(targetFolder, fileName);

                        // Handle potential name collisions if two subfolders have same filename
                        // For now, simpler is: if dest exists, maybe skip or overwrite?
                        // Original logic was renameSync which overwrites.

                        fs.renameSync(fullPath, dest); // Move
                        moved++;
                    } catch (e) {
                        console.error(e);
                        errors++;
                    }
                    break;
                }
            }
        }

        return {
            success: true,
            moved,
            errors,
            message: `Processed ${allFiles.length} items. Moved ${moved}.`
        };

    } catch (err: any) {
        return { success: false, message: err.message };
    }
});

ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
});

ipcMain.handle('app:checkForUpdates', () => {
    autoUpdater.checkForUpdates();
    return "Checking...";
});

ipcMain.handle('app:downloadUpdate', () => {
    autoUpdater.downloadUpdate();
    return "Downloading...";
});

ipcMain.handle('app:installUpdate', () => {
    autoUpdater.quitAndInstall();
});
