"use strict"

import {
    app,
    BaseWindow,
    BrowserView,
    BrowserWindow,
    ipcMain,
    Menu,
    WebContentsView,
    shell,
    clipboard,
    screen,
    dialog
} from "electron"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import Downloader from "./downloader.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const HEADER_SIZE = 74
/** @type {import('electron').BrowserWindowConstructorOptions} */
const BROWSER_WINDOW_OPTIONS = {
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    frame: false,
    transparent: true,
    autoHideMenuBar: true,
    webPreferences: {
        disableBlinkFeatures: "BlockInsecurePrivateNetworkRequests",
        preload: join(__dirname, "preload.js"),
        devTools: !app.isPackaged,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        safeDialogs: true,
        autoplayPolicy: "user-gesture-required",
        zoomFactor: 1.0
    },
    paintWhenInitiallyHidden: true,
    backgroundMaterial: "none",
    backgroundColor: "#00000000",
    //   show: true,
    show: false
}

Menu.setApplicationMenu(null)

/**
 * @type {{
 *   base: import('electron').BrowserWindow | null,
 *   header: import('electron').BrowserWindow | null,
 *   downloadDropdown: import('electron').BrowserWindow | null,
 *   moreOptions: import('electron').BrowserWindow | null,
 *   webview: import('electron').WebContentsView | null
 * }}
 */
const frames = {
    base: null,
    header: null,
    downloadDropdown: null,
    moreOptions: null,
    webview: null
}

// Very aggressive download detection - treats many URLs as downloads
function isDownloadUrl(url) {
    const downloadPatterns = [
        /\.(exe|zip|rar|7z|tar|gz|pdf|doc|docx|xls|xlsx|ppt|pptx|mp4|mp3|avi|mkv|mov|wav|flac|jpg|jpeg|png|gif|bmp|svg|webp|psd|ai|eps|tiff|iso|dmg|pkg|deb|rpm|apk|msi)$/i
    ]
    return downloadPatterns.some((p) => p.test(url))
}

// Very aggressive download detection - treats many URLs as downloads
function isMaliciousUrl(url) {
    const urlPatterns = [/http:/i]
    return urlPatterns.some((p) => p.test(url))
}

const Dropdowns = {
    /**
     * @param {'downloads'|'more-options'} name
     * @returns {boolean}
     */
    isVisible(name) {
        if (name === "downloads") {
            return frames.base.contentView.children.includes(frames.downloadDropdown)
        }
        if (name === "more-options") {
            return frames.base.contentView.children.includes(frames.moreOptions)
        }
        return false
    },

    /**
     * @param {'downloads'|'more-options'} name
     */
    async show(name) {
        const { width } = frames.base.getContentBounds()
        const targetBounds = {
            x: width - 302,
            y: HEADER_SIZE + 1,
            width: 300,
            height: 200
        }

        // auto-hide the other dropdown
        if (name !== "downloads" && this.isVisible("downloads")) await this.hide("downloads")
        if (name !== "more-options" && this.isVisible("more-options"))
            await this.hide("more-options")

        if (name === "downloads") {
            frames.downloadDropdown.setBounds({ ...targetBounds, height: 380 })
            frames.base.contentView.addChildView(frames.downloadDropdown)
        }

        if (name === "more-options") {
            frames.moreOptions.setBounds(targetBounds)
            frames.base.contentView.addChildView(frames.moreOptions)
        }
    },

    /**
     * @param {'downloads'|'more-options'} name
     */
    async hide(name) {
        await new Promise((resolve) => setTimeout(resolve, 600))
        if (name === "downloads" && this.isVisible("downloads")) {
            frames.base.contentView.removeChildView(frames.downloadDropdown)
        }
        if (name === "more-options" && this.isVisible("more-options")) {
            frames.base.contentView.removeChildView(frames.moreOptions)
        }
    },

    async hideAll() {
        await new Promise((resolve) => setTimeout(resolve, 600))
        this.hide("downloads")
        this.hide("more-options")
    },

    /**
     * toggle
     * @param {'downloads'|'more-options'} name
     */
    toggle(name) {
        this.isVisible(name) ? this.hide(name) : this.show(name)
    }
}

