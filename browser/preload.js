const { contextBridge, ipcRenderer } = require("electron")

// contextBridge.exposeInMainWorld('electronAPI', {
//   newTab: (url) => {
//     console.log(url)
//     ipcRenderer.invoke('tab:new', url)
//   }
// });

// "use strict";
// // import { contextBridge, app, ipcMain, ipcRenderer } from "electron";
// const { contextBridge, app, ipcMain, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("browser", {
    // Tab control
    window: {
        minimize: () => ipcRenderer.invoke("window:minimize"),
        toogleFullscreen: () => ipcRenderer.invoke("window:toogleFullscreen"),
        close: () => ipcRenderer.invoke("window:close"),
        toggleDownloadsDropdown: () => ipcRenderer.invoke("dropdown:toggleDownloads"),
        toggleMoreOptionsDropdown: () => ipcRenderer.invoke("dropdown:toggleMoreOptions")
    },
    tab: {
        new: (query) => ipcRenderer.invoke("tab:new", query),
        navigate: (id, query) => ipcRenderer.invoke("tab:navigate", id, query),
        reload: () => ipcRenderer.invoke("tab:reload"),
        goBack: () => ipcRenderer.invoke("tab:goBack"),
        goForward: () => ipcRenderer.invoke("tab:goForward"),
        switch: (id) => ipcRenderer.invoke("tab:switch", id),
        close: (id) => ipcRenderer.invoke("tab:close", id),
        list: () => ipcRenderer.invoke("tab:list")
    },
    dropdown: {
        /**
         * @param {"downloads"|"more-options"} name
         * @param {number} width
         * @param {number} height
         */
        resize: (name, width, height) => ipcRenderer.invoke("resize-dropdown", name, width, height)
    },
    downloader: {
        save: (url) => ipcRenderer.invoke("downloader:save", url),
        saveAs: (url) => ipcRenderer.invoke("downloader:saveAs", url),
        delete: (downloadUrl) => ipcRenderer.invoke("downloader:delete", downloadUrl)
    },
    listener: (channel, listener) => ipcRenderer.on(channel, listener),
    removeListener: (channel, listener) => ipcRenderer.removeListener(channel, listener)
})

// // tab: {
// //   // new: (query) => ipcRenderer.invoke('tab:new', query),
// //   // close: (id) => ipcRenderer.invoke('tab:close', id),
// //   // activate: (id) => ipcRenderer.invoke('tab:activate', id),
// //   // navigate: (id, url) => ipcRenderer.invoke('tab:navigate', id, url),
// //   // reload: (id) => ipcRenderer.invoke('tab:reload', id),
// //   // goBack: (id) => ipcRenderer.invoke('tab:go-back', id),
// //   // goForward: (id) => ipcRenderer.invoke('tab:go-forward', id),
// //   // list: () => ipcRenderer.invoke('tab:list'),
// //   // get: (id) => ipcRenderer.invoke('tab:get', id),
// // },
// // // Listen to events
// // onUrlUpdated: (callback) => {
// //   ipcRenderer.on('tab:url-updated', (event, data) => callback(data));
// //   return () => ipcRenderer.removeListener('tab:url-updated', callback);
// // },
// // onTitleUpdated: (callback) => {
// //   ipcRenderer.on('tab:title-updated', (event, data) => callback(data));
// //   return () => ipcRenderer.removeListener('tab:title-updated', callback);
// // },
// // // Required IPC handlers in main.js
// // ipcMain.handle('tab:new', (e, q) => { /* ... */ });
// // ipcMain.handle('tab:close', (e, id) => { /* ... */ });
// // ipcMain.handle('tab:activate', (e, id) => { /* ... */ });
// // ipcMain.handle('tab:navigate', (e, id, url) => { /* ... */ });
// // ipcMain.handle('tab:reload', (e, id) => { /* ... */ });
// // ipcMain.handle('tab:go-back', (e, id) => { /* ... */ });
// // ipcMain.handle('tab:go-forward', (e, id) => { /* ... */ });
// // ipcMain.handle('tab:list', () => tabs.getAll());
// // ipcMain.handle('tab:get', (e, id) => tabs.gotoTab(id));

// // // And emit events:
// // webContents.on('did-navigate', (e, url) => {
// //   mainWindow.webContents.send('tab:url-updated', { tabId, url });
// // });
// // webContents.on('page-title-updated', (e, title) => {
// //   mainWindow.webContents.send('tab:title-updated', { tabId, title });
// // });
