"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useDownloadProgress } from "@/hooks/useDownloadProgress"
import { useLocalDownloads } from "@/hooks/useLocalDownload"
import { useTabs } from "@/hooks/useTabs"
import { cn } from "@/lib/utils"
import {
    IconArrowLeft,
    IconArrowRight,
    IconCopy,
    IconDotsVertical,
    IconDownload,
    IconLayoutSidebarFilled,
    IconLoader2,
    IconLoader3,
    IconMinus,
    IconReload,
    IconSearch,
    IconWorld,
    IconX
} from "@tabler/icons-react"
import { PlusIcon } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

export default function Home() {
    return (
        <div className="min-w-screen min-h-screen flex flex-col bg-background">
            <div id="tabs-container" className="flex px-1 py-0.5">
                {/* <Button variant={"ghost"} size={"icon"} className="py-1">
                    <IconLayoutSidebarFilled></IconLayoutSidebarFilled>
                </Button> */}
                <TabBar />
                <span className="flex-1 draggable-window"></span>
                <span className="flex bg-background">
                    <Button
                        size={"icon"}
                        variant={"ghost"}
                        className="rounded-none h-8"
                        onClick={() => browser.window.minimize()}
                    >
                        <IconMinus></IconMinus>
                    </Button>
                    <Button
                        size={"icon"}
                        variant={"ghost"}
                        className="rounded-none h-8"
                        onClick={() => browser.window.toogleFullscreen()}
                    >
                        {/* <IconSquare></IconSquare> */}
                        <IconCopy></IconCopy>
                    </Button>
                    <Button
                        size={"icon"}
                        variant={"ghost"}
                        className="hover:bg-red-500! rounded-none h-8 hover:text-primary-foreground"
                        onClick={() => browser.window.close()}
                    >
                        <IconX></IconX>
                    </Button>
                </span>
            </div>
            <Separator></Separator>
            <div id="address-bar" className="flex items-center gap-1 px-1">
                <Button variant={"ghost"} size={"icon-sm"} onClick={() => browser.tab.goBack()}>
                    <IconArrowLeft />
                </Button>
                <Button variant={"ghost"} size={"icon-sm"} onClick={() => browser.tab.goForward()}>
                    <IconArrowRight />
                </Button>
                <Button variant={"ghost"} size={"icon-sm"} onClick={() => browser.tab.reload()}>
                    <IconReload />
                </Button>
                <div className="flex-1 items-center relative">
                    <IconSearch className="text-muted-foreground size-4 absolute top-0 left-0 transform translate-7/12" />
                    <SearchInput />
                    <span className=" absolute right-0 top-0 flex"></span>
                </div>
                <DownloadButton />
                <Button
                    variant={"ghost"}
                    size={"icon-sm"}
                    onClick={() => browser.window.toggleMoreOptionsDropdown()}
                >
                    <IconDotsVertical />
                </Button>
            </div>
            <Separator className="bg-transparent"></Separator>
            <main className="flex flex-1 bg-transparent"></main>
        </div>
    )
}