/**
 * @type{Map<number, {
 *   id: number,
 *   view: WebContentsView,
 *   title: string,
 *   url: string,
 *   favicon: string,
 *   loading: boolean
 * }>}
 */
let tabs = new Map() // tabId -> { view, title, url, favicon, loading }
let activeTabId = null
let tabCounter = 0

const Tabs = {
    parseQuery(input) {
        try {
            return new URL(input).toString()
        } catch {
            return `https://www.google.com/search?q=${encodeURIComponent(input)}`
        }
    },

    updateRenderer(tabData) {
        frames.header.webContents.send("tab:update", {
            id: tabData.id,
            title: tabData.title,
            url: tabs.get(activeTabId)?.view.webContents.getURL() || tabData.url,
            favicon: tabData.favicon,
            loading: tabData.loading,
            canGoBack: tabData.view.webContents.navigationHistory.canGoBack(),
            canGoForward: tabData.view.webContents.navigationHistory.canGoForward(),
            active: tabData.id === activeTabId
        })
        frames.header.webContents.send("tab:setActive", tabData.id)
    },

    create(query = "https://www.google.com") {
        const id = ++tabCounter
        const view = new WebContentsView()
        const url = this.parseQuery(query)

        // if (isDownloadUrl(url)) {
        //     saveAs(url)
        //     return
        // }
        // if(isMaliciousUrl(url)){

        // }

        const tabData = { id, view, title: "", url, favicon: "", loading: false }
        tabs.set(id, tabData)

        view.webContents.on("did-start-loading", () => {
            tabData.loading = true
            this.updateRenderer(tabData)
        })
        view.webContents.on("did-stop-loading", () => {
            tabData.loading = false
            this.updateRenderer(tabData)
        })
        view.webContents.on("page-title-updated", (_, title) => {
            tabData.title = title
            this.updateRenderer(tabData)
        })
        view.webContents.on("page-favicon-updated", (_, favicons) => {
            tabData.favicon = favicons[0] || ""
            this.updateRenderer(tabData)
        })
        view.webContents.on("will-navigate", (_, url) => {
            tabData.url = url
            this.updateRenderer(tabData)
        })
        view.webContents.on("new-window", (event, url) => {
            event.preventDefault()
            Tabs.create(url)
        })
        view.webContents.setWindowOpenHandler(({ url }) => {
            // open in your Tabs system instead of a real new window
            Tabs.create(url)
            return { action: "deny" } // prevent default new BrowserWindow
        })
        view.webContents.session.on("will-download", (event, item) => {
            event.preventDefault()
            save(item.getURL(), "will download")
        })
        // view.webContents.on("o")
        // view.webContents.on("before-input-event", () => Dropdowns.hideAll())
        // view.webContents.on("input-event", () => Dropdowns.hideAll())
        view.webContents.on("focus", () => Dropdowns.hideAll())
        view.webContents.on("did-fail-load", () => view.webContents.reload, 1000 * 10)
        Array(["did-start-loading", "did-navigate"]).map((startType) =>
            view.webContents.on(startType, () => {
                // Tabs.updateRenderer({
                //     ...tabData,
                //     loading: true
                // })
                frames.header.webContents.send("tab:start-loading", id)
            })
        )
        Array(["did-stop-loading", "did-fail-load"]).map((startType) =>
            view.webContents.on(startType, () => {
                // Tabs.updateRenderer({
                //     ...tabData,
                //     loading: false
                // })
                frames.header.webContents.send("tab:stop-loading", id)
            })
        )

        frames.base.contentView.addChildView(view)
        view.webContents.loadURL(url)
        // activeTabId = id
        // handleWindowResize()
        // handleWindowResize(view)
        // attachContextMenu(view)
        frames.header.webContents.send("tab:new")
        this.show(id)
        // frames.header.webContents.send("tab:setActive", id)

        return id
    },

    close(id) {
        const tab = tabs.get(id)
        if (!tab) return
        frames.base.contentView.removeChildView(tab.view)
        tabs.delete(id)
        if (activeTabId === id) {
            const keys = [...tabs.keys()]
            activeTabId = keys.length ? keys[keys.length - 1] : null
        }
        if (activeTabId) this.show(activeTabId)
        frames.header.webContents.send("tab:closed", id)
    },

    show(id) {
        const tab = tabs.get(id)
        if (!tab) {
            console.log("no tab found with id", id)
            return
        }
        activeTabId = id
        handleWindowResize()
        frames.header.webContents.send("tab:setActive", id)
        attachContextMenu(tab.view)
        // this.updateRenderer(tab)
    },

    navigate(query) {
        const tab = tabs.get(activeTabId)
        if (!tab) return
        const url = this.parseQuery(query)
        tab.view.webContents.loadURL(url)
    },

    reload() {
        tabs.get(activeTabId)?.view.webContents.reload()
    },
    goBack() {
        const tab = tabs.get(activeTabId)
        tab?.view.webContents.navigationHistory.canGoBack() &&
            tab.view.webContents.navigationHistory.goBack()
    },
    goForward() {
        const tab = tabs.get(activeTabId)
        tab?.view.webContents.navigationHistory.canGoForward() &&
            tab.view.webContents.navigationHistory.goForward()
    },

    getMetadata(id) {
        const tab = tabs.get(id)
        if (!tab) return null
        return {
            id: tab.id,
            title: tab.title,
            url: tab.url,
            favicon: tab.favicon,
            loading: tab.loading,
            canGoBack: tab.view.webContents.navigationHistory.canGoBack(),
            canGoForward: tab.view.webContents.navigationHistory.canGoForward(),
            active: tab.id === activeTabId
        }
    },

    list() {
        let list = []
        tabs.forEach((t) => {
            list.push({
                id: t.id,
                title: t.title,
                url: t.url,
                favicon: t.favicon,
                active: t.id === activeTabId
            })
        })
        return list
    }
}

