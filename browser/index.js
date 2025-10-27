import { app, BrowserWindow, WebContentsView, ipcMain } from 'electron';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let mainWindow;
let tabs = [];
const HEADER_HEIGHT = 70;

app.whenReady().then(() => {
  // Main window
  mainWindow = new BrowserWindow({
    x: 0,
    y:0,
    width: 800,
    height: 600,
    frame: false,
    transparent: true,
    webPreferences: { contextIsolation: true }
  });

  
  // IPC for header buttons
  ipcMain.handle('tab:new', (_, url) => {
    console.log({url})
    addTab(url)
  });

  // Header as separate BrowserWindow with preload
  const headerWin = new BrowserWindow({
    parent: mainWindow,
    x: 0,
    y: 0,
    width: 800,
    height: HEADER_HEIGHT,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  // headerWin.loadFile(join(__dirname, 'rgui/header.html'));
  headerWin.loadURL("http://localhost:3000");

   // Header as separate BrowserWindow with preload
  const downloadWin = new BrowserWindow({
    parent: mainWindow,
    x: 0,
    y: HEADER_HEIGHT + 3,
    width: 320,
    height: 100,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  downloadWin.loadFile(join(__dirname, 'rgui/header.html'));
  // downloadWin.loadURL("http://localhost:3000");

  // Add initial tab
  addTab('https://google.com');

  // Resize header + tabs on main window resize
  mainWindow.on('resize', () => {
    const [w, h] = mainWindow.getSize();
    headerWin.setBounds({ x: 0, y: 0, width: w, height: HEADER_HEIGHT });
    tabs.forEach((tab) => tab.setBounds({ x: 0, y: HEADER_HEIGHT, width: w, height: h - HEADER_HEIGHT }));
  });
});
let activeTab = null;

function addTab(url) {
  const view = new WebContentsView();
  view.webContents.loadURL(url);

  const [w, h] = mainWindow.getSize();
  view.setBounds({ x: 0, y: HEADER_HEIGHT, width: w, height: h - HEADER_HEIGHT });

  mainWindow.contentView.addChildView(view);
  tabs.push(view);

  // make new tab active
  if (activeTab) mainWindow.contentView.removeChildView(activeTab);
  activeTab = view;
}



// "use strict";

// import { join, dirname } from "node:path";
// import { fileURLToPath } from "node:url";
// import { app, BrowserWindow, ipcMain, Menu, WebContentsView, session, BaseWindow, BrowserView } from "electron";
// import { readFileSync } from "node:fs";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
// const HEADER_SIZE = 74

// Menu.setApplicationMenu(null);

// let window = null;

// app.whenReady().then(async() => {

//   ipcMain.on("window:minimize", () => window?.minimize());
//   ipcMain.on("window:maximize", () => window?.maximize());
//   ipcMain.on("window:close", () => window?.close());

//   window = new BaseWindow({
//     width: 800,
//     height: 600,
//     frame: false,
//     transparent: true,
//     autoHideMenuBar: true,
//     webPreferences: {
//       disableBlinkFeatures: 'BlockInsecurePrivateNetworkRequests',
//       preload: join(__dirname, "preload.js"),
//       // devTools: !app.isPackaged,
//       contextIsolation: true,
//       nodeIntegration: false,
//       // sandbox: true,
//       // safeDialogs: true,
//     },
//     show: true,
//   });
  

//   const webview = new WebContentsView();
//   window.contentView.addChildView(webview);
//   webview.webContents.loadURL("https://electronjs.org");
//   webview.setBounds({ x: 0, y: HEADER_SIZE, width: 800, height: 600 - HEADER_SIZE });
 
//   const header = new WebContentsView();
//   window.contentView.addChildView(header);
//   header.setBounds({ x: 0, y: 0, width: 800, height: HEADER_SIZE });
//   header.webContents.loadFile(join(__dirname, "rgui/header.html"));
//   header.webContents.openDevTools({ "mode": "detach" })
//   await webview.webContents.executeJavaScript(readFileSync(join(__dirname, "preload.js"), "utf8"));


//   window.on("resize", () => {
//     const [width, height] = window.getSize(); 
//     webview.setBounds({
//       x: 0,
//       y: HEADER_SIZE,
//       width,
//       height: height - HEADER_SIZE,
//     });

//     header.setBounds({x:0,y:0, width, height:HEADER_SIZE})
//   });

//   if (!app.isPackaged) {
//     window.webContents.openDevTools({ mode: "detach" });
//   }

//   // Set CSP for the session
//   window.webContents.session.setContentSecurityPolicy(
//     "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
//   );

//   app.on("activate", () => {
//     if (BrowserWindow.getAllWindows().length === 0) createWindow();
//   });
// });

// app.on("window-all-closed", () => {
//   if (process.platform !== "darwin") app.quit();
// });
