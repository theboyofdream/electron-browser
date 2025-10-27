"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    IconDeviceDesktopFilled,
    IconMailFilled,
    IconMoonFilled,
    IconSunLowFilled
} from "@tabler/icons-react"
import { useTheme } from "next-themes"

export default function MoreOptionsDropdown() {
    return (
        <div
            className="w-full p-1 bg-background border max-w-xs rounded-md"
            onClick={(e) => e.preventDefault()}
        >
            <div className="bg-primary hover:bg-primary! text-primary-foreground flex items-center gap-2 min-h-24 p-1 pl-2.5 rounded">
                <Avatar className="size-12 bg-primary-foreground">
                    <AvatarFallback className="text-sm text-primary bg-primary-foreground">
                        BOY
                    </AvatarFallback>
                </Avatar>
                <span className="flex flex-col">
                    <span className="text-sm font-medium">BOY</span>
                    <span className="text-xs flex gap-1 selection:bg-primary-foreground! selection:text-primary! select-text">
                        <IconMailFilled className="text-primary-foreground size-4"></IconMailFilled>
                        boy@gmail.com
                    </span>
                </span>
            </div>
            <Separator className="m-0" />
            <span className="text-muted-foreground p-1">Theme</span>
            <ThemeSwitcher />
            <span className="p-0.5">
                <Button
                    variant={"ghost"}
                    size={"sm"}
                    className="cursor-pointer py-2.5 w-full hover:text-destructive hover:bg-destructive/10! dark:hover:bg-destructive/5!"
                >
                    Log out
                </Button>
            </span>
        </div>
    )
}

function ThemeSwitcher() {
    const theme = useTheme()
    return (
        <span className="flex w-full gap-0.5 my-0.5 px-0.5">
            <Button
                variant={
                    // theme.theme !== "system" && theme.resolvedTheme === "light"
                    theme.resolvedTheme === "light" ? "default" : "ghost"
                }
                onClick={() => theme.setTheme("light")}
                className="flex-1 rounded"
                size={"sm"}
            >
                <IconSunLowFilled />
                Light
            </Button>
            <Button
                variant={
                    theme.resolvedTheme === "dark" ? "default" : "ghost"
                    // theme.theme !== "system" && theme.resolvedTheme === "dark" ? "default" : "ghost"
                }
                onClick={() => theme.setTheme("dark")}
                className="flex-1 rounded"
                size={"sm"}
            >
                <IconMoonFilled />
                Dark
            </Button>
            {/* <Button
                variant={theme.theme === "system" ? "default" : "ghost"}
                onClick={() => theme.setTheme("system")}
                className="flex-1"
                size={"sm"}
            >
                <IconDeviceDesktopFilled />
                System
            </Button> */}
        </span>
    )
}