function attachContextMenu(_view) {
    // frames.webview.webContents.on("context-menu", (event, params) => {
    let view = null
    if (_view) {
        view = _view
    } else {
        view = tabs.get(activeTabId)?.view
    }
    if (!view) return
    view.webContents.on("context-menu", (event, params) => {
        const template = []

        // Text selection options
        if (params.selectionText && params.selectionText.trim() !== "" && !params.isEditable) {
            template.push(
                {
                    label: "Copy",
                    role: "copy",
                    enabled: params.editFlags.canCopy
                },
                { label: "Cut", role: "cut", enabled: params.editFlags.canCut },
                {
                    label: "Paste",
                    role: "paste",
                    enabled: params.editFlags.canPaste
                },
                { type: "separator" },
                {
                    label: "Search Google for “" + params.selectionText.substring(0, 25) + "…”",
                    click: () => {
                        Tabs.create(
                            `https://www.google.com/search?q=${encodeURIComponent(
                                params.selectionText
                            )}`
                        )
                    }
                },
                { type: "separator" }
            )
        }

        // Editable fields (input/textarea)
        if (params.isEditable) {
            template.push(
                {
                    label: "Copy",
                    role: "copy",
                    enabled: params.editFlags.canCopy
                },
                { label: "Cut", role: "cut", enabled: params.editFlags.canCut },
                {
                    label: "Paste",
                    role: "paste",
                    enabled: params.editFlags.canPaste
                },
                { label: "Select All", role: "selectAll" },
                { type: "separator" },
                {
                    label: "Undo",
                    role: "undo",
                    enabled: params.editFlags.canUndo
                },
                {
                    label: "Redo",
                    role: "redo",
                    enabled: params.editFlags.canRedo
                },
                { type: "separator" }
            )
        }

        // Link context
        if (params.linkURL) {
            template.push(
                {
                    label: "Open Link in new Tab",
                    click: () => Tabs.create(params.linkURL)
                },
                {
                    label: "Copy Link Address",
                    click: () => clipboard.writeText(params.linkURL)
                },
                { type: "separator" }
            )
        }

        // Image/Video/Audio context
        if (["image", "video", "audio"].includes(params.mediaType.toLowerCase())) {
            const mediaType = params.mediaType
            template.push(
                {
                    label: `Open ${mediaType} in new Tab`,
                    click: () => Tabs.create(params.srcURL)
                },
                {
                    label: `Copy ${mediaType} URL`,
                    click: () => clipboard.writeText(params.srcURL)
                },
                {
                    label: `Save ${mediaType}`,
                    click: () => save(params.srcURL, "save")
                },
                // {
                //     label: `Save ${mediaType} As...`,
                //     click: () => save(params.srcURL, "save as")
                // },
                { type: "separator" }
            )
        }

        // General page actions
        template.push(
            {
                label: "Reload",
                role: "reload",
                click: () => view.webContents.reload()
            },
            {
                label: "Back",
                enabled: view.webContents.navigationHistory.canGoBack(),
                click: () => view.webContents.navigationHistory.goBack()
            },
            {
                label: "Forward",
                enabled: view.webContents.navigationHistory.canGoForward(),
                click: () => view.webContents.navigationHistory.goForward()
            }
        )

        if (!app.isPackaged) {
            template.push(
                { type: "separator" },
                {
                    label: "Inspect Element",
                    click: () => view.webContents.inspectElement(params.x, params.y)
                }
            )
        }

        const menu = Menu.buildFromTemplate(template)
        menu.popup({
            window: BrowserWindow.fromWebContents(view.webContents)
        })
    })
}

