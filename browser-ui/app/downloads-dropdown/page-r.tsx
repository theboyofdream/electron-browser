"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    IconDeviceFloppy,
    IconFileFilled,
    IconSearch,
    IconTrash,
    IconRefresh
} from "@tabler/icons-react"
import { useEffect, useState } from "react"

interface FileItem {
    name: string
    size: number
    sizeFormatted: string
    modified: Date
    downloadUrl: string
    previewUrl: string
}

const SERVER_URL = "http://localhost:8000"

export default function DownloadsDropdown() {
    const [downloadItems, setDownloadItems] = useState<FileItem[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchDownloads = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const response = await fetch(`${SERVER_URL}/downloads`)

            if (!response.ok) {
                throw new Error(`Failed to fetch files: ${response.statusText}`)
            }

            const data = await response.json()

            if (data.success && Array.isArray(data.files)) {
                setDownloadItems(data.files)
            } else {
                console.error(data)
                throw new Error("Invalid response format")
            }
        } catch (err) {
            console.error("Error fetching downloads:", err)
            setError(err instanceof Error ? err.message : "Failed to load files")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchDownloads()
    }, [])

    const filteredItems = downloadItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleDelete = async (fileName: string) => {
        try {
            // You'll need to implement a delete endpoint on your server
            const response = await fetch(
                `http://localhost:8000/bucket/files/${encodeURIComponent(fileName)}`,
                {
                    method: "DELETE"
                }
            )

            if (response.ok) {
                // Remove from local state
                setDownloadItems((prev) => prev.filter((item) => item.name !== fileName))
            } else {
                throw new Error("Failed to delete file")
            }
        } catch (err) {
            console.error("Error deleting file:", err)
            setError("Failed to delete file")
        }
    }

    const handleOpenInTab = (downloadUrl: string) => {
        browser.tab.new(downloadUrl)
    }

    const handleSaveAs = async (file: FileItem) => {
        try {
            // Trigger browser download
            const response = await fetch(file.downloadUrl)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = file.name
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (err) {
            console.error("Error saving file:", err)
            setError("Failed to save file")
        }
    }

    return (
        <div className="w-full max-w-[260px] p-0 border shadow">
            <div className="p-0 m-0 w-full">
                {/* Header with search and refresh */}
                <div className="p-2 border-b">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-semibold flex-1">Downloaded Files</h3>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={fetchDownloads}
                            disabled={isLoading}
                        >
                            <IconRefresh className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                    <div className="p-0 relative" onClick={(e) => e.preventDefault()}>
                        <Button
                            variant={"ghost"}
                            size={"icon"}
                            className="absolute left-0 top-0 h-6 w-6"
                        >
                            <IconSearch className="h-3 w-3" />
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

                {/* Error message */}
                {error && (
                    <div className="p-2 text-xs text-destructive bg-destructive/10 border-b">
                        {error}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 ml-2 text-xs"
                            onClick={() => setError(null)}
                        >
                            Dismiss
                        </Button>
                    </div>
                )}

                {/* Loading state */}
                {isLoading && (
                    <div className="h-24 text-muted-foreground grid place-items-center text-xs">
                        Loading files...
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && filteredItems.length === 0 && (
                    <div className="h-24 text-muted-foreground grid place-items-center text-xs hover:bg-transparent">
                        {searchQuery ? "No files match your search" : "No files found"}
                    </div>
                )}

                {/* Files list */}
                {!isLoading && filteredItems.length > 0 && (
                    <div className="max-h-64 overflow-y-auto">
                        {filteredItems.map((item) => (
                            <File
                                key={item.name}
                                item={item}
                                onOpenInTab={handleOpenInTab}
                                onSaveAs={handleSaveAs}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}

                {/* Footer with stats */}
                {!isLoading && downloadItems.length > 0 && (
                    <div className="p-2 border-t text-xs text-muted-foreground">
                        {filteredItems.length} of {downloadItems.length} files
                        {searchQuery && ` matching "${searchQuery}"`}
                    </div>
                )}
            </div>
        </div>
    )
}

type FileProps = {
    item: FileItem
    onOpenInTab: (url: string) => void
    onSaveAs: (file: FileItem) => void
    onDelete: (fileName: string) => void
}

function File({ item, onOpenInTab, onSaveAs, onDelete }: FileProps) {
    // const [isHovered, setIsHovered] = useState(false)

    return (
        <div
            className="p-2 flex items-center gap-2 cursor-pointer w-full hover:bg-accent transition-colors group"
            onClick={(e) => e.preventDefault()}
        >
            <IconFileFilled className="size-4 shrink-0" />
            <span className="flex flex-col flex-1 w-full overflow-hidden min-w-0">
                <span className="text-ellipsis line-clamp-1 break-all text-sm">{item.name}</span>
                <span className="text-[10px] font-light text-muted-foreground">
                    {item.sizeFormatted} • {new Date(item.modified).toLocaleDateString()}
                </span>
                <button
                    className="text-[9px] font-extralight underline underline-offset-2 text-left hover:text-primary transition-colors"
                    onClick={() => onOpenInTab(`${SERVER_URL}${item.previewUrl}`)}
                >
                    Open in tab
                </button>
            </span>

            <div className="flex items-center gap-1 shrink-0 hidden group-hover:visible">
                <Button
                    variant={"ghost"}
                    size={"icon"}
                    className="h-6 w-6 p-1 group"
                    onClick={() => browser.downloader.saveAs(`${SERVER_URL}${item.downloadUrl}`)}
                    title="Save As"
                >
                    <IconDeviceFloppy className="text-muted-foreground group-hover:text-primary" />
                </Button>
                <Button
                    variant={"ghost"}
                    size={"icon"}
                    className="h-6 w-6 p-1 group"
                    // onClick={() => onDelete(item.name)}
                    title="Delete"
                >
                    <IconTrash className="text-muted-foreground group-hover:text-destructive" />
                </Button>
            </div>
        </div>
    )
}
