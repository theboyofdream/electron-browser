"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle
} from "@/components/ui/item"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { SERVER_URL } from "@/hooks/constants"
import { useDownloadProgress } from "@/hooks/useDownloadProgress"
import { useDownloads } from "@/hooks/useDownloads"
import { useLocalDownloads } from "@/hooks/useLocalDownload"
import { cn } from "@/lib/utils"
import {
    IconDeviceFloppy,
    IconFileFilled,
    IconSearch,
    IconTrash,
    IconRefresh,
    IconFile,
    IconFilesFilled,
    IconTrashFilled,
    IconLoader2
} from "@tabler/icons-react"
import { useEffect, useMemo, useState } from "react"

interface FileItem {
    name: string
    size: number
    sizeFormatted: string
    modified?: Date
    downloadUrl?: string
    previewUrl?: string
}

export default function DownloadsDropdown() {
    // const [downloadItems, setDownloadItems] = useState<FileItem[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const { downloadItems, error, refresh, isLoading } = useDownloads()
    useDownloadProgress()

    useEffect(() => {
        const listenDownloadStart = () => setTimeout(refresh, 1)
        const listenDownloadEnd = () => setTimeout(refresh, 1)
        browser.listener("downloader:startedDownloading", listenDownloadStart)
        browser.listener("downloader:endededDownloading", listenDownloadEnd)

        return () => {
            browser.removeListener("downloader:startedDownloading", listenDownloadStart)
            browser.removeListener("downloader:endededDownloading", listenDownloadEnd)
        }
    }, [])

    const filteredItems = downloadItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="w-full max-w-xs h-full p-0 border shadow rounded-md bg-background hide-scrollbar">
            <div className="p-0 m-0 w-full">
                {/* Header with search and refresh */}
                <div className="p-2">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm tracking-wide flex-1">Downloads</p>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-current"
                            onClick={refresh}
                            disabled={isLoading}
                        >
                            <IconRefresh className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                    <div className="p-0 relative" onClick={(e) => e.preventDefault()}>
                        <Button
                            variant={"ghost"}
                            size={"icon"}
                            className="absolute left-1 top-1 h-6 w-6"
                        >
                            <IconSearch className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Input
                            type="search"
                            placeholder="Search for a file"
                            className="pl-8 h-8 text-xs"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <Separator></Separator>

                {/* Error message */}
                {error && (
                    <div className="p-2 text-sm font-extralight tracking-wider text-center text-destructive bg-destructive/12 border-b">
                        {error}
                    </div>
                )}

                {/* Loading state */}
                {isLoading && <div className="text-center text-xs my-2">Loading files...</div>}

                {/* Empty state */}
                {/* {!isLoading && filteredItems.length === 0 && ( */}
                {filteredItems.length === 0 && (
                    <div className="h-24 text-muted-foreground grid place-items-center text-xs hover:bg-transparent">
                        {searchQuery ? "No files match your search" : "No files found"}
                    </div>
                )}

                {/* Files list */}
                {/* {!isLoading && filteredItems.length > 0 && ( */}
                {filteredItems.length > 0 && (
                    <ScrollArea className="h-64 p-1 overflow-hidden">
                        <DownloadingFiles />
                        {filteredItems.map((item) => (
                            <File key={item.name} {...item} />
                        ))}
                    </ScrollArea>
                )}

                {/* Footer with stats */}
                {/* {!isLoading && downloadItems.length > 0 && ( */}
                {downloadItems.length > 0 && (
                    <div className="p-2 border-t text-xs text-muted-foreground">
                        Showing {filteredItems.length} of {downloadItems.length} files
                        {searchQuery && ` matching "${searchQuery}"`}
                    </div>
                )}
            </div>
        </div>
    )
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function DownloadingFiles() {
    const { activeDownloads } = useDownloadProgress()
    const { refresh } = useDownloads()
    const len = Object.keys(activeDownloads).length
    useEffect(() => {
        if (len > 0) {
            refresh()
        }
    }, [len])
    return (
        <>
            {Object.values(activeDownloads).map((file) => (
                <File
                    key={file.fileName}
                    loading={
                        file.totalBytes > 0 ? (file.downloadedBytes / file.totalBytes) * 100 : 0
                    }
                    name={file.fileName}
                    previewUrl={file.previewUrl}
                    downloadUrl={file.downloadUrl}
                    size={file.size || 0}
                    sizeFormatted={formatFileSize(file.downloadedBytes || 0)}
                />
            ))}
        </>
    )
}

type FileProps = FileItem & {
    loading?: number
}
function File(file: FileProps) {
    const { refresh } = useDownloads()
    const [deletingFile, setDeletingFile] = useState(false)
    const { setDownloading } = useLocalDownloads()
    const shouldDisable = deletingFile
    return (
        <div
            className="p-2 flex gap-2 w-full hover:bg-accent transition-colors group relative rounded-md"
            onClick={(e) => e.preventDefault()}
        >
            <IconFileFilled className="size-4 mt-1" />
            <div className="flex flex-col gap-1 flex-1 w-full overflow-hidden min-w-0">
                <span className="text-ellipsis line-clamp-1 break-all text-xs">{file.name}</span>
                {file.loading && (
                    <span
                        className="h-0.5 bg-blue-500"
                        style={{ width: `${file.loading}%` }}
                    ></span>
                )}
                <span className="flex text-[0.6rem] justify-between tracking-wide text-muted-foreground">
                    {!file.loading ? (
                        <button
                            className="cursor-pointer text-left w-fit hover:text-blue-500 transition-colors"
                            disabled={shouldDisable}
                            onClick={() => browser.tab.new(`${SERVER_URL}${file.previewUrl}`)}
                        >
                            Preview
                        </button>
                    ) : (
                        <span>Downloading...</span>
                    )}
                    <span className="font-light text-muted-foreground">
                        {file.sizeFormatted} •{" "}
                        {new Date(file.modified || new Date()).toLocaleDateString()}
                    </span>
                </span>
            </div>
            <div
                className={cn(
                    "flex items-center absolute top-2 right-2 gap-1 bg-background group-hover:bg-accent hover:bg-accent text-current/60 opacity-0 group-hover:opacity-100",
                    deletingFile && "opacity-100!",
                    file.loading && "opacity-0!"
                )}
            >
                <button
                    className="hover:text-blue-500 hover:scale-[1.1] cursor-pointer"
                    onClick={async () => {
                        setDownloading(true)
                        await browser.downloader.saveAs(`${SERVER_URL}${file.downloadUrl}`)
                        setDownloading(false)
                    }}
                    disabled={shouldDisable}
                    title="Save Offline"
                >
                    <IconDeviceFloppy className="size-4" strokeWidth={1.4} />
                </button>
                <button
                    className="hover:text-destructive hover:scale-[1.1] cursor-pointer"
                    onClick={async () => {
                        setDeletingFile(true)
                        const isFileDeleted = await browser.downloader.delete(file.downloadUrl)
                        console.log({ isFileDeleted })
                        setDeletingFile(() => !isFileDeleted)
                        refresh()
                    }}
                    disabled={shouldDisable}
                    title="Delete File"
                >
                    {deletingFile ? (
                        <IconLoader2
                            className="size-4 duration-500 animate-spin"
                            strokeWidth={1.4}
                        />
                    ) : (
                        <IconTrash className="size-4" strokeWidth={1.4} />
                    )}
                </button>
            </div>
        </div>
    )
}
