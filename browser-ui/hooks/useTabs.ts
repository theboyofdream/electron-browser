import { useState, useEffect } from 'react';

type TabData = {
    id: number
    title?: string
    favicon?: string
    url: string,
    loading: number,
    canGoBack: boolean,
    canGoForward: boolean,
    // active: tabData.id === activeTabId
}

export function useTabs() {
    const [tabs, setTabs] = useState<TabData[]>([]);
    const [loadingTabId, setLoadingTabId] = useState(-1)
    const [activeTabId, setActiveTabId] = useState(-1)

    useEffect(() => {
        const fetchTabs = async () => {
            const list = await browser.tab.list();
            setTabs(() => list);
        };

        const handleStartLoading = (_: unknown, id: number) => setLoadingTabId(() => id);
        const handleStopLoading = () => setLoadingTabId(() => -1);

        const handleUpdate = (_: unknown, data: TabData) => {
            setTabs((prev) => prev.map((t) => (t.id === data.id ? { ...t, ...data } : t)));
        };

        const handleSetActive = (_: unknown, id: number) => setActiveTabId(() => id)

        fetchTabs();

        browser.listener('tab:new', fetchTabs);
        browser.listener('tab:closed', fetchTabs);
        browser.listener('tab:start-loading', handleStartLoading);
        browser.listener('tab:stop-loading', handleStopLoading);
        browser.listener('tab:update', handleUpdate);
        browser.listener("tab:setActive", handleSetActive)

        return () => {
            browser.removeListener('tab:new', fetchTabs);
            browser.removeListener('tab:closed', fetchTabs);
            browser.removeListener('tab:start-loading', handleStartLoading);
            browser.removeListener('tab:stop-loading', handleStopLoading);
            browser.removeListener('tab:update', handleUpdate);
            browser.removeListener("tab:setActive", handleSetActive)
        };
    }, []);
    return { tabs, activeTabId, loadingTabId };
};