/**
 * @param {WebContentsView|undefined|null} view
 */
function handleWindowResize(view) {
    const { x, y, width, height } = frames.base.getContentBounds()
    const WEBVIEW_BOUNDS = {
        x: 0,
        y: HEADER_SIZE,
        width,
        height: height - HEADER_SIZE
    }

    frames.header.setBounds({ x, y, width, height: HEADER_SIZE })
    tabs.forEach(({ id, view }) => {
        if (activeTabId !== id) {
            frames.base.contentView.removeChildView(view)
        } else {
            view.setBounds(WEBVIEW_BOUNDS)
            frames.base.contentView.addChildView(view)
        }
    })
}

const save = async (url, source) => {
    console.debug(source, url)
    await Dropdowns.show("downloads")
    frames.header.webContents.send("downloader:startedDownloading")
    frames.downloadDropdown.webContents.send("downloader:startedDownloading")
    await Downloader.save(url)
    await Dropdowns.show("downloads")
    frames.header.webContents.send("downloader:endededDownloading")
    frames.downloadDropdown.webContents.send("downloader:endededDownloading")
}

const saveAs = async (url) => {
    await Dropdowns.show("downloads")
    frames.header.webContents.send("downloader:startedDownloading")
    frames.downloadDropdown.webContents.send("downloader:startedDownloading")
    await Downloader.saveAs(url)
    await Dropdowns.show("downloads")
    frames.header.webContents.send("downloader:endededDownloading")
    frames.downloadDropdown.webContents.send("downloader:endededDownloading")
}

