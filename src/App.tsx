import { useState } from 'react';
import { Archive, FileSpreadsheet, FolderOpen, FolderOutput, Play, CheckCircle, AlertCircle, AlertTriangle, RefreshCw, ShieldCheck, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for classes
function cn(...inputs: any[]) {
    return twMerge(clsx(inputs));
}

export default function App() {
    const [excelPath, setExcelPath] = useState<string>('');
    const [folderPath, setFolderPath] = useState<string>('');
    const [destinationPath, setDestinationPath] = useState<string>('');
    const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; msg: string }>({ type: 'idle', msg: '' });

    const handleSelectExcel = async () => {
        const path = await (window as any).api.selectExcel();
        if (path) setExcelPath(path);
    };

    const handleSelectFolder = async () => {
        const path = await (window as any).api.selectFolder();
        if (path) setFolderPath(path);
    };

    const handleSelectDestination = async () => {
        const path = await (window as any).api.selectFolder();
        if (path) setDestinationPath(path);
    };

    const handleProcess = async () => {
        if (!excelPath || !folderPath) return;
        setStatus({ type: 'loading', msg: 'Processing files...' });

        try {
            const result = await (window as any).api.organize({ excelPath, folderPath, destinationPath });
            if (result.success) {
                setStatus({ type: 'success', msg: result.message });
            } else {
                setStatus({ type: 'error', msg: result.message });
            }
        } catch (e: any) {
            setStatus({ type: 'error', msg: 'An unexpected error occurred.' });
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans selection:bg-purple-500/30">
            <div className="max-w-xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col items-center">
                    <div className="w-full flex justify-between items-center mb-4">
                        <UpdateChecker />
                    </div>

                    <div className="bg-gradient-to-tr from-purple-500 to-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/20 mb-4">
                        <Archive className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Barcode Grouper</h1>
                    <p className="text-slate-400 mt-2">Organize your product images instantly.</p>
                </div>

                {/* Main Card */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm space-y-6 shadow-xl">

                    {/* Step 1: Excel */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-400 ml-1">1. MAPPING FILE</label>
                        <button
                            onClick={handleSelectExcel}
                            className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 group",
                                excelPath ? "bg-emerald-500/10 border-emerald-500/50" : "bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
                            )}
                        >
                            <div className={cn("p-2 rounded-lg", excelPath ? "bg-emerald-500/20" : "bg-slate-700")}>
                                <FileSpreadsheet className={cn("w-6 h-6", excelPath ? "text-emerald-400" : "text-slate-400")} />
                            </div>
                            <div className="text-left flex-1 truncate">
                                <div className={cn("font-medium", excelPath ? "text-emerald-300" : "text-slate-300")}>
                                    {excelPath ? excelPath.split('\\').pop() : "Select Excel File"}
                                </div>
                                {excelPath && <div className="text-xs text-emerald-500/70 truncate">{excelPath}</div>}
                            </div>
                        </button>
                    </div>

                    {/* Step 2: Folder */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-400 ml-1">2. SOURCE FOLDER</label>
                        <button
                            onClick={handleSelectFolder}
                            className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 group",
                                folderPath ? "bg-blue-500/10 border-blue-500/50" : "bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
                            )}
                        >
                            <div className={cn("p-2 rounded-lg", folderPath ? "bg-blue-500/20" : "bg-slate-700")}>
                                <FolderOpen className={cn("w-6 h-6", folderPath ? "text-blue-400" : "text-slate-400")} />
                            </div>
                            <div className="text-left flex-1 truncate">
                                <div className={cn("font-medium", folderPath ? "text-blue-300" : "text-slate-300")}>
                                    {folderPath ? folderPath.split('\\').pop() : "Select Images Folder"}
                                </div>
                                {folderPath && <div className="text-xs text-blue-500/70 truncate">{folderPath}</div>}
                            </div>
                        </button>
                    </div>

                    {/* Step 3: Destination (Optional) */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-400 ml-1">3. DESTINATION FOLDER <span className="text-slate-600">(Optional)</span></label>
                        <button
                            onClick={handleSelectDestination}
                            className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 group",
                                destinationPath ? "bg-amber-500/10 border-amber-500/50" : "bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
                            )}
                        >
                            <div className={cn("p-2 rounded-lg", destinationPath ? "bg-amber-500/20" : "bg-slate-700")}>
                                <FolderOutput className={cn("w-6 h-6", destinationPath ? "text-amber-400" : "text-slate-400")} />
                            </div>
                            <div className="text-left flex-1 truncate">
                                <div className={cn("font-medium", destinationPath ? "text-amber-300" : "text-slate-300")}>
                                    {destinationPath ? destinationPath.split('\\').pop() : "Select Destination (or use Source)"}
                                </div>
                                {destinationPath && <div className="text-xs text-amber-500/70 truncate">{destinationPath}</div>}
                            </div>
                        </button>
                    </div>

                    {/* Warning if no destination */}
                    {folderPath && !destinationPath && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-amber-300 text-sm">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            <span>Files will be grouped <strong>within</strong> the Source Folder.</span>
                        </div>
                    )}

                    {/* Action */}
                    <button
                        onClick={handleProcess}
                        disabled={!excelPath || !folderPath || status.type === 'loading'}
                        className={cn(
                            "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-[0.98]",
                            (!excelPath || !folderPath)
                                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25"
                        )}
                    >
                        {status.type === 'loading' ? (
                            <>Processing...</>
                        ) : (
                            <><Play className="w-5 h-5 fill-current" /> DO IT</>
                        )}
                    </button>

                    {/* Status */}
                    {status.type !== 'idle' && (
                        <div className={cn(
                            "p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                            status.type === 'success' ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" :
                                status.type === 'error' ? "bg-red-500/10 text-red-300 border border-red-500/20" :
                                    "bg-slate-800 text-slate-300"
                        )}>
                            {status.type === 'success' && <CheckCircle className="w-5 h-5" />}
                            {status.type === 'error' && <AlertCircle className="w-5 h-5" />}
                            {status.msg}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center pt-4">
                    <p className="text-xs text-slate-700">Built with Electron & React • Proprietary MAF</p>
                </div>
            </div>
        </div>
    );
}

