import useSWR from "swr"
import { SERVER_URL } from "./constants"

type DownloadItem = {
    name: string,
    size: number,
    sizeFormatted: string,
    modified: number,
    previewUrl: string,
    downloadUrl: string,
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export const useDownloads = () => {
    const { data, error, mutate, isLoading } = useSWR(`${SERVER_URL}/downloads`, fetcher)

    // data.files will be your downloadItems
    const downloadItems: DownloadItem[] = data?.files || []

    return {
        downloadItems,
        isLoading,
        error,
        refresh: mutate // call refresh() to refetch
    }
}
