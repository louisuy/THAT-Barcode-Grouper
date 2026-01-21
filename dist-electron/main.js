"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const electron_log_1 = __importDefault(require("electron-log"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const XLSX = __importStar(require("xlsx"));
electron_log_1.default.transports.file.level = 'info';
electron_updater_1.autoUpdater.logger = electron_log_1.default;
electron_updater_1.autoUpdater.autoDownload = false; // Don't download automatically, wait for user input
// Define strict types for our IPC events
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1000,
        height: 800,
        show: false,
        backgroundColor: '#020617', // Match slate-950
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    mainWindow.once('ready-to-show', () => {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.show();
    });
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
}
electron_1.app.whenReady().then(() => {
    createWindow();
    // Check quietly in the background after 5 seconds
    setTimeout(() => {
        electron_updater_1.autoUpdater.checkForUpdates();
    }, 5000);
});
// Broadcast status to the renderer
const sendStatusToWindow = (text, type = 'status') => {
    if (mainWindow) {
        mainWindow.webContents.send('update-status', { text, type });
    }
};
electron_updater_1.autoUpdater.on('checking-for-update', () => {
    electron_log_1.default.info('Checking for update...');
});
electron_updater_1.autoUpdater.on('update-available', (info) => {
    sendStatusToWindow(`Version ${info.version} available.`, 'available');
});
electron_updater_1.autoUpdater.on('update-not-available', () => {
    electron_log_1.default.info('Update not available.');
});
electron_updater_1.autoUpdater.on('error', (err) => {
    electron_log_1.default.error('Update error:', err);
    // Only notify user of errors if it's important or manual check?
    // Let's keep it quiet for auto-checks via log, but if window is open maybe it's fine.
});
electron_updater_1.autoUpdater.on('download-progress', (progressObj) => {
    sendStatusToWindow(`Downloading: ${Math.round(progressObj.percent)}%`, 'status');
});
electron_updater_1.autoUpdater.on('update-downloaded', () => {
    sendStatusToWindow('Update ready to install.', 'downloaded');
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
// IPC Handlers
electron_1.ipcMain.handle('dialog:openFile', () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield electron_1.dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
    });
    return result.filePaths[0];
}));
electron_1.ipcMain.handle('dialog:openDirectory', () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield electron_1.dialog.showOpenDialog({
        properties: ['openDirectory'],
    });
    return result.filePaths[0];
}));
electron_1.ipcMain.handle('app:organize', (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { excelPath, folderPath, destinationPath }) {
    try {
        if (!fs_1.default.existsSync(excelPath) || !fs_1.default.existsSync(folderPath)) {
            return { success: false, message: 'Invalid paths provided.' };
        }
        // 1. Read Excel
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        const prefixMap = new Map();
        // Skip header if any, generally row 1
        // Heuristic: Check if first row looks like a header
        let startIndex = 0;
        if (data.length > 0 && typeof data[0][0] === 'string' && data[0][0].toLowerCase().includes('barcode')) {
            startIndex = 1;
        }
        for (let i = startIndex; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length < 2)
                continue;
            const barcode = String(row[0]).trim(); // Col A
            const prefix = String(row[1]).trim(); // Col B
            if (barcode && prefix) {
                prefixMap.set(prefix, barcode);
            }
        }
        // 2. Process Files
        // Use destination if provided, otherwise output inside source folder
        const outputBase = destinationPath && fs_1.default.existsSync(destinationPath) ? destinationPath : folderPath;
        const outputDir = path_1.default.join(outputBase, 'Sorted_Images');
        if (!fs_1.default.existsSync(outputDir))
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        // Helper to recursively get files
        const getAllFiles = (dir, fileList = []) => {
            const files = fs_1.default.readdirSync(dir);
            for (const file of files) {
                const fullPath = path_1.default.join(dir, file);
                try {
                    const stat = fs_1.default.statSync(fullPath);
                    if (stat.isDirectory()) {
                        // Avoid scanning the output directory if it's inside our source
                        if (path_1.default.resolve(fullPath) !== path_1.default.resolve(outputDir)) {
                            getAllFiles(fullPath, fileList);
                        }
                    }
                    else {
                        fileList.push({ fullPath, fileName: file });
                    }
                }
                catch (err) {
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
            if (fileName === 'Sorted_Images')
                continue;
            for (const [prefix, barcode] of prefixMap.entries()) {
                if (fileName.startsWith(prefix)) {
                    try {
                        const targetFolder = path_1.default.join(outputDir, barcode);
                        if (!fs_1.default.existsSync(targetFolder))
                            fs_1.default.mkdirSync(targetFolder, { recursive: true });
                        const dest = path_1.default.join(targetFolder, fileName);
                        // Handle potential name collisions if two subfolders have same filename
                        // For now, simpler is: if dest exists, maybe skip or overwrite?
                        // Original logic was renameSync which overwrites.
                        fs_1.default.renameSync(fullPath, dest); // Move
                        moved++;
                    }
                    catch (e) {
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
    }
    catch (err) {
        return { success: false, message: err.message };
    }
}));
electron_1.ipcMain.handle('app:getVersion', () => {
    return electron_1.app.getVersion();
});
electron_1.ipcMain.handle('app:checkForUpdates', () => {
    electron_updater_1.autoUpdater.checkForUpdates();
    return "Checking...";
});
electron_1.ipcMain.handle('app:downloadUpdate', () => {
    electron_updater_1.autoUpdater.downloadUpdate();
    return "Downloading...";
});
electron_1.ipcMain.handle('app:installUpdate', () => {
    electron_updater_1.autoUpdater.quitAndInstall();
});
