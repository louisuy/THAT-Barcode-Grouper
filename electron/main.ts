import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

// Define strict types for our IPC events

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(createWindow);

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
        const files = fs.readdirSync(folderPath);
        let moved = 0;
        let errors = 0;
        // Use destination if provided, otherwise output inside source folder
        const outputBase = destinationPath && fs.existsSync(destinationPath) ? destinationPath : folderPath;
        const outputDir = path.join(outputBase, 'Sorted_Images');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });


        for (const file of files) {
            // Skip directories and the output dir itself
            if (file === 'Sorted_Images') continue;

            for (const [prefix, barcode] of prefixMap.entries()) {
                if (file.startsWith(prefix)) {
                    try {
                        const targetFolder = path.join(outputDir, barcode);
                        if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder, { recursive: true });

                        const src = path.join(folderPath, file);
                        const dest = path.join(targetFolder, file);
                        fs.renameSync(src, dest); // Move
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
            message: `Processed ${files.length} items. Moved ${moved}.`
        };

    } catch (err: any) {
        return { success: false, message: err.message };
    }
});
