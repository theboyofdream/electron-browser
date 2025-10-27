"use client"
import "../bindings/window"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  IconArrowLeft,
  IconArrowRight,
  IconCopy,
  IconDeviceDesktop,
  IconDeviceDesktopFilled,
  IconDeviceFloppy,
  IconDots,
  IconDotsVertical,
  IconDownload,
  IconFile,
  IconFileFilled,
  IconGlobe,
  IconHome,
  IconHome2,
  IconHomeFilled,
  IconInfoCircle,
  IconLayoutSidebarFilled,
  IconLock,
  IconMail,
  IconMailFilled,
  IconMinus,
  IconMoonFilled,
  IconRefresh,
  IconReload,
  IconSearch,
  IconSquare,
  IconStar,
  IconStarFilled,
  IconSunLowFilled,
  IconTrash,
  IconWorld,
  IconX
} from "@tabler/icons-react"
import { useTheme } from "next-themes"
import { useState } from "react"
import { fa } from "zod/v4/locales"

export default function Home() {
  return (
    <div className="min-w-screen min-h-screen flex flex-col">
      <div id="tabs-container" className="flex">
        <Button variant={"ghost"} size={"icon"} className="py-1">
          <IconLayoutSidebarFilled></IconLayoutSidebarFilled>
        </Button>
        <span id="tabs-pills" className="flex">
          <TabButton title="Tab one" active={true} />
          {/* <TabButton title="Tab two" active={false} />
          <TabButton title="Tab three" active={false} />
          <TabButton title="Tab four" active={false} /> */}
        </span>
        <span className="flex-1 draggable-window"></span>
        <span className="flex">
          <Button size={"icon"} variant={"ghost"} onClick={() => browser.window.minimize()}>
            <IconMinus></IconMinus>
          </Button>
          <Button size={"icon"} variant={"ghost"} onClick={() => browser.window.toogleFullscreen()}>
            {/* <IconSquare></IconSquare> */}
            <IconCopy></IconCopy>
          </Button>
          <Button
            size={"icon"}
            variant={"ghost"}
            className="hover:bg-red-500!"
            onClick={() => browser.window.close()}
          >
            <IconX></IconX>
          </Button>
        </span>
      </div>
      <Separator></Separator>
      <div id="address-bar" className="flex items-center gap-0.5">
        <Button variant={"ghost"}>
          <IconArrowLeft />
        </Button>
        <Button variant={"ghost"}>
          <IconArrowRight />
        </Button>
        {/* <Button variant={"ghost"}>
          <IconHome />
        </Button> */}
        <Button variant={"ghost"}>
          <IconReload />
        </Button>
        <div className="flex-1 relative">
          <Button variant={"ghost"} className="absolute left-0 top-0">
            <IconSearch />
            {/* <IconLock />
            <IconInfoCircle /> */}
          </Button>
          <Input
            type="search"
            className="px-8 pr-0 border-y-0"
            placeholder="Search or enter web address"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                browser.tab.navigate(null, e.target.value?.trim() || "google")
              }
            }}
          />
          <span className=" absolute right-0 top-0 flex">
            {/* <Button variant={"ghost"} className="rounded-full">
            <IconX></IconX>
          </Button> */}
            {/* <Button variant={"ghost"}>
              <IconStar></IconStar>
            </Button> */}
            {/* <IconStarFilled></IconStarFilled> */}
          </span>
        </div>
        <Download />
        <Menu />
      </div>
      <Separator></Separator>
      <main className="flex flex-1 bg-transparent"></main>
    </div>
  )
}

type TabButtonProps = {
  favicon?: string
  title?: string
  active: boolean
}
function TabButton({ favicon, title, active }: TabButtonProps) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      className={cn("px-0 text-xs h-full font-light", !active && "opacity-50 hover:opacity-100")}
      size={"sm"}
    >
      {favicon ? (
        <img src={favicon} className="size-4"></img>
      ) : (
        <Button asChild variant={"ghost"} className="hover:bg-transparent! px-1.5!">
          <IconWorld></IconWorld>
        </Button>
      )}
      {title || "Untitled"}
      <Button
        asChild
        variant={"ghost"}
        className="hover:text-destructive hover:bg-transparent! px-1.5!"
      >
        <IconX></IconX>
      </Button>
    </Button>
  )
}