function UpdateChecker() {
    const [version, setVersion] = useState<string>('');
    const [updateStatus, setUpdateStatus] = useState<{ text: string; type: string } | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    useState(() => {
        (window as any).api.getVersion().then(setVersion);
        (window as any).api.onUpdateStatus((data: { text: string; type: string }) => {
            setUpdateStatus(data);
            setIsChecking(false);
        });
    });

    const checkUpdates = () => {
        setIsChecking(true);
        (window as any).api.checkForUpdates();
    };

    const downloadUpdate = () => {
        setUpdateStatus({ text: 'Starting download...', type: 'status' });
        (window as any).api.downloadUpdate();
    };

    if (!version) return <div className="h-6 w-20 bg-slate-900 animate-pulse rounded" />;

    return (
        <div className="flex items-center gap-4 w-full">
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full text-[10px] font-medium text-slate-500">
                <span className="text-slate-400 uppercase tracking-wider">v{version}</span>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <button
                    onClick={checkUpdates}
                    disabled={isChecking}
                    className="flex items-center gap-1.5 hover:text-purple-400 transition-colors group"
                >
                    <RefreshCw className={cn("w-3 h-3", isChecking && "animate-spin text-purple-500")} />
                    {isChecking ? "Checking..." : "Check"}
                </button>
            </div>

            {updateStatus && updateStatus.type !== 'status' && (
                <div className={cn(
                    "flex items-center gap-3 px-3 py-1.5 rounded-xl border animate-in slide-in-from-right-4 transition-all duration-500",
                    updateStatus.type === 'available' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                )}>
                    {updateStatus.type === 'available' ? (
                        <>
                            <div className="flex items-center gap-2">
                                <Download className="w-4 h-4 animate-bounce" />
                                <span className="text-xs font-semibold">{updateStatus.text}</span>
                            </div>
                            <button
                                onClick={downloadUpdate}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] px-2 py-0.5 rounded font-bold transition-colors"
                            >
                                GET
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" />
                                <span className="text-xs font-semibold">Ready to install!</span>
                            </div>
                            <button
                                onClick={() => (window as any).api.installUpdate()}
                                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10px] px-2 py-0.5 rounded font-bold transition-colors"
                            >
                                RESTART
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