function DownloadButton() {
    const [deletingFile, setDeletingFile] = useState(false)
    const [downloadingFile, setDownloadingFile] = useState(false)
    const { downloading } = useLocalDownloads()
    const { activeDownloads } = useDownloadProgress()

    useEffect(() => {
        const listenDeleteStart = () => setDeletingFile(() => true)
        const listenDeleteEnd = () => setDeletingFile(() => false)
        browser.listener("downloader:deletingFileStart", listenDeleteStart)
        browser.listener("downloader:deletingFileEnd", listenDeleteEnd)

        const listenDownloadStart = () => setDownloadingFile(() => true)
        const listenDownloadEnd = () => setDownloadingFile(() => false)
        browser.listener("downloader:startedDownloading", listenDownloadStart)
        browser.listener("downloader:endededDownloading", listenDownloadEnd)

        return () => {
            browser.removeListener("downloader:deletingFileStart", listenDeleteStart)
            browser.removeListener("downloader:deletingFileEnd", listenDeleteEnd)
            browser.removeListener("downloader:startedDownloading", listenDownloadStart)
            browser.removeListener("downloader:endededDownloading", listenDownloadEnd)
        }
    }, [])
    return (
        <Button
            variant={"ghost"}
            size={"icon-sm"}
            className="relative"
            onClick={() => browser.window.toggleDownloadsDropdown()}
        >
            <IconLoader2
                className={cn(
                    "absolute top-0 left-0 size-8 opacity-0",
                    deletingFile && "text-destructive animate-spin opacity-100",
                    downloadingFile ||
                        (Object.keys(activeDownloads).length > 0 &&
                            "text-blue-500 animate-spin opacity-100"),
                    downloading && "text-green-500 animate-spin opacity-100"
                )}
                strokeWidth={0.9}
            />
            <IconDownload />
        </Button>
    )
}

function SearchInput() {
    const inputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        const handleUpdate = (_: unknown, data: { url: string }) => {
            if (inputRef.current) {
                inputRef.current.value = data.url
            }
        }

        browser.listener("tab:update", handleUpdate)

        return () => {
            browser.removeListener("tab:update", handleUpdate)
        }
    }, [])

    return (
        <Input
            ref={inputRef}
            type="search"
            className="px-8 pr-2 rounded-full border-0 bg-background/50 my-0.5 h-7.5 text-muted-foreground focus-within:text-current"
            placeholder="Search or enter web address"
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                    const target = e.target as HTMLInputElement
                    browser.tab.navigate(target.value?.trim() || "google")
                }
            }}
        />
    )
}

type TabData = {
    id: number
    title?: string
    favicon?: string
    active: boolean
}

type TabButtonProps = {
    id: number
    // loading?: boolean
    favicon?: string
    title?: string
    // active: boolean
    // onClick?: () => void
    // onClose?: () => void
}

function TabButton({ id, favicon, title /*active, onClick, onClose */ }: TabButtonProps) {
    const { activeTabId, loadingTabId } = useTabs()
    const isActive = id == activeTabId
    const isLoading = id == loadingTabId
    return (
        <Button
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
                "px-0 pl-2 text-xs h-8 font-light w-[180px]",
                !isActive && "opacity-50 hover:opacity-100"
            )}
            size={"sm"}
            onClick={() => browser.tab.switch(id)}
        >
            {isLoading ? (
                <IconLoader2 className="size-4 animate-spin text-current" />
            ) : favicon ? (
                <img
                    src={favicon}
                    alt="Favicon"
                    className="size-4"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                />
            ) : (
                <IconWorld className="size-4 text-current" strokeWidth={1.5} />
            )}
            <span className="w-full text-left text-ellipsis overflow-hidden">{title || "Untitled"}</span>
            <Button
                variant={"ghost"}
                className="hover:text-destructive hover:bg-transparent! px-1.5!"
                onClick={(e) => {
                    e.stopPropagation()
                    browser.tab.close(id)
                }}
            >
                <IconX />
            </Button>
        </Button>
    )
}

export function TabBar() {
    const { tabs } = useTabs()
   
    return (
        <span id="tabs-pills" className="flex gap-0.5 overflow-x-scroll hide-scrollbar">
            {tabs.map((t) => (
                <TabButton
                    key={t.id}
                    id={t.id}
                    favicon={t.favicon}
                    title={t.title}
                    // active={t.id == activeTabId}
                    // onClick={() => handleSwitch(t.id)}
                    // onClose={() => handleClose(t.id)}
                    // loading={t.id == activeTabId && loading}
                />
            ))}
            <Button
                variant={"ghost"}
                size={"icon-sm"}
                className="ml-1"
                onClick={() => browser.tab.new()}
            >
                <PlusIcon />
            </Button>
        </span>
    )
}
