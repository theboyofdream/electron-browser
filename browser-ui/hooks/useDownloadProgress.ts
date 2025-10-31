import { useEffect, useState } from "react"
import { SERVER_URL } from "./constants"

type DownloadProgress = {
    status: 'downloading' | 'success' | 'error'
    totalBytes: number
    downloadedBytes: number
    fileName: string
    message?: string
    previewUrl?: string
    downloadUrl?: string
    size?: number
}

type ActiveDownloads = Record<string, DownloadProgress>
export const useDownloadProgress = () => {
    const [activeDownloads, setActiveDownloads] = useState<ActiveDownloads>({});
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reconnectCount, setReconnectCount] = useState(0);

    useEffect(() => {
        const eventSource = new EventSource(`${SERVER_URL}/download-progress`, {
            withCredentials: true,
        });

        eventSource.onopen = () => {
            setIsLoading(false);
            setError(null);
            setReconnectCount(0); // reset on successful open
        };

        eventSource.addEventListener('progress', (e) => {
            try {
                const data = JSON.parse(e.data) as ActiveDownloads;
                setActiveDownloads(data);
            } catch (err) {
                console.warn('Failed to parse SSE data:', e.data);
            }
        });

        eventSource.onerror = (err) => {
            console.warn('SSE connection issue (may auto-reconnect):', err);

            // Optional: track reconnect attempts
            setReconnectCount((c) => c + 1);

            // Only show error if it's likely permanent
            // e.g., after 3 failed reconnects, or if readyState is CLOSED
            if (eventSource.readyState === EventSource.CLOSED) {
                setError('Connection lost. Please refresh the page.');
                setIsLoading(false);
            }
            // Otherwise: stay quiet — browser will auto-reconnect
        };

        return () => {
            eventSource.close();
        };
    }, [SERVER_URL]);

    return {
        activeDownloads,
        isLoading,
        error,
        reconnectCount, // optional: for debugging
    };
};