async function onReady() {
    //----------------------
    // attach IPC listeners
    //----------------------
    ipcMain.removeHandler()
    // window handlers
    ipcMain.handle("window:minimize", () => frames.base?.minimize())
    ipcMain.handle("window:toogleFullscreen", () => {
        if (!frames.base) return
        if (frames.base.isMaximized()) {
            frames.base.unmaximize()
        } else {
            frames.base?.maximize()
        }
    })
    ipcMain.handle("window:close", () => frames.base?.close())
    // // tabs
    ipcMain.handle("tab:new", (_, query) => Tabs.create(query))
    ipcMain.handle("tab:close", (_, id) => Tabs.close(id))
    ipcMain.handle("tab:switch", (_, id) => Tabs.show(id))
    ipcMain.handle("tab:navigate", (_, id, query) => Tabs.navigate(id, query))
    ipcMain.handle("tab:reload", () => Tabs.reload())
    ipcMain.handle("tab:goBack", () => Tabs.goBack())
    ipcMain.handle("tab:goForward", () => Tabs.goForward())
    ipcMain.handle("tab:getMetadata", (_, id) => Tabs.getMetadata(id))
    ipcMain.handle("tab:list", () => Tabs.list())
    // downloader
    ipcMain.handle("downloader:save", (_, url) => save(url, "ipc"))
    ipcMain.handle("downloader:saveAs", (_, url) => saveAs(url))
    ipcMain.handle("downloader:delete", async (_, downloadUrl) => {
        frames.header.webContents.send("downloader:deletingFileStart", true)
        const { success, message } = await Downloader.delete(downloadUrl)
        console.debug({ success, message })
        frames.header.webContents.send("downloader:deletingFileEnd", success)
        return success
    })
    // dropdowns
    ipcMain.handle("dropdown:toggleDownloads", () => Dropdowns.toggle("downloads"))
    ipcMain.handle("dropdown:toggleMoreOptions", () => Dropdowns.toggle("more-options"))
    ipcMain.handle("dropdown:resize", (_, name, width, height) => {
        if (name === "downloads") {
            frames.downloadDropdown.setBounds(width, height)
        } else if (name === "more-options") {
            frames.moreOptions.setBounds(width, height)
        }
    })

    //-------------------
    // initialize frames
    //-------------------
    frames.base = new BrowserWindow({
        ...BROWSER_WINDOW_OPTIONS,
        transparent: false
    })
    // attachContextMenu()
    // frames.webview.webContents.loadURL("https://www.github.com/theboyofdream")

    // frames.webview.webContents.on("did-navigate", () => { })
    // frames.webview.webContents.on("page-title-updated", () => { })

    frames.downloadDropdown = new WebContentsView({
        ...BROWSER_WINDOW_OPTIONS,
        hasShadow: true
    })
    frames.downloadDropdown.webContents.loadURL("http://localhost:3000/downloads-dropdown")
    // frames.downloadDropdown.on("blur", () => Dropdowns.hideAll())
    // frames.downloadDropdown.webContents.openDevTools({ mode: "detach" })

    frames.moreOptions = new WebContentsView({
        ...BROWSER_WINDOW_OPTIONS,
        hasShadow: true
    })
    frames.moreOptions.webContents.loadURL("http://localhost:3000/more-options-dropdown")
    // frames.moreOptions.on("blur", () => Dropdowns.hideAll())

    frames.header = new WebContentsView({
        ...BROWSER_WINDOW_OPTIONS,
        height: HEADER_SIZE,
        show: true
    })
    frames.header.webContents.loadURL("http://localhost:3000/header")
    // frames.header.webContents.openDevTools({ mode: "detach" })

    //----------------------
    // handle window resize
    //----------------------
    frames.base.on("resize", () => handleWindowResize())
    frames.base.on("minimize", () => handleWindowResize())
    frames.base.on("maximize", () => handleWindowResize())
    frames.base.on("responsive", () => handleWindowResize())
    handleWindowResize()

    frames.base.contentView.addChildView(frames.header)
    frames.base.contentView.addChildView(frames.moreOptions)
    frames.base.contentView.addChildView(frames.downloadDropdown)

    frames.base.once("ready-to-show", () => {
        frames.base.show()
        frames.base.maximize()
        Tabs.create()
    })

    frames.header.webContents.on("focus", () => Dropdowns.hideAll())
    // frames.header.webContents.on("before-input-event", () => Dropdowns.hideAll())
    // frames.header.webContents.on("context-menu", (e) => e.preventDefault())
    // frames.base.webContents.on("focus", () => Dropdowns.hideAll())
    // frames.base.webContents.on("before-input-event", () => Dropdowns.hideAll())

    frames.base.on("show", () => {
        frames.base.webContents.invalidate()
        handleWindowResize()
    })
    frames.base.on("resize", () => {
        frames.base.webContents.invalidate()
        handleWindowResize()
    })
    frames.base.on("restore", () => {
        frames.base.webContents.invalidate()
        handleWindowResize()
    })
}

app.whenReady().then(onReady)
