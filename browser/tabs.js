// tabs.js
import Store from "electron-store";
import { randomUUID } from "node:crypto";

// Schema for electron-store (optional but recommended)
const store = new Store({
  schema: {
    tabs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          url: { type: "string" },
          title: { type: "string" },
        },
        required: ["id", "url", "title"],
      },
    },
  },
  defaults: {
    tabs: [{ id: randomUUID(), url: "https://google.com", title: "Google" }],
  },
});

class Tabs {
  constructor() {
    // Load tabs from persistent store
    this.tabs = store.get("tabs");
  }

  // Save current tabs to disk
  _save() {
    store.set("tabs", this.tabs);
  }

  // Open new tab (accepts URL or search query)
  openNew(urlOrSearchQuery) {
    let url = urlOrSearchQuery.trim();

    if (url.length < 1) {
      url = "https://www.google.com";
    }

    // If it's not a valid URL, treat as Google search
    try {
      new URL(url);
    } catch {
      url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    }

    const newTab = {
      id: crypto.randomUUID(),
      url,
      title: "Google",
    };

    this.tabs.push(newTab);
    this._save();
    return newTab;
  }

  // Close tab by ID
  closeTab(id) {
    const index = this.tabs.findIndex((tab) => tab.id === id);
    if (index !== -1) {
      this.tabs.splice(index, 1);
      // Ensure at least one tab remains
      if (this.tabs.length === 0) {
        this.openNew("https://google.com");
      }
      this._save();
    }
  }

  // Switch to tab (for UI highlighting)
  gotoTab(id) {
    // This is mostly for renderer; main process just needs to know which WebContents to show
    // You can emit an event or manage visibility in main.js
    return this.tabs.find((tab) => tab.id === id);
  }

  // Reload tab (you'll call webContents.loadURL(url) from main.js)
  reloadTab(id) {
    const tab = this.tabs.find((tab) => tab.id === id);
    if (tab) {
      // You’ll handle the actual reload in main.js via IPC
      return tab;
    }
  }

  // Get all tabs
  getAll() {
    return this.tabs;
  }

  // Set tab title (e.g., from page title)
  updateTitle(id, title) {
    const tab = this.tabs.find((tab) => tab.id === id);
    if (tab) {
      tab.title = title;
      this._save();
    }
  }
}

// ✅ Correct instantiation: `new Tabs()`, not `Tabs()`
const tabs = new Tabs();

export { tabs };
