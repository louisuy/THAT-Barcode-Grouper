# Barcode Grouper

A modern desktop application built with **Electron** and **React** to organize product images by grouping them into folders based on their barcode identifier.

![App Screenshot](https://via.placeholder.com/800x600?text=App+Screenshot+Placeholder)

## Features
-   **Excel Mapping**: Reads a mapping file (Col A: Barcode, Col B: Filename Prefix).
-   **Bulk Organization**: Scans a source folder and moves images into barcode-named subfolders.
-   **Destination Control**: Optionally specify a separate destination folder.
-   **Privacy Focused**: Runs entirely offline (Local File System). No cloud uploads.
-   **Dark Mode UI**: Sleek, modern interface using TailwindCSS.

## Installation

### Portable (Windows)
1.  Download `BarcodeGrouper_Release_v1.0.1.zip` from Releases.
2.  Extract the folder.
3.  Run `Barcode Grouper.exe`.

*Note: No installation required.*

## Development

### Prerequisites
-   Node.js (v18+)
-   NPM

### Setup
```bash
git clone https://github.com/louisuy/THAT-Barcode-Grouper.git
cd THAT-Barcode-Grouper
npm install
```

### Run Locally
```bash
npm run electron:dev
```

### Build
To build the portable executable:
```bash
npm run build
```
Output will be in `dist/win-unpacked`.

## Tech Stack
-   **Electron** (Desktop Runtime)
-   **Vite** (Build Tool)
-   **React** (UI Framework)
-   **TailwindCSS** (Styling)
-   **XLSX** (SheetJS - Excel Processing)

## License
Proprietary - Majid Al Futtaim