function Download() {
  const [search, setSearch] = useState("")
  const downloadItems = [
    // {
    //   name: "File 1",
    //   size: "100KB",
    //   type: "PDF",
    //   date: "2021-01-01",
    // },
  ]
  return (
    // <DropdownMenu>
    //   <DropdownMenuTrigger asChild>
    <Button variant={"ghost"} onClick={() => browser.window.toggleDownloadsDropdown()}>
      <IconDownload />
    </Button>
    //   </DropdownMenuTrigger>
    //   <DropdownMenuContent className="w-xs -mt-0.5 mr-0.5 p-0" align="end">
    //     <DropdownMenuGroup className="p-0 m-0 w-full">
    //       <DropdownMenuItem
    //         className="p-0 relative"
    //         onClick={(e) => e.preventDefault()}
    //       >
    //         <Button
    //           variant={"ghost"}
    //           size={"icon"}
    //           className="absolute left-0 top-0"
    //         >
    //           <IconSearch></IconSearch>
    //         </Button>
    //         <Input
    //           type="search"
    //           placeholder="Search for a file"
    //           className="pl-8"
    //         />
    //       </DropdownMenuItem>
    //       <DropdownMenuItem
    //         className="p-0 my-0 flex gap-0 cursor-pointer w-full"
    //         onClick={(e) => e.preventDefault()}
    //       >
    //         <IconFileFilled className="mx-2"></IconFileFilled>
    //         <span className="flex flex-col flex-1 w-full overflow-hidden">
    //           <span className="text-ellipsis line-clamp-1 break-all">
    //             Filename rrrrrrrrrrrrrrrrrrrrrttttttttttteeeee
    //           </span>
    //           <span className="text-[9px] font-extralight underline underline-offset-2">
    //             Open in tab
    //           </span>
    //         </span>
    //         <Button
    //           variant={"ghost"}
    //           size={"icon"}
    //           className="p-1 aspect-square! group"
    //         >
    //           <IconDeviceFloppy className="text-muted-foreground group-hover:text-primary-foreground"></IconDeviceFloppy>
    //         </Button>
    //         <Button
    //           variant={"ghost"}
    //           size={"icon"}
    //           className="p-1 aspect-square! group"
    //         >
    //           <IconTrash className="text-muted-foreground group-hover:text-destructive"></IconTrash>
    //         </Button>
    //       </DropdownMenuItem>
    //       {downloadItems.length < 1 && (
    //         <DropdownMenuItem className="h-24 text-muted-foreground! grid place-items-center text-xs hover:bg-transparent!">
    //           No files found
    //         </DropdownMenuItem>
    //       )}
    //     </DropdownMenuGroup>
    //   </DropdownMenuContent>
    // </DropdownMenu>
  )
}

function Menu() {
  return (
    // <DropdownMenu>
    //   <DropdownMenuTrigger asChild>
    <Button variant={"ghost"} onClick={() => browser.window.toggleMoreOptionsDropdown()}>
      <IconDotsVertical />
    </Button>
    //   </DropdownMenuTrigger>
    //   <DropdownMenuContent className="w-fit -mt-0.5 mr-0.5 p-0" align="end" side="bottom">
    //     <DropdownMenuGroup className="p-0 m-0">
    //       <DropdownMenuItem className="bg-primary hover:bg-primary! text-primary-foreground flex items-center gap-2 min-h-24" onClick={e=>e.preventDefault()}>
    //         <Avatar className="size-14 bg-primary-foreground">
    //           <AvatarFallback className="text-primary bg-primary-foreground">
    //             BOY
    //           </AvatarFallback>
    //         </Avatar>
    //         <span className="flex flex-col">
    //           <span className="text-sm font-medium">BOY</span>
    //           <span className="text-xs flex gap-1 selection:bg-primary-foreground! selection:text-primary! select-text">
    //             <IconMailFilled className="text-primary-foreground"></IconMailFilled>
    //             boy@gmail.com
    //           </span>
    //         </span>
    //       </DropdownMenuItem>
    //       <DropdownMenuItem className="py-2.5 cursor-pointer hover:bg-primary/10" disabled>
    //         Settings
    //       </DropdownMenuItem>
    //       <DropdownMenuSeparator className="m-0" />
    //       <DropdownMenuLabel>Theme</DropdownMenuLabel>
    //       <ThemeSwitcher />
    //     </DropdownMenuGroup>
    //     <DropdownMenuSeparator className="m-0" />
    //     <DropdownMenuItem
    //       variant={"destructive"}
    //       className="cursor-pointer py-2.5"
    //     >
    //       Log out
    //     </DropdownMenuItem>
    //   </DropdownMenuContent>
    // </DropdownMenu>
  )
}

// function ThemeSwitcher() {
//   const theme = useTheme();
//   const activeTheme = theme.theme;
//   return (
//     <span className="flex w-full">
//       <Button
//         variant={activeTheme === "light" ? "default" : "ghost"}
//         onClick={() => theme.setTheme("light")}
//         className="flex-1"
//       >
//         <IconSunLowFilled></IconSunLowFilled>
//         Light
//       </Button>
//       <Button
//         variant={activeTheme === "dark" ? "default" : "ghost"}
//         onClick={() => theme.setTheme("dark")}
//         className="flex-1"
//       >
//         <IconMoonFilled></IconMoonFilled>
//         Dark
//       </Button>
//       <Button
//         variant={activeTheme === "system" ? "default" : "ghost"}
//         onClick={() => theme.setTheme("system")}
//         className="flex-1"
//       >
//         <IconDeviceDesktopFilled></IconDeviceDesktopFilled>
//         System
//       </Button>
//     </span>
//   );
// }
